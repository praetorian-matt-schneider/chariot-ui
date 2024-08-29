import { useSearchParams } from 'react-router-dom';

import { safeExecute } from '@/utils/function.util';
import { isEqual } from '@/utils/lodash.util';

export const useQueryFilters = <T>({
  key,
  defaultFilters,
}: {
  key: string;
  defaultFilters: T;
}): [T, (filters: T) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchValue = searchParams.get(key);

  const filters = searchValue
    ? safeExecute<T>(() => JSON.parse(searchValue), defaultFilters)
    : defaultFilters;

  const setFilters = (filters: T) => {
    setSearchParams(prevParam => {
      if (isEqual(filters, defaultFilters)) {
        prevParam.delete(key);
      } else {
        prevParam.set(key, JSON.stringify(filters));
      }

      return prevParam;
    });
  };

  return [filters, setFilters];
};
