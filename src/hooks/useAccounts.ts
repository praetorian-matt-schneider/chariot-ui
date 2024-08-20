import { useMemo } from 'react';
import { toast } from 'sonner';

import { useAxios } from '@/hooks/useAxios';
import { useMy } from '@/hooks/useMy';
import { Integrations } from '@/sections/overview/Integrations';
import { useAuth } from '@/state/auth';
import { Account, LinkAccount } from '@/types';
import { useMutation } from '@/utils/api';
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
            pin: data.config.pin,
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
