import {
  Bars2Icon,
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

import { RiskSeverity } from '@/types';

export const getRiskSeverityIcon = (
  severity: RiskSeverity,
  className = 'size-5'
) => {
  switch (severity) {
    case RiskSeverity.Critical:
      return <ChevronDoubleUpIcon className={className} />;
    case RiskSeverity.High:
      return <ChevronUpIcon className={className} />;
    case RiskSeverity.Medium:
      return <Bars2Icon className={className} />;
    case RiskSeverity.Low:
      return <ChevronDownIcon className={className} />;
    case RiskSeverity.Info:
    default:
      return <ChevronDoubleDownIcon className={className} />;
  }
};
