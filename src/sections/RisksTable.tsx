import { useLayoutEffect, useMemo, useState } from 'react';
import { ArrowDownOnSquareStackIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

import { HorseIcon } from '@/components/icons/Horse.icon';
import { SpinnerIcon } from '@/components/icons/Spinner.icon';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import Counts from '@/components/ui/Counts';
import { RiskDropdown } from '@/components/ui/RiskDropdown';
import { useCounts } from '@/hooks/useCounts';
import { useFilter } from '@/hooks/useFilter';
import { useMy } from '@/hooks/useMy';
import { useSearchParams } from '@/hooks/useSearchParams';
import { useMergeStatus } from '@/utils/api';
import { exportContent } from '@/utils/download.util';
import { Regex } from '@/utils/regex.util';
import { StorageKey } from '@/utils/storage/useStorage.util';

import { Risk, RiskSeverity, SeverityDef, Statistics } from '../types';

import { useOpenDrawer } from './detailsDrawer/useOpenDrawer';

const sortOrder = ['C', 'H', 'M', 'L', 'I'];
const riskCardsPriority = ['C', 'H', 'M', 'L'];

export function Risks() {
  const { openRisk } = useOpenDrawer();
  const { addSearchParams } = useSearchParams();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isFilterApplied, setIsFilterApplied] = useState(false);

  const [filter, setFilter] = useFilter('', setSelectedRows);
  const { data: stats = {}, status: statsStatus } = useCounts({
    resource: 'risk',
    filterByGlobalSearch: true,
  });
  const { data: threats, status: threatsStatus } = useMy({
    resource: 'threat',
  });
  const {
    data: risks = [],
    status: risksStatus,
    error,
    isFetchingNextPage,
    fetchNextPage,
  } = useMy({
    resource: 'risk',
    filterByGlobalSearch: true,
  });

  const status = useMergeStatus(risksStatus, statsStatus, threatsStatus);

  const knownExploitedThreats = useMemo(() => {
    return threats.map(threat => threat.name);
  }, [JSON.stringify(threats)]);

  const { cisa_kev, analyzing } = useMemo(() => {
    const cisa_kev = risks.filter(risk => {
      if (risk.status[0] !== 'O') {
        return false;
      }

      const matchedCVEID = Regex.CVE_ID.exec(risk.name)?.[0];

      return (
        (matchedCVEID && knownExploitedThreats.includes(matchedCVEID)) ||
        knownExploitedThreats.includes(risk.name)
      );
    });

    // Sort status order: Critical, High, Medium, Low, Info
    const analyzing = risks.filter(risk => risk.status[0] === 'T');
    analyzing.sort((a, b) => {
      return sortOrder.indexOf(a.status[1]) - sortOrder.indexOf(b.status[1]);
    });

    return { cisa_kev, analyzing };
  }, [JSON.stringify(knownExploitedThreats), JSON.stringify(risks)]);

  const statsCount = useMemo(() => {
    const statsCount: Statistics = {
      cisa_kev: cisa_kev.length,
      analyzing: analyzing.length,
      ...Object.entries(stats).reduce(
        (acc: { [key: string]: number }, [label, count]) => {
          const existingCount = acc[label[1]] || 0;
          return {
            ...acc,
            // Get all open stats
            [label[1]]:
              label[0] === 'O' ? existingCount + count : existingCount,
          };
        },
        {}
      ),
    };

    return statsCount;
  }, [JSON.stringify({ cisa_kev, analyzing, stats })]);

  const filteredRisks = useMemo(() => {
    if (filter === 'cisa_kev') {
      return cisa_kev;
    } else if (filter === 'analyzing') {
      return analyzing;
    } else if (filter?.length > 0) {
      return risks.filter(
        risk => risk.status[1] === filter && risk.status[0] === 'O'
      );
    }
    return risks;
  }, [
    filter,
    JSON.stringify(risks),
    JSON.stringify(cisa_kev),
    JSON.stringify(analyzing),
  ]);

  useLayoutEffect(() => {
    if (status === 'success' && !isFilterApplied) {
      setIsFilterApplied(true);

      if (cisa_kev.length > 0) {
        setFilter('cisa_kev');

        return;
      }

      const highestPriorityRisk = riskCardsPriority.find(s => {
        return statsCount[s] > 0;
      });

      if (highestPriorityRisk) {
        setFilter(highestPriorityRisk);
      }
    }
  }, [status, isFilterApplied]);

  const columns: Columns<Risk> = [
    {
      label: 'Risk Name',
      id: 'name',
      cell: 'highlight',
      onClick: (item: Risk) => openRisk(item),
      className: 'w-full',
      copy: true,
    },
    {
      label: 'Status',
      id: 'status',
      className: 'text-left',
      fixedWidth: 200,
      cell: (risk: Risk, selectedRowsData?: Risk[]) => {
        return (
          <div className="border-1 flex justify-start ">
            <RiskDropdown
              type="status"
              risk={risk}
              selectedRowsData={selectedRowsData}
            />
          </div>
        );
      },
    },
    {
      label: 'Severity',
      id: 'status',
      fixedWidth: 120,
      cell: (risk: Risk, selectedRowsData?: Risk[]) => {
        return (
          <RiskDropdown
            type="severity"
            risk={risk}
            selectedRowsData={selectedRowsData}
          />
        );
      },
    },
    {
      label: 'DNS',
      id: 'dns',
      className: 'w-full hidden md:table-cell',
      copy: true,
    },
    {
      label: 'POE',
      id: '',
      cell: risk => (
        <ChatBubbleLeftIcon
          className="size-5 cursor-pointer text-default-light"
          onClick={() => {
            addSearchParams(
              StorageKey.POE,
              encodeURIComponent(`${risk.dns}/${risk.name}`)
            );
          }}
        />
      ),
      align: 'center',
      fixedWidth: 56,
    },
    {
      label: 'First Seen',
      id: 'created',
      cell: 'date',
      className: 'hidden lg:table-cell',
    },
    {
      label: 'Last Seen',
      id: 'updated',
      cell: 'date',
      className: 'hidden lg:table-cell',
    },
  ];

  return (
    <div className="flex w-full flex-col">
      <Table
        name={'risks'}
        counters={
          <Counts
            status={status}
            stats={statsCount}
            onClick={(label: string) => {
              if (label === filter && label !== '') {
                setFilter('');
              } else {
                setFilter(label);
              }
            }}
            selected={filter}
            type="risks"
          />
        }
        columns={columns}
        data={filteredRisks}
        status={status}
        error={error}
        selection={{ value: selectedRows, onChange: setSelectedRows }}
        noData={{
          title:
            risks?.length > 0
              ? `Scanning for${filter in SeverityDef ? ' ' + SeverityDef[filter as RiskSeverity] : ''} Risks`
              : 'No Risks Found',
          description:
            risks.length > 0
              ? `None of these Risks have been found, but we're actively scanning for them.\nWe'll alert you if we find any.`
              : `Congratulations! Your Assets look safe, secure, and properly configured.\nWe'll continue to watch them to ensure nothing changes.`,
          icon:
            risks.length > 0 ? (
              <SpinnerIcon className="size-[100px]" />
            ) : (
              <HorseIcon />
            ),
        }}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        actions={{
          items: [
            {
              label: 'Export as JSON',
              onClick: () => exportContent(risks, 'risks'),
              icon: <ArrowDownOnSquareStackIcon className="size-5" />,
            },
            {
              label: 'Export as CSV',
              onClick: () => exportContent(risks, 'risks', 'csv'),
              icon: <ArrowDownOnSquareStackIcon className="size-5" />,
            },
          ],
        }}
      />
    </div>
  );
}
