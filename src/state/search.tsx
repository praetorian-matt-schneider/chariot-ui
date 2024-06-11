import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDebounce } from 'use-debounce';

import { useSearchParams } from '@/hooks/useSearchParams';
import { useComponentDidUpdate } from '@/utils/reactHooks.util';
import { StorageKey } from '@/utils/storage/useStorage.util';

interface SearchContextType {
  search: string;
  genericSearch: string;
  hashSearch: string;
  advancedSearch: Record<string, string>;
  isAdvancedSearch: boolean;
  isHashSearch: boolean;
  isGenericSearch: boolean;
  appendAdvancedSearch: (search: string) => void;
  update: (term: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const ADVANCED_SEARCH_REGEX = /(\w+):?(.*?)(?=\s|$)/;

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
  const { searchParams, addSearchParams, removeSearchParams } =
    useSearchParams();

  const unparsedFilterComposite = searchParams.get(StorageKey.HASH_SEARCH);
  const unparsedQ = searchParams.get(StorageKey.GENERIC_SEARCH);
  const forceUpdateGlobalSearch = searchParams.get(
    StorageKey.FORCE_UPDATE_GLOBAL_SEARCH
  );

  const filterComposite = unparsedFilterComposite
    ? decodeURIComponent(unparsedFilterComposite)
    : '';
  const q = unparsedQ && decodeURIComponent(unparsedQ);

  const [searchTerm, setSearchTerm] = useState(q || filterComposite || '');
  const [debouncedSearch, setDebouncedSearchTerm] = useDebounce(
    searchTerm,
    500
  );

  const isAdvancedSearch = isAdvancedSearchFn(searchTerm);
  const isHashSearch =
    searchTerm.startsWith('#') || searchTerm.startsWith('%23');
  const isGenericSearch = !isAdvancedSearch && !isHashSearch;

  useEffect(() => {
    if (forceUpdateGlobalSearch && forceUpdateGlobalSearch === 'true') {
      removeSearchParams(StorageKey.FORCE_UPDATE_GLOBAL_SEARCH);
    }
  }, []);

  useComponentDidUpdate(() => {
    if (isHashSearch) {
      const setHashSearchTimer = setTimeout(() => {
        addSearchParams(StorageKey.HASH_SEARCH, searchTerm);
      }, 500);

      return () => {
        clearTimeout(setHashSearchTimer);
      };
    } else {
      removeSearchParams(StorageKey.HASH_SEARCH);
    }
  }, [isHashSearch, searchTerm]);

  useComponentDidUpdate(() => {
    if (forceUpdateGlobalSearch && forceUpdateGlobalSearch === 'true') {
      setSearchTerm(q || filterComposite || '');
      removeSearchParams(StorageKey.FORCE_UPDATE_GLOBAL_SEARCH);
    }
  }, [forceUpdateGlobalSearch]);

  const advancedSearch: Record<string, string> = useMemo(() => {
    const searchItems = isAdvancedSearchFn(searchTerm)
      ? searchTerm.match(new RegExp(ADVANCED_SEARCH_REGEX, 'g'))
      : [];

    return searchItems
      ? Object.fromEntries(
          searchItems
            .map(searchItem => {
              const searchItems = searchItem.match(ADVANCED_SEARCH_REGEX);

              if (searchItems) {
                return [searchItems[1], searchItems[2]];
              }

              return [];
            })
            .filter(x => x.length > 0)
        )
      : {};
  }, [searchTerm]);

  function isAdvancedSearchFn(search: string) {
    return search.startsWith('=');
  }

  function update(term: string) {
    const trimmedTerm = term.trimStart();
    setSearchTerm(trimmedTerm);
    setDebouncedSearchTerm(trimmedTerm);
  }

  function appendAdvancedSearch(search: string) {
    setSearchTerm(currentSearch => {
      return isAdvancedSearchFn(currentSearch)
        ? `${currentSearch} ${search}`
        : `= ${search}`;
    });
  }

  return (
    <SearchContext.Provider
      value={{
        search: searchTerm,
        genericSearch: isGenericSearch ? debouncedSearch : '',
        hashSearch: isHashSearch ? debouncedSearch : '',
        advancedSearch,
        isAdvancedSearch,
        isHashSearch,
        isGenericSearch,
        update,
        appendAdvancedSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
