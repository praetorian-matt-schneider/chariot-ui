import { useAxios } from '@/hooks/useAxios';
import { getQueryKey } from '@/hooks/useQueryKeys';
import { queryClient } from '@/queryclient';
import { MyResourceKey, Statistics } from '@/types';
import {
  mergeStatus,
  UseExtendQueryOptions,
  useQueries,
  useQuery,
} from '@/utils/api';
import { sToMs } from '@/utils/date.util';

interface UseCountsProps<ResourceKey extends MyResourceKey> {
  resource: ResourceKey;
  // query to filter the resource data, if not provided, it will fetch all data
  query?: string;
}

export const useCounts = <ResourceKey extends MyResourceKey>(
  props: UseCountsProps<ResourceKey>,
  options?: UseExtendQueryOptions<Statistics>
) => {
  const axios = useAxios();

  return useQuery<Statistics>({
    ...options,
    defaultErrorMessage: `Failed to fetch ${props.resource} counts`,
    refetchInterval: sToMs(30),
    queryKey: getQueryKey.getCounts(props.resource, props.query),
    queryFn: async () => {
      const { data } = await axios.get(`/my/count`, {
        params: {
          key: `#${props.resource}${props.query || ''}`,
        },
      });
      // remap empty key with 'cloud'
      if ('' in data) {
        data.cloud = data[''];
        delete data[''];
      }
      return data as Statistics;
    },
  });
};

export const useBulkCounts = <ResourceKey extends MyResourceKey>(
  countProps: UseCountsProps<ResourceKey>[],
  options?: UseExtendQueryOptions<Statistics>
) => {
  const axios = useAxios();

  return useQueries({
    // defaultErrorMessage: 'Failed to fetch job status',
    queries: Object.values(countProps).map(props => {
      return {
        ...options,
        defaultErrorMessage: `Failed to fetch ${props.resource} counts`,
        queryKey: getQueryKey.getCounts(props.resource, props.query),
        queryFn: async () => {
          const { data } = await axios.get(`/my/count`, {
            params: {
              key: `#${props.resource}${props.query || ''}`,
            },
          });

          // remap empty key with 'cloud'
          if ('' in data) {
            data.cloud = data[''];
            delete data[''];
          }

          return data as Statistics;
        },
      };
    }),
    combine: results => {
      return {
        data: countProps.reduce(
          (acc, _, index) => ({
            ...acc,
            ...results[index].data,
          }),
          {}
        ) as Record<string, Statistics>,
        status: mergeStatus(...results.map(result => result.status)),
        invalidate: () => {
          countProps.forEach(props => {
            const queryKey = getQueryKey.getCounts(props.resource, props.query);
            queryClient.invalidateQueries({ queryKey });
          });
        },
      };
    },
  });
};
