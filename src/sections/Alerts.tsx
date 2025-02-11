import React, { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { getSeverityButton } from '@/components/icons/RiskSeverity.icon';
import { Loader } from '@/components/Loader';
import { Tooltip } from '@/components/Tooltip';
import { ClosedStateModal } from '@/components/ui/ClosedStateModal';
import { useDeleteAsset, useUpdateAsset } from '@/hooks/useAssets';
import { useUpdateRisk } from '@/hooks/useRisks';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { Empty } from '@/sections/Empty';
import { SingularAlertDescriptions } from '@/sections/RisksBeta';
import {
  Asset,
  AssetStatus,
  AssetStatusLabel,
  Attribute,
  Condition,
  Risk,
  RiskSeverity,
  RiskStatus,
} from '@/types';
import { getAlertName } from '@/utils/alert.util';
import { QueryStatus } from '@/utils/api';
import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';
import { getRiskStatusLabel } from '@/utils/riskStatus.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { useSearchParams as useSearchParamsUtil } from '@/utils/url.util';

type AlertType = Asset | Risk | Attribute;

const isAssetFn = (item: AlertType): item is Asset =>
  item.key?.startsWith('#asset#');

const isRiskFn = (item: AlertType): item is Risk =>
  item.key?.startsWith('#risk#');

interface Props {
  items: AlertType[];
  status: QueryStatus;
  refetch: (message?: string) => void;
}

export const Alerts: React.FC<Props> = ({
  refetch,
  status: dataStatus,
  items,
}: Props) => {
  const { getRiskDrawerLink, getAssetDrawerLink } = getDrawerLink();
  const navigate = useNavigate();

  function handleRefetch(message?: string) {
    refetch(message);
  }

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
          {isRisk &&
            getSeverityButton(getRiskStatusLabel(item.status).severity)}
          {(isAsset || isRisk) && (
            <div className="flex flex-1 items-center space-x-3 overflow-hidden">
              <div className="flex w-full flex-col overflow-hidden">
                <Tooltip title={item.name ?? (isAsset ? item.dns : item.key)}>
                  <span className="truncate text-base font-semibold text-indigo-500">
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
                Identified {formatDate(item.updated)}
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
        <AlertAction item={item} handleRefetch={handleRefetch} />
      </div>
    );
  };

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => document.getElementById('body'),
    estimateSize: () => 77, // Adjusted size to fit the new layout
    overscan: 5,
  });

  return (
    <div className="flex size-full bg-white">
      <div className="flex size-full flex-col">
        <div className="flex-1 overflow-auto">
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
          {dataStatus !== 'pending' && items.length > 0 && (
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
          {dataStatus !== 'pending' && items.length === 0 && <Empty />}
        </div>
      </div>
    </div>
  );
};

export const AlertAction = ({
  item,
  handleRefetch,
  showQuestionTooltip,
  extraAction,
}: {
  item: AlertType;
  handleRefetch: (message?: string) => void;
  showQuestionTooltip?: boolean;
  extraAction?: ReactNode;
}) => {
  const isAsset = isAssetFn(item);
  const isRisk = isRiskFn(item);
  const riskStatus = getRiskStatusLabel((item as Risk)?.status).status;

  const { removeSearchParams } = useSearchParamsUtil();
  const [isClosedSubStateModalOpen, setIsClosedSubStateModalOpen] =
    useState(false);
  const [selectedItem, setSelectedItem] = useState<Risk | null>(null);

  const { mutateAsync: updateAsset, status: updateAssetStatus } =
    useUpdateAsset();

  const { mutateAsync: deleteAsset, status: deleteAssetStatus } =
    useDeleteAsset();
  const { mutateAsync: updateRisk, status: updateRiskStatus } = useUpdateRisk();

  function handleAssetChange(asset: Asset, status: AssetStatus) {
    updateAsset({
      key: asset.key,
      name: asset.name,
      status,
      showSnackbar: true,
    }).then(() =>
      handleRefetch(
        `Asset ${asset.name} status updated to ${AssetStatusLabel[status]}.`
      )
    );
  }

  const securityAlertLookup = (status: string) => {
    switch (status) {
      case 'O':
        return 'Requires Remediation';
      case 'R':
        return 'Remediated';
      case 'T':
        return 'Pending Triage';
      default:
        return status;
    }
  };

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
      const sentence = `${risk.name} has been moved to ${securityAlertLookup(status)}.`;
      handleRefetch(sentence);
    });
  }

  const handleOpenModal = (item: Risk) => {
    setSelectedItem(item);
    setIsClosedSubStateModalOpen(true);
  };

  const description =
    showQuestionTooltip &&
    (isAsset || isRisk) &&
    SingularAlertDescriptions[riskStatus];

  return (
    <div className="flex flex-col gap-1">
      {description && (
        <div className="text-base text-gray-500">{description}</div>
      )}
      <div className="flex gap-2">
        <ClosedStateModal
          risk={selectedItem as Risk}
          isOpen={isClosedSubStateModalOpen}
          onClose={() => {
            setIsClosedSubStateModalOpen(false);
          }}
          onSuccess={message => {
            setIsClosedSubStateModalOpen(false);
            setSelectedItem(null);
            removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY);
            handleRefetch(message);
          }}
        />
        {isAsset && item.status === AssetStatus.ActiveLow && (
          <>
            <Tooltip placement="top" title="Enable Risk Scanning">
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
                Yes
              </Button>
            </Tooltip>
            <Tooltip placement="top" title="Delete the Asset">
              <Button
                styleType="secondary"
                className="h-8"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  deleteAsset({
                    key: item.key,
                    name: item.name,
                  }).then(() => handleRefetch(`Asset ${item.name} deleted.`));
                }}
                disabled={deleteAssetStatus === 'pending'}
              >
                No
              </Button>
            </Tooltip>
          </>
        )}
        {isRisk && riskStatus === RiskStatus.Triaged && (
          <>
            <Tooltip placement="top" title="Open the Risk">
              <Button
                styleType="primary"
                className="h-8"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRiskChange(
                    item,
                    RiskStatus.Opened,
                    getRiskStatusLabel(item.status).severity
                  );
                }}
                disabled={updateRiskStatus === 'pending'}
              >
                Yes
              </Button>
            </Tooltip>
            <Tooltip placement="top" title="Close the Risk">
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
                No
              </Button>
            </Tooltip>
          </>
        )}
        {isRisk && riskStatus === RiskStatus.MachineDeleted && (
          <>
            <Tooltip placement="top" title="Close the Risk">
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
                Yes
              </Button>
            </Tooltip>
            <Tooltip placement="top" title="Open the Risk">
              <Button
                styleType="secondary"
                className="h-8"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRiskChange(
                    item,
                    RiskStatus.Opened,
                    getRiskStatusLabel(item.status).severity
                  );
                }}
                disabled={updateRiskStatus === 'pending'}
              >
                No
              </Button>
            </Tooltip>
          </>
        )}
        {isRisk && riskStatus === RiskStatus.MachineOpen && (
          <>
            <Tooltip placement="top" title="Open the Risk">
              <Button
                styleType="primary"
                className="h-8"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRiskChange(
                    item,
                    RiskStatus.Opened,
                    getRiskStatusLabel(item.status).severity
                  );
                }}
                disabled={updateRiskStatus === 'pending'}
              >
                Yes
              </Button>
            </Tooltip>
            <Tooltip placement="top" title="Close the Risk">
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
                No
              </Button>
            </Tooltip>
          </>
        )}
        {isRisk && riskStatus === RiskStatus.Opened && (
          <>
            <Tooltip placement="top" title="Close the Risk">
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
                Yes
              </Button>
            </Tooltip>
          </>
        )}
        {/* Exposure Risks */}
        {isRisk && riskStatus === RiskStatus.ExposedRisks && (
          <>
            <Tooltip placement="top" title="Open the Risk">
              <Button
                styleType="primary"
                className="h-8"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRiskChange(item, RiskStatus.Opened, RiskSeverity.Low);
                }}
                disabled={updateRiskStatus === 'pending'}
              >
                Yes
              </Button>
            </Tooltip>
            <Tooltip placement="top" title="Close the Risk">
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
                No
              </Button>
            </Tooltip>
          </>
        )}
        {extraAction}
      </div>
    </div>
  );
};

const spinnerStyle = {
  width: '20px',
  height: '20px',
  border: '2px solid #f3f3f3',
  borderTop: '2px solid #3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const spinnerKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const AlertButton = ({
  attributeKey,
  alerts,
  refetch,
  addAlert,
  removeAlert,
  label,
}: {
  attributeKey: string;
  alerts: Condition[];
  refetch: () => void;
  addAlert: (alert: Pick<Condition, 'value' | 'name'>) => void;
  removeAlert: (alert: Pick<Condition, 'key'>) => void;
  label: string;
}) => {
  const alertName: string = getAlertName(attributeKey);

  const isAlerting = alerts.some(alert => alert.value === alertName);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);

    if (isAlerting) {
      await removeAlert({
        key: `#condition#${alertName}`,
      });
    } else {
      await addAlert({
        value: alertName,
        name: alertName,
      });
    }
    refetch();
    setIsUpdating(false);
  };

  return (
    <label
      className="space-between flex w-full cursor-pointer items-center justify-between p-2 font-semibold"
      onClick={handleToggle}
    >
      <p>{label}</p>
      <div className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={isAlerting}
          readOnly
        />
        <div className="relative h-6 w-11 rounded-full  bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand dark:border-gray-600 dark:bg-gray-700">
          {isUpdating && (
            <div
              style={spinnerStyle}
              className={cn(
                ' z-20 absolute top-[2px]',
                isAlerting ? 'right-[2px]' : 'left-[2px]'
              )}
            >
              <style>{spinnerKeyframes}</style>
            </div>
          )}
        </div>
      </div>
    </label>
  );
};

export const AlertCategory = ({
  title,
  icon,
  items,
  alerts,
  refetch,
  addAlert,
  removeAlert,
  attributeExtractor,
}: {
  title: string;
  icon: JSX.Element;
  items: string[];
  alerts: Condition[];
  refetch: () => void;
  addAlert: (alert: Pick<Condition, 'value' | 'name'>) => void;
  removeAlert: (alert: Pick<Condition, 'key'>) => void;
  attributeExtractor: (item: string) => string;
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item =>
    attributeExtractor(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewAlert = () => {
    setSearchTerm('');
    const alert = `exposure-${title.toLowerCase()}-${searchTerm}`;
    addAlert({
      value: alert,
      name: alert,
    });
    refetch();
  };

  return (
    <div className="border-default-dark flex w-full flex-col border border-dashed bg-white p-4">
      <div className="flex items-center justify-center">{icon}</div>
      <p className="mb-2 text-center text-2xl font-bold">{title}</p>
      <Input
        name={`${title.toLowerCase()}Search`}
        placeholder={`Search ${title.toLowerCase()}...`}
        className="mb-4 w-full rounded-sm bg-gray-200 p-2 text-lg"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      {filteredItems.map(attributeKey => (
        <AlertButton
          key={attributeKey}
          attributeKey={attributeKey}
          alerts={alerts}
          refetch={refetch}
          addAlert={addAlert}
          removeAlert={removeAlert}
          label={
            attributeKey === '#attribute#new#asset'
              ? 'Last 24 hours'
              : attributeExtractor(attributeKey)?.length > 0
                ? attributeExtractor(attributeKey)
                : attributeKey
          }
        />
      ))}
      {searchTerm && (
        <button
          onClick={handleNewAlert}
          className="mb-2 flex w-full items-center justify-between rounded-lg border border-dashed border-brand p-3 text-brand transition-colors hover:bg-brand hover:text-white"
        >
          <p className="font-semibold">{searchTerm}</p>
          <PlusIcon className="size-5" />
        </button>
      )}
      {filteredItems.length === 0 && (
        <p className="text-sm italic text-gray-500">
          No {title.toLowerCase()}s found
        </p>
      )}
    </div>
  );
};
