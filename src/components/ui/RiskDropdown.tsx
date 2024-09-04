import { forwardRef, useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  Bars2Icon,
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@heroicons/react/24/outline';

import { Chip } from '@/components/Chip';
import { Dropdown } from '@/components/Dropdown';
import { ClosedStateModal } from '@/components/ui/ClosedStateModal';
import { useBulkUpdateRisk, useDeleteRisk } from '@/hooks/useRisks';
import { Risk, RiskStatus, RiskStatusLabel, SeverityDef } from '@/types';
import { cn } from '@/utils/classname';
import { getSeverityClass } from '@/utils/getSeverityClass.util';
import { getStatusSeverity } from '@/utils/riskStatus.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { useSearchParams } from '@/utils/url.util';

interface Props {
  risk: Pick<Risk, 'status' | 'key' | 'comment'>;
  className?: string;
  type?: 'status' | 'severity';
  selectedRowsData?: Risk[];
  styleType?: 'chip';
}

export const riskStatusOptions = [
  {
    label: RiskStatusLabel[RiskStatus.Triaged],
    value: RiskStatus.Triaged,
    icon: <AdjustmentsHorizontalIcon className="size-4 stroke-2" />,
  },
  {
    label: 'Open',
    value: RiskStatus.Opened,
    icon: <LockOpenIcon className="size-4 stroke-2" />,
  },
  {
    label: 'Closed',
    value: RiskStatus.Remediated,
    icon: <LockClosedIcon className="size-4 stroke-2" />,
  },
];

export const riskSeverityOptions = [
  {
    label: 'Critical',
    value: 'C',
    icon: <ChevronDoubleUpIcon className="size-4 stroke-2" />,
  },
  {
    label: 'High',
    value: 'H',
    icon: <ChevronUpIcon className="size-4 stroke-2" />,
  },
  {
    label: 'Medium',
    value: 'M',
    icon: <Bars2Icon className="size-4 stroke-2" />,
  },
  {
    label: 'Low',
    value: 'L',
    icon: <ChevronDownIcon className="size-4 stroke-2" />,
  },
  {
    label: 'Info',
    value: 'I',
    icon: <ChevronDoubleDownIcon className="size-4" />,
  },
];

export const RiskDropdown = forwardRef<HTMLButtonElement, Props>(
  function RiskDropdown(
    { risk, className, type = 'severity', selectedRowsData, styleType }: Props,
    ref
  ) {
    const [isClosedSubStateModalOpen, setIsClosedSubStateModalOpen] =
      useState(false);

    const { handleUpdate: updateRisk } = useBulkUpdateRisk();
    const { mutate: deleteRisk } = useDeleteRisk();
    const { removeSearchParams } = useSearchParams();

    const data =
      selectedRowsData && selectedRowsData.length > 1
        ? selectedRowsData
        : [risk];

    const generalChipClass = 'inline-flex min-h-[26px] py-1 whitespace-nowrap';

    const { status: riskStatusKey, severity: riskSeverityKey } =
      getStatusSeverity(risk.status);

    const statusLabel = RiskStatusLabel[riskStatusKey] || riskStatusKey;
    const severityLabel = SeverityDef[riskSeverityKey] || riskSeverityKey;

    function handleStatusChange({
      status,
      severity,
      comment,
    }: {
      status?: RiskStatus;
      severity?: string;
      comment?: string;
    }) {
      updateRisk({
        selectedRows: data as Risk[],
        status,
        severity,
        comment,
      });
    }

    function handleDeleteRisk({ status }: { status: string }) {
      const updatedData = data.map(data => ({
        ...data,
        comment: status,
      }));
      deleteRisk(updatedData);
      removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY);
    }

    if (styleType === 'chip') {
      return type === 'status' ? (
        <Chip className={cn(generalChipClass, className)} style="default">
          {statusLabel}
        </Chip>
      ) : (
        <Chip
          className={cn(
            generalChipClass,
            getSeverityClass(riskSeverityKey),
            className
          )}
        >
          {severityLabel}
        </Chip>
      );
    }

    if (type === 'status') {
      return (
        <>
          <Dropdown
            className={`min-w-32 justify-start rounded-[2px] border border-default py-1 ${className}`}
            menu={{
              items: riskStatusOptions,
              onClick: value => {
                if (value) {
                  if (value === RiskStatus.Remediated) {
                    setIsClosedSubStateModalOpen(true);
                  } else {
                    handleStatusChange({ status: value as RiskStatus });
                  }
                }
              },
            }}
            startIcon={
              riskStatusOptions.find(option => option.value === riskStatusKey)
                ?.icon ?? <LockClosedIcon className="size-4 stroke-2" />
            }
            endIcon={<ChevronDownIcon className="text-defualt size-3" />}
            onClick={event => event.stopPropagation()}
          >
            <div className="flex-1 text-left">{statusLabel}</div>
          </Dropdown>

          <ClosedStateModal
            isOpen={isClosedSubStateModalOpen}
            onClose={() => setIsClosedSubStateModalOpen(false)}
            onStatusChange={handleDeleteRisk}
          />
        </>
      );
    }

    return (
      <Dropdown
        className={`border-1 min-w-28 justify-between rounded-[2px] border border-default py-1 pr-2 ${className}`}
        menu={{
          items: riskSeverityOptions,
          onClick: value => {
            if (value) {
              handleStatusChange({ severity: value });
            }
          },
        }}
        startIcon={
          riskSeverityOptions.find(option => option.value === riskSeverityKey)
            ?.icon
        }
        endIcon={<ChevronDownIcon className="size-3 text-default-light" />}
        onClick={event => event.stopPropagation()}
        ref={ref}
      >
        <div className="flex-1 text-left">{severityLabel}</div>
      </Dropdown>
    );
  }
);

export const riskStatusFilterOptions = Object.values(RiskStatus).map(
  riskStatus => {
    return {
      label: RiskStatusLabel[riskStatus],
      value: riskStatus,
    };
  }
);
