import { UseExtendQueryOptions, useQuery } from '@/utils/api';

import { GenericResource } from '../types';

import { mapAssetStataus } from './useAssets';
import { useAxios } from './useAxios';
import { getQueryKey } from './useQueryKeys';

export const useGenericSearch = (
  props: { query: string },
  options?: UseExtendQueryOptions<GenericResource>
) => {
  const { query } = props;

  const axios = useAxios();
  return useQuery<GenericResource>({
    ...options,
    defaultErrorMessage: `Failed to fetch search result`,
    queryKey: getQueryKey.genericSearch(query),
    enabled: options?.enabled ?? Boolean(query),
    queryFn: async () => {
      const { data } = await axios.get<GenericResource>(`/my`, {
        params: {
          key: query,
        },
      });

      if (data.assets) {
        return {
          ...data,
          assets: data.assets.map(asset => {
            return {
              ...asset,
              status: mapAssetStataus(asset),
            };
          }),
        };
      }

      return data;
    },
  });
};
