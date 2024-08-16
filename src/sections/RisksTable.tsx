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

import { Dropdown } from '@/components/Dropdown';
import { RisksIcon } from '@/components/icons';
import { HorseIcon } from '@/components/icons/Horse.icon';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { getRiskStatusIcon } from '@/components/icons/RiskStatus.icon';
import { MenuItemProps } from '@/components/Menu';
import SourceDropdown from '@/components/SourceDropdown';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { AttributeFilter } from '@/components/ui/AttributeFilter';
import { ClosedStateModal } from '@/components/ui/ClosedStateModal';
import { useCounts } from '@/hooks/useCounts';
import {
  useBulkUpdateRisk,
  useGetRisks,
  useMapRiskFilters,
} from '@/hooks/useRisks';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { useGlobalState } from '@/state/global.state';
import {
  Risk,
  RiskSeverity,
  RiskStatus,
  RiskStatusLabel,
  SeverityDef,
} from '@/types';
import { omit } from '@/utils/lodash.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { generatePathWithSearch } from '@/utils/url.util';

const DownIcon = (
  <ChevronDownIcon className="size-3 stroke-[4px] text-header-dark" />
);

const KEV_ATTRIBUTE = '#attribute#source#kev';

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
            <AttributeFilter
              type="risk"
              value={filters.attributes.filter(att => att !== KEV_ATTRIBUTE)}
              onChange={attributes => {
                setFilters(prevFilters => {
                  return { ...prevFilters, attributes };
                });
              }}
            />
            <RiskStatusFilter
              onChange={updatedStatus => {
                setFilters(prevFilters => {
                  return { ...prevFilters, status: updatedStatus };
                });
              }}
              value={filters.status}
              countFilters={useMapRiskFilters(omit(filters, 'status'))}
            />
            <Dropdown
              styleType="header"
              label={getFilterLabel('Threat Intel', filters.attributes, [
                { label: 'CISA KEV', value: KEV_ATTRIBUTE },
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
                    value: KEV_ATTRIBUTE,
                  },
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
              countFilters={useMapRiskFilters(omit(filters, 'sources'))}
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

interface RiskStatusFilterProps {
  onChange: (selected: string[]) => void;
  value: string[];
  countFilters: string[][];
}

function RiskStatusFilter(props: RiskStatusFilterProps) {
  const { data } = useCounts({ resource: 'risk', filters: props.countFilters });
  const statusData = data?.status || {};

  const name = 'priorities';

  return (
    <Dropdown
      styleType="header"
      label={props.value.length === 0 ? `All ${name}` : props.value.join(', ')}
      className="capitalize"
      endIcon={<ChevronDownIcon className="size-5 text-gray-500" />}
      menu={{
        items: [
          {
            label: `All ${name}`,
            labelSuffix: Object.values(statusData)
              .reduce((a, b) => a + b, 0)
              .toLocaleString(),
            value: '',
          },
          {
            label: 'Divider',
            type: 'divider',
          },
          ...Object.keys(RiskStatusLabel).map(status => ({
            label: RiskStatusLabel[status as RiskStatus],
            value: status,
            subMenuMultiSelect: true,
            submenu: Object.keys(SeverityDef)
              .map(severity => {
                const value = status[1]
                  ? status[0] + severity[0] + status[1]
                  : status[0] + severity[0];

                return {
                  label: SeverityDef[severity as keyof typeof SeverityDef],
                  labelSuffix: statusData[value] || 0,
                  value: value,
                };
              })
              .reverse(),
          })),
        ],
        onSelect: value => props.onChange(value as string[]),
        value: props.value.length === 0 ? [''] : props.value,
      }}
    />
  );
}
