import { Dispatch, SetStateAction, useState } from 'react';
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
import { Risk, RiskCombinedStatus, RiskStatus, RiskStatusLabel } from '@/types';
import { cn } from '@/utils/classname';
import { getSeverityClass } from '@/utils/getSeverityClass.util';
import { getRiskStatusLabel } from '@/utils/riskStatus.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { useSearchParams } from '@/utils/url.util';

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

const RISK_DROPDOWN_CLASS =
  'border-1 min-w-28 justify-between rounded-[2px] border border-default py-1 pr-2';

interface Props {
  risk: Risk;
  combinedStatus: RiskCombinedStatus;
  setCombinedStatus: Dispatch<SetStateAction<RiskCombinedStatus>>;
}

export const RiskDropdown = ({
  risk,
  combinedStatus,
  setCombinedStatus,
}: Props) => {
  const { removeSearchParams } = useSearchParams();
  const { status, severity, statusLabel, severityLabel } =
    getRiskStatusLabel(combinedStatus);

  const [isClosedSubStateModalOpen, setIsClosedSubStateModalOpen] =
    useState(false);

  return (
    <div className="mb-4 flex items-start gap-3">
      {/* Severity */}
      <Dropdown
        className={cn(RISK_DROPDOWN_CLASS, getSeverityClass(severity || ''))}
        menu={{
          items: riskSeverityOptions,
          onClick: value =>
            setCombinedStatus(`${status}${value || ''}` as RiskCombinedStatus),
        }}
        startIcon={
          riskSeverityOptions.find(option => option.value === severity)?.icon
        }
        endIcon={<ChevronDownIcon className="size-3 text-default-light" />}
        onClick={event => event.stopPropagation()}
      >
        <div className="flex-1 text-left">{severityLabel}</div>
      </Dropdown>

      {/* Status */}
      <Dropdown
        className={RISK_DROPDOWN_CLASS}
        menu={{
          items: riskStatusOptions,
          onClick: value => {
            if (value) {
              if (value === RiskStatus.Remediated) {
                setIsClosedSubStateModalOpen(true);
              } else {
                setCombinedStatus(`${value}${severity}`);
              }
            }
          },
        }}
        startIcon={
          riskStatusOptions.find(option => option.value === status)?.icon ?? (
            <LockClosedIcon className="size-4 stroke-2" />
          )
        }
        endIcon={<ChevronDownIcon className="size-3 text-default-light" />}
        onClick={event => event.stopPropagation()}
      >
        <div className="flex-1 text-left">{statusLabel}</div>
      </Dropdown>
      <ClosedStateModal
        risk={risk}
        isOpen={isClosedSubStateModalOpen}
        onClose={() => {
          setIsClosedSubStateModalOpen(false);
          removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY);
        }}
      />
    </div>
  );
};

export const RiskLabel = ({
  status: riskStatus,
  type,
}: {
  status: RiskCombinedStatus;
  type: 'status' | 'severity';
}) => {
  const CLASS = 'inline-flex min-h-[26px] py-1 whitespace-nowrap';
  const { severity, statusLabel, severityLabel } =
    getRiskStatusLabel(riskStatus);

  return type === 'status' ? (
    <Chip className={CLASS} style="default">
      {statusLabel}
    </Chip>
  ) : (
    <Chip className={cn(CLASS, getSeverityClass(severity))}>
      {severityLabel}
    </Chip>
  );
};

export const riskStatusFilterOptions = Object.values(RiskStatus).map(
  riskStatus => {
    return {
      label: RiskStatusLabel[riskStatus],
      value: riskStatus,
    };
  }
);
