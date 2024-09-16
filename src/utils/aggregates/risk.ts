import { Risk, RiskStatusLabel } from '@/types';
import {
  AggregateCollection,
  defineAggregate,
} from '@/utils/aggregates/aggregate';
import { getRiskStatusLabel } from '@/utils/riskStatus.util';

const getDateFromISO = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString();
};

/* 
  See the following link for more information on how to add new charts:
  https://github.com/praetorian-inc/chariot-ui?tab=readme-ov-file#adding-new-charts
*/
const riskStatus = (statusAndSeverity: string): string => {
  const status = getRiskStatusLabel(statusAndSeverity).status;
  return RiskStatusLabel[status];
};

const riskSeverity = (status: string): string => {
  switch (status[1]) {
    case 'C':
      return 'Critical';
    case 'H':
      return 'High';
    case 'M':
      return 'Medium';
    case 'L':
      return 'Low';
    case 'I':
      return 'Info';
    default:
      return 'Unknown';
  }
};

export const aggregates: AggregateCollection<Risk> = {
  countRisksByDate: defineAggregate<Risk>(
    'Count risks updated by date',
    risk => getDateFromISO(risk.updated),
    'date',
    'count'
  ),
  countRisksByStatus: defineAggregate<Risk>(
    'Count risks by status',
    risk => riskStatus(risk.status),
    'status',
    'count'
  ),
  countRisksBySeverity: defineAggregate<Risk>(
    'Count risks by severity',
    risk => riskSeverity(risk.status),
    'severity',
    'count'
  ),
};
