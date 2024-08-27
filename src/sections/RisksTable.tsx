import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDownIcon,
  DocumentTextIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  Bars2Icon,
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { useDebounce } from 'use-debounce';

import { Dropdown } from '@/components/Dropdown';
import { RisksIcon } from '@/components/icons';
import { HorseIcon } from '@/components/icons/Horse.icon';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { getRiskStatusIcon } from '@/components/icons/RiskStatus.icon';
import { MenuItemProps } from '@/components/Menu';
import SeverityDropdown from '@/components/SeverityDropdown';
import StatusDropdown from '@/components/StatusDropdown';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { ClosedStateModal } from '@/components/ui/ClosedStateModal';
import { useGetKev } from '@/hooks/kev';
import { useFilter } from '@/hooks/useFilter';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useMy } from '@/hooks/useMy';
import { useBulkUpdateRisk, useDeleteRisk } from '@/hooks/useRisks';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { useGlobalState } from '@/state/global.state';
import {
  Risk,
  RiskSeverity,
  RiskStatus,
  RiskStatusLabel,
  SeverityDef,
} from '@/types';
import { useMergeStatus } from '@/utils/api';
import { isKEVRisk } from '@/utils/risk.util';
import { getRiskSeverity, getRiskStatus } from '@/utils/riskStatus.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { generatePathWithSearch, useSearchParams } from '@/utils/url.util';

const DownIcon = (
  <ChevronDownIcon className="size-3 stroke-[4px] text-header-dark" />
);

export const getFilterLabel = (
  label = '',
  filter: string[],
  options: MenuItemProps[]
) => {
  const labels = filter.map(
    v => options.find(({ value }) => value === v)?.label || ''
  );
  return filter.length === 0 ? `All ${label}` : labels.join(', ');
};

const getFilteredRisksByCISA = (
  risks: Risk[],
  knownExploitedThreats?: string[]
) => {
  if (knownExploitedThreats && knownExploitedThreats.length > 0) {
    return risks.filter(risk => {
      return isKEVRisk(risk, knownExploitedThreats);
    });
  }
  return [];
};

const getFilteredRisks = (
  risks: Risk[],
  {
    statusFilter = [],
    severityFilter = [],
    intelFilter = [],
    sourcesFilter = [],
    knownExploitedThreats,
  }: {
    statusFilter?: string[];
    severityFilter?: string[];
    intelFilter?: string[];
    sourcesFilter?: string[];
    knownExploitedThreats?: string[];
  }
) => {
  let filteredRisks = risks;
  const trimmedStatusFilter = statusFilter.filter(Boolean);
  const trimmedSeverityFilter = severityFilter.filter(Boolean);
  const trimmedIntelFilter = intelFilter.filter(Boolean);
  const trimmedSourcesFilter = sourcesFilter.filter(Boolean);

  if (trimmedStatusFilter.length > 0) {
    filteredRisks = filteredRisks.filter(risk =>
      trimmedStatusFilter.filter(Boolean).includes(getRiskStatus(risk.status))
    );
  }

  if (trimmedSeverityFilter.length > 0) {
    filteredRisks = filteredRisks.filter(risk =>
      trimmedSeverityFilter.filter(Boolean).includes(risk.status[1])
    );
  }

  if (trimmedIntelFilter.length > 0) {
    filteredRisks = getFilteredRisksByCISA(
      filteredRisks,
      knownExploitedThreats
    );
  }

  if (trimmedSourcesFilter.length > 0) {
    filteredRisks = filteredRisks.filter(risk =>
      trimmedSourcesFilter.filter(Boolean).includes(risk.source)
    );
  }

  return filteredRisks;
};

export function Risks() {
  const { getRiskDrawerLink } = getDrawerLink();
  const { handleUpdate: updateRisk, status: updateRiskStatus } =
    useBulkUpdateRisk();
  const { mutate: deleteRisk } = useDeleteRisk();

  const {
    modal: { risk },
  } = useGlobalState();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [statusFilter, setStatusesFilter] = useFilter<RiskStatus[]>(
    [],
    'risk-status',
    setSelectedRows
  );
  const [severityFilter, setSeverityFilter] = useFilter<RiskSeverity[]>(
    [],
    'risk-severity',
    setSelectedRows
  );
  const [intelFilter, setIntelFilter] = useFilter<string[]>(
    [],
    'risk-intel',
    setSelectedRows
  );
  const [sourcesFilter] = useFilter<string[]>(
    [],
    'risk-sources',
    setSelectedRows
  );

  useEffect(() => {
    if (updateRiskStatus === 'success') {
      setSelectedRows([]);
    }
  }, [updateRiskStatus]);

  const [isFilteredDataFetching, setIsFilteredDataFetching] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const { data: dataDebouncedSearch, status: statusDebouncedSearch } =
    useGenericSearch(
      { query: `name:${debouncedSearch}` },
      { enabled: Boolean(debouncedSearch) }
    );

  const { searchParams, addSearchParams } = useSearchParams();

  const [isClosedSubStateModalOpen, setIsClosedSubStateModalOpen] =
    useState(false);

  const { data: knownExploitedThreats = [], status: threatsStatus } =
    useGetKev();

  const {
    data: risksUseMy = [],
    status: risksStatus,
    error,
    isFetchingNextPage,
    isFetching: isRisksFetching,
    fetchNextPage,
    hasNextPage,
  } = useMy({
    resource: 'risk',
  });

  useEffect(() => {
    if (searchParams.has('q')) {
      setSearch(searchParams.get('q') || '');
    }
  }, [searchParams]);

  const risks: Risk[] = debouncedSearch
    ? dataDebouncedSearch?.risks || []
    : risksUseMy;

  const apiStatus = useMergeStatus(
    debouncedSearch ? statusDebouncedSearch : risksStatus,
    threatsStatus
  );

  const status = isFilteredDataFetching ? 'pending' : apiStatus;

  const filteredRisks = useMemo(() => {
    return getFilteredRisks(risks, {
      statusFilter,
      severityFilter,
      intelFilter,
      sourcesFilter,
      knownExploitedThreats,
    });
  }, [
    severityFilter,
    statusFilter,
    intelFilter,
    sourcesFilter,
    risks,
    knownExploitedThreats,
  ]);

  const sortedRisks = useMemo(() => {
    const sortOrder = ['C', 'H', 'M', 'L', 'I'];
    return filteredRisks.sort((a, b) => {
      return (
        sortOrder.indexOf(a.status[1]) - sortOrder.indexOf(b.status[1]) ||
        new Date(b.updated).getTime() - new Date(a.updated).getTime()
      );
    });
  }, [filteredRisks]);

  function handleSearchUpdate(value: string) {
    setSearch(value);
    addSearchParams('q', value);
  }

  const columns: Columns<Risk> = useMemo(
    () => [
      {
        label: 'Priority',
        id: 'status',
        fixedWidth: 80,
        cell: (risk: Risk) => {
          const riskStatusKey = getRiskStatus(risk.status);
          const riskSeverityKey = getRiskSeverity(risk.status);

          const statusIcon = getRiskStatusIcon(riskStatusKey);
          const severityIcon = getRiskSeverityIcon(riskSeverityKey);

          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-default">
                <Tooltip
                  title={
                    (RiskStatusLabel[riskStatusKey] || 'Closed') + ' Status'
                  }
                >
                  {statusIcon}
                </Tooltip>
                <Tooltip title={SeverityDef[riskSeverityKey] + ' Severity'}>
                  {severityIcon}
                </Tooltip>
              </div>
            </div>
          );
        },
      },
      {
        label: 'Risk',
        id: 'name',
        to: (item: Risk) => getRiskDrawerLink(item),
        copy: true,
      },
      {
        label: 'Status',
        id: 'status',
        className: 'text-left',
        cell: (risk: Risk) => {
          const riskStatusKey = getRiskStatus(risk.status);
          return <span>{RiskStatusLabel[riskStatusKey]}</span>;
        },
      },
      {
        label: 'DNS',
        id: 'dns',
        className: 'hidden md:table-cell',
        copy: true,
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
      {
        label: 'Proof',
        id: '',
        cell: risk => (
          <Tooltip title="View Proof of Exploit">
            <Link
              to={generatePathWithSearch({
                appendSearch: [[StorageKey.POE, `${risk.dns}/${risk.name}`]],
              })}
              className="cursor-pointer"
            >
              <DocumentTextIcon className="size-5 text-default" />
            </Link>
          </Tooltip>
        ),
        align: 'center',
        fixedWidth: 70,
      },
    ],
    []
  );

  useEffect(() => {
    if (!isRisksFetching) {
      if (search) {
        setIsFilteredDataFetching(false);
      } else {
        if (hasNextPage && sortedRisks.length < 50) {
          setIsFilteredDataFetching(true);
          fetchNextPage();
        } else {
          setIsFilteredDataFetching(false);
        }
      }
    }
  }, [JSON.stringify({ sortedRisks }), search, isRisksFetching, hasNextPage]);

  return (
    <div className="flex w-full flex-col">
      <Table
        isTableView
        name={'risks'}
        search={{
          value: search,
          onChange: handleSearchUpdate,
        }}
        resize={true}
        bodyHeader={
          <div className="flex gap-4">
            <SeverityDropdown
              value={severityFilter}
              onChange={selectedRows => {
                setSeverityFilter(selectedRows);
              }}
            />
            <StatusDropdown
              value={statusFilter}
              onChange={selectedRows => {
                setStatusesFilter(selectedRows);
              }}
            />
            <Dropdown
              styleType="header"
              label={getFilterLabel('Threat Intel', intelFilter, [
                { label: 'CISA KEV', value: 'cisa_kev' },
              ])}
              endIcon={DownIcon}
              menu={{
                items: [
                  {
                    label: 'All Threat Intel',
                    value: '',
                  },
                  {
                    label: 'Divider',
                    type: 'divider',
                  },
                  {
                    label: 'CISA KEV',
                    value: 'cisa_kev',
                  },
                ],
                onSelect: selectedRows => setIntelFilter(selectedRows),
                value: intelFilter.length === 0 ? [''] : intelFilter,
                multiSelect: true,
              }}
            />
          </div>
        }
        primaryAction={() => {
          return {
            label: 'Add Risk',
            startIcon: <PlusIcon className="size-5" />,
            icon: <RisksIcon className="size-5" />,
            onClick: () => {
              risk.onOpenChange(true);
            },
          };
        }}
        bulkActions={(selectedRows: Risk[]) => {
          return {
            menu: {
              items: [
                {
                  label: 'Change Status',
                  type: 'label',
                },
                {
                  label: RiskStatusLabel[RiskStatus.Triaged],
                  icon: getRiskStatusIcon(RiskStatus.Triaged),
                  onClick: () => {
                    updateRisk({
                      selectedRows,
                      status: RiskStatus.Triaged,
                    });
                  },
                },
                {
                  label: RiskStatusLabel[RiskStatus.Opened],
                  icon: getRiskStatusIcon(RiskStatus.Opened),
                  onClick: () => {
                    updateRisk({
                      selectedRows,
                      status: RiskStatus.Opened,
                    });
                  },
                },
                {
                  label: 'Closed',
                  icon: getRiskStatusIcon(RiskStatus.Remediated),
                  onClick: () => {
                    setIsClosedSubStateModalOpen(true);
                  },
                },
                {
                  label: 'Change Severity',
                  type: 'label',
                },
                {
                  label: 'Critical',
                  icon: <ChevronDoubleUpIcon />,
                  onClick: () => {
                    updateRisk({
                      selectedRows,
                      severity: RiskSeverity.Critical,
                    });
                  },
                },
                {
                  label: 'High',
                  icon: <ChevronUpIcon />,
                  onClick: () => {
                    updateRisk({
                      selectedRows,
                      severity: RiskSeverity.High,
                    });
                  },
                },
                {
                  label: 'Medium',
                  icon: <Bars2Icon />,
                  onClick: () => {
                    updateRisk({
                      selectedRows,
                      severity: RiskSeverity.Medium,
                    });
                  },
                },
                {
                  label: 'Low',
                  icon: <ChevronDownIcon />,
                  onClick: () => {
                    updateRisk({
                      selectedRows,
                      severity: RiskSeverity.Low,
                    });
                  },
                },
                {
                  label: 'Informational',
                  icon: <ChevronDoubleDownIcon />,
                  onClick: () => {
                    updateRisk({
                      selectedRows,
                      severity: RiskSeverity.Info,
                    });
                  },
                },
              ],
            },
          };
        }}
        columns={columns}
        data={sortedRisks}
        status={status}
        error={error}
        selection={{ value: selectedRows, onChange: setSelectedRows }}
        noData={{
          title: risks.length === 0 ? 'No Risks Found' : 'No Matching Risks',
          description:
            risks.length === 0
              ? "Congratulations! Your Assets look safe, secure, and properly configured.\nWe'll continue to watch it to ensure nothing changes."
              : 'Try adjusting your filters or add new risks to see results.',
          icon: <HorseIcon />,
        }}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
      <ClosedStateModal
        isOpen={isClosedSubStateModalOpen}
        onClose={() => setIsClosedSubStateModalOpen(false)}
        onStatusChange={({ status }) => {
          const risksToDelete: Risk[] = selectedRows.map(i => {
            const risk = sortedRisks[Number(i)];

            return {
              ...risk,
              comment: status, // Set the comment to the status
            };
          });

          updateRisk({
            selectedRows: risksToDelete,
            comment: status,
          });
          deleteRisk(risksToDelete);
          setSelectedRows([]);
        }}
      />
    </div>
  );
}
