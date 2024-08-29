import { useAxios } from '@/hooks/useAxios';
import { getQueryKey } from '@/hooks/useQueryKeys';
import { MyResourceKey, Statistics } from '@/types';
import { UseExtendQueryOptions, useQuery } from '@/utils/api';
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
