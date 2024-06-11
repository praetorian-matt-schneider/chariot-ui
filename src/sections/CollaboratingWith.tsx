import React, { useMemo } from 'react';

import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import useAccountDetails from '@/hooks/useAccountDetails';
import { useAuth } from '@/state/auth';

interface EmailData {
  email: string;
  displayName: string;
}

interface Props {
  emails: EmailData[];
}

interface TableData {
  displayName?: string;
  email: string;
  total: number;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export const CollaboratingWith: React.FC<Props> = ({ emails }) => {
  const { startImpersonation } = useAuth();
  const { accountDetails, loading } = useAccountDetails(
    emails.map(e => e.email)
  );

  const tableData = useMemo(() => {
    const data: TableData[] = [];
    Object.keys(accountDetails).forEach(email => {
      const counts = { total: 0, low: 0, medium: 0, high: 0, critical: 0 };
      let displayName = '';
      Object.keys(accountDetails[email]).forEach(key => {
        const val = accountDetails[email][key];
        if (key === 'displayName' && val !== undefined) {
          displayName = String(val);
          return;
        }

        // Hide closed & rejected
        if (key[0] === 'C' || key[0] === 'R') return;

        if (key.length === 2) {
          counts.total += val;
        }
        switch (key[1]) {
          case 'L':
            counts.low += val;
            break;
          case 'M':
            counts.medium += val;
            break;
          case 'H':
            counts.high += val;
            break;
          case 'C':
            counts.critical += val;
            break;
        }
      });
      data.push({ email, displayName: displayName || email, ...counts });
    });
    return data;
  }, [accountDetails]);

  const columns: Columns<TableData> = [
    {
      label: 'User',
      id: 'displayName',
      cell: 'highlight',
      onClick: (row: TableData) =>
        startImpersonation(row.email, row.displayName ?? ''),
    },
    {
      label: 'Total',
      id: 'total',
      fixedWidth: 80,
    },
    {
      label: 'Low',
      id: 'low',
      fixedWidth: 80,
    },
    {
      label: 'Medium',
      id: 'medium',
      fixedWidth: 80,
    },
    {
      label: 'High',
      id: 'high',
      fixedWidth: 80,
    },
    {
      label: 'Critical',
      id: 'critical',
      fixedWidth: 80,
    },
  ];

  return (
    <div className="flex w-full flex-col">
      <Table
        className="border-none p-0 shadow-none"
        name="collaborators"
        columns={columns}
        data={tableData}
        status={loading ? 'pending' : 'success'}
        loadingRowCount={3}
        noData={{
          description: 'No collaborating organizations found.',
        }}
        header={false}
        footer={false}
        error={null}
      />
    </div>
  );
};
