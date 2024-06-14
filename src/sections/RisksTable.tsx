import { useMemo, useState } from 'react';
import {
  ArrowDownOnSquareStackIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

import { Dropdown } from '@/components/Dropdown';
import { HorseIcon } from '@/components/icons/Horse.icon';
import { SpinnerIcon } from '@/components/icons/Spinner.icon';
import { MenuProps } from '@/components/Menu';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { RiskDropdown, riskStatusOptions } from '@/components/ui/RiskDropdown';
import { useFilter } from '@/hooks/useFilter';
import { useMy } from '@/hooks/useMy';
import { useSearchParams } from '@/hooks/useSearchParams';
import { useMergeStatus } from '@/utils/api';
import { exportContent } from '@/utils/download.util';
import { Regex } from '@/utils/regex.util';
import { StorageKey } from '@/utils/storage/useStorage.util';

import { Risk, RiskSeverity, SeverityDef } from '../types';

import { useOpenDrawer } from './detailsDrawer/useOpenDrawer';

const DownIcon = (
  <ChevronDownIcon className="size-3 stroke-[4px] text-header-dark" />
);

const FilterLabel = ({ label, count }: { label: string; count: number }) => (
  <div className="flex w-full justify-between gap-4">
    <span>{label}</span>
    <span>{count}</span>
  </div>
);

const getStatus = (status: string) => (status[0] || '') + (status[2] || '');

const getFilteredRisksByCISA = (
  risks: Risk[],
  knownExploitedThreats?: string[]
) => {
  let filteredRisks = risks;
  if (knownExploitedThreats && knownExploitedThreats.length > 0) {
    filteredRisks = filteredRisks.filter(risk => {
      const matchedCVEID = Regex.CVE_ID.exec(risk.name)?.[0];

      return (
        (matchedCVEID && knownExploitedThreats.includes(matchedCVEID)) ||
        knownExploitedThreats.includes(risk.name)
      );
    });
  }
  return filteredRisks;
};

const getFilteredRisks = (
  risks: Risk[],
  {
    statusFilter,
    severityFilter,
    sourceFilter,
    knownExploitedThreats,
  }: {
    statusFilter?: string;
    severityFilter?: string;
    sourceFilter?: string;
    knownExploitedThreats?: string[];
  }
) => {
  let filteredRisks = risks;
  if (statusFilter) {
    filteredRisks = filteredRisks.filter(
      ({ status }) => `${getStatus(status)}` === statusFilter
    );
  }
  if (severityFilter) {
    filteredRisks = filteredRisks.filter(
      risk => risk.status[1] === severityFilter
    );
  }
  if (
    sourceFilter === 'cisa_kev' &&
    knownExploitedThreats &&
    knownExploitedThreats.length > 0
  ) {
    filteredRisks = getFilteredRisksByCISA(
      filteredRisks,
      knownExploitedThreats
    );
  }
  return filteredRisks;
};

export function Risks() {
  const { openRisk } = useOpenDrawer();
  const { addSearchParams } = useSearchParams();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useFilter('', setSelectedRows);
  const [statusFilter, setStatusesFilter] = useFilter('', setSelectedRows);
  const [sourceFilter, setSourceFilter] = useFilter('', setSelectedRows);

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

  const status = useMergeStatus(risksStatus, threatsStatus);

  const knownExploitedThreats = useMemo(() => {
    return threats.map(threat => threat.name);
  }, [JSON.stringify(threats)]);

  const filteredRisks = useMemo(() => {
    let filteredRisks = risks;
    filteredRisks = getFilteredRisks(risks, {
      statusFilter,
      severityFilter,
      sourceFilter,
      knownExploitedThreats,
    });
    return filteredRisks;
  }, [
    severityFilter,
    statusFilter,
    sourceFilter,
    JSON.stringify(risks),
    JSON.stringify(knownExploitedThreats),
  ]);

  const columns: Columns<Risk> = useMemo(
    () => [
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
    ],
    []
  );

  const risksExceptSeverity = useMemo(
    () =>
      getFilteredRisks(risks, {
        statusFilter,
        sourceFilter,
        knownExploitedThreats,
      }),
    [risks, statusFilter, sourceFilter, JSON.stringify(knownExploitedThreats)]
  );
  const risksExceptStatus = useMemo(
    () =>
      getFilteredRisks(risks, {
        severityFilter,
        sourceFilter,
        knownExploitedThreats,
      }),
    [risks, severityFilter, sourceFilter, JSON.stringify(knownExploitedThreats)]
  );
  const risksExceptSource = useMemo(
    () => getFilteredRisks(risks, { severityFilter, statusFilter }),
    [risks, severityFilter, statusFilter]
  );

  const sourceFilterOptions = useMemo(() => {
    return [
      {
        label: (
          <FilterLabel label="All Sources" count={risksExceptSource.length} />
        ),
        value: '',
      },
      {
        label: 'Divider',
        type: 'divider',
      },
      {
        label: (
          <FilterLabel
            label="CISA KEV"
            count={
              getFilteredRisksByCISA(risksExceptSource, knownExploitedThreats)
                .length
            }
          />
        ),
        value: 'cisa_kev',
      },
    ];
  }, [
    risks.length,
    JSON.stringify(risksExceptSource),
    JSON.stringify(knownExploitedThreats),
  ]);

  return (
    <div className="flex w-full flex-col">
      <Table
        name={'risks'}
        filters={
          <div className="flex gap-4">
            <Dropdown
              styleType="header"
              label={
                statusFilter
                  ? `${riskStatusOptions.find(option => option.value === statusFilter)?.label} Statuses`
                  : 'All Statuses'
              }
              endIcon={DownIcon}
              menu={{
                items: [
                  {
                    label: (
                      <FilterLabel
                        label={'All Statuses'}
                        count={risksExceptStatus.length}
                      />
                    ),
                    value: '',
                  },
                  {
                    label: 'Divider',
                    type: 'divider',
                  },
                  ...riskStatusOptions.map(option => ({
                    ...option,
                    label: (
                      <FilterLabel
                        label={option.label}
                        count={
                          risksExceptStatus.filter(
                            ({ status }: { status: string }) =>
                              getStatus(status) === option.value
                          ).length
                        }
                      />
                    ),
                  })),
                ],
                onClick: value => {
                  setStatusesFilter(value || '');
                },
                value: statusFilter,
              }}
            />
            <Dropdown
              styleType="header"
              label={
                severityFilter
                  ? `${SeverityDef[severityFilter as RiskSeverity]} Severities`
                  : 'All Severities'
              }
              endIcon={DownIcon}
              menu={{
                items: [
                  {
                    label: (
                      <FilterLabel
                        label="All Severities"
                        count={risksExceptSeverity.length}
                      />
                    ),
                    value: '',
                  },
                  {
                    label: 'Divider',
                    type: 'divider',
                  },
                  ...Object.entries(SeverityDef)
                    .map(([value, label]) => ({
                      label: (
                        <FilterLabel
                          label={label}
                          count={
                            risksExceptSeverity.filter(
                              ({ status }) => status[1] === value
                            ).length
                          }
                        />
                      ),

                      value,
                    }))
                    .reverse(),
                ],
                onClick: value => {
                  setSeverityFilter(value || '');
                },
                value: severityFilter,
              }}
            />
            <Dropdown
              styleType="header"
              label={
                sourceFilter
                  ? `${sourceFilterOptions.find(option => option.value === sourceFilter)?.label} Sources`
                  : 'All Sources'
              }
              endIcon={DownIcon}
              menu={{
                items: sourceFilterOptions as MenuProps['items'],
                onClick: value => {
                  setSourceFilter(value || '');
                },
                value: sourceFilter,
              }}
            />
            <span className="ml-auto text-2xl font-bold">{`${filteredRisks.length} Risks Shown`}</span>
          </div>
        }
        columns={columns}
        data={filteredRisks}
        status={status}
        error={error}
        selection={{ value: selectedRows, onChange: setSelectedRows }}
        noData={{
          title: risks?.length > 0 ? 'Scanning for Risks' : 'No Risks Found',
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
