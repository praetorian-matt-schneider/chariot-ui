import {
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowPathIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Drawer } from '@/components/Drawer';
import { RisksIcon } from '@/components/icons';
import { UnionIcon } from '@/components/icons/Union.icon';
import { Loader } from '@/components/Loader';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { MarkdownPreview } from '@/components/markdown/MarkdownPreview';
import { Modal } from '@/components/Modal';
import { Tabs } from '@/components/Tab';
import { Timeline } from '@/components/Timeline';
import { Tooltip } from '@/components/Tooltip';
import { RiskDropdown } from '@/components/ui/RiskDropdown';
import { useMy } from '@/hooks';
import { useGetKev } from '@/hooks/kev';
import { useGetFile, useUploadFile } from '@/hooks/useFiles';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useBulkReRunJob, useJobsStatus } from '@/hooks/useJobs';
import { useReportRisk, useUpdateRisk } from '@/hooks/useRisks';
import {
  ResponsiveGrid,
  StickHeaderSection,
} from '@/sections/detailsDrawer/AssetDrawer';
import { Comment } from '@/sections/detailsDrawer/Comment';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { getStatusColor } from '@/sections/Jobs';
import {
  Attribute,
  EntityHistory,
  JobStatus,
  Risk,
  RiskCombinedStatus,
  RiskStatus,
  RiskStatusLabel,
  RiskStatusWithoutSeverity,
} from '@/types';
import { mergeJobStatus } from '@/utils/api';
import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';
import { sToMs } from '@/utils/date.util';
import { getSeverityClass } from '@/utils/getSeverityClass.util';
import { getDescription, isManualORPRrovidedRisk } from '@/utils/risk.util';
import { getRiskSeverity } from '@/utils/riskStatus.util';
import { StorageKey, useStorage } from '@/utils/storage/useStorage.util';
import { useSearchParams } from '@/utils/url.util';

interface RiskDrawerProps {
  open: boolean;
  compositeKey: string;
}

const isScannable = (attribute: Attribute) =>
  attribute.name === 'source' &&
  (attribute.value.startsWith('#attribute') ||
    attribute.value.startsWith('#asset'));

export function RiskDrawer({ compositeKey, open }: RiskDrawerProps) {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('poe');
  const { removeSearchParams } = useSearchParams();
  const [riskJobsMap, setRiskJobsMap] = useStorage<
    Record<string, Record<string, string>>
  >(
    {
      key: StorageKey.RISK_JOB_MAP,
    },
    {}
  );

  const [, dns, name] = compositeKey.split('#');
  const attributesFilter = `source:#risk#${dns}#${name}`;

  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);
  const [markdownValue, setMarkdownValue] = useState('');
  const { mutateAsync: bulkReRunJobs, status: reRunJobStatus } =
    useBulkReRunJob();
  const { mutateAsync: updateRisk, isPending: isRiskFetching } =
    useUpdateRisk();
  const { mutateAsync: updateFile, status: updateFileStatus } = useUploadFile();
  const { mutateAsync: reportRisk, status: reportRiskStatus } = useReportRisk();

  const {
    data: risks = [],
    status: riskStatus,
    refetch: refetchRisk,
  } = useMy(
    {
      resource: 'risk',
      query: compositeKey,
    },
    { enabled: open }
  );

  const {
    data: definitionsFile,
    status: definitionsFileStatus,
    isFetching: isDefinitionsFileFetching,
  } = useGetFile(
    {
      name: `definitions/${name}`,
    },
    { enabled: open }
  );
  const { data: attributesGenericSearch } = useGenericSearch(
    {
      query: attributesFilter,
      exact: true,
    },
    {
      enabled: open,
    }
  );
  const sourceKeys = useMemo(
    () =>
      (attributesGenericSearch?.attributes || [])
        .filter(attribute => isScannable(attribute))
        .map(attribute => attribute.value),
    [attributesGenericSearch]
  );
  const { data: knownExploitedThreats = [] } = useGetKev();

  const definitionsFileValue =
    typeof definitionsFile === 'string'
      ? definitionsFile
      : JSON.stringify(definitionsFile);

  const isInitialLoading =
    riskStatus === 'pending' || definitionsFileStatus === 'pending';
  const risk: Risk = risks[0] || {};

  // This variable filters the jobs from localStorage and only keeps the jobs that are related to the current risk
  const attributeJobMap = Object.fromEntries(
    Object.entries(riskJobsMap[risk.key] || {}).filter(([key]) =>
      sourceKeys.includes(key)
    )
  );

  const { data: jobsData = {}, status: allAssetJobsStatus } = useJobsStatus(
    attributeJobMap,
    {
      enabled: open && sourceKeys.length > 0,
      refetchInterval: sToMs(10),
    }
  );

  const jobsStatus = mergeJobStatus(
    Object.values(jobsData).map(job => job?.status)
  );

  const lastScan =
    Object.values(jobsData)
      .map(job => job?.updated)
      .sort()
      .reverse()[0] || '';

  const isJobsRunning =
    jobsStatus === JobStatus.Running || jobsStatus === JobStatus.Queued;

  const severityClass = getSeverityClass(risk.status?.[1]);

  const resetMarkdownValue = useCallback(() => {
    setMarkdownValue(isEditingMarkdown ? definitionsFileValue : '');
  }, [isEditingMarkdown]);

  useEffect(() => {
    resetMarkdownValue();
  }, [resetMarkdownValue]);

  const history = useMemo(() => {
    const riskHistory = risk.history || [];
    const noHistory = riskHistory.length === 0;

    const firstTrackedHistory: EntityHistory = {
      from: '',
      to: noHistory ? risk.status : risk.history[0].from,
      updated: risk.created,
    };

    return [firstTrackedHistory, ...riskHistory];
  }, [JSON.stringify(risk.history)]);

  async function handleUpdateComment(comment = '') {
    await updateRisk({
      comment,
      key: risk.key,
      name: risk.name,
      status: risk.status,
    });
    refetchRisk();
  }

  const assetsOnRisk = useMemo(
    () =>
      attributesGenericSearch?.attributes
        ?.filter(attribute => attribute.value.includes('#asset'))
        .map(attribute => {
          // remove everything before #asset
          const newKey = attribute.value.split('#asset')[1];
          const [, dns, name] = newKey.split('#') || [];

          return {
            key: `#asset#${name}#${dns}`,
            dns,
            name,
            updated: attribute.updated,
          };
        }) || [],
    [attributesGenericSearch?.attributes]
  );

  return (
    <Drawer
      open={open}
      onClose={() => removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY)}
      onBack={() => navigate(-1)}
      className={'w-full rounded-t-lg pb-0 shadow-lg'}
    >
      <Loader isLoading={isInitialLoading} type="spinner">
        <ResponsiveGrid
          section1={
            <History history={history}>
              <Comment
                comment={risk.comment}
                isLoading={isRiskFetching}
                onSave={handleUpdateComment}
              />
            </History>
          }
          section2={
            <div className="col flex size-full flex-col overflow-hidden">
              <div className="flex items-start justify-between gap-4 px-9 py-5">
                <div className="flex w-2/3 flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <h1
                      className="text-2xl font-bold"
                      style={{ wordBreak: 'break-word' }}
                    >
                      {risk.name}
                    </h1>
                    {knownExploitedThreats.includes(risk.name) && (
                      <span className="text-red-500">
                        [Known Exploited Threat]
                      </span>
                    )}
                    <JobStatusBadge
                      status={jobsStatus}
                      lastScan={formatDate(lastScan)}
                    />
                  </div>

                  {/* Actions Section */}
                  <div className="flex flex-row gap-3">
                    <Tooltip placement="top" title="Change risk severity">
                      <RiskDropdown
                        type="severity"
                        risk={risk}
                        className={cn(
                          'transition-all h-8 text-xs',
                          severityClass,
                          'brightness-90'
                        )}
                      />
                    </Tooltip>
                    <Tooltip placement="top" title="Change risk status">
                      <RiskDropdown
                        type="status"
                        risk={risk}
                        className="h-8 border-gray-400 text-xs"
                      />
                    </Tooltip>
                    <Tooltip
                      placement="top"
                      title={
                        isInitialLoading
                          ? ''
                          : risk.source && !isManualORPRrovidedRisk(risk)
                            ? isJobsRunning
                              ? 'Scanning in progress'
                              : sourceKeys.length === 0
                                ? 'On-demand scanning is only available for risk which have a source attribute'
                                : 'Revalidate the risk'
                            : 'On-demand scanning is only available for automated risk discovery.'
                      }
                    >
                      <Button
                        className="h-8 text-nowrap border border-gray-400 text-xs"
                        startIcon={<ArrowPathIcon className="size-4" />}
                        disabled={
                          isInitialLoading ||
                          sourceKeys.length === 0 ||
                          isManualORPRrovidedRisk(risk) ||
                          Boolean(isJobsRunning)
                        }
                        isLoading={
                          reRunJobStatus === 'pending' ||
                          allAssetJobsStatus === 'pending'
                        }
                        onClick={async () => {
                          const [response] = await bulkReRunJobs(
                            sourceKeys.map(jobKey => ({
                              capability: risk.source,
                              jobKey,
                              config: {
                                test: risk.name,
                              },
                            }))
                          );
                          setRiskJobsMap(riskJobsMap => ({
                            ...riskJobsMap,
                            [risk.key]: sourceKeys.reduce(
                              (acc, current, index) =>
                                response[index]?.key
                                  ? {
                                      ...acc,
                                      [current]: response[index].key,
                                    }
                                  : acc,
                              {}
                            ),
                          }));
                        }}
                      >
                        Scan Now
                      </Button>
                    </Tooltip>
                  </div>
                </div>
                <RiskDetails className="w-1/3" risk={risk} />
              </div>

              {/* POE and Description */}
              <Tabs
                className="overflow-hidden px-9 pb-5"
                contentWrapperClassName="overflow-auto"
                tabs={[
                  {
                    label: 'Proof of Exploits',
                    id: 'poe',
                    tabClassName: 'bg-transparent',
                    Content: () => <POE risk={risk} />,
                  },
                  {
                    label: 'Description & Remediation',
                    id: 'description',
                    tabClassName: 'bg-transparent',
                    Content: () => (
                      <Loader
                        isLoading={
                          isDefinitionsFileFetching ||
                          reportRiskStatus === 'pending'
                        }
                        className="h-6 bg-layer0"
                      >
                        <Modal
                          size="6xl"
                          open={isEditingMarkdown}
                          onClose={() => setIsEditingMarkdown(false)}
                          title="Description & Remediation"
                          footer={{
                            text: 'Save',
                            isLoading: updateFileStatus === 'pending',
                            onClick: async () => {
                              await updateFile({
                                ignoreSnackbar: true,
                                name: `definitions/${name}`,
                                content: markdownValue,
                              });
                              setIsEditingMarkdown(false);
                            },
                          }}
                        >
                          <div className="h-[60vh]">
                            <MarkdownEditor
                              value={markdownValue}
                              onChange={value => setMarkdownValue(value || '')}
                              filePathPrefix="definitions/files"
                            />
                          </div>
                        </Modal>
                        {definitionsFile ? (
                          <MarkdownPreview
                            source={definitionsFileValue}
                            style={{
                              padding: '0.75rem',
                              wordBreak: 'break-word',
                              minHeight: '20px',
                            }}
                          />
                        ) : (
                          <div className="my-8 flex size-full flex-1 flex-col items-center justify-center text-center text-default">
                            <UnionIcon className="mt-8 size-16 text-default-light" />
                            <p className="mt-7 text-lg font-bold">
                              Generate Description & Remediation
                            </p>
                            <p className="mt-2">
                              Add a Description & Remediation to this Risk
                              <br />
                              {`using Praetorian's Machine Learning.`}
                            </p>
                            <Button
                              className="mt-10"
                              startIcon={
                                <UnionIcon className="size-3 text-brand-light" />
                              }
                              styleType="primary"
                              onClick={() => reportRisk({ name })}
                            >
                              Generate Now
                            </Button>
                          </div>
                        )}
                        <Button
                          styleType="none"
                          className="mr-auto mt-4 pl-0 font-bold"
                          endIcon={<PencilSquareIcon className="size-5" />}
                          onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            setIsEditingMarkdown(true);
                          }}
                        >
                          Edit
                        </Button>
                      </Loader>
                    ),
                  },
                ]}
                defaultValue={'poe'}
                value={selectedTab}
                onChange={setSelectedTab}
                styleType="horizontal"
              />
            </div>
          }
          section3={<AffectedAssets assets={assetsOnRisk} />}
        />
      </Loader>
    </Drawer>
  );
}

const History: React.FC<PropsWithChildren & { history: EntityHistory[] }> = ({
  children,
  history = [],
}) => {
  return (
    <StickHeaderSection label="History">
      {children}
      <Timeline
        items={[
          ...(history
            ?.map((item, itemIndex) => {
              const { title, updated } = getHistoryDiff(item, itemIndex === 0);
              return {
                title,
                description: updated,
                className: 'text-default',
                icon:
                  itemIndex === 0 ? (
                    <RisksIcon className="stroke-1" />
                  ) : undefined,
              };
            })
            .reverse() || []),
        ]}
      />
    </StickHeaderSection>
  );
};

const POE: React.FC<{ risk: Risk }> = ({ risk }) => {
  const poe = `${risk.dns}/${risk.name}`;
  const { data: file, status: fileStatus } = useGetFile({
    name: `proofs/${poe}`,
  });

  const proofOfExploit = useMemo(() => {
    const proofDescription = getDescription(file);

    const { Request, Response } = proofDescription;
    return Request || Response
      ? {
          Request,
          Response,
        }
      : null;
  }, [file]);

  return (
    <Loader className="my-8 h-96" isLoading={fileStatus === 'pending'}>
      {!proofOfExploit && (
        <div className="mt-12">
          <p className="text-lg font-bold">No Proof of Exploit found.</p>
        </div>
      )}
      {proofOfExploit && (
        <div className="relative my-8 overflow-auto">
          {Object.entries(proofOfExploit).map(([key, value]) => (
            <div className="mb-8" key={key}>
              <h3 className="text-lg font-bold">{key}</h3>
              <code className="prose whitespace-pre-wrap text-xs">
                {(value as ReactNode) || 'Not Found'}
              </code>
            </div>
          ))}
        </div>
      )}
    </Loader>
  );
};

const AffectedAssets: React.FC<{
  assets: {
    key: string;
    dns: string;
    name: string;
    updated: string;
  }[];
}> = ({ assets }) => {
  const { getAssetDrawerLink } = getDrawerLink();

  return (
    <StickHeaderSection label="Affected Assets">
      {assets?.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          <p>No assets found.</p>
        </div>
      )}
      {assets.length > 0 &&
        assets.map(asset => (
          <div
            className="flex flex-col items-start justify-between gap-4 border-b border-gray-300 p-4 md:flex-row"
            key={asset.key}
          >
            <div>
              <Link
                to={getAssetDrawerLink({
                  dns: asset.dns,
                  name: asset.name,
                })}
                className="hover:underline"
              >
                <h2 className="text-brand">{asset.name}</h2>
              </Link>
              <p
                className="text-sm text-gray-500"
                style={{ wordBreak: 'break-word' }}
              >
                {asset.dns}
              </p>
            </div>
            <span className="text-sm text-gray-500">
              {formatDate(asset.updated)}
            </span>
          </div>
        ))}
    </StickHeaderSection>
  );
};

const RiskDetails = ({
  risk,
  className,
}: {
  risk: Risk;
  className?: string;
}) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-start text-slate-600">
        DNS:
        <p
          className="ml-1 break-words font-bold text-slate-950"
          style={{ wordBreak: 'break-word' }}
        >
          {risk.dns}
        </p>
      </div>
      <div className="flex items-center text-nowrap text-slate-600">
        Last Seen:
        <p className="ml-1 font-bold text-slate-950">
          {formatDate(risk.updated)}
        </p>
      </div>
      <div className="flex items-center text-nowrap text-slate-600">
        First Seen:
        <p className="ml-1 font-bold text-slate-950">
          {formatDate(risk.created)}
        </p>
      </div>
    </div>
  );
};

const JobStatusBadge = ({
  status,
  lastScan,
}: {
  status?: JobStatus;
  lastScan: string;
}) => {
  if (!status) {
    return null;
  }

  return (
    <div
      className={`!ml-auto flex min-w-40 items-center justify-center rounded-md px-4 py-1 text-xs ${getStatusColor(status)}`}
    >
      <span className="flex gap-2">
        {getJobStatusText({ status, lastScan })}
        {status === JobStatus.Running && (
          <ArrowPathIcon className="size-4 animate-spin" />
        )}
      </span>
    </div>
  );
};

const getJobStatusText = ({
  status,
  lastScan,
}: {
  status?: JobStatus;
  lastScan: string;
}) => {
  switch (status) {
    case JobStatus.Pass:
      return `Last Scan: ${lastScan}`;
    case JobStatus.Fail:
      return `Failed: ${lastScan}`;
    case JobStatus.Running:
      return 'Scanning';
    case JobStatus.Queued:
      return 'Job Queued';
    default:
      return '';
  }
};

function getHistoryDiff(
  history: EntityHistory,
  isFirst: boolean
): {
  title: ReactNode;
  updated: string;
} {
  if (isFirst) {
    return {
      title: (
        <div className="whitespace-break-spaces">
          <p className="inline">
            <strong>First Tracked</strong>
            {EmptySpace}as{EmptySpace}
          </p>
          {RiskStatusWithoutSeverity.includes(history.to as RiskStatus) ? (
            <Chip
              className="inline-flex min-h-[26px] whitespace-nowrap py-1"
              style="default"
            >
              {RiskStatusLabel[history.to as RiskStatus]}
            </Chip>
          ) : (
            <RiskDropdown
              risk={{
                status: history.to as RiskCombinedStatus,
                key: '',
                comment: '',
              }}
              type={'severity'}
              styleType="chip"
            />
          )}
        </div>
      ),
      updated: formatDate(history.updated),
    };
  }

  const isStatusChanged =
    `${history.from?.[0]}${history.from?.[2]}` !==
    `${history.to?.[0]}${history.to?.[2]}`;
  const isSeverityChanged =
    RiskStatusWithoutSeverity.includes(history.from as RiskStatus) ||
    RiskStatusWithoutSeverity.includes(history.to as RiskStatus)
      ? false
      : getRiskSeverity(history.from) !== getRiskSeverity(history.to);
  const isBothChanged = isSeverityChanged && isStatusChanged;
  const by = history?.by;

  const severity = (
    <>
      <p className="inline">
        {by ? (
          <span>
            {by} changed the <span className="font-semibold">Severity</span>{' '}
            from
          </span>
        ) : (
          <span>
            <span className="font-semibold">Severity</span> changed from
          </span>
        )}
        {EmptySpace}
      </p>
      <RiskDropdown
        risk={{
          status: history.from as RiskCombinedStatus,
          key: '',
          comment: '',
        }}
        type={'severity'}
        styleType="chip"
      />
      <p className="inline">
        {EmptySpace}to{EmptySpace}
      </p>
      <RiskDropdown
        risk={{
          status: history.to as RiskCombinedStatus,
          key: '',
          comment: '',
        }}
        type={'severity'}
        styleType="chip"
      />
    </>
  );

  const status = (
    <>
      <p className="inline">
        {isBothChanged ? (
          <>
            {EmptySpace}, and <span className="font-semibold">Status</span> from
            {EmptySpace}
          </>
        ) : (
          <>
            {by ? (
              <span>
                {by} changed the <span className="font-semibold">Status</span>{' '}
                from
              </span>
            ) : (
              <span>
                <span className="font-semibold">Status</span> changed from
              </span>
            )}
            {EmptySpace}
          </>
        )}
      </p>
      <RiskDropdown
        risk={{
          status: history.from as RiskCombinedStatus,
          key: '',
          comment: '',
        }}
        type={'status'}
        styleType="chip"
      />
      <p className="inline-block">
        {EmptySpace}to{EmptySpace}
      </p>
      <RiskDropdown
        risk={{
          status: history.to as RiskCombinedStatus,
          key: '',
          comment: '',
        }}
        type={'status'}
        styleType="chip"
      />
    </>
  );

  return {
    title: (
      <div className="whitespace-break-spaces leading-7">
        {(isSeverityChanged || isBothChanged) && severity}
        {(isStatusChanged || isBothChanged) && status}
      </div>
    ),
    updated: formatDate(history.updated),
  };
}

const EmptySpace = ' ';
