import { RiskSeverity, RiskStatus } from '@/types';

export const getRiskStatus = (status: string) => {
  const slicedStatus = status.slice(0, -1);

  if (Object.values(RiskStatus).includes(slicedStatus as RiskStatus)) {
    return slicedStatus as RiskStatus;
  }

  return status as RiskStatus;
};

export const getRiskSeverity = (status: string) => {
  const slicedSeverity = status.slice(-1);

  if (Object.values(RiskSeverity).includes(slicedSeverity as RiskSeverity)) {
    return slicedSeverity as RiskSeverity;
  }

  return status as RiskSeverity;
};
