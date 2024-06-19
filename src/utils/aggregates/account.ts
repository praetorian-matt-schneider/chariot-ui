import { isFQDN } from 'validator';

import { Account } from '@/types';

import { defineAggregate } from './aggregate';

const getDomainFromEmail = (email: string): string => {
  const domain = email.split('@')[1];
  return isFQDN(domain) ? domain : '';
};

const getFormattedDate = (isoDate: string): string => {
  return isoDate.split('T')[0];
};

export const aggregates = {
  uniqueDomainNames: defineAggregate<Account>(
    'Unique domain names',
    account => getDomainFromEmail(account.member),
    'member',
    'count'
  ),
  numberOfAccountsOverTime: defineAggregate<Account>(
    'Number of Accounts Over Time',
    account => getFormattedDate(account.updated),
    'date',
    'cumulativeAccounts'
  ),
};
