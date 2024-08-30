import { RiskSeverity, RiskStatus } from '@/types';

export const getRiskStatus = (status: string) => {
  // TODO : Confirm the logic
  return status.slice(0, -1) in RiskStatus
    ? (status.slice(0, -1) as RiskStatus)
    : (status as RiskStatus);
};

export const getRiskSeverity = (status: string) => {
  return status.slice(-1) in RiskSeverity
    ? (status.slice(-1) as RiskSeverity)
    : RiskSeverity.Info;
};
