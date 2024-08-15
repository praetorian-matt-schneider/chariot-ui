import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BellAlertIcon,
  ExclamationTriangleIcon as ExclamationTriangleIconOutline,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/solid';
import { Hourglass, Inbox, PlusIcon, Unplug } from 'lucide-react';

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
import { Body } from '@/components/ui/Body';
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
import { Integrations } from '@/sections/overview/Module';
import SetupModal from '@/sections/SetupModal';
import { useAuth } from '@/state/auth';
import { Account, AssetStatus, Plan } from '@/types';
import { Job, JobStatus, JobStatusLabel } from '@/types';
import { cn } from '@/utils/classname';

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

interface RootDomain {
  domain: string;
  scanOption: AssetStatus;
}

const availableIntegrations = [
  Integrations.amazon,
  Integrations.azure,
  Integrations.gcp,
  Integrations.ns1,
  Integrations.github,
  Integrations.gitlab,
  Integrations.crowdstrike,
  Integrations.nessus,
  Integrations.cloudflare,
];

// Begin "coming soon" integrations
const comingSoonIntegrations = [
  Integrations.godaddy,
  Integrations.gsuite,
  Integrations.shodan,
  Integrations.securitytrails,
  Integrations.greynoise,
  Integrations.sentinel,
  Integrations.sumologic,
  Integrations.palo,
  Integrations.splunk,
  Integrations.graylog,
  Integrations.tanium,
  Integrations.orca,
  Integrations.snyk,
  Integrations.ibmcloud,
  Integrations.qualys,
  Integrations.mandiant,
  Integrations.r7,
  Integrations.securityopscenter,
  Integrations.jupiterone,
  Integrations.runzero,
  Integrations.traceable,
  Integrations.trellix,
  Integrations.elasticsearch,
  Integrations.defender,
  Integrations.sentinelone,
  Integrations.vulndb,
  Integrations.imperva,
  Integrations.f5,
  Integrations.carbonblack,
  Integrations.devo,
  Integrations.exabeam,
  Integrations.newrelic,
  Integrations.dnsdb,
  Integrations.akamai,
  Integrations.datadog,
  Integrations.wiz,
];

const riskIntegrations = [
  Integrations.slack,
  Integrations.jira,
  Integrations.webhook,
  Integrations.zulip,
  Integrations.teams,
];

const Chariot: React.FC = () => {
  const { me, friend } = useAuth();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDomainDrawerOpen, setIsDomainDrawerOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] =
    useState(false);
  const [disconnectIntegrationKey, setDisconnectIntegrationKey] =
    useState<string>('');
  const [search, setSearch] = useState('');
  const [setupIntegration, setSetupIntegration] = useState<Account>();
  const [updatedRootDomain, setUpdatedRootDomain] =
    useState<RootDomain | null>();
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(
    []
  );
  const [
    selectedNotificationIntegrations,
    setSelectedNotificationIntegrations,
  ] = useState<string[]>([]);

  const { integrations: integrationWithHook } = useIntegration();

  const {
    currentIntegrations,
    jobKeys,
    requiresSetupIntegrations,
    waitlistedIntegrations,
    connectedIntegrations,
    riskNotificationStatus,
    attackSurfaceStatus,
  } = useMemo(() => {
    const integrationWithoutHook = integrationWithHook.filter(
      account => account.member !== 'hook'
    );

    const updatedJobKeys = integrationWithoutHook
      .map(integration => integration.member)
      .reduce(
        (acc, member) => {
          acc[member] = member;
          return acc;
        },
        {} as Record<string, string>
      );

    const {
      waitlistedIntegrations,
      requiresSetupIntegrations,
      connectedIntegrations,
      riskNotificationStatus,
      attackSurfaceStatus,
    } = integrationWithoutHook.reduce(
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
          const isNowAvailableToSetup = availableIntegrations.find(
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

    return {
      currentIntegrations: integrationWithoutHook,
      connectedIntegrations,
      jobKeys: updatedJobKeys,
      requiresSetupIntegrations,
      waitlistedIntegrations,
      attackSurfaceStatus,
      riskNotificationStatus,
    };
  }, [JSON.stringify(integrationWithHook)]);

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

  const disconnectIntegration = currentIntegrations.find(
    integration => integration.key === disconnectIntegrationKey
  );

  const domainToDiplay = rootDomain?.value ?? (friend || me).split('@')[1];

  const jobs: JobI[] = currentIntegrations.map((integration, index) => {
    const job = jobsData[index];
    const lastRunJob = jobsData[index];
    return {
      member: integration.member,
      status: job?.status,
      comment: job?.comment,
      lastStatus: lastRunJob?.status,
    };
  });

  // Map the counts to each integration
  const counts = integrationCounts.map((result, index) => ({
    member: connectedIntegrations[index].member,
    count: result.data,
  }));

  const totalAssets = assetCount
    ? Object.values(assetCount?.status || {}).reduce((acc, val) => acc + val, 0)
    : 0;

  const currentPlan = getCurrentPlan({ accounts, friend });

  const handleUpdateRootDomain = async () => {
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
  };

  const displayName = useGetAccountDetails(accounts).name || friend || me;

  const allIntegrations = [
    ...availableIntegrations,
    ...comingSoonIntegrations,
  ].filter(integration =>
    integration.name.toLowerCase().includes(search?.toLowerCase())
  );

  allIntegrations.sort((a, b) => a.name.localeCompare(b.name));

  const notificationsIntegrations = riskIntegrations.filter(integration =>
    integration.name.toLowerCase().includes(search?.toLowerCase())
  );

  const attackSurfaceIntegrations = allIntegrations.map(integration => (
    <div
      key={integration.id}
      className={cn(
        ' w-[150px] resize-none rounded-sm bg-white p-6 text-center',
        selectedIntegrations.includes(integration.id) && 'border-2 border-brand'
      )}
      role="button"
      onClick={() => {
        if (selectedIntegrations.includes(integration.id)) {
          setSelectedIntegrations(
            selectedIntegrations.filter(id => id !== integration.id)
          );
        } else {
          setSelectedIntegrations([...selectedIntegrations, integration.id]);
        }
      }}
    >
      <div className="justify-items flex h-12 items-center">
        <img className="mx-auto my-3 w-12" src={integration.logo} />
      </div>
      <p className="text-lg font-bold">{integration.name?.split(' ')[0]}</p>
    </div>
  ));

  const notificationIntegrations = notificationsIntegrations.map(
    integration => (
      <div
        key={integration.id}
        className={cn(
          ' w-[150px] resize-none rounded-sm bg-white p-6 text-center',
          selectedNotificationIntegrations.includes(integration.id) &&
            'border-2 border-brand'
        )}
        role="button"
        onClick={() => {
          if (selectedNotificationIntegrations.includes(integration.id)) {
            setSelectedNotificationIntegrations(
              selectedNotificationIntegrations.filter(
                id => id !== integration.id
              )
            );
          } else {
            setSelectedNotificationIntegrations([
              ...selectedNotificationIntegrations,
              integration.id,
            ]);
          }
        }}
      >
        <img className="mx-auto my-3 size-12" src={integration.logo} />
        <p className="text-lg font-bold">{integration.name?.split(' ')[0]}</p>
      </div>
    )
  );

  useEffect(() => {
    if (!isDrawerOpen && !isNotificationsDrawerOpen) {
      setSearch('');
    }
  }, [isDrawerOpen, isNotificationsDrawerOpen]);

  function closeIntegrationDrawer() {
    setSelectedIntegrations([]);

    setIsDrawerOpen(false);
  }

  function closeNotificationDrawer() {
    setSelectedNotificationIntegrations([]);

    setIsNotificationsDrawerOpen(false);
  }

  return (
    <Body
      style={{
        background:
          'radial-gradient(circle at center, rgb(41, 34, 90) 0%, rgb(24, 22, 60) 70%, rgb(13, 13, 40) 100%)',
      }}
      header={true}
      footer={true}
    >
      <RenderHeaderExtraContentSection>
        <div>
          <div className="flex flex-row items-center justify-center space-x-6">
            <div className="flex w-full flex-row justify-between">
              <div>
                <p className="text-2xl font-bold text-white">My Chariot</p>
                <Loader
                  styleType="header"
                  isLoading={accountsStatus === 'pending'}
                >
                  <p className="text-sm font-normal text-gray-400">
                    {displayName}&apos;s Organization
                  </p>
                </Loader>
              </div>
              <AssetUsage
                currentPlan={currentPlan}
                used={totalAssets}
                assetCountStatus={assetCountStatus}
                total={999}
              />
            </div>
          </div>
        </div>
      </RenderHeaderExtraContentSection>
      <div className="flex flex-col space-y-4">
        <div className="flex w-full flex-row text-sm font-semibold text-layer0 underline">
          <div className="flex-1 rounded-l-sm border border-gray-600 bg-header p-2 text-center">
            <button
              onClick={() => setIsDomainDrawerOpen(true)}
              className="mx-auto flex flex-row items-center justify-center space-x-1 text-center underline"
            >
              <PencilSquareIcon className="mr-1 inline size-5 text-layer0" />{' '}
              <Loader isLoading={rootDomainStatus === 'pending'}>
                {domainToDiplay}
              </Loader>
            </button>
          </div>
          <div className="flex-1 rounded-r-sm border border-gray-600 bg-header p-2 text-center">
            <button
              onClick={() => setIsNotificationsDrawerOpen(true)}
              className="underline"
            >
              <BellAlertIcon className="mr-1 inline size-5 text-layer0" />
              Manage Risk Notifications
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col text-gray-200">
        <GettingStarted
          completedSteps={{
            rootDomain: rootDomain?.value !== undefined,
            attackSurface: attackSurfaceStatus === 'connected',
            riskNotifications: riskNotificationStatus === 'connected',
          }}
          onRootDomainClick={() => setIsDomainDrawerOpen(true)}
          onAttackSurfaceClick={() => setIsDrawerOpen(true)}
          onRiskNotificationsClick={() => setIsNotificationsDrawerOpen(true)}
        />
        <main className="mt-6 w-full">
          <div className="rounded-sm border border-gray-600 bg-header shadow-md">
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
              <Button
                styleType="primary"
                startIcon={<PlusIcon />}
                onClick={() => setIsDrawerOpen(true)}
                className="rounded-sm py-1"
                style={{
                  padding: '0rem 1.5rem',
                }}
              >
                Add Attack Surface
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table
                tableClassName="bg-header border-0 [&_thead_tr]:bg-header [&_tr_td]:text-layer0 [&_td_div]:border-1 [&_td_div]:border-gray-600 [&_th_div]:border-0"
                name="attack-surface"
                status="success"
                isTableView={false}
                error={null}
                skipNoData={true}
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
                  { label: 'Surface', id: 'surface', className: 'font-bold' },
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
                      <div className={'text-gray-500'}>
                        {riskIntegrations.find(
                          integration => row.surface === integration.id
                        )
                          ? 'Risk Notification'
                          : `${row.discoveredAssets.toLocaleString()} Assets`}
                      </div>
                    ),
                  },
                  {
                    label: 'Actions',
                    id: 'actions',
                    align: 'center',
                    cell: row => (
                      <div className="flex flex-row items-center justify-center">
                        {row.actions === 'Setup' && (
                          <button
                            onClick={() => setSetupIntegration(row.account)}
                            className="w-[100px] rounded-sm bg-[#FFD700] px-3 py-1 text-sm font-medium text-black"
                          >
                            Setup
                          </button>
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
                data={[
                  {
                    status: 'success',
                    surface: 'chariot',
                    identifier: 'Provided',
                    discoveredAssets: assetCount?.source?.provided || 0,
                    actions: '',
                    connected: false,
                    id: 'providedAssets',
                    key: 'providedAssets',
                    account: undefined,
                  },
                  ...requiresSetupIntegrations.map(integration => {
                    return {
                      status: 'warning',
                      surface: integration.member,
                      identifier: 'Requires Setup',
                      discoveredAssets: '-',
                      actions: 'Setup',
                      connected: false,
                      id: integration.member,
                      key: integration.key,
                      account: integration,
                    };
                  }),
                  ...connectedIntegrations.map(integration => ({
                    status: 'success',
                    surface: integration.member,
                    identifier: integration.value ?? '[Redacted]',
                    discoveredAssets:
                      counts.find(count => count.member === integration.member)
                        ?.count || 0,
                    actions: 'Disconnect',
                    connected: true,
                    id: integration.member,
                    key: integration.key,
                    account: integration,
                  })),
                  ...waitlistedIntegrations.map(integration => {
                    return {
                      status: 'waitlist',
                      surface: integration.member,
                      identifier: 'Coming Soon',
                      discoveredAssets: '-',
                      actions: 'Waitlist',
                      connected: false,
                      id: integration.member,
                      key: integration.key,
                      account: integration,
                    };
                  }),
                ]}
              />
            </div>
          </div>
        </main>
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
          open={isDrawerOpen}
          onClose={closeIntegrationDrawer}
          onBack={closeIntegrationDrawer}
          className={cn('w-full rounded-t-sm shadow-lg p-0 bg-zinc-100')}
          header={''}
          skipBack={true}
          footer={
            selectedIntegrations.length > 0 && (
              <Button
                styleType="primary"
                className="mx-20 mb-10 h-20 w-full text-xl font-bold"
                isLoading={linkStatus === 'pending'}
                onClick={async () => {
                  // add integration   accounts
                  const promises = selectedIntegrations
                    .map((integration: string) => {
                      const isWaitlisted = comingSoonIntegrations.find(
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

                  closeIntegrationDrawer();
                }}
              >
                Build Attack Surface ({selectedIntegrations.length} selected)
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
              {attackSurfaceIntegrations}
            </div>
          </div>
        </Drawer>
        <Drawer
          open={isNotificationsDrawerOpen}
          onClose={closeNotificationDrawer}
          onBack={closeNotificationDrawer}
          className={cn('w-full rounded-t-sm shadow-lg pb-0 bg-zinc-100')}
          header={''}
          footerClassname=""
          skipBack={true}
          footer={
            selectedNotificationIntegrations.length > 0 && (
              <Button
                styleType="primary"
                className="mx-20 mb-10 h-20 w-full text-xl font-bold"
                onClick={async () => {
                  // add integration   accounts
                  const promises = selectedNotificationIntegrations
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

                  closeNotificationDrawer();
                }}
              >
                Set Notification Channels (
                {selectedNotificationIntegrations.length} selected)
              </Button>
            )
          }
        >
          <div className="mx-12">
            <h1 className="mb-4 text-4xl font-extrabold">
              Where do you want to be notified?
            </h1>
            <p className="mb-8 text-lg text-gray-700">
              Select your notification channels for alerts. View your current
              alerts to stay updated.
            </p>
            <Button
              styleType="none"
              className="mb mx-auto mb-3 h-14 w-full rounded-sm bg-white text-lg font-semibold"
              onClick={() => (window.location.href = '/app/alerts')}
            >
              <Inbox className="mr-2 size-6 text-gray-700" /> View My Current
              Alerts
            </Button>
            <div className="mb-8 flex flex-row flex-wrap gap-4">
              {notificationIntegrations}
            </div>
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
    </Body>
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
        account.member.startsWith('chariot+') &&
        account.member.endsWith('@praetorian.com')
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

export default Chariot;
