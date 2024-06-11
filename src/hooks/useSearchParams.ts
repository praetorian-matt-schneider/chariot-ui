import { useSearchParams as useSearchParamRouter } from 'react-router-dom';

export const useSearchParams = () => {
  const [searchParams, setSearchParams] = useSearchParamRouter();

  function removeSearchParams(resource = '') {
    if (searchParams.get(resource)) {
      searchParams.delete(resource);
      setSearchParams(searchParams, { replace: true });
    }
  }

  function addSearchParams(key: string, value = '') {
    searchParams.set(key, value);
    setSearchParams(searchParams);
  }

  return { searchParams, addSearchParams, removeSearchParams };
};
