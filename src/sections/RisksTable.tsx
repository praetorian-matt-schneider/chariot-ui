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
import { countDescription, MenuItemProps } from '@/components/Menu';
import SourceDropdown from '@/components/SourceDropdown';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { ClosedStateModal } from '@/components/ui/ClosedStateModal';
import { useMy } from '@/hooks/useMy';
import { useBulkUpdateRisk } from '@/hooks/useRisks';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { useGlobalState } from '@/state/global.state';
import {
  Risk,
  RiskFilters,
  RiskSeverity,
  RiskStatus,
  RiskStatusLabel,
  SeverityDef,
} from '@/types';
import { StorageKey, useStorage } from '@/utils/storage/useStorage.util';
import { generatePathWithSearch } from '@/utils/url.util';

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

export function Risks() {
  const { getRiskDrawerLink } = getDrawerLink();
  const { handleUpdate: updateRisk, status: updateRiskStatus } =
    useBulkUpdateRisk();

  const {
    modal: { risk },
  } = useGlobalState();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  useEffect(() => {
    if (updateRiskStatus === 'success') {
      setSelectedRows([]);
    }
  }, [updateRiskStatus]);

  const [isClosedSubStateModalOpen, setIsClosedSubStateModalOpen] =
    useState(false);

  const {
    data: risks,
    status: risksStatus,
    error,
    isFetchingNextPage,
    fetchNextPage,
    filters,
    setFilters,
  } = useGetRisks();

  const columns: Columns<Risk> = useMemo(
    () => [
      {
        label: 'Priority',
        id: 'status',
        fixedWidth: 80,
        cell: (risk: Risk) => {
          const riskStatusKey =
            `${risk.status?.[0]}${risk.status?.[2] || ''}` as RiskStatus;
          const riskSeverityKey = risk.status?.[1] as RiskSeverity;

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
          const riskStatusKey =
            `${risk.status?.[0]}${risk.status?.[2] || ''}` as RiskStatus;
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

  return (
    <div className="flex w-full flex-col">
      <Table
        name={'risks'}
        search={{
          value: filters.search,
          onChange: updatedSearch => {
            setFilters(prevFilters => {
              return { ...prevFilters, search: updatedSearch };
            });
          },
        }}
        resize={true}
        filters={
          <div className="flex gap-4">
            <Dropdown
              styleType="header"
              label={getFilterLabel('Threat Intel', filters.attributes, [
                { label: 'CISA KEV', value: '#attribute#source#kev' },
              ])}
              endIcon={DownIcon}
              menu={{
                items: [
                  {
                    label: 'All Threat Intel',
                    labelSuffix: risks.length,
                    value: '',
                  },
                  {
                    label: 'Divider',
                    type: 'divider',
                  },
                  {
                    label: 'CISA KEV',
                    labelSuffix: 0,
                    value: '#attribute#source#kev',
                  },
                  countDescription,
                ],
                onSelect: selectedAttributes => {
                  setFilters(prevFilters => {
                    return { ...prevFilters, attributes: selectedAttributes };
                  });
                },
                value: filters.attributes,
                multiSelect: true,
              }}
            />
            <SourceDropdown
              type="risk"
              value={filters.sources}
              onChange={selectedSources => {
                setFilters(prevFilters => {
                  return { ...prevFilters, sources: selectedSources };
                });
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
        actions={(selectedRows: Risk[]) => {
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
                  icon: getRiskStatusIcon(RiskStatus.Resolved),
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
        data={risks}
        status={risksStatus}
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
        onStatusChange={({ status, comment }) => {
          updateRisk({
            selectedRows: selectedRows
              .map(i => risks[Number(i)])
              .filter(Boolean),
            status,
            comment,
          });
          setSelectedRows([]);
        }}
      />
    </div>
  );
}

function useGetRisks() {
  const [filters, setFilters] = useStorage<RiskFilters>(
    { queryKey: 'riskFilters' },
    { search: '', attributes: [], status: [], sources: [] }
  );

  const [debouncedSearch] = useDebounce(filters.search, 500);

  const apiFilters = [['#risk']];

  if (debouncedSearch) {
    apiFilters.push([debouncedSearch, `dns|${debouncedSearch}`]);
  }

  if (filters.status.length > 0) {
    apiFilters.push(filters.status.map(s => `status:${s}`));
  }

  if (filters.sources.length > 0) {
    apiFilters.push(filters.sources.map(priority => `source:${priority}`));
  }

  if (filters.attributes.length > 0) {
    apiFilters.push(filters.sources.map(priority => `attributes:${priority}`));
  }

  const { status, data, isFetching, fetchNextPage, isFetchingNextPage, error } =
    useMy({
      resource: 'risk',
      filters: apiFilters,
    });

  return {
    data,
    status,
    fetchNextPage,
    error,
    isFetchingNextPage,
    isFetching,
    setFilters,
    filters,
  };
}
