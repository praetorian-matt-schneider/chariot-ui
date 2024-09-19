import {
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { Type } from '@/components/form/Input';
import { InputText } from '@/components/form/InputText';
import { RisksIcon } from '@/components/icons';
import { UnionIcon } from '@/components/icons/Union.icon';
import { Loader } from '@/components/Loader';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { MarkdownPreview } from '@/components/markdown/MarkdownPreview';
import { Modal } from '@/components/Modal';
import { Tabs } from '@/components/Tab';
import { Timeline } from '@/components/Timeline';
import { Tooltip } from '@/components/Tooltip';
import { RiskDropdown, RiskLabel } from '@/components/ui/RiskDropdown';
import { useMy } from '@/hooks';
import { useGetKev } from '@/hooks/kev';
import { useGetFile, useUploadFile } from '@/hooks/useFiles';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useBulkReRunJob, useJobsStatus } from '@/hooks/useJobs';
import { useReportRisk, useUpdateRisk } from '@/hooks/useRisks';
import { AlertAction } from '@/sections/Alerts';
import {
  AttributeList,
  ResponsiveGrid,
  StickHeaderSection,
} from '@/sections/detailsDrawer/AssetDrawer';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { getStatusColor } from '@/sections/Jobs';
import {
  Attribute,
  EntityHistory,
  JobStatus,
  Risk,
  RiskCombinedStatus,
  RiskFilters,
  RiskStatus,
  RiskStatusWithoutSeverity,
} from '@/types';
import { mergeJobStatus } from '@/utils/api';
import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';
import { sToMs } from '@/utils/date.util';
import { getJobStatus } from '@/utils/job';
import { Regex } from '@/utils/regex.util';
import { getDescription, isManualORPRrovidedRisk } from '@/utils/risk.util';
import { getRiskStatusLabel } from '@/utils/riskStatus.util';
import { useQueryFilters } from '@/utils/storage/useQueryParams.util';
import { StorageKey, useStorage } from '@/utils/storage/useStorage.util';
import { generatePathWithSearch, useSearchParams } from '@/utils/url.util';

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
  const [selectedTab, setSelectedTab] = useState('description');
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const { removeSearchParams } = useSearchParams();
  const [riskJobsMap, setRiskJobsMap] = useStorage<
    Record<string, Record<string, string>>
  >(
    {
      key: StorageKey.RISK_JOB_MAP,
    },
    {}
  );
  const [comment, setComment] = useState<string>('');
  const [localCombinedStatus, setLocalCombinedStatus] =
    useState<RiskCombinedStatus>('');

  const [, dns, name] = compositeKey.split('#');
  const attributesFilter = `source:#risk#${dns}#${name}`;

  const [riskFilters] = useQueryFilters<RiskFilters>({
    key: StorageKey.RISK_FILTERS,
    defaultFilters: {
      search: '',
      query: '',
      subQuery: '',
    },
  });
  const { invalidate: invalidateRiskData } = useGenericSearch({
    query: riskFilters.search || riskFilters.query,
  });

  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);
  const [markdownValue, setMarkdownValue] = useState('');
  const { mutateAsync: bulkReRunJobs, status: reRunJobStatus } =
    useBulkReRunJob();
  const { mutateAsync: updateRisk, status: updateRiskStatus } = useUpdateRisk();
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

  const { data: definitionsFile, isFetching: isDefinitionsFileFetching } =
    useGetFile(
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

  const isInitialLoading = riskStatus === 'pending';
  const risk: Risk = risks[0] || {};

  const hasLocalChanges =
    risk.status !== localCombinedStatus || Boolean(comment);

  useEffect(() => {
    if (risk && risk.status) {
      setLocalCombinedStatus(risk.status);
      setComment(risk.comment);
    }
  }, [JSON.stringify(risk)]);

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
    Object.values(jobsData).map(job => getJobStatus(job))
  );

  const lastScan =
    Object.values(jobsData)
      .map(job => job?.updated)
      .sort()
      .reverse()[0] || '';

  const isJobsRunning =
    jobsStatus === JobStatus.Running || jobsStatus === JobStatus.Queued;

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
      comment: risk.comment,
    };

    return [firstTrackedHistory, ...riskHistory];
  }, [JSON.stringify(risk.history)]);

  async function handleUpdateRisk(comment = '', status = '') {
    await updateRisk({
      comment,
      key: risk.key,
      name: risk.name,
      status,
    });
    refetchRisk();
  }

  const assetsOnRisk = useMemo(
    () =>
      attributesGenericSearch?.attributes
        ?.filter(attribute => attribute.value.includes('#asset'))
        .map(attribute => {
          const [, dns, name] = attribute.value.match(Regex.ASSET_KEY) || [];

          return {
            key: `#asset#${name}#${dns}`,
            dns,
            name,
            updated: attribute.updated,
          };
        }) || [],
    [attributesGenericSearch?.attributes]
  );

  const handleClose = useCallback(() => {
    if (hasLocalChanges) {
      setIsWarningModalOpen(true);
    } else {
      removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY);
    }
  }, [hasLocalChanges]);

  const handleSaveComment = async () => {
    try {
      await handleUpdateRisk(comment, localCombinedStatus);
      setComment('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      onBack={() => navigate(-1)}
      className={cn('w-full rounded-t-lg pb-0 shadow-lg')}
      contentClassName="flex rounded-t-lg"
    >
      <Loader isLoading={isInitialLoading} type="spinner">
        <ResponsiveGrid
          section1={
            <History history={history}>
              <div
                className={
                  'cursor-pointer rounded-sm bg-gray-100 p-4 transition-all'
                }
              >
                {risk.status !== RiskStatus.ExposedRisks && (
                  <RiskDropdown
                    risk={risk}
                    combinedStatus={localCombinedStatus}
                    setCombinedStatus={setLocalCombinedStatus}
                  />
                )}
                <InputText
                  type={Type.TEXT_AREA}
                  name="message"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Write your thoughts here..."
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <Button
                    onClick={handleSaveComment}
                    disabled={
                      updateRiskStatus === 'pending' || !hasLocalChanges
                    }
                    className="py-2"
                    styleType={hasLocalChanges ? 'primary' : 'none'}
                  >
                    {updateRiskStatus === 'pending' ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
              <Modal
                style="dialog"
                title={
                  <div className="flex items-center gap-1">
                    <ExclamationTriangleIcon className="size-5 text-yellow-600" />
                    Unsaved Changes
                  </div>
                }
                open={isWarningModalOpen}
                onClose={() => {
                  setIsWarningModalOpen(false);
                  removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY);
                }}
                closeOnOutsideClick={false}
                footer={{
                  text: 'Save',
                  onClick: async () => {
                    // Add api to save the changes
                    if (risk.status === RiskStatus.ExposedRisks) {
                      await handleUpdateRisk(comment, risk.status);
                    } else {
                      await handleUpdateRisk(comment, localCombinedStatus);
                    }
                    setIsWarningModalOpen(false);
                  },
                }}
              >
                <div className="space-y-2 text-sm text-default-light">
                  There are some changes on status. Do you want to save ?
                </div>
              </Modal>
            </History>
          }
          section2={
            <div className="col flex size-full flex-col overflow-hidden">
              <div className="flex items-start gap-4 px-9 py-5">
                <div className="max-w-1/2 flex flex-col gap-1">
                  <div className="flex items-center gap-4">
                    <h1
                      className="text-2xl font-bold"
                      style={{ wordBreak: 'break-word' }}
                    >
                      {risk.name}
                    </h1>
                    <Link
                      to={generatePathWithSearch({
                        appendSearch: [
                          [StorageKey.POE, `${risk.dns}/${risk.name}`],
                        ],
                      })}
                      className="cursor-pointer"
                    >
                      <DocumentTextIcon className="size-4 text-default" />
                    </Link>
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
                  <div className="flex flex-row flex-wrap gap-3">
                    <AlertAction
                      item={risk}
                      showQuestionTooltip
                      handleRefetch={() => {
                        invalidateRiskData();
                      }}
                      extraAction={
                        getRiskStatusLabel(risk.status).status !==
                          RiskStatus.Opened &&
                        getRiskStatusLabel(risk.status).status !==
                          RiskStatus.MachineOpen && (
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
                        )
                      }
                    />
                  </div>
                </div>
                <RiskDetails risk={risk} />
              </div>
              {/* POE and Description */}
              <Tabs
                className="overflow-hidden pb-5"
                contentWrapperClassName="overflow-auto pb-10"
                tabs={[
                  {
                    label: 'Description & Remediation',
                    id: 'description',
                    tabClassName: 'bg-transparent',
                    content: (
                      <Loader
                        className="my-4 h-96"
                        isLoading={
                          isDefinitionsFileFetching ||
                          reportRiskStatus === 'pending'
                        }
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
                          className="pl-0 font-bold"
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
                  {
                    label: 'Proof of Exploit',
                    id: 'poe',
                    tabClassName: 'bg-transparent',
                    content: <POE risk={risk} />,
                  },
                ]}
                defaultValue={'description'}
                value={selectedTab}
                onChange={setSelectedTab}
                styleType="horizontal"
              />
            </div>
          }
          section3={
            <AffectedAssets
              assets={assetsOnRisk}
              attributes={attributesGenericSearch?.attributes ?? []}
            />
          }
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
      : proofDescription;
  }, [file]);

  return (
    <Loader className="my-4 h-96" isLoading={fileStatus === 'pending'}>
      {!proofOfExploit && (
        <div className="mt-4">
          <p className="text-lg font-bold">No Proof of Exploit found.</p>
        </div>
      )}
      {proofOfExploit && (
        <div className="relative my-4 overflow-auto">
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
  attributes: Attribute[];
}> = ({ assets, attributes }) => {
  const { getAssetDrawerLink } = getDrawerLink();
  const [showAttributes, setShowAttributes] = useState(false);

  function renderShowAttribute() {
    return (
      <div className="sticky bottom-0 w-full border-y border-gray-300 bg-layer0">
        <Button
          onClick={() => setShowAttributes(!showAttributes)}
          className="w-full text-xs"
          styleType="none"
        >
          {showAttributes ? 'Hide Attributes' : 'Show Attributes'}
        </Button>
      </div>
    );
  }

  return (
    <>
      {!showAttributes && (
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
                    className="hover:text-indigo-600 hover:underline"
                  >
                    <h2 className="font-semibold text-indigo-500">
                      {asset.name}
                    </h2>
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
          {renderShowAttribute()}
        </StickHeaderSection>
      )}

      {showAttributes && (
        <StickHeaderSection label="Attributes">
          <AttributeList
            attributes={attributes.map(attribute => {
              return {
                updated: attribute.updated,
                name: attribute.name,
                value: attribute.value,
              };
            })}
            className={'px-4 last:border-0'}
          />
          {renderShowAttribute()}
        </StickHeaderSection>
      )}
    </>
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
    <div className={cn('flex flex-wrap ml-auto gap-8 max-w-1/2', className)}>
      <div className="ml-auto text-nowrap text-slate-600">
        <p className="text-xl font-bold text-slate-950">
          {formatDate(risk.updated)}
        </p>
        <p>Last Seen</p>
      </div>
      <div className="ml-auto text-nowrap text-slate-600">
        <p className="text-xl font-bold text-slate-950">
          {formatDate(risk.created)}
        </p>
        <p>First Seen</p>
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
    if (!history.to) {
      return { title: '', updated: '' };
    }

    return {
      title: (
        <div className="whitespace-break-spaces">
          <p className="inline">
            <strong>First Tracked</strong>
            {EmptySpace}as{EmptySpace}
          </p>
          <RiskLabel status={history.to as RiskCombinedStatus} type="status" />
        </div>
      ),
      updated: formatDate(history.updated),
    };
  }

  const { status: statusFrom, severity: severityFrom } = getRiskStatusLabel(
    history.from
  );
  const { status: statusTo, severity: severityTo } = getRiskStatusLabel(
    history.to
  );
  const isStatusWithoutSeverityFrom = RiskStatusWithoutSeverity.includes(
    history.from as RiskStatus
  );

  const isStatusChanged = statusFrom !== statusTo;
  const isSeverityChanged = severityFrom !== severityTo;
  const hasComment = Boolean(history.comment);
  const isBothChanged = isSeverityChanged && isStatusChanged;

  const by = history?.by;

  const severity = (
    <>
      <p className="inline">
        {by ? (
          <span>
            {by} changed the <span className="font-semibold">Severity</span>{' '}
            {isStatusWithoutSeverityFrom ? 'to' : 'from'}
          </span>
        ) : (
          <span>
            <span className="font-semibold">Severity</span>
            {isStatusWithoutSeverityFrom ? ' set to' : ' changed from'}
          </span>
        )}
        {EmptySpace}
      </p>
      {!isStatusWithoutSeverityFrom && (
        <>
          <RiskLabel
            status={history.from as RiskCombinedStatus}
            type="severity"
          />
          <p className="inline">
            {EmptySpace}to{EmptySpace}
          </p>
        </>
      )}
      <RiskLabel status={history.to as RiskCombinedStatus} type="severity" />
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
      <RiskLabel status={history.from as RiskCombinedStatus} type="status" />
      <p className="inline-block">
        {EmptySpace}to{EmptySpace}
      </p>
      <RiskLabel status={history.to as RiskCombinedStatus} type="status" />
    </>
  );

  const comment =
    isStatusChanged || isSeverityChanged ? (
      <p className="inline">
        {` with `}
        <span className="font-semibold">Comment</span>
        <i style={{ wordBreak: 'break-word' }}>{` "${history.comment}"`}</i>
      </p>
    ) : (
      <p className="inline">
        <span>
          {by} added the <span className="font-semibold">Comment</span>
          <i style={{ wordBreak: 'break-word' }}>{` "${history.comment}"`}</i>
        </span>
      </p>
    );

  const hasChange = isStatusChanged || isSeverityChanged || hasComment;

  return {
    title: hasChange ? (
      <div className="whitespace-break-spaces leading-7">
        {(isSeverityChanged || isBothChanged) && severity}
        {(isStatusChanged || isBothChanged) && status}
        {history.comment && comment}
      </div>
    ) : null,
    updated: formatDate(history.updated),
  };
}

const EmptySpace = ' ';
