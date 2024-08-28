import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon as ExclamationTriangleIconOutline,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/solid';
import { Hourglass, Unplug } from 'lucide-react';

import { AssetUsage } from '@/components/AssetUsage';
import { Button } from '@/components/Button';
import { DomainDrawerContent } from '@/components/DomainDrawerContent';
import { Drawer } from '@/components/Drawer';
import { Input } from '@/components/form/Input';
import { GettingStarted } from '@/components/GettingStarted';
import { Loader } from '@/components/Loader';
import { Modal } from '@/components/Modal';
import { Table } from '@/components/table/Table';
import { Tooltip } from '@/components/Tooltip';
import UpgradeMenu from '@/components/UpgradeMenu';
import { useMy } from '@/hooks';
import { useGetAccountDetails, useModifyAccount } from '@/hooks/useAccounts';
import { useCreateAsset } from '@/hooks/useAssets';
import {
  useBulkDeleteAttributes,
  useCreateAttribute,
  useGetRootDomain,
} from '@/hooks/useAttribute';
import { useCounts } from '@/hooks/useCounts';
import { useIntegration } from '@/hooks/useIntegration';
import useIntegrationCounts from '@/hooks/useIntegrationCounts';
import { useJobsStatus } from '@/hooks/useJobs';
import { RenderHeaderExtraContentSection } from '@/sections/AuthenticatedApp';
import {
  AttackSurfaceCard,
  RiskNotificationCard,
} from '@/sections/overview/IntegrationCards';
import {
  availableAttackSurfaceIntegrations,
  comingSoonAttackSurfaceIntegrations,
  riskIntegrations,
} from '@/sections/overview/Integrations';
import SetupModal from '@/sections/SetupModal';
import { useAuth } from '@/state/auth';
import { useGlobalState } from '@/state/global.state';
import { Account, AssetStatus, FREEMIUM_ASSETS_LIMIT, Plan } from '@/types';
import { Job, JobStatus, JobStatusLabel } from '@/types';
import { partition } from '@/utils/array.util';
import { cn } from '@/utils/classname';
import { getRoute } from '@/utils/route.util';
import { useStorage } from '@/utils/storage/useStorage.util';
import { generatePathWithSearch } from '@/utils/url.util';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircleIcon className="size-8 text-[#10B981]" />;
    case 'warning':
      return (
        <div className="flex size-7 items-center justify-center rounded-full bg-[#FFD700]">
          <WrenchScrewdriverIcon className="size-4 text-[#2D3748]" />
        </div>
      );
    case 'error':
      return <ExclamationTriangleIcon className="size-7 text-[#F87171]" />;
    case 'waitlist':
      return (
        <div className="flex size-7 items-center justify-center rounded-full bg-gray-600">
          <Hourglass className="size-4 text-[#2D3748]" />
        </div>
      );
    default:
      return <div className="size-4 bg-gray-600"></div>;
  }
};

interface JobI {
  member: string;
  status?: Job['status'];
  comment?: string;
  lastStatus?: Job['status'];
}

const getJobsStatus = (job?: JobI) => {
  const status = job?.status;
  const comment = job?.comment;
  const lastStatus = status === JobStatus.Running ? job?.lastStatus : '';

  const getStatus = () => {
    switch (status) {
      case JobStatus.Fail:
        return <XCircleIcon className="size-7 text-[#F87171]" />;
      case JobStatus.Running:
        return <ArrowPathIcon className="size-7 animate-spin" />;
      case JobStatus.Queued:
        return (
          <div className="flex size-7 items-center justify-center rounded-full bg-gray-600">
            <Hourglass className="size-4 text-[#2D3748]" />
          </div>
        );
      default:
        return (
          <CheckCircleIcon className="size-8 text-center text-[#10B981]" />
        );
    }
  };

  return (
    <Tooltip
      placement="left"
      title={
        status ? (
          <div className="space-y-4">
            <span>{`Job ${JobStatusLabel[status]}`}</span>
            {comment && <div>{comment}</div>}
            {lastStatus && <div>Last Status: {JobStatusLabel[lastStatus]}</div>}
          </div>
        ) : (
          ''
        )
      }
    >
      {getStatus()}
    </Tooltip>
  );
};

export const Overview: React.FC = () => {
  const { me, friend } = useAuth();
  const navigate = useNavigate();

  const [isAttackSurfaceDrawerOpen, setIsAttackSurfaceDrawerOpen] = useStorage(
    { queryKey: 'attackSurfaceDrawer' },
    false
  );
  const [isRiskNotificationsDrawerOpen, setIsRiskNotificationsDrawerOpen] =
    useStorage({ queryKey: 'riskNotificationDrawer' }, false);

  const [isDomainDrawerOpen, setIsDomainDrawerOpen] = useState(false);
  const [disconnectIntegrationKey, setDisconnectIntegrationKey] =
    useState<string>('');
  const [isUpgradePlanOpen, setIsUpgradePlanOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [setupIntegration, setSetupIntegration] = useState<Account>();
  const [updatedRootDomain, setUpdatedRootDomain] = useState<{
    domain: string;
    scanOption: AssetStatus;
  }>();
  const [
    selectedAttackSurfaceIntegrations,
    setSelectedAttackSurfaceIntegrations,
  ] = useState<string[]>([]);
  const [
    selectedRiskNotificationIntegrations,
    setSelectedRiskNotificationIntegrations,
  ] = useState<string[]>([]);

  const {
    modal: {
      asset: { onOpenChange: onAddAssetOpenChange },
    },
  } = useGlobalState();
  const {
    data: {
      jobKeys,
      requiresSetupIntegrations,
      waitlistedIntegrations,
      connectedIntegrations,
      riskNotificationStatus,
      attackSurfaceStatus,
    },
  } = useIntegration();

  const integrationCounts = useIntegrationCounts(connectedIntegrations);
  const { data: jobsData } = useJobsStatus(jobKeys);
  const {
    data: rootDomain,
    refetch,
    status: rootDomainStatus,
  } = useGetRootDomain();
  const { data: assetCount, status: assetCountStatus } = useCounts({
    resource: 'asset',
  });
  const { data: providedAssets, status: providedAssetsStatus } = useCounts({
    resource: 'attribute',
    query: '#provided#',
  });
  const {
    data: accounts,
    status: accountsStatus,
    invalidate: invalidateAccounts,
  } = useMy({
    resource: 'account',
  });

  const { mutateAsync: createAsset } = useCreateAsset();
  const { mutateAsync: createAttribute } = useCreateAttribute('', true);
  const { mutateAsync: deleteAttribute } = useBulkDeleteAttributes({
    showToast: false,
  });
  const { mutate: unlink } = useModifyAccount('unlink');
  const { mutateAsync: link, status: linkStatus } = useModifyAccount(
    'link',
    true
  );

  const stringifiedConnectedIntegrations = JSON.stringify(
    connectedIntegrations
  );
  const domainToDiplay = rootDomain?.value ?? (friend || me).split('@')[1];
  const currentPlan = getCurrentPlan({ accounts, friend });
  const displayName = useGetAccountDetails(accounts).name || friend || me;

  const disconnectIntegration = useMemo(() => {
    return [...connectedIntegrations, ...requiresSetupIntegrations].find(
      integration => integration.key === disconnectIntegrationKey
    );
  }, [stringifiedConnectedIntegrations, disconnectIntegrationKey]);
  const jobs: JobI[] = useMemo(() => {
    return connectedIntegrations.map(integration => {
      const job = jobsData[integration.member];

      return {
        member: integration.member,
        status: job?.status,
        comment: job?.comment,
        lastStatus: job?.status,
      };
    });
  }, [stringifiedConnectedIntegrations, JSON.stringify(jobsData)]);
  // Map the counts to each integration
  const counts = useMemo(() => {
    return integrationCounts.map((result, index) => ({
      member: connectedIntegrations[index].member,
      value: connectedIntegrations[index].value,
      count: result.data,
    }));
  }, [stringifiedConnectedIntegrations, JSON.stringify(integrationCounts)]);
  const usedAssets = useMemo(() => {
    return assetCount
      ? Object.values(assetCount).reduce((acc, val) => acc + val, 0)
      : 0;
  }, [JSON.stringify(assetCount)]);
  const {
    filteredRiskNotificationIntegrations,
    filteredAttackSurfaceIntegrations,
  } = useMemo(() => {
    const filteredAttackSurfaceIntegrations = [
      ...availableAttackSurfaceIntegrations,
      ...comingSoonAttackSurfaceIntegrations,
    ].filter(integration =>
      integration.name.toLowerCase().includes(search?.toLowerCase())
    );

    filteredAttackSurfaceIntegrations.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const filteredRiskNotificationIntegrations = riskIntegrations.filter(
      integration =>
        integration.name.toLowerCase().includes(search?.toLowerCase())
    );

    return {
      filteredRiskNotificationIntegrations,
      filteredAttackSurfaceIntegrations,
    };
  }, [search]);

  useEffect(() => {
    if (!isAttackSurfaceDrawerOpen && !isRiskNotificationsDrawerOpen) {
      setSearch('');
    }
  }, [isAttackSurfaceDrawerOpen, isRiskNotificationsDrawerOpen]);

  function closeAttackSurfaceDrawer() {
    setSelectedAttackSurfaceIntegrations([]);

    setIsAttackSurfaceDrawerOpen(false);
  }

  function closeRiskNotificationDrawer() {
    setSelectedRiskNotificationIntegrations([]);

    setIsRiskNotificationsDrawerOpen(false);
  }

  async function handleUpdateRootDomain() {
    if (!updatedRootDomain) return;

    await createAsset({
      name: updatedRootDomain?.domain,
      status: updatedRootDomain?.scanOption,
    });

    if (rootDomain?.key) {
      await deleteAttribute([rootDomain]);
    }
    await createAttribute({
      key: `#asset#${updatedRootDomain?.domain}#${updatedRootDomain?.domain}`,
      name: 'CHARIOT__ROOT_DOMAIN',
      value: updatedRootDomain?.domain,
    });

    refetch();
    setIsDomainDrawerOpen(false);
  }

  const data = useMemo(() => {
    const tableData = [
      {
        status: 'success',
        surface: 'Chariot',
        identifier: 'Provided',
        discoveredAssets: providedAssets
          ? Object.values(providedAssets).reduce((a, v) => a + v, 0)
          : 0,
        discoveredAssetsStatus: providedAssetsStatus,
        actions: 'AddAsset',
        connected: false,
        id: 'chariot',
        key: 'chariot',
        account: undefined,
        type: 'chariot',
      },
      ...requiresSetupIntegrations.map(integration => {
        return {
          status: 'warning',
          surface: integration.displayName,
          identifier: 'Requires Setup',
          discoveredAssets: '0',
          discoveredAssetsStatus: 'success',
          actions: 'Setup',
          connected: false,
          id: integration.member,
          key: integration.key,
          account: integration,
          type: integration.type,
        };
      }),
      ...connectedIntegrations.map(integration => ({
        status: 'success',
        surface: integration.displayName,
        identifier: integration.value ?? '[Redacted]',
        discoveredAssets:
          counts.find(
            count =>
              count.member === integration.member &&
              count.value === integration.value
          )?.count || 0,
        discoveredAssetsStatus: assetCountStatus,
        actions: 'Disconnect',
        connected: true,
        id: integration.member,
        key: integration.key,
        account: integration,
        type: integration.type,
      })),
    ];

    const waitlistedIntegrationsData = waitlistedIntegrations.map(
      integration => {
        return {
          status: 'waitlist',
          surface: integration.displayName,
          identifier: 'Coming Soon',
          discoveredAssets: '0',
          discoveredAssetsStatus: 'success',
          actions: 'Waitlist',
          connected: false,
          id: integration.member,
          key: integration.key,
          account: integration,
          type: integration.type,
        };
      }
    );

    const [, rest] = partition(
      tableData,
      row => row.type === 'riskNotification'
    );

    return [
      ...rest.sort((a, b) => a.surface.localeCompare(b.surface)),
      ...waitlistedIntegrationsData,
    ];
  }, [
    assetCount,
    assetCountStatus,
    requiresSetupIntegrations,
    connectedIntegrations,
    counts,
    waitlistedIntegrations,
  ]);

  return (
    <div>
      <RenderHeaderExtraContentSection>
        <div>
          <div className="flex flex-row items-center justify-center space-x-6">
            <div className="flex w-full flex-row justify-between">
              <div>
                <Loader
                  styleType="header"
                  isLoading={accountsStatus === 'pending'}
                >
                  <p className="text-2xl font-bold text-white">
                    {displayName}&apos;s Organization
                  </p>
                </Loader>
                <button
                  onClick={() => setIsDomainDrawerOpen(true)}
                  className=" flex flex-row items-center justify-center space-x-1 text-center text-sm text-white underline"
                >
                  <Loader isLoading={rootDomainStatus === 'pending'}>
                    {domainToDiplay}
                  </Loader>
                  <PencilSquareIcon className="ml-1 inline size-5 text-layer0" />{' '}
                </button>
              </div>
              <AssetUsage
                currentPlan={currentPlan}
                used={usedAssets}
                assetCountStatus={assetCountStatus}
                total={FREEMIUM_ASSETS_LIMIT}
                setIsUpgradePlanOpen={setIsUpgradePlanOpen}
              />
            </div>
          </div>
        </div>
      </RenderHeaderExtraContentSection>
      <div className="flex w-full flex-col text-gray-200">
        <GettingStarted
          completedSteps={{
            rootDomain:
              rootDomain?.value !== undefined ? 'connected' : 'notConnected',
            attackSurface: attackSurfaceStatus,
            riskNotifications: riskNotificationStatus,
          }}
          onRootDomainClick={() => setIsDomainDrawerOpen(true)}
          onAttackSurfaceClick={() => setIsAttackSurfaceDrawerOpen(true)}
          onRiskNotificationsClick={() =>
            setIsRiskNotificationsDrawerOpen(true)
          }
          total={FREEMIUM_ASSETS_LIMIT}
          isFreemiumMaxed={
            currentPlan === 'freemium' &&
            FREEMIUM_ASSETS_LIMIT - usedAssets <= 0
          }
        />
        <main className="mt-6 w-full">
          <div className="overflow-hidden rounded-lg border-2 border-header-dark bg-header shadow-md">
            <div className="flex w-full p-8">
              <div className="flex flex-1 flex-col">
                <p className="text-xl font-bold text-white">Attack Surface</p>
                <p className="text-xs font-normal text-gray-500">
                  Your attack surface represents all the points where a
                  potential risk could occur in your digital environment.
                </p>
                <p className="text-xs font-normal text-gray-500">
                  Building your attack surface helps you monitor and protect
                  these points effectively.
                </p>
              </div>
            </div>
            <div>
              <Table
                tableClassName="bg-header border-0 [&_thead_tr]:bg-header [&_tbody_tr:nth-child(odd)]:bg-header-dark [&_tr_td]:text-layer0 [&__tr_td_div:first]:border-t-4 [&_td_div]:border-header-dark [&_th_div]:border-0"
                name="attack-surface"
                status="success"
                error={null}
                columns={[
                  {
                    label: 'Status',
                    id: 'status',
                    fixedWidth: 150,
                    align: 'center',
                    cell: row => {
                      return row.connected
                        ? getJobsStatus(jobs.find(job => job.member === row.id))
                        : getStatusIcon(row.status);
                    },
                  },
                  {
                    label: 'Surface',
                    id: 'surface',
                    className: 'font-bold',
                  },
                  {
                    label: 'Identifier',
                    id: 'identifier',
                    cell: row => (
                      <div
                        className={
                          row.identifier === 'Requires Setup'
                            ? 'text-[#FFD700]'
                            : 'text-gray-500'
                        }
                      >
                        {row.identifier}
                      </div>
                    ),
                  },
                  {
                    label: 'Description',
                    id: 'discoveredAssets',
                    cell: row => (
                      <div className={'flex gap-2 text-gray-500'}>
                        <Loader
                          isLoading={row.discoveredAssetsStatus === 'pending'}
                        >
                          {row.type === 'riskNotification' && (
                            <BellIcon className="size-4 text-default-light" />
                          )}
                          {row.type === 'riskNotification' ? (
                            'Risk Notification'
                          ) : (
                            <div
                              className={cn(
                                'flex items-center justify-between gap-4',
                                row.status === 'success' &&
                                  Number(row.discoveredAssets) > 0
                                  ? 'cursor-pointer text-white'
                                  : 'pointer-events-none'
                              )}
                              onClick={() => {
                                navigate(
                                  generatePathWithSearch({
                                    pathname: getRoute(['app', 'assets']),
                                    appendSearch: [
                                      [
                                        'assetFilters',
                                        JSON.stringify({
                                          search: '',
                                          attributes: [
                                            `source##asset#${row.id}#${row.identifier}`,
                                          ],
                                          priorities: [],
                                          sources: [],
                                        }),
                                      ],
                                    ],
                                  })
                                );
                              }}
                            >
                              <span>{`${row.discoveredAssets.toLocaleString()} Assets`}</span>
                            </div>
                          )}
                        </Loader>
                      </div>
                    ),
                  },
                  {
                    label: 'Actions',
                    id: 'actions',
                    align: 'center',
                    cell: row => (
                      <div className="flex flex-row items-center justify-center">
                        {row.actions === 'AddAsset' && (
                          <Tooltip title="Add Asset" placement="right">
                            <Button
                              styleType="none"
                              className="mx-auto"
                              onClick={() => {
                                onAddAssetOpenChange(true);
                              }}
                              startIcon={
                                <PlusCircleIcon className="size-6 text-white" />
                              }
                            />
                          </Tooltip>
                        )}
                        {row.actions === 'Setup' && (
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => setSetupIntegration(row.account)}
                              className="w-[100px] rounded-sm bg-[#FFD700] px-3 py-1 text-sm font-medium text-black"
                            >
                              Setup
                            </button>
                            <Tooltip title="Disconnect" placement="right">
                              <Button
                                className="p-0"
                                onClick={() => {
                                  setDisconnectIntegrationKey(row.key);
                                }}
                                startIcon={
                                  <XMarkIcon className="size-4 text-layer0" />
                                }
                                styleType="textPrimary"
                              />
                            </Tooltip>
                          </div>
                        )}
                        {row.actions === 'Waitlist' && (
                          <p className="min-w-24 font-medium italic text-gray-500">
                            Waitlist
                          </p>
                        )}
                        {row.actions === 'Disconnect' && (
                          <Tooltip title="Disconnect" placement="right">
                            <Button
                              styleType="none"
                              className="mx-auto"
                              onClick={() => {
                                setDisconnectIntegrationKey(row.key);
                              }}
                            >
                              <Unplug className="mr-2 size-6 text-white" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    ),
                  },
                ]}
                data={data}
              />
            </div>
          </div>
        </main>
        {isUpgradePlanOpen && (
          <UpgradeMenu
            open={isUpgradePlanOpen}
            onClose={() => setIsUpgradePlanOpen(false)}
            currentPlan={currentPlan}
            used={usedAssets}
            total={FREEMIUM_ASSETS_LIMIT}
          />
        )}
        <Modal
          icon={
            <ExclamationTriangleIconOutline className="size-7 text-yellow-600" />
          }
          title={'Disconnect Integration'}
          onClose={() => {
            setDisconnectIntegrationKey('');
          }}
          className="px-8"
          open={Boolean(disconnectIntegrationKey)}
          footer={{
            text: 'Disconnect',
            onClick: async () => {
              if (disconnectIntegration) {
                await unlink({
                  username: disconnectIntegration.member,
                  member: disconnectIntegration.member,
                  config: disconnectIntegration.config,
                  value: disconnectIntegration.value,
                  key: disconnectIntegration.key,
                });
                setDisconnectIntegrationKey('');
              }
            },
          }}
        >
          Are you sure you want to disconnect{' '}
          <b>{disconnectIntegration?.member}</b> ?
        </Modal>
        <SetupModal
          isOpen={Boolean(setupIntegration)}
          onClose={() => setSetupIntegration(undefined)}
          onComplete={async () => {
            setSetupIntegration(undefined);
          }}
          selectedIntegration={setupIntegration}
        />
        <Drawer
          open={isAttackSurfaceDrawerOpen}
          onClose={closeAttackSurfaceDrawer}
          onBack={closeAttackSurfaceDrawer}
          className={cn('w-full rounded-t-sm shadow-lg p-0 bg-zinc-100')}
          header={''}
          skipBack={true}
          footer={
            selectedAttackSurfaceIntegrations.length > 0 && (
              <Button
                styleType="primary"
                className="mx-20 mb-10 h-20 w-full text-xl font-bold"
                isLoading={linkStatus === 'pending'}
                onClick={async () => {
                  // add integration   accounts
                  const promises = selectedAttackSurfaceIntegrations
                    .map((integration: string) => {
                      const isWaitlisted =
                        comingSoonAttackSurfaceIntegrations.find(
                          i => i.id === integration
                        );

                      return link({
                        username: integration,
                        value: isWaitlisted ? 'waitlisted' : 'setup',
                        config: {},
                      });
                    })
                    .map(promise => promise.catch(error => error));

                  const response = await Promise.all(promises);

                  const validResults = response.filter(
                    result => !(result instanceof Error)
                  );

                  if (validResults.length > 0) {
                    invalidateAccounts();
                  }

                  closeAttackSurfaceDrawer();
                }}
              >
                Build Attack Surface ({selectedAttackSurfaceIntegrations.length}{' '}
                selected)
              </Button>
            )
          }
        >
          <div className="mx-12 pb-10">
            <div className="mb-12 flex flex-col items-center justify-between md:flex-row">
              <h1 className=" text-4xl font-extrabold">
                Which surfaces are you in?
              </h1>
              <Input
                name="search"
                startIcon={<MagnifyingGlassIcon className="size-6" />}
                placeholder="Search integrations..."
                className="w-[400px] rounded-sm  bg-gray-200 p-4 text-lg"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              }}
            >
              {filteredAttackSurfaceIntegrations.map((integration, index) => {
                return (
                  <AttackSurfaceCard
                    key={index}
                    integration={integration}
                    selectedIntegrations={selectedAttackSurfaceIntegrations}
                    setSelectedIntegrations={
                      setSelectedAttackSurfaceIntegrations
                    }
                  />
                );
              })}
            </div>
            <p className="mt-4 text-sm italic">
              {`Contact us for more integrations support: `}
              <a className="text-brand" href="mailto:support@praetorian.com">
                support@praetorian.com
              </a>
            </p>
          </div>
        </Drawer>
        <Drawer
          open={isRiskNotificationsDrawerOpen}
          onClose={closeRiskNotificationDrawer}
          onBack={closeRiskNotificationDrawer}
          className={cn('w-full rounded-t-sm shadow-lg pb-0 bg-zinc-100')}
          header={''}
          footerClassname=""
          skipBack={true}
          footer={
            selectedRiskNotificationIntegrations.length > 0 && (
              <Button
                styleType="primary"
                className="mx-20 mb-10 h-20 w-full text-xl font-bold"
                onClick={async () => {
                  // add integration   accounts
                  const promises = selectedRiskNotificationIntegrations
                    .map((integration: string) => {
                      return link({
                        username: integration,
                        value: 'setup',
                        config: {},
                      });
                    })
                    .map(promise => promise.catch(error => error));

                  const response = await Promise.all(promises);

                  const validResults = response.filter(
                    result => !(result instanceof Error)
                  );

                  if (validResults.length > 0) {
                    invalidateAccounts();
                  }

                  closeRiskNotificationDrawer();
                }}
              >
                Set Notification Channels (
                {selectedRiskNotificationIntegrations.length} selected)
              </Button>
            )
          }
        >
          <div className="mx-12">
            <h1 className="mb-4 text-4xl font-extrabold">
              Where do you want to be notified?
            </h1>
            <p className="mb-8 text-lg text-gray-700">
              Select where you would like to be notified when new risks are
              identified in your attack surface.
            </p>
            <div className="mb-8 flex flex-row flex-wrap gap-4">
              {filteredRiskNotificationIntegrations.map(
                (integration, index) => {
                  return (
                    <RiskNotificationCard
                      key={index}
                      integration={integration}
                      selectedIntegrations={
                        selectedRiskNotificationIntegrations
                      }
                      setSelectedIntegrations={
                        setSelectedRiskNotificationIntegrations
                      }
                    />
                  );
                }
              )}
            </div>
            <p className="mb-8 text-sm italic">
              {`Contact us for more integrations support: `}
              <a className="text-brand" href="mailto:support@praetorian.com">
                support@praetorian.com
              </a>
            </p>
          </div>
        </Drawer>
        <Drawer
          open={isDomainDrawerOpen}
          onClose={() => setIsDomainDrawerOpen(false)}
          onBack={() => setIsDomainDrawerOpen(false)}
          className={cn('w-full rounded-t-sm shadow-lg pb-0 bg-zinc-100')}
          header={''}
          footerClassname=""
          skipBack={true}
          footer={
            <Button
              styleType="primary"
              className="mx-20 mb-10 h-20 w-full text-xl font-bold"
              onClick={handleUpdateRootDomain}
            >
              Update Root Domain
            </Button>
          }
        >
          <DomainDrawerContent
            domain={rootDomain?.value}
            onChange={(domain, scanOption) => {
              setUpdatedRootDomain({ domain, scanOption });
            }}
          />
        </Drawer>
      </div>
    </div>
  );
};

export const getCurrentPlan = ({
  accounts,
  friend,
}: {
  accounts: Account[];
  friend: string;
}): Plan => {
  const isManaged =
    (friend.startsWith('chariot+') && friend.endsWith('@praetorian.com')) ||
    accounts.some(
      account =>
        (account.member.startsWith('research') &&
          account.member.endsWith('@praetorian.com')) ||
        (account.member.startsWith('managed_services') &&
          account.member.endsWith('@praetorian.com'))
    );
  const isUnmanaged = Boolean(
    accounts.find(account => account.member === 'license')
  );

  if (isManaged) {
    return 'managed';
  } else if (isUnmanaged) {
    return 'unmanaged';
  }
  return 'freemium';
};
