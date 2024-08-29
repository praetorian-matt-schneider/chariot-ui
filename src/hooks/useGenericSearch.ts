import { mapAssetStataus } from '@/hooks/useAssets';
import { useAxios } from '@/hooks/useAxios';
import { getQueryKey } from '@/hooks/useQueryKeys';
import { GenericResource } from '@/types';
import { UseExtendInfiniteQueryOptions, useInfiniteQuery } from '@/utils/api';

export const useGenericSearch = (
  props: { query: string; exact?: boolean },
  options?: UseExtendInfiniteQueryOptions<GenericResource>
) => {
  const { query, exact } = props;

  const axios = useAxios();

  const response = useInfiniteQuery<GenericResource>({
    ...options,
    defaultErrorMessage: `Failed to fetch search result`,
    retry: false,
    queryKey: getQueryKey.genericSearch(query),
    enabled: options?.enabled ?? Boolean(query),
    queryFn: async ({ pageParam }) => {
      const { data } = await axios.get<GenericResource>(`/my`, {
        params: {
          key: query,
          exact: exact,
          offset: pageParam ? JSON.stringify(pageParam) : undefined,
        },
      });

      if (data.assets) {
        return {
          data: {
            ...data,
            assets: data.assets.map(asset => {
              return {
                ...asset,
                status: mapAssetStataus(asset),
              };
            }),
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          offset: (data as any)?.offset,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { data, offset: (data as any)?.offset };
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => {
      return lastPage.offset;
    },
  });

  const processedData = response.data
    ? response.data.pages.reduce(
        (acc, data) => {
          return {
            accounts: [
              ...acc['accounts'],
              ...(data?.['data']?.['accounts'] || []),
            ],
            assets: [...acc['assets'], ...(data?.['data']?.['assets'] || [])],
            attributes: [
              ...acc['attributes'],
              ...(data?.['data']?.['attributes'] || []),
            ],
            conditions: [
              ...acc['conditions'],
              ...(data?.['data']?.['conditions'] || []),
            ],
            files: [...acc['files'], ...(data?.['data']?.['files'] || [])],
            jobs: [...acc['jobs'], ...(data?.['data']?.['jobs'] || [])],
            risks: [...acc['risks'], ...(data?.['data']?.['risks'] || [])],
            threats: [
              ...acc['threats'],
              ...(data?.['data']?.['threats'] || []),
            ],
          };
        },
        {
          accounts: [],
          assets: [],
          attributes: [],
          conditions: [],
          files: [],
          jobs: [],
          risks: [],
          threats: [],
        } as GenericResource
      )
    : undefined;

  return {
    ...response,
    data: processedData,
  };
};
