import { Seed, SeedStatus } from '@/types';

import {
  AggregateCollection,
  defineAggregate,
  getDateFromISO,
} from './aggregate';

const getStatus = (seed: Seed): string => {
  return seed.status[0] === SeedStatus.Frozen ? 'Frozen' : 'Active';
};

export const aggregates: AggregateCollection<Seed> = {
  countSeedsByStatus: defineAggregate<Seed>(
    'Count seeds by status',
    getStatus,
    'status',
    'count'
  ),
  countSeedsByClass: defineAggregate<Seed>(
    'Count seeds by class',
    seed => seed.class || '', // Return empty string if class is undefined
    'class',
    'count'
  ),
  seedsCreatedOverTime: defineAggregate<Seed>(
    'Seeds created over time',
    seed => getDateFromISO(seed.created),
    'date',
    'count'
  ),
};
