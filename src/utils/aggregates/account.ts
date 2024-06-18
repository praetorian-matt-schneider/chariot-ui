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
  countAccountsByMember: {
    label: 'Count accounts by member',
    run: (accounts: Account[]): CountData[] =>
      accounts.map(account => ({
        [aggregates.countAccountsByMember.xField]: account.member,
        [aggregates.countAccountsByMember.yField]: 1,
      })),
    xField: 'member',
    yField: 'count',
  },
  countAccountsByUsername: {
    label: 'Count accounts by username',
    run: (accounts: Account[]): CountData[] =>
      accounts.reduce((acc: CountData[], account) => {
        const existingIndex = acc.findIndex(
          item =>
            item[aggregates.countAccountsByUsername.xField] === account.username
        );
        if (existingIndex !== -1) {
          acc[existingIndex][aggregates.countAccountsByUsername.yField] =
            Number(
              acc[existingIndex][aggregates.countAccountsByUsername.yField]
            ) + 1;
        } else {
          acc.push({
            [aggregates.countAccountsByUsername.xField]: account.username,
            [aggregates.countAccountsByUsername.yField]: 1,
          });
        }
        return acc;
      }, []),
    xField: 'username',
    yField: 'count',
  },
  latestAccountUpdateByMember: {
    label: 'Latest account update by member',
    run: (accounts: Account[]): CountData[] =>
      accounts.reduce((acc: CountData[], account) => {
        const existingIndex = acc.findIndex(
          item =>
            item[aggregates.latestAccountUpdateByMember.xField] ===
            account.member
        );
        if (existingIndex !== -1) {
          if (
            Number(
              acc[existingIndex][aggregates.latestAccountUpdateByMember.yField]
            ) < Number(account.updated)
          ) {
            acc[existingIndex][aggregates.latestAccountUpdateByMember.yField] =
              Number.parseInt(account.updated, 10);
          }
        } else {
          acc.push({
            [aggregates.latestAccountUpdateByMember.xField]: account.member,
            [aggregates.latestAccountUpdateByMember.yField]: Number.parseInt(
              account.updated,
              10
            ),
          });
        }
        return acc;
      }, []),
    xField: 'member',
    yField: 'updated',
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
