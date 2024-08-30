import { RiskSeverity, RiskStatus } from '@/types';

export const getRiskStatus = (status: string) => {
  // TODO : Confirm the logic
  return [
    RiskStatus.MachineOpen,
    RiskStatus.MachineDeleted,
    RiskStatus.ExposedRisks,
  ].includes(status as RiskStatus)
    ? (status as RiskStatus)
    : (status.slice(0, -1) as RiskStatus);
};

export const getRiskSeverity = (status: string) => {
  return status.slice(-1) as RiskSeverity;
};
