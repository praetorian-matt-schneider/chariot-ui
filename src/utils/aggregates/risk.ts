import { Risk } from '@/types';

import { AggregateCollection, defineAggregate } from './aggregate';

const getDateFromISO = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString();
};

export const aggregates: AggregateCollection<Risk> = {
  countRisksByClass: defineAggregate<Risk>(
    'Count risks by class',
    risk => risk.class,
    'class',
    'count'
  ),
  countRisksByDate: defineAggregate<Risk>(
    'Count risks updated by date',
    risk => getDateFromISO(risk.updated),
    'date',
    'count'
  ),
};
