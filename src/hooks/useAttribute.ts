import { toast } from 'sonner';

import { useAxios } from '@/hooks/useAxios';
import { useCounts } from '@/hooks/useCounts';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useMy } from '@/hooks/useMy';
import { getQueryKey } from '@/hooks/useQueryKeys';
import { Attribute } from '@/types';
import { mergeStatus, useMutation, useQueries, useQuery } from '@/utils/api';

interface CreateAttribute {
  key: string;
  name: string;
  value: string;
}

// Hook to get the root domain
export const useGetRootDomain = () => {
  const axios = useAxios();
  return useQuery({
    defaultErrorMessage: 'Failed to fetch root domain',
    queryKey: getQueryKey.getMy('attribute', 'CHARIOT__ROOT_DOMAIN'),
    queryFn: async () => {
      const res = await axios.get('/my', {
        params: { key: '#attribute#CHARIOT__ROOT_DOMAIN' },
      });
      return res.data['attributes'][0] ?? {};
    },
  });
};

// Hook to create or update the root domain
export const useSetRootDomain = () => {
  const axios = useAxios();
  const { invalidate: invalidateAttributeCounts } = useCounts(
    { resource: 'attribute' },
    { enabled: false }
  );
  const { invalidate: invalidateAttributesGenericSearch } = useGenericSearch(
    {
      query: `source:root`,
    },
    {
      enabled: false,
    }
  );

  return useMutation({
    defaultErrorMessage: `Failed to set root domain`,
    mutationFn: async (domain: string) => {
      const promise = axios.post(`/attribute`, {
        key: 'root',
        name: 'Root Domain',
        value: domain,
      });

      toast.promise(promise, {
        loading: 'Setting root domain...',
        success: 'Root domain set successfully',
        error: 'Failed to set root domain',
      });

      const { data } = await promise;
      invalidateAttributeCounts();
      invalidateAttributesGenericSearch();

      return data;
    },
  });
};

export const useCreateAttribute = (resourceKey = '', skipToast = false) => {
  const axios = useAxios();
  const { invalidate: invalidateAttributeCounts } = useCounts(
    { resource: 'attribute' },
    { enabled: false }
  );
  const { invalidate: invalidateAttributesGenericSearch } = useGenericSearch(
    {
      query: `source:${resourceKey}`,
    },
    {
      enabled: false,
    }
  );

  return useMutation({
    defaultErrorMessage: `Failed to add attribute`,
    mutationFn: async (attribute: CreateAttribute) => {
      const promise = axios.post(`/attribute`, {
        key: attribute.key,
        name: attribute.name,
        value: attribute.value,
      });

      if (!skipToast) {
        toast.promise(promise, {
          loading: 'Adding attribute...',
          success: 'Attribute added',
          error: 'Failed to add attribute',
        });
      }

      const { data } = await promise;
      invalidateAttributeCounts();
      invalidateAttributesGenericSearch();

      return data;
    },
  });
};

export const useBulkAddAttributes = () => {
  const axios = useAxios();
  const { invalidate: invalidateAttributeCounts } = useCounts(
    { resource: 'attribute' },
    { enabled: false }
  );
  const { invalidate: invalidateAttribute } = useMy(
    { resource: 'attribute' },
    { enabled: false }
  );

  return useMutation({
    defaultErrorMessage: 'Failed to bulk add attributes',

    mutationFn: async (attributes: CreateAttribute[]) => {
      const promise = Promise.all<Attribute>(
        attributes
          .map(attribute => {
            return axios.post(`/attribute`, {
              key: attribute.key,
              name: attribute.name,
              value: attribute.value,
            });
          })
          // Note: Catch error so we can continue adding assets even if some fail
          .map(p => p.catch(e => e))
      );

      toast.promise(promise, {
        loading: 'Adding attributes',
        success: 'Attributes added',
        error: 'Failed to add attributes',
      });

      const response = await promise;
      const validResults = response.filter(
        result => !(result instanceof Error)
      );

      if (validResults.length > 0) {
        invalidateAttributeCounts();
        invalidateAttribute();
      }

      return response;
    },
  });
};

export const useBulkDeleteAttributes = (props?: { showToast?: boolean }) => {
  const { showToast = true } = props || {};

  const axios = useAxios();
  const { invalidate: invalidateAttributeCounts } = useCounts(
    { resource: 'attribute' },
    { enabled: false }
  );
  const { invalidate: invalidateAttribute } = useMy(
    { resource: 'attribute' },
    { enabled: false }
  );

  return useMutation({
    defaultErrorMessage: 'Failed to delete attributes',
    mutationFn: async (attributes: { key: string }[]) => {
      const promise = Promise.all<Attribute>(
        attributes
          .map(attribute => {
            return axios.delete(`/attribute`, {
              data: {
                key: attribute.key,
              },
            });
          })
          // Note: Catch error so we can continue adding assets even if some fail
          .map(p => p.catch(e => e))
      );

      if (showToast) {
        toast.promise(promise, {
          loading: 'Deleting attributes',
          success: 'Attributes removed',
          error: 'Failed to remove attributes',
        });
      }

      const response = await promise;

      const validResults = response.filter(
        result => !(result instanceof Error)
      );

      if (validResults.length > 0) {
        invalidateAttributeCounts();
        invalidateAttribute();
      }

      return response;
    },
  });
};

export const useAssetsWithAttributes = (attributes: string[]) => {
  const axios = useAxios();
  return useQueries({
    // defaultErrorMessage: 'Failed to fetch assets with attributes',
    queries: attributes
      .filter(x => Boolean(x))
      .map(attribute => {
        return {
          queryKey: getQueryKey.getMy('attribute', `#${attribute}`),
          queryFn: async () => {
            const res = await axios.get(`/my`, {
              params: {
                key: `#attribute#${attribute}`,
              },
            });

            return { pages: [res.data['attributes'] || []], pageParams: [] };
          },
        };
      }),
    combine: results => {
      return {
        data: results
          .filter(x => x)
          .reduce((acc, result) => {
            const processedData = result.data ? result.data.pages.flat() : [];

            const currentSources = processedData.map(
              (attribute: Attribute) => attribute.source
            );
            return acc.length === 0
              ? currentSources
              : [...new Set([...acc, ...currentSources])];
          }, [] as string[]),
        status: mergeStatus(...results.map(result => result.status)),
      };
    },
  });
};
