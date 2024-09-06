import { mapAssetStatus } from '@/hooks/useAssets';
import { useAxios } from '@/hooks/useAxios';
import { getQueryKey, useGetUserKey } from '@/hooks/useQueryKeys';
import { Asset, MyResource, MyResourceKey } from '@/types';
import { UseExtendInfiniteQueryOptions, useInfiniteQuery } from '@/utils/api';

interface UseMyProps<ResourceKey extends MyResourceKey> {
  resource: ResourceKey;
  // query to filter the resource data, if not provided, it will fetch all data
  query?: string;
}

export const useMy = <ResourceKey extends MyResourceKey>(
  props: UseMyProps<ResourceKey>,
  options?: UseExtendInfiniteQueryOptions<MyResource[ResourceKey]> & {
    doNotImpersonate?: boolean;
  }
) => {
  const axios = useAxios(options?.doNotImpersonate);

  const response = useInfiniteQuery<MyResource[ResourceKey]>({
    ...options,
    defaultErrorMessage: `Failed to fetch ${props.resource} data`,
    retry: false,
    queryKey: useGetUserKey(
      getQueryKey.getMy(props.resource, props.query),
      options?.doNotImpersonate
    ),
    queryFn: async ({ pageParam }) => {
      const { data } = await axios.get(`/my`, {
        params: {
          key: `#${props.resource}${props.query || ''}`,
          offset: pageParam ? JSON.stringify(pageParam) : undefined,
        },
      });

      const resourceData = data[`${props.resource}s`] || [];

      if (props.resource === 'asset') {
        return {
          data: resourceData.map((asset: Asset) => {
            return {
              ...asset,
              status: mapAssetStatus(asset),
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

  return {
    ...response,
    data: processedData,
  };
};
