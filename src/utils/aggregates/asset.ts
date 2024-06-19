import { Asset } from '@/types';

export interface CountData {
  [key: string]: string | number;
}

interface AggregateDefinition {
  label: string;
  run: (assets: Asset[]) => CountData[];
  xField: string;
  yField: string;
}

export interface AggregateCollection {
  [key: string]: AggregateDefinition;
}

const aggregates: AggregateCollection = {
  countAssetsByClass: {
    label: 'Count assets by class',
    run: (assets: Asset[]): CountData[] =>
      assets.reduce((acc: CountData[], asset) => {
        const assetClass = asset.class;
        const existingIndex = acc.findIndex(
          item => item[aggregates.countAssetsByClass.xField] === assetClass
        );
        if (existingIndex === -1) {
          acc.push({
            [aggregates.countAssetsByClass.xField]: assetClass,
            [aggregates.countAssetsByClass.yField]: 1,
          });
        } else {
          acc[existingIndex][aggregates.countAssetsByClass.yField] =
            (acc[existingIndex][
              aggregates.countAssetsByClass.yField
            ] as number) + 1;
        }
        return acc;
      }, []),
    xField: 'class',
    yField: 'count',
  },
  assetsCreatedOverTime: {
    label: 'Assets created over time',
    run: (assets: Asset[]): CountData[] =>
      assets
        .reduce((acc: CountData[], asset) => {
          const createDate = asset.created.split('T')[0]; // Extract just the date part
          const existingIndex = acc.findIndex(
            item => item[aggregates.assetsCreatedOverTime.xField] === createDate
          );
          if (existingIndex === -1) {
            acc.push({
              [aggregates.assetsCreatedOverTime.xField]: createDate,
              [aggregates.assetsCreatedOverTime.yField]: 1 as number, // Explicitly marking as number
            });
          } else {
            acc[existingIndex][aggregates.assetsCreatedOverTime.yField] =
              (acc[existingIndex][
                aggregates.assetsCreatedOverTime.yField
              ] as number) + 1;
          }
          return acc;
        }, [])
        .sort(
          (a, b) =>
            new Date(a[aggregates.assetsCreatedOverTime.xField]).getTime() -
            new Date(b[aggregates.assetsCreatedOverTime.xField]).getTime()
        )
        .map((item, index, array) => ({
          ...item,
          [aggregates.assetsCreatedOverTime.yField]: array
            .slice(0, index + 1)
            .reduce(
              (sum, current) =>
                sum +
                (current[aggregates.assetsCreatedOverTime.yField] as number),
              0 as number
            ),
        })),
    xField: 'date',
    yField: 'cumulativeAssets',
  },
};

export const runAggregate = (
  aggregateName: string,
  assets: Asset[]
): CountData[] => {
  if (!(aggregateName in aggregates)) {
    throw new Error(`Aggregate '${aggregateName}' not found`);
  }
  return aggregates[aggregateName].run(assets);
};

export const getAggregates = (): AggregateCollection => aggregates;
