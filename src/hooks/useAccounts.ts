import { useMemo } from 'react';
import {
  deleteUserAttributes,
  fetchUserAttributes,
  FetchUserAttributesOutput,
  updateUserAttribute,
} from 'aws-amplify/auth';
import { toast } from 'sonner';

import { useAxios } from '@/hooks/useAxios';
import { useMy } from '@/hooks/useMy';
import { getQueryKey } from '@/hooks/useQueryKeys';
import { Integrations } from '@/sections/overview/Integrations';
import { useAuth } from '@/state/auth';
import { Account, LinkAccount } from '@/types';
import { UseExtendQueryOptions, useMutation, useQuery } from '@/utils/api';
import { getChariotWebhookURL } from '@/utils/integration.util';
import { capitalize } from '@/utils/lodash.util';

export const useModifyAccount = (
  action: 'link' | 'unlink' | 'updateSetting',
  skipOnSuccess?: boolean
) => {
  const axios = useAxios();
  const { invalidate: invalidateAccount } = useMy(
    { resource: 'account' },
    { enabled: false }
  );
  const { invalidate: invalidateAsset } = useMy(
    { resource: 'asset' },
    { enabled: false }
  );
  const { me, api } = useAuth();

  return useMutation<Account, Error, LinkAccount>({
    defaultErrorMessage: 'Failed to modify account',
    mutationFn: async account => {
      try {
        const {
          username,
          config: configAccount,
          member,
          value,
          key,
          ...rest
        } = account;
        const config =
          configAccount || (Object.keys(rest).length ? rest : null);
        let data: Account;

        if (action === 'link' || action === 'updateSetting') {
          const response = await axios.post(`/account/${username}`, {
            config,
            value,
          });
          data = response.data as Account;
        } else {
          const response = await axios.delete(`/account/${username}`, {
            data: {
              config: configAccount,
              member,
              value,
              key,
            },
          });
          data = response.data as Account;
        }

        return data;
      } catch (error) {
        toast.error(
          `Error ${action === 'link' ? 'connecting' : 'disconnecting'} account`,
          {
            description: 'Please check your username and secret and try again.',
          }
        );
        throw error;
      }
    },
    onSuccess: (data, account) => {
      if (!skipOnSuccess) {
        const { username } = account;

        const snackbarTitle =
          username in Integrations ? 'integration' : 'account';

        const snackbarAction =
          action === 'link'
            ? 'connected'
            : action === 'updateSetting'
              ? 'updated'
              : 'disconnected';

        if (action === 'link' && username === 'hook') {
          const webhookUrl = getChariotWebhookURL({
            api,
            me,
            pin: data.value,
          });
          navigator.clipboard.writeText(webhookUrl);
        }

        invalidateAccount();
        invalidateAsset();

        // Show success snackbar
        toast.success(`${capitalize(snackbarTitle)} ${snackbarAction}`, {
          description:
            username === 'hook'
              ? action === 'link'
                ? 'Webhook URL copied to clipboard.'
                : 'Webhook URL was destroyed.'
              : `Your ${snackbarTitle} has been successfully ${snackbarAction}.`,
        });
      }
    },
  });
};

export const useUpdateUserAttributes = () => {
  const { invalidate } = useUserAttributes({ enabled: false });

  return useMutation({
    defaultErrorMessage: ({ key }) => {
      return `Error updating user attribute: ${key}`;
    },
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await updateUserAttribute({
        userAttribute: { attributeKey: key, value },
      });
    },
    onSuccess: (_, { key }) => {
      invalidate();
      if (key === 'custom:frozen') {
        toast.success('Jobs Resumed', {
          description: 'All the automated jobs have been resumed.',
        });
      } else {
        toast.success(`User attribute updated`);
      }
    },
  });
};

export const useDeleteUserAttributes = () => {
  const { invalidate } = useUserAttributes({ enabled: false });

  return useMutation({
    defaultErrorMessage: ({ key }) => {
      return `Error deleting user attribute: ${key}`;
    },
    mutationFn: async ({ key }: { key: string }) => {
      await deleteUserAttributes({
        userAttributeKeys: [key],
      });
    },
    onSuccess: (_, { key }) => {
      invalidate();
      if (key === 'custom:frozen') {
        toast.success('Jobs Frozen', {
          description: 'All the automated jobs have been paused.',
        });
      } else {
        toast.success(`User attribute deleted`);
      }
    },
  });
};

export const useUserAttributes = (
  options?: UseExtendQueryOptions<FetchUserAttributesOutput>
) => {
  return useQuery({
    ...options,
    defaultErrorMessage: 'Failed to fetch user attributes',
    queryKey: getQueryKey.userAttributes(),
    queryFn: async () => {
      return await fetchUserAttributes();
    },
  });
};

export function usePurgeAccount() {
  const axios = useAxios();
  const { logout } = useAuth();

  return useMutation<null, Error, void>({
    defaultErrorMessage: `Failed to purge account`,
    mutationFn: async () => {
      try {
        await axios.delete(`/account/purge`);
        logout();
      } catch {
        // ignore
      }
      return null;
    },
  });
}

export function useGetAccountDetails(accounts: Account[]) {
  return useMemo(() => {
    const myAccount = accounts?.find(acc => acc.key.endsWith('#settings#'));

    return {
      name: myAccount?.config?.displayName || '',
    };
  }, [JSON.stringify(accounts)]);
}

export function useGetPrimaryEmail() {
  const { isSSO, me } = useAuth();

  const { data: myAccounts, status: myAccountsStatus } = useMy(
    {
      resource: 'account',
    },
    { doNotImpersonate: true, enabled: isSSO }
  );

  const myAccount = myAccounts?.find(acc => acc.member.startsWith('sso:'));

  return {
    data: isSSO ? myAccount?.name || '' : me,
    status: isSSO ? myAccountsStatus : 'success',
  };
}

export function getDisplayName(accounts: Account[]) {
  const myAccount = accounts?.find(acc => acc.key.endsWith('#settings#'));

  return myAccount?.config?.displayName || '';
}

export function useGetCollaboratorEmails(accounts: Account[]) {
  return useMemo(() => {
    return accounts
      .filter(
        acc => !acc.key.endsWith('#settings#') && acc?.member === acc?.username
      )
      .map(acc => acc.name);
  }, [JSON.stringify(accounts)]);
}
