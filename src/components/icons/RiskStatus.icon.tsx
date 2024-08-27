import {
  AdjustmentsHorizontalIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@heroicons/react/24/outline';
import { Bot } from 'lucide-react';

import { RiskStatus } from '@/types';
import { cn } from '@/utils/classname';

export const getRiskStatusIcon = (status: RiskStatus, className = 'size-5') => {
  switch (status) {
    case RiskStatus.MachineDeleted:
    case RiskStatus.MachineOpen:
      return <Bot className={className} />;
    case RiskStatus.Triaged:
      return <AdjustmentsHorizontalIcon className={className} />;
    case RiskStatus.Opened:
      return <LockOpenIcon className={className} />;
    case RiskStatus.Remediated:
    default:
      return <LockClosedIcon className={cn('text-default-light', className)} />;
  }
};
