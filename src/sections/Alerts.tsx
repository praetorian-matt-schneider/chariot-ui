import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Inbox, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/Button';
import { getSeverityButton } from '@/components/icons/RiskSeverity.icon';
import { Loader } from '@/components/Loader';
import { Tooltip } from '@/components/Tooltip';
import { ClosedStateModal } from '@/components/ui/ClosedStateModal';
import { useUpdateAsset } from '@/hooks/useAssets';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { useReRunJob } from '@/hooks/useJobs';
import { useDeleteRisk, useUpdateRisk } from '@/hooks/useRisks';
import { AlertIcon } from '@/sections/Assets';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import {
  Asset,
  AssetStatus,
  Attribute,
  Risk,
  RiskSeverity,
  RiskStatus,
} from '@/types';
import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';
import { getRiskSeverity, getRiskStatus } from '@/utils/riskStatus.util';

type AlertType = Asset | Risk | Attribute;

const isAssetFn = (item: AlertType): item is Asset =>
  item.key.startsWith('#asset#');

const isRiskFn = (item: AlertType): item is Risk =>
  item.key.startsWith('#risk#');

const AlertsWrapper: React.FC = () => {
  const [query, setQuery] = useState<string | null>(null);

  return <Alerts query={query} setQuery={setQuery} />;
};

interface Props {
  query: string | null;
  setQuery: (query: string) => void;
  hideFilters?: boolean;
  refetch?: () => void;
  unsubscribeAlert?: string;
}

export const Alerts: React.FC<Props> = ({
  query,
  setQuery,
  hideFilters,
  refetch,
  unsubscribeAlert,
}: Props) => {
  const [isClosedSubStateModalOpen, setIsClosedSubStateModalOpen] =
    useState(false);
  const [selectedItem, setSelectedItem] = useState<Risk | null>(null);

  const { mutateAsync: reRunJob, status: reRunJobStatus } = useReRunJob();
  const { data: alertsWithUpdatedQueries, refetch: refetchAlerts } =
    useGetAccountAlerts();
  const { getRiskDrawerLink, getAssetDrawerLink } = getDrawerLink();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // TODO - Refactor this on BE instead
  const alerts = (alertsWithUpdatedQueries || []).map(alert => ({
    ...alert,
    value: alert.value.startsWith('#attribute')
      ? `name:${alert.name}`
      : alert.value,
  }));

  const { mutateAsync: updateAsset, status: updateAssetStatus } =
    useUpdateAsset();
  const { mutateAsync: updateRisk, status: updateRiskStatus } = useUpdateRisk();
  const { mutateAsync: deleteRisk } = useDeleteRisk();

  useEffect(() => {
    const initialQuery = searchParams.get('query');
    if (initialQuery) {
      setQuery(initialQuery);
    } else if (alerts && alerts.length > 0) {
      setQuery(alerts[0].value);
    }
  }, [alerts, searchParams]);

  const handleCategoryClick = (query: string) => {
    setQuery(query);
  };

  const {
    data,
    refetch: refetchData,
    status: dataStatus,
  } = useGenericSearch(
    {
      query: query ?? '',
    },
    {
      enabled: !!query,
    }
  );

  function handleRefetch() {
    refetchData();
    refetchAlerts();
    refetch && refetch();
  }

  function getAlertDescription(query: string) {
    const statusCode = query.split(':')[1] as AssetStatus | RiskStatus;
    switch (statusCode) {
      case RiskStatus.Opened:
      case RiskStatus.MachineOpen:
        return (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              These are all your open risks that need remediation.
            </h1>
            <p className="mt-4 text-sm text-gray-700">
              <span className="font-semibold">Recommended Action:</span>{' '}
              Remediate the risk, then either rescan to confirm or close if no
              longer valid.
            </p>
          </>
        );
      case RiskStatus.Triaged:
        return (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              These are newly discovered risks that require triaging.
            </h1>
            <p className="mt-4 text-sm text-gray-700">
              <span className="font-semibold">Recommended Action:</span> Accept
              the risk if it is valid, or reject it if it is invalid.
            </p>
          </>
        );
      case RiskStatus.MachineDeleted:
        return (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              These risks were previously open but are no longer detected.
            </h1>
            <p className="mt-4 text-sm text-gray-700">
              <span className="font-semibold">Recommended Action:</span> Confirm
              that the risk is no longer present or reopen the risk if
              necessary.
            </p>
          </>
        );
      case AssetStatus.ActiveLow:
        return (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              These assets are not being scanned for risks.
            </h1>
            <p className="mt-4 text-sm text-gray-700">
              <span className="font-semibold">Recommended Action:</span> Enable
              risk scanning for these assets or delete them if they are not of
              interest.
            </p>
          </>
        );
      default:
        return (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              These are all your exposure risks
            </h1>
            <p className="mt-4 text-sm text-gray-700">
              <span className="font-semibold">Recommended Action:</span> Open or
              close the risk as needed.
            </p>
          </>
        );
    }
  }

  function handleAssetChange(asset: Asset, status: AssetStatus) {
    updateAsset({
      key: asset.key,
      name: asset.name,
      status,
      showSnackbar: true,
    }).then(handleRefetch);
  }

  function handleRiskChange(
    risk: Risk,
    status: RiskStatus,
    severity?: RiskSeverity
  ) {
    updateRisk({
      key: risk.key,
      name: risk.name,
      status: `${status}${severity ? severity : ''}`,
      showSnackbar: true,
      comment: risk.comment,
    }).then(() => {
      handleRefetch();
    });
  }

  const handleOpenModal = (item: Risk) => {
    setSelectedItem(item);
    setIsClosedSubStateModalOpen(true);
  };

  const renderItemDetails = (item: AlertType) => {
    const isAsset = isAssetFn(item);
    const isRisk = isRiskFn(item);

    const handleViewLink = () => {
      if (isAsset) {
        return getAssetDrawerLink(item as Asset);
      } else if (isRisk) {
        return getRiskDrawerLink(item as Risk);
      }
    };

    return (
      <div
        className="flex w-full cursor-pointer items-center space-x-4 border-b border-gray-200 bg-white p-4 hover:bg-gray-100"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          const link = handleViewLink();
          link && navigate(link);
        }}
      >
        <div className="flex flex-1 items-center space-x-3 overflow-hidden">
          {isRisk && getSeverityButton(getRiskSeverity(item.status))}
          {(isAsset || isRisk) && (
            <div className="flex flex-1 items-center space-x-3 overflow-hidden">
              <div className="flex w-full flex-col overflow-hidden">
                <Tooltip title={item.name ?? (isAsset ? item.dns : item.key)}>
                  <span className="truncate text-base font-semibold text-brand hover:text-brand-dark">
                    {item.name}
                  </span>
                </Tooltip>
                <span className="text-sm text-gray-500">{item.dns}</span>
              </div>
            </div>
          )}
        </div>
        {(isAsset || isRisk) && (
          <span className="text-xs text-gray-500">
            {item.created !== item.updated ? (
              <Tooltip title={`Created ${formatDate(item.created)}`}>
                Updated {formatDate(item.updated)}
              </Tooltip>
            ) : (
              <span>
                {isAsset
                  ? item.source === 'provided'
                    ? 'Added'
                    : 'Discovered'
                  : 'Identified'}{' '}
                {formatDate(item.created)}
              </span>
            )}
          </span>
        )}

        {/* {(isAsset || isRisk) && (
          <div className="flex items-center space-x-2">
            <Tooltip title="Status">
              <span className="rounded border border-red-400 px-2 py-1 text-xs font-medium text-red-500">
                {isAsset && AssetStatusLabel[item.status as AssetStatus]}
                {isRisk && RiskStatusLabel[getRiskStatus(item.status)]}
              </span>
            </Tooltip>
          </div>
        )} */}
        <div className="flex space-x-2">
          {isAsset && item.status === AssetStatus.ActiveLow && (
            <>
              <Tooltip title="Enable Risk Scanning">
                <Button
                  styleType="primary"
                  className="h-8"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAssetChange(item, AssetStatus.Active);
                  }}
                  disabled={updateAssetStatus === 'pending'}
                >
                  Enable
                </Button>
              </Tooltip>
              <Tooltip title="Mark as Deleted">
                <Button
                  styleType="secondary"
                  className="h-8"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAssetChange(item, AssetStatus.Deleted);
                  }}
                  disabled={updateAssetStatus === 'pending'}
                >
                  Delete
                </Button>
              </Tooltip>
            </>
          )}
          {isRisk && getRiskStatus(item.status) === RiskStatus.Triaged && (
            <>
              <Tooltip title="Mark as Open">
                <Button
                  styleType="primary"
                  className="h-8"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRiskChange(
                      item,
                      RiskStatus.Opened,
                      getRiskSeverity(item.status)
                    );
                  }}
                  disabled={updateRiskStatus === 'pending'}
                >
                  Accept
                </Button>
              </Tooltip>
              <Tooltip title="Mark as Closed">
                <Button
                  styleType="secondary"
                  className="h-8"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenModal(item);
                  }}
                  disabled={updateRiskStatus === 'pending'}
                >
                  Reject
                </Button>
              </Tooltip>
            </>
          )}
          {isRisk &&
            getRiskStatus(item.status) === RiskStatus.MachineDeleted && (
              <>
                <Tooltip title="Mark as Closed">
                  <Button
                    styleType="primary"
                    className="h-8"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenModal(item);
                    }}
                    disabled={updateRiskStatus === 'pending'}
                  >
                    Confirm
                  </Button>
                </Tooltip>
                <Tooltip title="Mark as Open">
                  <Button
                    styleType="secondary"
                    className="h-8"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRiskChange(
                        item,
                        RiskStatus.Opened,
                        getRiskSeverity(item.status) as RiskSeverity
                      );
                    }}
                    disabled={updateRiskStatus === 'pending'}
                  >
                    Reopen
                  </Button>
                </Tooltip>
              </>
            )}
          {isRisk &&
            (getRiskStatus(item.status) === RiskStatus.Opened ||
              item.status === RiskStatus.MachineOpen) && (
              <>
                <Tooltip title="Rerun capability against this asset">
                  <Button
                    styleType="primary"
                    className="h-8"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      reRunJob({
                        capability: item.source,
                        jobKey: `#asset#${item.dns}`,
                      });
                    }}
                    disabled={reRunJobStatus === 'pending'}
                  >
                    Rescan
                  </Button>
                </Tooltip>
                <Tooltip title="Mark as Closed">
                  <Button
                    styleType="secondary"
                    className="h-8"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenModal(item);
                    }}
                    disabled={updateRiskStatus === 'pending'}
                  >
                    Close
                  </Button>
                </Tooltip>
              </>
            )}
          {/* Exposure Risks */}
          {isRisk && getRiskStatus(item.status) === RiskStatus.ExposedRisks && (
            <>
              <Tooltip title="Mark as Open">
                <Button
                  styleType="primary"
                  className="h-8"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRiskChange(item, RiskStatus.MachineOpen);
                  }}
                  disabled={updateRiskStatus === 'pending'}
                >
                  Mark as Open
                </Button>
              </Tooltip>
              <Tooltip title="Mark as Closed">
                <Button
                  styleType="secondary"
                  className="h-8"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenModal({ ...item, comment: 'Rejected Exposure' });
                  }}
                  disabled={updateRiskStatus === 'pending'}
                >
                  Reject
                </Button>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    );
  };

  const items = useMemo(() => {
    if (data?.assets && data?.assets.length > 0) {
      return data?.assets;
    }
    if (data?.attributes && data?.attributes.length > 0) {
      return data?.attributes;
    }
    if (data?.risks && data?.risks.length > 0) {
      // Exposed Risks
      if (query?.startsWith('name:')) {
        return (data?.risks || []).filter(
          risk => (risk as Risk).status === RiskStatus.ExposedRisks
        );
      } else {
        return data?.risks;
      }
    }
    return [];
  }, [data]);
  const totalAlerts = alerts?.reduce((acc, alert) => acc + alert.count, 0);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 77, // Adjusted size to fit the new layout
    overscan: 5,
  });

  return (
    <div
      className="relative z-10 flex rounded-sm border border-gray-200 bg-white"
      style={{ height: 'calc(100vh - 135px)' }}
    >
      {/* Sidebar */}
      {!hideFilters && (
        <div className="w-1/4 overflow-auto border-r border-gray-200 bg-zinc-50 bg-gradient-to-l px-2 py-4">
          <h2 className="mb-4 flex items-center py-2 text-lg font-medium text-gray-800">
            <Inbox className="ml-3 mr-2 size-8 stroke-[2px] " />
            <span className="mr-2 text-xl font-bold">
              All Alerts{' '}
              {alerts && alerts.length && (
                <span>({totalAlerts?.toLocaleString()})</span>
              )}
            </span>
          </h2>
          {alerts === null && (
            <div className="flex items-center justify-between px-3 italic text-gray-500">
              <p className="text-md select-none font-medium">No alerts found</p>
            </div>
          )}
          <div>
            {(alerts ?? []).map((alert, index) => (
              <div
                key={index}
                className={cn(
                  'flex cursor-pointer items-start p-4 ',
                  query === alert.value
                    ? 'bg-highlight/10 '
                    : ' hover:bg-gray-100'
                )}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  searchParams.set('query', alert.value);
                  setSearchParams(searchParams);
                  handleCategoryClick(alert.value);
                }}
              >
                <div className="flex flex-col space-y-1">
                  <p className="text-md select-none font-medium">
                    {alert.name}
                  </p>

                  <span className="text-xs font-normal text-gray-500">
                    {alert.count} {alert.name.split(' ')[0].toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
            {alerts?.length === 0 && (
              <div
                className="flex cursor-pointer items-center justify-between space-x-2 border-l-[3px] border-brand bg-highlight/10 p-3"
                onClick={() => {
                  searchParams.set('query', '');
                  setSearchParams(searchParams);
                }}
              >
                <p className="text-md select-none font-medium">
                  No alerts found
                </p>
                <span className="text-md font-medium">View Alerts</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {alerts === null && (
          <div className="mt-16 flex flex-1 items-center justify-center">
            <div className="text-center">
              <ShieldCheck className="mx-auto mb-4 size-52 stroke-[1px] text-gray-900" />
              <h3 className="mt-10 text-5xl font-bold text-gray-900">
                {`You're all caught up!`}
              </h3>
              <p className="mt-4 text-lg text-gray-600">
                No alerts to show. Enjoy your peace of mind.
              </p>
            </div>
          </div>
        )}
        {query && (
          <div className="flex h-full flex-col">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>{getAlertDescription(query)}</div>
                {unsubscribeAlert && (
                  <AlertIcon
                    value={[unsubscribeAlert]}
                    currentValue={unsubscribeAlert}
                    styleType="button"
                    onAdd={handleRefetch}
                    onRemove={handleRefetch}
                  />
                )}
              </div>
            </div>
            <div ref={parentRef} className="flex-1 overflow-auto">
              {dataStatus === 'pending' && (
                <>
                  {[...Array(5).keys()].map(index => (
                    <Loader
                      key={index}
                      className="mb-2 h-[77px] w-full"
                      isLoading={true}
                    />
                  ))}
                </>
              )}
              {dataStatus !== 'pending' && (
                <div
                  className="relative"
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                  }}
                >
                  {virtualizer.getVirtualItems().map(virtualItem => (
                    <div
                      key={virtualItem.key}
                      className="absolute left-0 top-0 w-full"
                      style={{
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      {renderItemDetails(items[virtualItem.index])}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <ClosedStateModal
        isOpen={isClosedSubStateModalOpen}
        onClose={() => setIsClosedSubStateModalOpen(false)}
        onStatusChange={({ status }) => {
          if (selectedItem) {
            const newSelectedItem = {
              ...selectedItem,
              comment: selectedItem.comment || status,
            };
            deleteRisk([newSelectedItem]).then(handleRefetch);
            setSelectedItem(null);
          }
        }}
      />
    </div>
  );
};

export default AlertsWrapper;
