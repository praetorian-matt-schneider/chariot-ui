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
    setSearchParams(searchParams, { replace: true });
  }

  function getAllSearchParams(): Record<string, string> {
    const paramsObj = Array.from(searchParams.keys()).reduce(
      (acc, val) => ({ ...acc, [val]: searchParams.get(val) }),
      {}
    );

    return paramsObj;
  }

  return {
    searchParams,
    addSearchParams,
    removeSearchParams,
    getAllSearchParams,
  };
};

export function getCurrentSearchParam() {
  return new URLSearchParams(window.location.search);
}

export function generatePathWithSearch({
  pathname = window.location.pathname,
  appendSearch = [],
}: {
  pathname?: string;
  appendSearch?: [string, string][];
}) {
  const searchParams = getCurrentSearchParam();

  appendSearch.forEach(([key, value]) => {
    searchParams.set(key, value);
  });

  return {
    pathname,
    search: searchParams.toString(),
  };
}

export async function checkIsImageUrlValid(url: string) {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = function () {
      // Image loaded successfully
      resolve(true);
    };

    img.onerror = function () {
      // An error occurred while loading the image
      resolve(false);
    };

    img.src = url;
  });
}
