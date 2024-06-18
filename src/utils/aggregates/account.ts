import { isFQDN } from 'validator';

import { Account } from '@/types';
export interface CountData {
  [key: string]: string | number; // Adjust this type based on your specific needs
}

interface AggregateDefinition {
  label: string;
  run: (accounts: Account[]) => CountData[];
  xField: string;
  yField: string;
}

interface AggregateCollection {
  [key: string]: AggregateDefinition;
}

const aggregates: AggregateCollection = {
  uniqueDomainNames: {
    label: 'Unique domain names',
    run: (accounts: Account[]): CountData[] =>
      accounts.reduce((acc: CountData[], account) => {
        const domain = account.member.split('@')[1];
        if (!domain || !isFQDN(domain)) {
          return acc; // Skip the counter if domain is empty or not a valid domain
        }
        const existingIndex = acc.findIndex(
          item => item[aggregates.uniqueDomainNames.xField] === domain
        );
        if (existingIndex === -1) {
          acc.push({
            [aggregates.uniqueDomainNames.xField]: domain,
            [aggregates.uniqueDomainNames.yField]: 1,
          });
        } else {
          acc[existingIndex][aggregates.uniqueDomainNames.yField] =
            (acc[existingIndex][
              aggregates.uniqueDomainNames.yField
            ] as number) + 1;
        }
        return acc;
      }, []),
    xField: 'member',
    yField: 'count',
  },
  numberOfAccountsOverTime: {
    label: 'Number of Accounts Over Time',
    run: (accounts: Account[]): CountData[] =>
      accounts
        .reduce((acc: CountData[], account) => {
          const updateDate = account.updated.split('T')[0]; // Extract just the date part
          const existingIndex = acc.findIndex(
            item =>
              item[aggregates.numberOfAccountsOverTime.xField] === updateDate
          );
          if (existingIndex === -1) {
            acc.push({
              [aggregates.numberOfAccountsOverTime.xField]: updateDate,
              [aggregates.numberOfAccountsOverTime.yField]: 1 as number, // Explicitly marking as number
            });
          } else {
            // Ensure we are working with numbers by explicitly casting
            acc[existingIndex][aggregates.numberOfAccountsOverTime.yField] =
              (acc[existingIndex][
                aggregates.numberOfAccountsOverTime.yField
              ] as number) + 1;
          }
          return acc;
        }, [])
        .sort(
          (a, b) =>
            new Date(a[aggregates.numberOfAccountsOverTime.xField]).getTime() -
            new Date(b[aggregates.numberOfAccountsOverTime.xField]).getTime()
        )
        .map((item, index, array) => ({
          ...item,
          [aggregates.numberOfAccountsOverTime.yField]: array
            .slice(0, index + 1)
            .reduce(
              (sum, current) =>
                sum +
                (current[aggregates.numberOfAccountsOverTime.yField] as number),
              0 as number
            ),
        })),
    xField: 'date',
    yField: 'cumulativeAccounts',
  },
};

export const runAggregate = (
  aggregateName: string,
  accounts: Account[]
): CountData[] => {
  if (!(aggregateName in aggregates)) {
    throw new Error(`Aggregate '${aggregateName}' not found`);
  }
  return aggregates[aggregateName].run(accounts);
};

export const getAggregates = (): AggregateCollection => aggregates;
