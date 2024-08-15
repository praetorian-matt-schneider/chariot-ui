// eslint-disable-next-line no-restricted-imports

import { useMy } from '@/hooks/useMy';

export function useGetKev() {
  const { data, status } = useMy({
    resource: 'attribute',
    filters: [['#attribute#source#kev']],
  });

  return {
    data: data?.map(({ source }) => source),
    status,
  };
}
