import React, { useMemo } from 'react';
import { ArrowDownOnSquareStackIcon } from '@heroicons/react/24/solid';

import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import useAccountDetails from '@/hooks/useAccountDetails';
import useRiskDetails from '@/hooks/useRiskDetails';
import { useAuth } from '@/state/auth';
import { exportContent } from '@/utils/download.util';

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
  const fetchRiskDetails = useRiskDetails();
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

        // Hide non-open status and info severity risks
        // These were deemed not important enough to show in the table
        if (key[0] !== 'O' || key[1] === 'I') return;

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
      data.push({
        email,
        displayName: displayName || email,
        ...counts,
      });
    });
    return data;
  }, [accountDetails]);

  const downloadRisks = async (email: string, filetype: 'json' | 'csv') => {
    const risks = await fetchRiskDetails(email);
    const filteredRisks = risks.filter(risk => risk.status[0] === 'O');
    exportContent(filteredRisks, `risk-detail-${email}.${filetype}`, filetype);
  };

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
        rowActions={{
          items: [
            {
              label: 'Export as JSON',
              onClick: rows =>
                rows.forEach(row => downloadRisks(row.email, 'json')),
              icon: <ArrowDownOnSquareStackIcon className="size-5" />,
            },
            {
              label: 'Export as CSV',
              onClick: rows =>
                rows.forEach(row => downloadRisks(row.email, 'csv')),
              icon: <ArrowDownOnSquareStackIcon className="size-5" />,
            },
          ],
        }}
      />
    </div>
  );
};
