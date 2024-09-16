import {
  RiskCombinedStatus,
  RiskSeverity,
  RiskStatus,
  RiskStatusLabel,
  RiskStatusWithoutSeverity,
  RiskStatusWithSeverity,
  SeverityDef,
} from '@/types';

export const isAvailableRiskStatus = (status: string = '') => {
  const availableStatus = [];

  RiskStatusWithSeverity.forEach(status => {
    Object.values(RiskSeverity).forEach(severity => {
      availableStatus.push(`${status}${severity}`);
    });
  });

  availableStatus.push(...RiskStatusWithoutSeverity);

  return availableStatus.includes(status as RiskStatus);
};

const getRiskStatus = (status: string = '') => {
  const slicedStatus = status.length > 1 ? status.slice(0, -1) : status;

  if (Object.values(RiskStatus).includes(slicedStatus as RiskStatus)) {
    return slicedStatus as RiskStatus;
  }

  return status as RiskStatus;
};

const getRiskSeverity = (status: string = '') => {
  const slicedSeverity = status.slice(-1);

  if (Object.values(RiskSeverity).includes(slicedSeverity as RiskSeverity)) {
    return slicedSeverity as RiskSeverity;
  }

  return status as RiskSeverity;
};

export const getRiskStatusLabel = (riskStatus: RiskCombinedStatus = '') => {
  const status = getRiskStatus(riskStatus);
  const severity = getRiskSeverity(riskStatus);

  return {
    status,
    severity,
    statusLabel: RiskStatusLabel[status] || status,
    severityLabel: SeverityDef[severity] || severity,
  };
};
