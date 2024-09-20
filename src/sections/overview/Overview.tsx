import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon as ExclamationTriangleIconOutline,
  PlusCircleIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { HourglassIcon, TriangleAlertIcon, Unplug } from 'lucide-react';

import { Button } from '@/components/Button';
import { Dropzone, Files } from '@/components/Dropzone';
import { Loader } from '@/components/Loader';
import { Modal } from '@/components/Modal';
import { Table } from '@/components/table/Table';
import { Tooltip } from '@/components/Tooltip';
import { useMy, useUploadFile } from '@/hooks';
import { useModifyAccount } from '@/hooks/useAccounts';
import { useCounts } from '@/hooks/useCounts';
import { useIntegration } from '@/hooks/useIntegration';
import useIntegrationCounts from '@/hooks/useIntegrationCounts';
import { JobWithFailedCount, useJobsStatus } from '@/hooks/useJobs';
import { RenderHeaderExtraContentSection } from '@/sections/AuthenticatedApp';
import { IntegrationBuckets } from '@/sections/overview/Integrations';
import SetupModal from '@/sections/SetupModal';
import PushNotificationSetup from '@/sections/stepper/PushNotificationSetup';
import { RootDomainSetup } from '@/sections/stepper/RootDomainSetup';
import { SurfaceSetup } from '@/sections/stepper/SurfaceSetup';
import { useAuth } from '@/state/auth';
import { useGlobalState } from '@/state/global.state';
import { Account, FREEMIUM_ASSETS_LIMIT, Job, Plan, RiskStatus } from '@/types';
import { JobStatus, JobStatusLabel } from '@/types';
import { partition } from '@/utils/array.util';
import { cn } from '@/utils/classname';
import { sToMs } from '@/utils/date.util';
import { getJobStatus } from '@/utils/job';
import { getRoute } from '@/utils/route.util';
import { generatePathWithSearch, useSearchParams } from '@/utils/url.util';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircleIcon className="size-8 text-[#10B981]" />;
    case 'warning':
      return (
        <div className="flex size-7 items-center justify-center rounded-full bg-yellow-300">
          <WrenchScrewdriverIcon className="size-4 text-[#2D3748]" />
        </div>
      );
    case 'error':
      return <ExclamationTriangleIcon className="size-7 text-[#F87171]" />;
    case 'waitlist':
      return (
        <div className="flex size-7 items-center justify-center rounded-full bg-gray-200 dark:bg-white">
          <HourglassIcon className="size-4 text-gray-600" />
        </div>
      );
    default:
      return <div className="size-4 bg-gray-600"></div>;
  }
};

export const getJobStatusIcon = (status: JobStatus, className?: string) => {
  switch (status) {
    case JobStatus.Fail:
      return (
        <XCircleIcon
          className={cn('size-7 text-[#F87171] shrink-0', className)}
        />
      );
    case JobStatus.Running:
      return (
        <ArrowPathIcon
          className={cn('size-7 animate-spin shrink-0', className)}
        />
      );
    case JobStatus.Queued:
      return (
        <div
          className={cn(
            'flex size-7 items-center justify-center rounded-full bg-gray-300 shrink-0',
            className
          )}
        >
          <HourglassIcon className="size-4 text-[#2D3748]" />
        </div>
      );
    default:
      return (
        <CheckCircleIcon
          className={cn(
            'size-8 text-center text-[#10B981] shrink-0',
            className
          )}
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

  const { modal } = useGlobalState();
  const { onOpenChange: onOpenChangePushNotification } = modal.pushNotification;
  const { onOpenChange: onOpenChangeSurfaceSetup } = modal.surfaceSetup;

  const [isDomainDrawerOpen, setIsDomainDrawerOpen] = useState(false);
  const [disconnectIntegrationKey, setDisconnectIntegrationKey] =
    useState<string>('');
  const [setupIntegration, setSetupIntegration] = useState<Account>();

  // Open the drawer based on the search params
  const { searchParams, removeSearchParams, getAllSearchParams } =
    useSearchParams();
  const allSearchParams = getAllSearchParams();
  const { id: integrationId, ...integrationFormData } = allSearchParams;

  useEffect(() => {
    if (searchParams) {
      const params = new URLSearchParams(searchParams);
      const action = params.get('action');
      if (action) {
        if (action === 'set-root-domain') {
          setIsDomainDrawerOpen(true);
        } else if (action === 'build-attack-surface') {
          onOpenChangeSurfaceSetup(true);
        } else if (action === 'set-risk-notifications') {
          onOpenChangePushNotification(true);
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
      accounts,
    },
  } = useIntegration();

  useEffect(() => {
    if (accounts.length > 0 && integrationId) {
      const integration = accounts.find(
        ({ member }) => member === integrationId
      );
      setSetupIntegration(integration);
    }
  }, [JSON.stringify(accounts), integrationId]);

  const integrationCounts = useIntegrationCounts(connectedIntegrations);
  const { data: jobs } = useJobsStatus(jobKeys);

  const { data: assetCount, status: assetCountStatus } = useCounts({
    resource: 'asset',
  });

  const {
    data: providedAssets,
    status: providedAssetsStatus,
    hasNextPage: hasNextPageProvidedAssets,
  } = useMy({
    resource: 'attribute',
    query: '#surface#provided',
  });

  // code, cloud, edr, waf, siem, scanner, cti
  const buckets = {
    code: connectedIntegrations.some(integration =>
      IntegrationBuckets.code.some(i => i === integration.member)
    ),
    cloud: connectedIntegrations.some(integration =>
      IntegrationBuckets.cloud.some(i => i === integration.member)
    ),
    edr: connectedIntegrations.some(integration =>
      IntegrationBuckets.edr.some(i => i === integration.member)
    ),
    waf: connectedIntegrations.some(integration =>
      IntegrationBuckets.waf.some(i => i === integration.member)
    ),
    siem: connectedIntegrations.some(integration =>
      IntegrationBuckets.siem.some(i => i === integration.member)
    ),
    scanner: connectedIntegrations.some(integration =>
      IntegrationBuckets.scanner.some(i => i === integration.member)
    ),
    cti: connectedIntegrations.some(integration =>
      IntegrationBuckets.cti.some(i => i === integration.member)
    ),
  };
  const bucketTooltips = {
    code: 'Code integrations allow you to connect to code repositories like GitHub and GitLab.',
    cloud:
      'Cloud integrations allow you to connect to cloud providers like AWS and Azure.',
    edr: 'EDR integrations allow you to connect to endpoint detection and response tools like Carbon Black and Crowdstrike.',
    waf: 'WAF integrations allow you to connect to web application firewalls like Cloudflare and Akamai.',
    siem: 'SIEM integrations allow you to connect to security information and event management tools like Splunk and Elastic.',
    scanner:
      'Scanner integrations allow you to connect to vulnerability scanners like Nessus and Qualys.',
    cti: 'CTI integrations allow you to connect to cyber threat intelligence tools like VulnDB and GreyNoise.',
  };
  const bucketLabels = {
    code: 'Code',
    cloud: 'Cloud',
    edr: 'EDR',
    waf: 'WAF',
    siem: 'SIEM',
    scanner: 'Scanner',
    cti: 'CTI',
  };

  const { mutate: unlink } = useModifyAccount('unlink');

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
        discoveredAssets: providedAssets.length,
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

  const handleCloseSetupModal = () => {
    setSetupIntegration(undefined);
    Object.keys(allSearchParams).forEach(key => removeSearchParams(key));
  };

  const isFreemiumMaxed =
    currentPlan === 'freemium' && usedAssets >= FREEMIUM_ASSETS_LIMIT;

  return (
    <>
      <RenderHeaderExtraContentSection>
        <div className="dark:hidden">
          <RiskStats />
        </div>
      </RenderHeaderExtraContentSection>
      <div className="z-10 flex w-full flex-col bg-layer1 dark:bg-transparent dark:text-gray-200">
        <div className="hidden dark:block">
          <RiskStats />
        </div>
        <main className="w-full">
          <div className="overflow-hidden rounded-lg border-2 border-default dark:border-header-dark dark:bg-header dark:shadow-md">
            <div className="my-4 ml-6 mr-10 flex flex-row items-center justify-between space-x-4 bg-layer1 dark:mb-0 dark:bg-header">
              {Object.entries(buckets).map(([key, hasCode]) => (
                <Tooltip
                  key={key}
                  title={bucketTooltips[key as keyof typeof bucketTooltips]}
                  placement="top"
                >
                  <div className="flex items-center gap-2 text-sm dark:text-gray-400">
                    <div
                      className={cn(
                        'size-3 rounded-full bg-gray-400',
                        hasCode && 'bg-green-500'
                      )}
                    />
                    {bucketLabels[key as keyof typeof bucketLabels]}
                  </div>
                </Tooltip>
              ))}
            </div>
            <div className="flex w-full bg-white p-8 dark:bg-header">
              <div className="flex flex-1 flex-col">
                <p className="text-xl font-bold dark:text-white">
                  Attack Surface
                </p>
                <p className="flex items-center space-x-2 text-sm font-normal dark:text-gray-500">
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
                onClick={() => onOpenChangeSurfaceSetup(true)}
                className="mt-6 h-10 rounded-md py-0"
              >
                New Attack Surface
              </Button>
            </div>

            <div>
              <Table
                tableClassName="bg-layer0 dark:bg-header dark:border-0 dark:[&_thead_tr]:bg-header dark:[&_tr_td]:text-layer0 dark:[&__tr_td_div:first]:border-t-4 dark:[&_td_div]:border-header-dark dark:[&_th_div]:border-0"
                name="attack-surface"
                status="success"
                error={null}
                rowClassName={row => {
                  return row.identifier === 'Provided'
                    ? 'dark:bg-header-dark'
                    : '';
                }}
                columns={[
                  {
                    label: 'Status',
                    id: 'status',
                    fixedWidth: 100,
                    align: 'center',
                    cell: row => {
                      const job = jobs[`${row.id}#${row.identifier}`];
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
                                      search:
                                        job?.failedJobSource?.[0] || row?.id,
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
                            ? 'text-yellow-600 dark:text-[#FFD700]'
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
                                  ? 'cursor-pointer dark:text-white'
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
                                              ? ['#attribute#surface#provided']
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
                                <PlusCircleIcon className="size-6 dark:text-white" />
                              }
                            />
                          </Tooltip>
                        )}
                        {row.actions === 'Setup' && (
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => {
                                setSetupIntegration(row.account);
                              }}
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
                                  <XMarkIcon className="size-4 dark:text-layer0" />
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
                              <Unplug className="mr-2 size-6 dark:text-white" />
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
          onClose={handleCloseSetupModal}
          onComplete={handleCloseSetupModal}
          selectedIntegration={setupIntegration}
          formData={integrationFormData}
        />
        <PushNotificationSetup />

        <RootDomainSetup
          open={isDomainDrawerOpen}
          setOpen={setIsDomainDrawerOpen}
        />
        <SurfaceSetup />
      </div>
    </>
  );
};

export const RiskStats = () => {
  const navigate = useNavigate();
  const { modal } = useGlobalState();
  const { onOpenChange: onOpenChangeSurfaceSetup } = modal.surfaceSetup;
  const { data: riskCountData, status: riskCountStatus } = useCounts({
    resource: 'risk',
  });
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: link } = useModifyAccount('link');
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  const {
    data: files = [],
    refetch: refetchFiles,
    status: filesStatus,
  } = useMy({
    resource: 'file',
    query: '#scans',
  });

  useEffect(() => {
    if (files.length > 0) {
      const refetchInterval = setInterval(() => {
        refetchFiles();
      }, sToMs(10));

      // Stop refetching if the files have been removed
      return () => clearInterval(refetchInterval);
    }
  }, [files.length]);

  const { totalRisks, openRisks, deletedRisks } = useMemo(() => {
    const totalRisks = Object.values(riskCountData ?? {}).reduce(
      (acc, val) => acc + val,
      0
    );
    const openRisks = Object.entries(riskCountData ?? {})
      .filter(([key]) => key.startsWith(RiskStatus.Opened))
      .reduce((acc, [, val]) => acc + val, 0);
    const deletedRisks = Object.entries(riskCountData ?? {})
      .filter(([key]) => key.startsWith(RiskStatus.DeletedRisks))
      .reduce((acc, [, val]) => acc + val, 0);
    return { totalRisks, openRisks, deletedRisks };
  }, [JSON.stringify(riskCountData)]);

  const getMessage = () => {
    // When there are no risks
    if (totalRisks === 0) {
      return {
        Icon: () => <ShieldExclamationIcon className="size-20 text-white/60" />,
        title: 'No risks detected yet!',
        Subtitle: () => (
          <>
            <Button
              styleType="textPrimary"
              className="p-0  text-xs text-white/70 underline"
              onClick={() => onOpenChangeSurfaceSetup(true)}
            >
              Build your attack surface
            </Button>
            {files.length === 0 && (
              <>{' or upload a Nessus XML file to get started.'}</>
            )}{' '}
          </>
        ),
      };
    }

    // When there are risks, however no Open or Deleted
    if (openRisks === 0 && deletedRisks === 0) {
      return {
        Icon: () => <ShieldCheckIcon className="size-20 text-white/60" />,
        title: 'Congrats, your environment is all signal, no noise!',
      };
    }

    // When there are just Deleted risks
    if (openRisks === 0 && deletedRisks > 0) {
      return {
        Icon: () => <ShieldCheckIcon className="size-20 text-white/60" />,
        title: 'No open risks detected!',
        Subtitle: () =>
          'Great news! All risks have been currently closed, and there are no open risks to report.',
      };
    }

    // When there are just Open risks
    if (openRisks > 0 && deletedRisks === 0) {
      return {
        Icon: () => <ShieldExclamationIcon className="size-20 text-white/60" />,
        title: `${openRisks} Open Risks Detected!`,
        Subtitle: () => (
          <>
            {`Recommended Action: `}
            <Button
              styleType="textPrimary"
              className="p-0  text-xs text-white/70 underline"
              onClick={() =>
                navigate(
                  generatePathWithSearch({
                    pathname: getRoute(['app', 'risks']),
                    appendSearch: [
                      [
                        'riskFilters',
                        JSON.stringify({
                          search: '',
                          query: `status:${RiskStatus.Opened}`,
                          subQuery: '',
                        }),
                      ],
                    ],
                  })
                )
              }
            >
              Remediation
            </Button>
          </>
        ),
      };
    }

    // When there are both Open and Deleted risks
    return {
      Icon: () => (
        <div className="flex h-[92px] gap-2">
          <div className="flex flex-col justify-end gap-1">
            <p className="text-center text-xs font-bold text-brand">1.3%</p>
            <div className="rounded bg-brand" style={{ height: '10%' }} />
            <p className="text-xs text-header-light">Risks</p>
          </div>
          <div className="flex flex-col justify-end gap-1">
            <div className="h-full w-8 flex-1 rounded bg-header-light" />
            <p className="text-xs text-header-light">Noise</p>
          </div>
        </div>
      ),
      title: 'Risks vs noise',
      Subtitle: () =>
        `${openRisks + deletedRisks} risks identified (${(deletedRisks * 100) / (openRisks + deletedRisks)}% noise)`,
    };
  };

  const { Icon, title, Subtitle } = useMemo(
    () => getMessage(),
    [totalRisks, openRisks, deletedRisks]
  );

  async function handleNessusFileDrop(files: Files<'arrayBuffer'>) {
    if (files.length === 1) {
      const content = files[0].content;
      const file = files[0].file;
      setIsUploading(true);

      await uploadFile({
        name: `scans/${file.name}`,
        content,
      });

      await link({
        value: `scans/${file.name}`,
        config: {},
        username: 'nessus-xml',
      });

      setIsScanning(true);
      setIsUploading(false);
    }
  }

  return (
    <Loader
      isLoading={riskCountStatus === 'pending'}
      className="h-32 w-full bg-header-dark"
    >
      <section className="flex items-center gap-4 rounded-md border-2 border-header-dark bg-[#191933] p-4">
        <Icon />
        <div className="flex flex-1 flex-col gap-2">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {Subtitle && (
            <p className="max-w-xl text-xs text-white/70">
              <Subtitle />
            </p>
          )}
          <p className="max-w-xl text-xs text-white">
            Chariot runs continuous security scans across your attack surface,
            looking for everything from policy misconfigurations to material
            risks. We then filter out the noise.
          </p>
        </div>

        {(filesStatus === 'pending' || isUploading) && (
          <div className="mt-1 h-auto rounded border-2 border-header-dark p-4 ">
            <div className="flex max-w-xs items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white">
                  File Uploading...
                </h2>
                <p className="text-xs text-white/70">
                  {`We're testing the noise reduction from your uploaded Nessus
                XML file.`}
                </p>
              </div>
              <ArrowPathIcon
                className="spin-slow duration-2000 size-12 text-white/60"
                style={{
                  animation: isScanning ? 'spin 2s linear infinite' : 'none',
                }}
              />
            </div>
          </div>
        )}

        {filesStatus === 'success' && files.length > 0 && (
          <div className="mt-1 h-auto rounded border-2 border-header-dark p-4 ">
            <div className="flex max-w-xs items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Assessing risks
                </h2>
                <p className="text-xs text-white/70">
                  {`We're testing the noise reduction from your uploaded Nessus
                    XML file.`}
                </p>
              </div>
              <ArrowPathIcon
                className="spin-slow duration-2000 size-12 text-white/60"
                style={{
                  animation: isScanning ? 'spin 2s linear infinite' : 'none',
                }}
              />
            </div>
          </div>
        )}

        {filesStatus === 'success' && files.length === 0 && (
          <Dropzone
            type="arrayBuffer"
            className="mt-1 h-auto border-header bg-header"
            onFilesDrop={handleNessusFileDrop}
            title=""
            subTitle=""
            accept={{
              'application/xml': ['.nessus'],
            }}
          >
            <div className="flex max-w-xs items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Want a dry run?
                </h2>
                <p className="text-xs text-white/70">
                  Test our noise reduction by uploading a .nessus file.
                </p>
              </div>
              <ArrowUpTrayIcon className="size-12 text-white/60" />
            </div>
          </Dropzone>
        )}
      </section>
    </Loader>
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
          className="text-3xl font-extrabold dark:text-white"
          initial={{ rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: -90, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {digit}
        </motion.div>
      ))}
      <span className="text-md ml-2 font-medium text-gray-600">
        Assets Monitored
      </span>
    </div>
  );
};
