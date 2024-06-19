import { Seed, SeedStatus } from '@/types';

export interface CountData {
  [key: string]: string | number;
}

interface AggregateDefinition {
  label: string;
  run: (seeds: Seed[]) => CountData[];
  xField: string;
  yField: string;
}

export interface AggregateCollection {
  [key: string]: AggregateDefinition;
}

const getDateFromISO = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toISOString().split('T')[0]; // Extract just the date part
};

const aggregates: AggregateCollection = {
  countSeedsByStatus: {
    label: 'Count seeds by status',
    run: (seeds: Seed[]): CountData[] =>
      seeds.reduce((acc: CountData[], seed) => {
        const status =
          seed.status[0] === SeedStatus.Frozen ? 'Frozen' : 'Active';
        const existingIndex = acc.findIndex(
          item => item[aggregates.countSeedsByStatus.xField] === status
        );
        if (existingIndex === -1) {
          acc.push({
            [aggregates.countSeedsByStatus.xField]: status,
            [aggregates.countSeedsByStatus.yField]: 1,
          });
        } else {
          acc[existingIndex][aggregates.countSeedsByStatus.yField] =
            (acc[existingIndex][
              aggregates.countSeedsByStatus.yField
            ] as number) + 1;
        }
        return acc;
      }, []),
    xField: 'status',
    yField: 'count',
  },
  countSeedsByClass: {
    label: 'Count seeds by class',
    run: (seeds: Seed[]): CountData[] =>
      seeds.reduce((acc: CountData[], seed) => {
        const seedClass = seed.class;
        if (!seedClass) {
          return acc; // Skip if class is empty
        }
        const existingIndex = acc.findIndex(
          item => item[aggregates.countSeedsByClass.xField] === seedClass
        );
        if (existingIndex === -1) {
          acc.push({
            [aggregates.countSeedsByClass.xField]: seedClass,
            [aggregates.countSeedsByClass.yField]: 1,
          });
        } else {
          acc[existingIndex][aggregates.countSeedsByClass.yField] =
            Number(acc[existingIndex][aggregates.countSeedsByClass.yField]) + 1;
        }
        return acc;
      }, []),
    xField: 'class',
    yField: 'count',
  },
  seedsCreatedOverTime: {
    label: 'Seeds created over time',
    run: (seeds: Seed[]): CountData[] => {
      const counts: CountData[] = [];

      seeds.forEach(seed => {
        const createDate = getDateFromISO(seed.created);
        const existingIndex = counts.findIndex(
          item => item[aggregates.seedsCreatedOverTime.xField] === createDate
        );
        if (existingIndex === -1) {
          counts.push({
            [aggregates.seedsCreatedOverTime.xField]: createDate,
            [aggregates.seedsCreatedOverTime.yField]: 1,
          });
        } else {
          counts[existingIndex][aggregates.seedsCreatedOverTime.yField] =
            Number(
              counts[existingIndex][aggregates.seedsCreatedOverTime.yField]
            ) + 1;
        }
      });

      // Sort counts by date ascending
      counts.sort(
        (a, b) =>
          new Date(a[aggregates.seedsCreatedOverTime.xField]).getTime() -
          new Date(b[aggregates.seedsCreatedOverTime.xField]).getTime()
      );

      return counts;
    },
    xField: 'date',
    yField: 'count',
  },
};

export const runAggregate = (
  aggregateName: string,
  seeds: Seed[]
): CountData[] => {
  if (!(aggregateName in aggregates)) {
    throw new Error(`Aggregate '${aggregateName}' not found`);
  }
  return aggregates[aggregateName].run(seeds);
};

export const getAggregates = (): AggregateCollection => aggregates;
