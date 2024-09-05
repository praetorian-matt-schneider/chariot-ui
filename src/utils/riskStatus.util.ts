import {
  RiskSeverity,
  RiskStatus,
  RiskStatusWithoutSeverity,
  RiskStatusWithSeverity,
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
  if (isAvailableRiskStatus(status)) {
    return {
      status: getRiskStatus(status),
      severity: getRiskSeverity(status),
    };
  }

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
