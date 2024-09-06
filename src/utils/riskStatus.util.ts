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

export const getStatusSeverity = (status: string = '') => {
  // Check if status is without severity like MO / MD / E
  if (RiskStatusWithoutSeverity.includes(status as RiskStatus)) {
    return {
      status: status as RiskStatus,
      severity: '' as RiskSeverity,
    };
  }
  // Check if status is with severity: combination of T, O, R with severity I, L, M, H, C
  if (isAvailableRiskStatus(status)) {
    return {
      status: getRiskStatus(status),
      severity: getRiskSeverity(status),
    };
  }
  // If these are deprecated status with severity in the middle
  return {
    status: `${status[0]}${status[2] || ''}` as RiskStatus,
    severity: (status[1] || '') as RiskSeverity,
  };
};

export const getRiskStatus = (status: string = '') => {
  const slicedStatus = status.slice(0, -1);

  if (Object.values(RiskStatus).includes(slicedStatus as RiskStatus)) {
    return slicedStatus as RiskStatus;
  }

  return status as RiskStatus;
};

export const getRiskSeverity = (status: string = '') => {
  const slicedSeverity = status.slice(-1);

  if (Object.values(RiskSeverity).includes(slicedSeverity as RiskSeverity)) {
    return slicedSeverity as RiskSeverity;
  }

  return status as RiskSeverity;
};

export const getRiskStatusLabel = (riskStatus: RiskCombinedStatus = '') => {
  const { status, severity } = getStatusSeverity(riskStatus);

  return {
    status,
    severity,
    statusLabel: RiskStatusLabel[status] || status,
    severityLabel: SeverityDef[severity] || severity,
  };
};
