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

export function getCurrentSearchParam() {
  return new URLSearchParams(window.location.search);
}

export function generateUrlWithSearchParam(key: string, value = '') {
  const searchParams = getCurrentSearchParam();
  searchParams.set(key, value);

  return {
    pathname: window.location.pathname,
    search: searchParams.toString(),
  };
}
