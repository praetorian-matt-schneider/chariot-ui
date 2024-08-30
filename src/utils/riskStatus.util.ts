import { RiskSeverity, RiskStatus } from '@/types';

export const getRiskStatus = (status: string) => {
  return status.length > 1
    ? (status.slice(0, -1) as RiskStatus)
    : (status as RiskStatus);
};

export const getRiskSeverity = (status: string) => {
  return status.slice(-1) as RiskSeverity;
};
