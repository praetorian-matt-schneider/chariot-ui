import { useMemo } from 'react';

import { useMy } from '@/hooks/useMy';
import {
  allIntegrations,
  availableAttackSurfaceIntegrations,
  availableRiskIntegrations,
  comingSoonRiskIntegrations,
  Integrations,
} from '@/sections/overview/Integrations';
import { Account, GetStartedStatus } from '@/types';

type AccountWithType = Account & { type: string; displayName: string };

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
      (acc, integrationWithoutType) => {
        let updatedAcc = acc;
        const integration = {
          ...integrationWithoutType,
          type: [
            ...availableRiskIntegrations,
            ...comingSoonRiskIntegrations,
          ].find(current => current.id === integrationWithoutType.member)
            ? 'riskNotification'
            : 'attack',
          displayName:
            (
              allIntegrations.find(
                current => current.id === integrationWithoutType.member
              )?.name || ''
            )?.split(' ')[0] || integrationWithoutType.member,
        };

        if (integration.value === 'setup') {
          updatedAcc = {
            ...acc,
            requiresSetupIntegrations: [
              ...acc.requiresSetupIntegrations,
              integration,
            ],
          };
        } else if (integration.value === 'waitlisted') {
          const isNowAvailableToSetup = [
            ...availableAttackSurfaceIntegrations,
            ...availableRiskIntegrations,
          ].find(i => i.id === integration.member);

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
          const isRiskIntegration = [
            ...availableRiskIntegrations,
            ...comingSoonRiskIntegrations,
          ].find(({ id }) => id === integration.member);

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
        waitlistedIntegrations: [] as AccountWithType[],
        requiresSetupIntegrations: [] as AccountWithType[],
        connectedIntegrations: [] as AccountWithType[],
        attackSurfaceStatus: 'notConnected' as GetStartedStatus,
        riskNotificationStatus: 'notConnected' as GetStartedStatus,
      }
    );

    const updatedJobKeys = connectedIntegrations.reduce(
      (acc, integration) => {
        acc[integration.member] =
          `#job#${integration.member}#${integration.value}${integration.member === 'amazon' ? '' : '#'}`;
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

  return {
    status,
    data: {
      ...restProps,
      integrations,
    },
  };
};
