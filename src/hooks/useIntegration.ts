import { useCallback, useMemo } from 'react';

import { useMy } from '@/hooks/useMy';
import { AvailableIntegrations } from '@/sections/overview/Integration';
import { Asset } from '@/types';

export const useIntegration = () => {
  const { data: accounts, status } = useMy(
    {
      resource: 'account',
    },
    {
      refetchInterval: 3000,
    }
  );

  const integrations = useMemo(() => {
    return accounts.filter(account =>
      AvailableIntegrations.includes(account.member)
    );
  }, [JSON.stringify(accounts)]);

  const isIntegration = useCallback(
    (asset: Asset) => {
      return integrations.some(account => account.member === asset.dns);
    },
    [JSON.stringify(integrations)]
  );

  return {
    isIntegration,
    integrations,
    status,
  };
};
