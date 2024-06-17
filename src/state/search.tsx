import React, { createContext, useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { useSearchParams } from '@/hooks/useSearchParams';
import { useComponentDidUpdate } from '@/utils/reactHooks.util';
import { StorageKey } from '@/utils/storage/useStorage.util';

interface SearchContextType {
  search: string;
  debouncedSearch: string;
  genericSearchFromQuery: string;
  hashSearchFromQuery: string;
  isHashSearch: boolean;
  isGenericSearch: boolean;
  update: (search: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const { searchParams, addSearchParams, removeSearchParams } =
    useSearchParams();

  const unparsedHashSearch = searchParams.get(StorageKey.HASH_SEARCH);
  const unparsedQ = searchParams.get(StorageKey.GENERIC_SEARCH);

  const hashSearchFromQuery = unparsedHashSearch
    ? decodeURIComponent(unparsedHashSearch)
    : '';
  const genericSearchFromQuery = unparsedQ ? decodeURIComponent(unparsedQ) : '';
  const querySearchTerm = genericSearchFromQuery || hashSearchFromQuery || '';

  const [searchTerm, setSearchTerm] = useState(querySearchTerm);
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const isHashSearch = checkIsHashSearch(searchTerm);
  const isGenericSearch = Boolean(searchTerm) && !isHashSearch;

  useComponentDidUpdate(() => {
    if (checkIsHashSearch(debouncedSearch)) {
      removeSearchParams(StorageKey.GENERIC_SEARCH);
      addSearchParams(StorageKey.HASH_SEARCH, debouncedSearch);
    } else {
      removeSearchParams(StorageKey.HASH_SEARCH);
    }
  }, [debouncedSearch]);

  useComponentDidUpdate(() => {
    if (querySearchTerm !== debouncedSearch) {
      setSearchTerm(querySearchTerm);
    }
  }, [querySearchTerm]);

  function update(term: string) {
    const trimmedTerm = term.trimStart();
    setSearchTerm(trimmedTerm);
  }

  return (
    <SearchContext.Provider
      value={{
        search: searchTerm,
        debouncedSearch,
        genericSearchFromQuery: isGenericSearch ? genericSearchFromQuery : '',
        hashSearchFromQuery: isHashSearch ? hashSearchFromQuery : '',
        isHashSearch,
        isGenericSearch,
        update,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

function checkIsHashSearch(search: string) {
  return search.startsWith('#');
}
