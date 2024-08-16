import { useLayoutEffect, useState } from 'react';
import { AxiosHeaders } from 'axios';

import { mapAssetStataus } from '@/hooks/useAssets';
import { useAxios } from '@/hooks/useAxios';
import { getQueryKey } from '@/hooks/useQueryKeys';
import { Asset, MyResource, MyResourceKey } from '@/types';
import { UseExtendInfiniteQueryOptions, useInfiniteQuery } from '@/utils/api';

interface UseMyProps<ResourceKey extends MyResourceKey> {
  resource: ResourceKey;
  // query to filter the resource data, if not provided, it will fetch all data
  // Resource data will be filtered by global search or filter from url parameters
  filterByGlobalSearch?: boolean;
  filters?: string[][];
}

export const useMy = <ResourceKey extends MyResourceKey>(
  props: UseMyProps<ResourceKey>,
  options?: UseExtendInfiniteQueryOptions<MyResource[ResourceKey]> & {
    doNotImpersonate?: boolean;
  }
) => {
  const [isFilteredDataFetching, setIsFilteredDataFetching] = useState(false);

  const axios = useAxios();

  const response = useInfiniteQuery<MyResource[ResourceKey], Error>({
    ...options,
    defaultErrorMessage: `Failed to fetch ${props.resource} data`,
    retry: false,
    queryKey: getQueryKey.getMy(props.resource, props.filters),
    queryFn: async ({ pageParam }) => {
      const headers = options?.doNotImpersonate
        ? ({
            common: {
              account: undefined,
            },
          } as unknown as AxiosHeaders)
        : undefined;

      const { data } = await axios.post(
        `/my`,
        (props.filters?.length || 0) > 0
          ? props.filters
          : [[`#${props.resource}`]],
        {
          params: {
            key: props.resource,
            offset: pageParam ? JSON.stringify(pageParam) : undefined,
          },
          headers,
        }
      );

      const resourceData = data[`${props.resource}s`] || [];

      if (props.resource === 'asset') {
        return {
          data: resourceData.map((asset: Asset) => {
            return {
              ...asset,
              status: mapAssetStataus(asset),
            };
          }),
          offset: data?.offset,
        };
      }

      return { data: resourceData, offset: data?.offset };
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => {
      return lastPage.offset;
    },
  });

  const processedData = response.data
    ? response.data.pages.map(({ data }) => data).flat()
    : [];

  useLayoutEffect(() => {
    if (!response.isFetching) {
      if (response.hasNextPage && processedData.length < 50) {
        setIsFilteredDataFetching(true);
        response.fetchNextPage();
      } else {
        setIsFilteredDataFetching(false);
      }
    }
  }, [
    JSON.stringify({ processedData }),
    response.isFetching,
    response.hasNextPage,
  ]);

  return {
    ...response,
    status: isFilteredDataFetching ? 'pending' : response.status,
    data: processedData,
  };
};
