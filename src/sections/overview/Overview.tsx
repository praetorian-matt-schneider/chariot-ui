import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon as ExclamationTriangleIconOutline,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PlusIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/solid';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Hourglass, TriangleAlertIcon, Unplug } from 'lucide-react';

import { Button } from '@/components/Button';
import { DomainDrawerContent } from '@/components/DomainDrawerContent';
import { Drawer } from '@/components/Drawer';
import { Input } from '@/components/form/Input';
import { Values } from '@/components/form/Inputs';
import { GettingStarted } from '@/components/GettingStarted';
import { Loader } from '@/components/Loader';
import { Modal } from '@/components/Modal';
import PushNotificationDrawer from '@/components/PushNotificationDrawer';
import { Table } from '@/components/table/Table';
import { Tooltip } from '@/components/Tooltip';
import UpgradeMenu from '@/components/UpgradeMenu';
import { useMy } from '@/hooks';
import { useModifyAccount } from '@/hooks/useAccounts';
import { useCreateAsset } from '@/hooks/useAssets';
import {
  useBulkDeleteAttributes,
  useCreateAttribute,
  useGetRootDomain,
} from '@/hooks/useAttribute';
import { useCounts } from '@/hooks/useCounts';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useIntegration } from '@/hooks/useIntegration';
import useIntegrationCounts from '@/hooks/useIntegrationCounts';
import { JobWithFailedCount, useJobsStatus } from '@/hooks/useJobs';
import { RenderHeaderExtraContentSection } from '@/sections/AuthenticatedApp';
import { AttackSurfaceCard } from '@/sections/overview/IntegrationCards';
import {
  availableAttackSurfaceIntegrations,
  availableAttackSurfaceIntegrationsKeys,
  availableRiskIntegrations,
  comingSoonAttackSurfaceIntegrations,
  comingSoonRiskIntegrations,
  streamingRiskIntegrations,
  ticketingRiskIntegrations,
} from '@/sections/overview/Integrations';
import SetupModal from '@/sections/SetupModal';
import { useAuth } from '@/state/auth';
import { useGlobalState } from '@/state/global.state';
import {
  Account,
  AssetStatus,
  FREEMIUM_ASSETS_LIMIT,
  Job,
  LinkAccount,
  Plan,
} from '@/types';
import { JobStatus, JobStatusLabel } from '@/types';
import { partition } from '@/utils/array.util';
import { cn } from '@/utils/classname';
import { getJobStatus } from '@/utils/job';
import { getRoute } from '@/utils/route.util';
import { useStorage } from '@/utils/storage/useStorage.util';
import { generatePathWithSearch, useSearchParams } from '@/utils/url.util';

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

export const getJobStatusIcon = (status: JobStatus, className?: string) => {
  switch (status) {
    case JobStatus.Fail:
      return <XCircleIcon className={cn('size-7 text-[#F87171]', className)} />;
    case JobStatus.Running:
      return <ArrowPathIcon className={cn('size-7 animate-spin', className)} />;
    case JobStatus.Queued:
      return (
        <div
          className={cn(
            'flex size-7 items-center justify-center rounded-full bg-gray-300',
            className
          )}
        >
          <Hourglass className="size-4 text-[#2D3748]" />
        </div>
      );
    default:
      return (
        <CheckCircleIcon
          className={cn('size-8 text-center text-[#10B981]', className)}
        />
      );
  }
};

const getJobsStatus = (job?: JobWithFailedCount) => {
  const status = getJobStatus(job as Job);
  const isFailed = (job?.failedJobsCount ?? 0) > 0;

  return (
    <Tooltip
      placement="left"
      title={
        status ? (
          <div className="space-y-4">
            <div>
              {isFailed
                ? `${job?.failedJobsCount} Failed Jobs`
                : `Job ${JobStatusLabel[status]}`}
            </div>
            {isFailed && <p>Click to view details</p>}
          </div>
        ) : (
          ''
        )
      }
    >
      {getJobStatusIcon(
        job?.failedJobsCount ? JobStatus.Fail : getJobStatus(job as Job)
      )}
    </Tooltip>
  );
};

export const Overview: React.FC = () => {
  const { friend } = useAuth();
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

  // Open the drawer based on the search params
  const { searchParams, removeSearchParams } = useSearchParams();
  useEffect(() => {
    if (searchParams) {
      const params = new URLSearchParams(searchParams);
      const action = params.get('action');
      if (action) {
        if (action === 'set-root-domain') {
          setIsDomainDrawerOpen(true);
        } else if (action === 'build-attack-surface') {
          setIsAttackSurfaceDrawerOpen(true);
        } else if (action === 'set-risk-notifications') {
          setIsRiskNotificationsDrawerOpen(true);
        }
      }
      // clear the search params
      removeSearchParams('action');
    }
  }, [searchParams]);

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
  const { data: jobs } = useJobsStatus(jobKeys);
  const { data: rootDomain, refetch } = useGetRootDomain();
  const { data: assetCount, status: assetCountStatus } = useCounts({
    resource: 'asset',
  });
  const {
    data: providedAssets,
    status: providedAssetsStatus,
    hasNextPage: hasNextPageProvidedAssets,
  } = useGenericSearch({ query: `source:provided` });

  const {
    data: accounts,

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
  const currentPlan = getCurrentPlan({ accounts, friend });

  const disconnectIntegration = useMemo(() => {
    return [...connectedIntegrations, ...requiresSetupIntegrations].find(
      integration => integration.key === disconnectIntegrationKey
    );
  }, [stringifiedConnectedIntegrations, disconnectIntegrationKey]);

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
  const { filteredAttackSurfaceIntegrations } = useMemo(() => {
    const filteredAttackSurfaceIntegrations = [
      ...availableAttackSurfaceIntegrations,
      ...comingSoonAttackSurfaceIntegrations,
    ].filter(integration =>
      integration.name.toLowerCase().includes(search?.toLowerCase())
    );

    filteredAttackSurfaceIntegrations.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const filteredRiskNotificationIntegrations = [
      ...availableRiskIntegrations,
      ...comingSoonRiskIntegrations,
    ].filter(integration =>
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

    // Trigger the confetti effect
    confetti({
      particleCount: 150,
      spread: 60,
    });
  }

  const data = useMemo(() => {
    const tableData = [
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
      {
        status: 'success',
        surface: 'Manually Added',
        identifier: 'Provided',
        discoveredAssets: providedAssets?.assets?.length,
        discoveredAssetsStatus: providedAssetsStatus,
        actions: 'AddAsset',
        connected: false,
        id: 'chariot',
        key: 'chariot',
        account: undefined,
        type: 'chariot',
      },
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
    providedAssetsStatus,
  ]);

  const showMore = (identifier: string) => {
    if (identifier.trim().toLowerCase() === 'provided') {
      return hasNextPageProvidedAssets ? '+' : '';
    }
    return '';
  };

  const connectedNotifications = useMemo(() => {
    return connectedIntegrations.filter(
      integration => integration.type === 'riskNotification'
    );
  }, [stringifiedConnectedIntegrations]);

  const isFreemiumMaxed =
    currentPlan === 'freemium' && usedAssets >= FREEMIUM_ASSETS_LIMIT;
  return (
    <div>
      <RenderHeaderExtraContentSection>
        <div>{/* Retained for consitent spacing */}</div>
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
          isFreemiumMaxed={isFreemiumMaxed}
          domain={rootDomain?.value}
          surfaces={
            connectedIntegrations?.filter(integration =>
              availableAttackSurfaceIntegrationsKeys.includes(
                integration.member
              )
            )?.length
          }
          notifications={connectedNotifications.length}
        />
        <main className="mt-6 w-full">
          <div className="overflow-hidden rounded-lg border-2 border-header-dark bg-header shadow-md">
            <div className="flex w-full p-8">
              <div className="flex flex-1 flex-col">
                <p className="text-xl font-bold text-white">Attack Surface</p>
                <p className="flex items-center space-x-2 text-sm font-normal text-gray-500">
                  {isFreemiumMaxed && (
                    <TriangleAlertIcon className="mr-1 block size-4 text-yellow-500" />
                  )}
                  <Loader
                    isLoading={assetCountStatus === 'pending'}
                    className="inline-block w-5"
                  >
                    <Counter from={0} to={usedAssets} />
                  </Loader>
                </p>
              </div>
              <Button
                styleType="primary"
                startIcon={<PlusIcon className="size-4" />}
                onClick={() => setIsAttackSurfaceDrawerOpen(true)}
                className="mt-6 h-10 rounded-md py-0"
              >
                New Attack Surface
              </Button>
            </div>

            <div>
              <Table
                tableClassName="bg-header border-0 [&_thead_tr]:bg-header [&_tr_td]:text-layer0 [&__tr_td_div:first]:border-t-4 [&_td_div]:border-header-dark [&_th_div]:border-0"
                name="attack-surface"
                status="success"
                error={null}
                rowClassName={row => {
                  return row.identifier === 'Provided' ? 'bg-header-dark' : '';
                }}
                columns={[
                  {
                    label: 'Status',
                    id: 'status',
                    fixedWidth: 100,
                    align: 'center',
                    cell: row => {
                      const job = jobs[row.id];
                      return row.connected ? (
                        <Button
                          styleType="text"
                          className="hover:bg-transparent"
                          onClick={() =>
                            navigate(
                              generatePathWithSearch({
                                pathname: getRoute(['app', 'jobs']),
                                appendSearch: [
                                  [
                                    'jobsFilters',
                                    JSON.stringify({
                                      search: row.id,
                                      status: job.failedJobsCount
                                        ? JobStatus.Fail
                                        : getJobStatus(job),
                                      sources: [],
                                    }),
                                  ],
                                ],
                              })
                            )
                          }
                        >
                          {getJobsStatus(job)}
                        </Button>
                      ) : (
                        getStatusIcon(row.status)
                      );
                    },
                  },
                  {
                    label: 'Surface',
                    id: 'surface',
                    className: 'font-bold',
                    fixedWidth: 250,
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
                    fixedWidth: 150,
                    cell: row => (
                      <div className={'flex gap-2 text-gray-500'}>
                        <Loader
                          isLoading={row.discoveredAssetsStatus === 'pending'}
                        >
                          {row.type === 'riskNotification' ? (
                            'Notification'
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
                                          attributes:
                                            row.identifier === 'Provided'
                                              ? ['source:provided']
                                              : [
                                                  `#attribute#source##asset#${row.id}`,
                                                ],
                                        }),
                                      ],
                                    ],
                                  })
                                );
                              }}
                            >
                              <span>{`${Number(row.discoveredAssets)?.toLocaleString()}${showMore(row.identifier)} Assets`}</span>
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
                    fixedWidth: 200,
                    cell: row => (
                      <div className="flex flex-row items-center justify-center">
                        {row.actions === 'AddAsset' && (
                          <Tooltip title="Add Asset" placement="top">
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
                            <Tooltip title="Disconnect" placement="top">
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
                          <Tooltip title="Disconnect" placement="top">
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
          <div className="mx-12 mt-6 pb-10">
            <div className=" flex flex-col items-start justify-between md:flex-row">
              <div className="flex flex-col space-y-1">
                <h1 className=" text-4xl font-extrabold">
                  Which surfaces are you in?
                </h1>
              </div>
              <Input
                name="search"
                startIcon={<MagnifyingGlassIcon className="size-6" />}
                placeholder="Search integrations..."
                className="w-[400px] rounded-sm  bg-gray-200 text-lg"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <p className="mb-4 mt-2 text-lg text-gray-700">
              Once added, they’ll appear in your attack surface, ready for setup
              later.
            </p>
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
        <PushNotificationDrawer
          isOpen={isRiskNotificationsDrawerOpen}
          onClose={closeRiskNotificationDrawer}
          onDisconnect={(account: Account) => {
            setDisconnectIntegrationKey(account.key);
          }}
          onConnect={async (formData: Values) => {
            await link(formData as unknown as LinkAccount);
          }}
          streamingIntegrations={streamingRiskIntegrations}
          ticketingIntegrations={ticketingRiskIntegrations}
          connectedIntegrations={connectedNotifications}
        />

        <Drawer
          open={isDomainDrawerOpen}
          onClose={() => setIsDomainDrawerOpen(false)}
          onBack={() => setIsDomainDrawerOpen(false)}
          className={cn('w-full rounded-t-sm shadow-lg pb-0 bg-zinc-100')}
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

const Counter = ({ from, to }: { from: number; to: number }) => {
  const [currentValue, setCurrentValue] = useState(from);

  useEffect(() => {
    let frameId: number;
    let start: number;

    const updateCounter = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const duration = 500; // 0.5 seconds

      const currentNumber =
        from + (to - from) * Math.min(progress / duration, 1);
      setCurrentValue(Math.floor(currentNumber));

      if (progress < duration) {
        frameId = requestAnimationFrame(updateCounter);
      }
    };

    frameId = requestAnimationFrame(updateCounter);

    return () => cancelAnimationFrame(frameId);
  }, [from, to]);

  const numberArray = currentValue.toLocaleString().split(''); // Convert number to string array

  return (
    <div className="flex items-baseline ">
      {numberArray.map((digit, index) => (
        <motion.div
          key={index}
          className="text-3xl font-extrabold text-brand"
          initial={{ rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: -90, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{
            textShadow:
              '1px 1px 2px rgba(255, 255, 255, 0.1), -1px -1px 3px rgba(0, 0, 0, 0.4)',
          }}
        >
          {digit}
        </motion.div>
      ))}
      <span
        className="text-md ml-2 font-medium text-gray-600"
        style={{
          textShadow:
            '1px 1px 2px rgba(255, 255, 255, 0.1), -1px -1px 3px rgba(0, 0, 0, 0.4)',
        }}
      >
        Assets Monitored
      </span>
    </div>
  );
};
