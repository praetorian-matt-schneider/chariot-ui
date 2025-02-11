import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';

import { useAxios } from '@/hooks/useAxios';
import { useCounts } from '@/hooks/useCounts';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { useMy } from '@/hooks/useMy';
import { buildOpenRiskDataset } from '@/sections/Assets';
import {
  Asset,
  AssetFilters,
  AssetStatus,
  AssetStatusLabel,
  Risk,
  RiskScanMessage,
  SeverityOpenCounts,
} from '@/types';
import { useMutation } from '@/utils/api';
import { useMergeStatus } from '@/utils/api';
import { Regex } from '@/utils/regex.util';
import { useStorage } from '@/utils/storage/useStorage.util';

interface UpdateAssetProps {
  key: string;
  name: string;
  status?: AssetStatus;
  comment?: string;
  showSnackbar?: boolean;
}

export const AssetsSnackbarTitle = {
  [AssetStatus.Active]: `will be marked as ${AssetStatusLabel[AssetStatus.Active].toLocaleLowerCase()}`,
  [AssetStatus.ActiveHigh]: `will be marked as ${AssetStatusLabel[AssetStatus.ActiveHigh].toLocaleLowerCase()}`,
  [AssetStatus.ActiveLow]: `will be marked as ${AssetStatusLabel[AssetStatus.ActiveLow].toLocaleLowerCase()}`,
  [AssetStatus.Frozen]: 'will stop scanning',
  [AssetStatus.Deleted]: 'will stop scanning',
};

export const getStartMessage = (status: AssetStatus) => {
  if (status === AssetStatus.Frozen) {
    return RiskScanMessage.Stop;
  }

  if (status === AssetStatus.ActiveHigh) {
    return RiskScanMessage.StartHigh;
  } else if (status === AssetStatus.ActiveLow) {
    return RiskScanMessage.StartLow;
  } else if (status === AssetStatus.Active) {
    return RiskScanMessage.Start;
  } else {
    return '';
  }
};

export const useUpdateAsset = () => {
  const axios = useAxios();

  const { updateAllSubQueries } = useMy(
    {
      resource: 'asset',
    },
    {
      enabled: false,
    }
  );
  const { invalidate: invalidateAlerts } = useGetAccountAlerts({
    enabled: false,
  });

  return useMutation<Asset, Error, UpdateAssetProps>({
    defaultErrorMessage: 'Failed to update asset',
    mutationFn: async ({ key, name, status, comment }) => {
      const promise = axios.put(`/asset`, {
        key,
        status,
        comment,
      });

      toast.promise(promise, {
        loading: `Updating ${name}`,
        success: `Updated ${name}`,
        error: `Failed to update ${name}`,
      });

      const response = await promise;
      const data = response.data?.[0] as Asset;

      invalidateAlerts();
      updateAllSubQueries(previous => {
        if (!previous) {
          return {
            pages: [{ data: [data], offset: undefined }],
            pageParams: [undefined],
          };
        }

        const updatedPages = previous.pages.map(page => {
          return {
            ...page,
            data: page.data.map(currentAsset =>
              currentAsset.key === key ? data : currentAsset
            ),
          };
        });
        return { ...previous, pages: updatedPages };
      });

      return data;
    },
  });
};

export const useDeleteAsset = () => {
  const axios = useAxios();

  const { invalidate: invalidateMyAssets } = useMy(
    {
      resource: 'asset',
    },
    {
      enabled: false,
    }
  );
  const { invalidate: invalidateGeneric } = useGenericSearch(
    {
      query: '',
    },
    {
      enabled: false,
    }
  );
  const { invalidate: invalidateAlerts } = useGetAccountAlerts({
    enabled: false,
  });

  return useMutation<void, Error, UpdateAssetProps>({
    defaultErrorMessage: 'Failed to delete asset',
    mutationFn: async ({ key, name }) => {
      const promise = axios.delete(`/asset`, {
        data: {
          key,
        },
      });

      toast.promise(promise, {
        loading: `Deleting ${name}`,
        success: `Deleted ${name}`,
        error: `Failed to delete ${name}`,
      });

      await promise;

      invalidateAlerts();
      invalidateGeneric();
      invalidateMyAssets();
    },
  });
};

export function mapAssetStatus(asset: Asset) {
  if ([AssetStatus.ActiveHigh, AssetStatus.ActiveLow].includes(asset.status)) {
    return asset.status;
  }

  if ((asset.status as string) === 'AS') {
    return AssetStatus.Active;
  }

  return asset.status as AssetStatus;
}

export const useCreateAsset = () => {
  const axios = useAxios();
  const { invalidate: invalidateJob } = useMy(
    { resource: 'job' },
    { enabled: false }
  );
  const { invalidate: invalidateAssets } = useMy(
    { resource: 'asset' },
    { enabled: false }
  );
  const { invalidate: invalidateCounts } = useCounts({
    resource: 'asset',
  });
  const { invalidate: invalidateProvidedAssets } = useGenericSearch({
    query: 'source:provided',
  });

  return useMutation<Asset, Error, Pick<Asset, 'name' | 'status'>>({
    defaultErrorMessage: `Failed to add asset`,
    getErrorFromResponse: true,
    mutationFn: async asset => {
      const promise = axios.put(`/asset`, {
        dns: asset.name,
        name: asset.name,
        status: asset.status || AssetStatus.Active,
      });

      toast.promise(promise, {
        loading: 'Adding asset',
        success: `Added ${asset.name}`,
      });

      const { data } = await promise;

      invalidateJob();
      invalidateAssets();
      invalidateCounts();
      invalidateProvidedAssets();

      return data;
    },
    onError: error => {
      toast.error('Failed to add asset', {
        description: `${error.name} ${error.message}`,
      });
    },
  });
};

export const useBulkAddAsset = () => {
  const axios = useAxios();
  const { invalidate: invalidateJob } = useMy(
    { resource: 'job' },
    { enabled: false }
  );
  const { invalidate: invalidateAsset } = useMy(
    { resource: 'asset' },
    { enabled: false }
  );

  return useMutation({
    defaultErrorMessage: 'Failed to bulk add assets',
    errorByStatusCode: {
      402: 'License is required to add more assets',
    },
    mutationFn: async (
      assets: (Partial<Pick<Asset, 'status'>> & Pick<Asset, 'name'>)[]
    ) => {
      const promise = Promise.all<Asset>(
        assets
          .map(async asset => {
            const { data } = await axios.put<Asset[]>(`/asset`, {
              dns: asset.name,
              name: asset.name,
              status: asset.status || AssetStatus.Active,
            });

            return data[0];
          })
          // Note: Catch error so we can continue adding assets even if some fail
          .map(p => p.catch(e => e))
      );

      toast.promise(promise, {
        loading: 'Adding assets',
        success: `Added ${assets.length} assets`,
        error: 'Failed to add assets',
      });

      const response = await promise;

      const validResults = response.filter(
        result => !(result instanceof Error)
      );

      if (validResults.length > 0) {
        invalidateJob();
        invalidateAsset();
      }

      return validResults;
    },
  });
};

export type PartialAsset = Pick<Asset, 'name' | 'dns' | 'updated' | 'key'> & {
  riskSummary?: SeverityOpenCounts;
};

const defaultFilters: AssetFilters = {
  search: '',
  attributes: ['#attribute#new#asset'],
};

// eslint-disable-next-line complexity
export function useGetAssets(options?: {
  enabled?: boolean;
  setQuery?: boolean;
}) {
  const isEnabled = options?.enabled ?? true;

  const [filters, setFilters] = useStorage<AssetFilters>(
    {
      queryKey: options?.setQuery ? 'assetFilters' : '',
    },
    defaultFilters
  );

  const [isFilteredDataFetching, setIsFilteredDataFetching] = useState(false);

  const [debouncedSearch] = useDebounce(filters.search, 500);
  const isSearched = Boolean(filters.search);
  const isAttributesFilter = Boolean(filters.attributes[0]);

  const {
    data: assetSearchByName,
    status: assetByNameStatus,
    error: assetSearchByNameError,
    isFetching: isFetchingAssetSearchByName,
    fetchNextPage: assetSearchByNameFetchNextPage,
    isFetchingNextPage: assetSearchByNameIsFetchingNextPage,
    hasNextPage: assetSearchByNameHasNextPage,
  } = useGenericSearch(
    { query: `name:${debouncedSearch}` },
    { enabled: isEnabled && isSearched }
  );
  const {
    data: assetSearchByDns,
    status: assetSearchByDnsStatus,
    error: assetSearchByDnsError,
    isFetching: isFetchingAssetSearchByDns,
    fetchNextPage: assetSearchByDnsFetchNextPage,
    isFetchingNextPage: assetSearchByDnsIsFetchingNextPage,
    hasNextPage: assetSearchByDnsHasNextPage,
  } = useGenericSearch(
    { query: `dns:${debouncedSearch}` },
    { enabled: isEnabled && isSearched }
  );

  const {
    status: myAssetsStatus,
    data: myAssets = [],
    isFetching: isFetchingMyAssets,
    fetchNextPage: myAssetsFetchNextPage,
    isFetchingNextPage: myAssetsIsFetchingNextPage,
    hasNextPage: myAssetsHasNextPage,
    error: myAssetsError,
  } = useMy(
    {
      resource: 'asset',
    },
    { enabled: isEnabled && !isSearched }
  );

  const {
    data: risks = [],
    status: riskStatus,
    error: risksError,
    isFetching: isFetchingRisks,
  } = useMy({ resource: 'risk' }, { enabled: isEnabled });

  const {
    data: attributes,
    status: attributesStatus,
    fetchNextPage: attributesFetchNextpage,
    isFetchingNextPage: isFetchingAttributesNextPage,
    error: attributesError,
    isFetching: isFetchingAttributes,
    hasNextPage: isAttributesHasNextPage,
  } = useMy(
    {
      resource: 'attribute',
      query: isAttributesFilter
        ? `${filters.attributes[0].replace('#attribute', '')}`
        : '',
    },
    { enabled: isEnabled && isAttributesFilter }
  );

  const apiStatus = useMergeStatus(
    ...(debouncedSearch
      ? [assetByNameStatus, assetSearchByDnsStatus, riskStatus]
      : isAttributesFilter
        ? [attributesStatus, riskStatus]
        : [myAssetsStatus, riskStatus])
  );
  const isFetchingNextPage = debouncedSearch
    ? assetSearchByNameIsFetchingNextPage || assetSearchByDnsIsFetchingNextPage
    : isAttributesFilter
      ? isFetchingAttributesNextPage
      : myAssetsIsFetchingNextPage;

  const error = debouncedSearch
    ? assetSearchByNameError || assetSearchByDnsError || risksError
    : isAttributesFilter
      ? attributesError || risksError
      : myAssetsError || risksError;
  const fetchNextPage = debouncedSearch
    ? () => {
        assetSearchByNameFetchNextPage();
        assetSearchByDnsFetchNextPage();
      }
    : isAttributesFilter
      ? attributesFetchNextpage
      : myAssetsFetchNextPage;
  const isFetching = debouncedSearch
    ? isFetchingAssetSearchByName ||
      isFetchingAssetSearchByDns ||
      isFetchingRisks
    : isAttributesFilter
      ? isFetchingAttributes || isFetchingRisks
      : isFetchingMyAssets || isFetchingRisks;
  const hasNextPage = debouncedSearch
    ? assetSearchByNameHasNextPage || assetSearchByDnsHasNextPage
    : isAttributesFilter
      ? isAttributesHasNextPage
      : myAssetsHasNextPage;

  const status = isFilteredDataFetching ? 'pending' : apiStatus;

  const assets: PartialAsset[] = useMemo(
    () =>
      debouncedSearch
        ? [
            ...(assetSearchByName?.assets || []),
            ...(assetSearchByDns?.assets || []),
          ].reduce((acc, asset: Asset) => {
            if (!acc.find(a => a.key === asset.key)) {
              acc.push(asset);
            }
            return acc;
          }, [] as Asset[])
        : isAttributesFilter
          ? attributes.map(attribute => {
              const [, assetdns, assetname] =
                attribute.source.match(Regex.ASSET_KEY) || [];

              return {
                key: attribute.source,
                name: assetname,
                dns: assetdns,
                updated: attribute.updated,
              };
            })
          : myAssets,
    [
      debouncedSearch,
      isAttributesFilter,
      JSON.stringify({
        assetSearchByName,
        assetSearchByDns,
        myAssets,
        attributes,
      }),
    ]
  );

  const openRiskDataset = useMemo(
    () => buildOpenRiskDataset(risks as Risk[]),
    [riskStatus]
  );

  const data = useMemo(() => {
    // merge risk data with asset data
    return assets.map(asset => {
      const riskSummary = openRiskDataset[asset.dns];

      if (riskSummary) {
        return { ...asset, riskSummary };
      }

      return asset;
    }) as PartialAsset[];
  }, [
    JSON.stringify({
      assets,
      filters,
    }),
  ]);

  useEffect(() => {
    if (!isFetching) {
      if (hasNextPage && data.length < 50) {
        setIsFilteredDataFetching(true);
        fetchNextPage();
      } else {
        setIsFilteredDataFetching(false);
      }
    }
  }, [JSON.stringify({ data }), filters.search, isFetching, hasNextPage]);

  return {
    data,
    status,
    fetchNextPage,
    error,
    isFetchingNextPage,
    isFetching,
    filters,
    setFilters: (filters: AssetFilters) => {
      if (filters.search === '' && filters.attributes.length === 0) {
        setFilters(defaultFilters);
      } else {
        setFilters(filters);
      }
    },
    hasNextPage,
  };
}
