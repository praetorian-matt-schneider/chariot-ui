import { Risk } from '@/types';

export interface CountData {
  [key: string]: string | number; // Adjust this type based on your specific needs
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
            Number(acc[existingIndex][aggregates.countRisksByClass.yField]) + 1;
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
  latestRiskUpdateByDNS: {
    label: 'Latest risk update by DNS',
    run: (risks: Risk[]): CountData[] =>
      risks.reduce((acc: CountData[], risk) => {
        const existingIndex = acc.findIndex(
          item => item[aggregates.latestRiskUpdateByDNS.xField] === risk.dns
        );
        if (existingIndex !== -1) {
          if (
            Number(
              acc[existingIndex][aggregates.latestRiskUpdateByDNS.yField]
            ) < Number(risk.updated)
          ) {
            acc[existingIndex][aggregates.latestRiskUpdateByDNS.yField] =
              Number(risk.updated);
          }
        } else {
          acc.push({
            [aggregates.latestRiskUpdateByDNS.xField]: risk.dns,
            [aggregates.latestRiskUpdateByDNS.yField]: Number(risk.updated),
          });
        }
        return acc;
      }, []),
    xField: 'dns',
    yField: 'lastUpdate',
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
