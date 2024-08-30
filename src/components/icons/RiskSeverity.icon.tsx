import {
  Bars2Icon,
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

import { RiskSeverity, SeverityDef } from '@/types';
import { cn } from '@/utils/classname';

export const getRiskSeverityIcon = (
  severity: RiskSeverity,
  className = 'size-5'
) => {
  switch (severity) {
    case RiskSeverity.Critical:
      return <ChevronDoubleUpIcon className={cn('text-red-800', className)} />;
    case RiskSeverity.High:
      return <ChevronUpIcon className={cn('text-pink-800', className)} />;
    case RiskSeverity.Medium:
      return <Bars2Icon className={cn('text-amber-800', className)} />;
    case RiskSeverity.Low:
      return <ChevronDownIcon className={cn('text-indigo-800', className)} />;
    case RiskSeverity.Info:
    default:
      return (
        <ChevronDoubleDownIcon className={cn('border-gray-200', className)} />
      );
  }
};

export const getSeverityButton = (severity: RiskSeverity) => {
  const textColor = {
    [RiskSeverity.Critical]: 'text-red-800',
    [RiskSeverity.High]: 'text-pink-800',
    [RiskSeverity.Medium]: 'text-amber-800',
    [RiskSeverity.Low]: 'text-indigo-800',
    [RiskSeverity.Info]: 'text-gray-800',
  };
  const borderColor = {
    [RiskSeverity.Critical]: 'border-red-800',
    [RiskSeverity.High]: 'border-pink-800',
    [RiskSeverity.Medium]: 'border-amber-800',
    [RiskSeverity.Low]: 'border-indigo-800',
    [RiskSeverity.Info]: 'border-gray-800',
  };
  const bgColor = {
    [RiskSeverity.Critical]: 'bg-red-100',
    [RiskSeverity.High]: 'bg-pink-100',
    [RiskSeverity.Medium]: 'bg-amber-100',
    [RiskSeverity.Low]: 'bg-indigo-100',
    [RiskSeverity.Info]: 'bg-gray-100',
  };

  return (
    <div
      className={cn(
        'border rounded-sm p-1 pr-2 flex gap-2 items-center text-sm w-fit',
        textColor[severity] || textColor[RiskSeverity.Info],
        borderColor[severity] || borderColor[RiskSeverity.Info],
        bgColor[severity] || bgColor[RiskSeverity.Info]
      )}
    >
      {getRiskSeverityIcon(severity, 'size-4')}
      <span>{SeverityDef[severity]}</span>
    </div>
  );
};
