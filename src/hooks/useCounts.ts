import { useAxios } from '@/hooks/useAxios';
import { getQueryKey } from '@/hooks/useQueryKeys';
import { MyResourceKey, Statistics } from '@/types';
import { UseExtendQueryOptions, useQuery } from '@/utils/api';
import { sToMs } from '@/utils/date.util';

interface UseCountsProps<ResourceKey extends MyResourceKey> {
  resource: ResourceKey;
  filters?: string[][];
}

export const useCounts = <ResourceKey extends MyResourceKey>(
  props: UseCountsProps<ResourceKey>,
  options?: UseExtendQueryOptions<Statistics>
) => {
  const axios = useAxios();

  console.log('props.filters', props.filters);
  const filter: string[][] = [...(props.filters || [])];
  const queryKey = getQueryKey.getCounts(props.resource, filter);

  return useQuery<Statistics, Error>({
    ...options,
    defaultErrorMessage: `Failed to fetch ${props.resource} counts`,
    refetchInterval: sToMs(30),
    queryKey,
    queryFn: async () => {
      const { data } = await axios.post(
        `/my/count`,
        [[`#${props.resource}`, ...filter]],
        {
          params: {
            key: props.resource,
          },
        }
      );
      // remap empty key with 'cloud'
      if ('' in data) {
        data.cloud = data[''];
        delete data[''];
      }
      return data as Statistics;
    },
  });
};
