import React, { useState } from 'react';
import { ChevronRightIcon, UserMinusIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/Button';
import { OverflowText } from '@/components/OverflowText';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { InviteUser } from '@/components/ui/InviteUser';
import { useModifyAccount, useMy } from '@/hooks';
import { useGetPrimaryEmail } from '@/hooks/useAccounts';
import { Integrations } from '@/sections/overview/Integrations';
import { useAuth } from '@/state/auth';
import { Account } from '@/types';
import { useMergeStatus } from '@/utils/api';

const isAccount = (account: Account): boolean => {
  return account?.key === 'self';
};

export const Users: React.FC = () => {
  const { friend } = useAuth();
  const { mutate: unlink } = useModifyAccount('unlink');

  const {
    data: accounts,
    status: accountsStatus,
    error,
  } = useMy({ resource: 'account' });

  const { data: primaryEmail, status: primaryEmailStatus } =
    useGetPrimaryEmail();

  const users = [
    {
      username: friend || primaryEmail,
      member: friend || primaryEmail,
      name: friend || primaryEmail,
      updated: '',
      config: {},
      key: 'self',
    },
    ...(accounts || []).filter(
      account =>
        !(account.member in Integrations) &&
        account.member !== account.username &&
        account.member.includes('@')
    ),
  ];

  const [showInviteModal, setShowInviteModal] = useState(false);

  const columns: Columns<Account> = [
    {
      label: 'User',
      id: 'member',
      className: 'w-full',
      cell: account =>
        isAccount(account) ? (
          <span className="cursor-not-allowed pt-2 text-disabled">
            <OverflowText text={account?.config?.displayName ?? account.name} />
          </span>
        ) : (
          <OverflowText text={account?.config?.displayName ?? account.member} />
        ),
    },
    {
      label: 'Role',
      id: 'member',
      fixedWidth: 150,
      cell: (account: Account) =>
        isAccount(account) ? (
          <span className="cursor-not-allowed text-disabled">Account</span>
        ) : (
          'Collaborator'
        ),
    },
    {
      label: 'Added',
      id: 'updated',
      cell: 'date',
      fixedWidth: 150,
    },
    {
      label: 'Revoke',
      id: 'config',
      fixedWidth: 100,
      cell: (account: Account) => {
        if (isAccount(account)) return null;

        return (
          <Button
            styleType="none"
            onClick={() =>
              unlink({ username: account.member, config: account.config })
            }
          >
            <UserMinusIcon className="size-5" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="flex w-full flex-col items-start">
      <Table
        className="border-none p-0 shadow-none"
        name="users"
        columns={columns}
        data={users}
        error={error}
        loadingRowCount={1}
        status={useMergeStatus(accountsStatus, primaryEmailStatus)}
        noData={{
          description: 'No authorized users found.',
        }}
        isTableView={false}
      />
      <Button
        styleType="none"
        endIcon={<ChevronRightIcon className="size-3 stroke-[4px]" />}
        onClick={() => setShowInviteModal(true)}
        className="-ml-2 text-brand"
      >
        Invite Collaborator
      </Button>
      <InviteUser
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
};
