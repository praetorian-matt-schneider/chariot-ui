import { Risk } from '@/types';

export interface CountData {
  [key: string]: string | number;
}

interface AggregateDefinition {
  label: string;
  run: (risks: Risk[]) => CountData[];
  xField: string;
  yField: string;
}

interface AggregateCollection {
  [key: string]: AggregateDefinition;
}

const getDateFromISO = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString();
};

const aggregates: AggregateCollection = {
  countRisksByClass: {
    label: 'Count risks by class',
    run: (risks: Risk[]): CountData[] =>
      risks.reduce((acc: CountData[], risk) => {
        const existingIndex = acc.findIndex(
          item => item[aggregates.countRisksByClass.xField] === risk.class
        );
        if (existingIndex !== -1) {
          acc[existingIndex][aggregates.countRisksByClass.yField] =
            (acc[existingIndex][
              aggregates.countRisksByClass.yField
            ] as number) + 1;
        } else {
          acc.push({
            [aggregates.countRisksByClass.xField]: risk.class,
            [aggregates.countRisksByClass.yField]: 1,
          });
        }
        return acc;
      }, []),
    xField: 'class',
    yField: 'count',
  },
  countRisksByDate: {
    label: 'Count risks updated by date',
    run: (risks: Risk[]): CountData[] => {
      const counts: CountData[] = [];

      risks.forEach(risk => {
        const date = getDateFromISO(risk.updated);
        const existingIndex = counts.findIndex(
          item => item[aggregates.countRisksByDate.xField] === date
        );
        if (existingIndex !== -1) {
          counts[existingIndex][aggregates.countRisksByDate.yField] =
            (counts[existingIndex][
              aggregates.countRisksByDate.yField
            ] as number) + 1;
        } else {
          counts.push({
            [aggregates.countRisksByDate.xField]: date,
            [aggregates.countRisksByDate.yField]: 1,
          });
        }

        if (risk.history) {
          risk.history.forEach(update => {
            const historyDate = getDateFromISO(update.updated);
            const existingHistoryIndex = counts.findIndex(
              item => item[aggregates.countRisksByDate.xField] === historyDate
            );
            if (existingHistoryIndex !== -1) {
              counts[existingHistoryIndex][aggregates.countRisksByDate.yField] =
                (counts[existingHistoryIndex][
                  aggregates.countRisksByDate.yField
                ] as number) + 1;
            } else {
              counts.push({
                [aggregates.countRisksByDate.xField]: historyDate,
                [aggregates.countRisksByDate.yField]: 1,
              });
            }
          });
        }
      });

      // Sort counts by date ascending
      counts.sort(
        (a, b) =>
          new Date(a[aggregates.countRisksByDate.xField]).getTime() -
          new Date(b[aggregates.countRisksByDate.xField]).getTime()
      );

      return counts;
    },
    xField: 'date',
    yField: 'count',
  },
};

export const runAggregate = (
  aggregateName: string,
  risks: Risk[]
): CountData[] => {
  if (!(aggregateName in aggregates)) {
    throw new Error(`Aggregate '${aggregateName}' not found`);
  }
  return aggregates[aggregateName].run(risks);
};

export const getAggregates = (): AggregateCollection => aggregates;
