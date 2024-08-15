// eslint-disable-next-line no-restricted-imports
import { toast } from 'sonner';

import { useAxios } from '@/hooks/useAxios';
import { useCounts } from '@/hooks/useCounts';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useMy } from '@/hooks/useMy';
import { Attribute } from '@/types';
import { useMutation } from '@/utils/api';

interface CreateAttribute {
  key: string;
  name: string;
  value: string;
}

// Hook to get the root domain
export const useGetRootDomain = () => {
  const rootDomainQuery = useMy({
    resource: 'attribute',
    filters: [['#attribute#CHARIOT__ROOT_DOMAIN']],
  });

  return {
    ...rootDomainQuery,
    data: rootDomainQuery?.data?.[0] ?? {},
  };
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
