import { useCallback, useMemo } from 'react';

import { useMy } from '@/hooks/useMy';
import {
  availableAttackSurfaceIntegrations,
  Integrations,
  riskIntegrations,
} from '@/sections/overview/Integrations';
import { Account, Asset } from '@/types';

export const useIntegration = () => {
  const { data: accounts, status } = useMy(
    {
      resource: 'account',
    },
    {
      refetchInterval: 3000,
    }
  );

  const { integrations, ...restProps } = useMemo(() => {
    const { integrationsWithoutHook, hookIntegration } = accounts.reduce<{
      hookIntegration?: Account;
      integrationsWithoutHook: Account[];
    }>(
      (acc, account) => {
        if (!(account.member in Integrations)) {
          return acc;
        }

        if (account.member === Integrations.hook.id) {
          return {
            ...acc,
            hookIntegration: account,
          };
        }

        return {
          ...acc,
          integrationsWithoutHook: [...acc.integrationsWithoutHook, account],
        };
      },
      {
        hookIntegration: undefined,
        integrationsWithoutHook: [],
      }
    );

    const {
      waitlistedIntegrations,
      requiresSetupIntegrations,
      connectedIntegrations,
      riskNotificationStatus,
      attackSurfaceStatus,
    } = integrationsWithoutHook.reduce(
      (acc, integration) => {
        let updatedAcc = acc;

        if (integration.value === 'setup') {
          updatedAcc = {
            ...acc,
            requiresSetupIntegrations: [
              ...acc.requiresSetupIntegrations,
              integration,
            ],
          };
        } else if (integration.value === 'waitlisted') {
          const isNowAvailableToSetup = availableAttackSurfaceIntegrations.find(
            i => i.id === integration.member
          );

          if (isNowAvailableToSetup) {
            updatedAcc = {
              ...acc,
              requiresSetupIntegrations: [
                ...acc.requiresSetupIntegrations,
                integration,
              ],
            };
          } else {
            updatedAcc = {
              ...acc,
              waitlistedIntegrations: [
                ...acc.waitlistedIntegrations,
                integration,
              ],
            };
          }
        } else {
          updatedAcc = {
            ...acc,
            connectedIntegrations: [...acc.connectedIntegrations, integration],
          };
        }

        if (
          integration.value !== 'waitlisted' &&
          (acc.riskNotificationStatus !== 'connected' ||
            acc.attackSurfaceStatus !== 'connected')
        ) {
          const isRiskIntegration = riskIntegrations.find(
            ({ id }) => id === integration.member
          );

          if (isRiskIntegration) {
            if (acc.riskNotificationStatus !== 'connected') {
              if (integration.value === 'setup') {
                updatedAcc = {
                  ...updatedAcc,
                  riskNotificationStatus: 'setup',
                };
              } else {
                updatedAcc = {
                  ...updatedAcc,
                  riskNotificationStatus: 'connected',
                };
              }
            }
          } else {
            if (acc.attackSurfaceStatus !== 'connected') {
              if (integration.value === 'setup') {
                updatedAcc = {
                  ...updatedAcc,
                  attackSurfaceStatus: 'setup',
                };
              } else {
                updatedAcc = {
                  ...updatedAcc,
                  attackSurfaceStatus: 'connected',
                };
              }
            }
          }
        }

        return updatedAcc;
      },
      {
        waitlistedIntegrations: [] as Account[],
        requiresSetupIntegrations: [] as Account[],
        connectedIntegrations: [] as Account[],
        attackSurfaceStatus: 'notConnected' as
          | 'notConnected'
          | 'setup'
          | 'connected',
        riskNotificationStatus: 'notConnected' as
          | 'notConnected'
          | 'setup'
          | 'connected',
      }
    );

    const updatedJobKeys = connectedIntegrations
      .map(integration => integration.member)
      .reduce(
        (acc, member) => {
          acc[member] = member;
          return acc;
        },
        {} as Record<string, string>
      );

    return {
      integrationsWithoutHook,
      hookIntegration,
      integrations: [
        ...integrationsWithoutHook,
        ...(hookIntegration ? [hookIntegration] : []),
      ],
      connectedIntegrations,
      jobKeys: updatedJobKeys,
      requiresSetupIntegrations,
      waitlistedIntegrations,
      attackSurfaceStatus,
      riskNotificationStatus,
    };
  }, [JSON.stringify(accounts)]);

  const isAssetIntegration = useCallback(
    (asset: Asset) => {
      return Boolean(
        integrations.find(account => account.member === asset.dns)
      );
    },
    [JSON.stringify(integrations)]
  );
  return {
    isAssetIntegration,
    status,
    data: {
      ...restProps,
      integrations,
    },
  };
};
