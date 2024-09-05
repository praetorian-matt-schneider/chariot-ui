import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircleIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { BellIcon } from '@heroicons/react/24/solid';

import { Drawer } from '@/components/Drawer';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { getRiskStatusIcon } from '@/components/icons/RiskStatus.icon';
import { Loader } from '@/components/Loader';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { Alerts } from '@/sections/Alerts';
import { AlertIcon, CategoryFilter, FancyTable } from '@/sections/Assets';
import { RenderHeaderExtraContentSection } from '@/sections/AuthenticatedApp';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { useGlobalState } from '@/state/global.state';
import {
  AssetStatus,
  Risk,
  RiskFilters,
  RiskStatus,
  RiskStatusLabel,
  SeverityDef,
} from '@/types';
import { partition } from '@/utils/array.util';
import { getRiskSeverity, getRiskStatus } from '@/utils/riskStatus.util';
import { useQueryFilters } from '@/utils/storage/useQueryParams.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { generatePathWithSearch, useSearchParams } from '@/utils/url.util';

const RisksBeta: React.FC = () => {
  const {
    modal: {
      risk: { onOpenChange: onOpenRiskChange },
    },
  } = useGlobalState();
  const [filters, setFilters] = useQueryFilters<RiskFilters>({
    key: StorageKey.RISK_FILTERS,
    defaultFilters: {
      search: '',
      query: '',
    },
  });

  const [isCTAOpen, setIsCTAOpen] = useState<boolean>(false);
  const closeCTADrawer = () => {
    setIsCTAOpen(false);
  };

  // Check for remediated risks to update the CTA
  const {
    data: risksGeneric,
    status: risksStatus,
    error: risksError,
    isFetchingNextPage,
    fetchNextPage,
  } = useGenericSearch({
    query: 'status:R',
  });
  const hasRemediatedRisk = (risksGeneric?.risks || [])?.length > 0;
  const { getRiskDrawerLink } = getDrawerLink();

  //   Security alert options
  const { data: alertsWithConditions, status: alertsStatus } =
    useGetAccountAlerts();
  const alertsWithoutAttributes = (alertsWithConditions || []).filter(
    alert => !alert.value.startsWith('#attribute')
  );

  const [alerts, conditions] = partition(
    alertsWithoutAttributes,
    ({ source }) => source === 'system'
  );

  const query = filters.search || filters.query || '';

  // Add default filter if none is selected
  useEffect(() => {
    if (!filters.search && !filters.query) {
      if (alerts && alerts.length > 0) {
        setFilters({
          search: '',
          query: alerts[0].value,
        });
      } else if (conditions && conditions.length > 0) {
        setFilters({
          search: '',
          query: conditions[0].value,
        });
      }
    }
  }, [JSON.stringify({ alerts, filters, conditions })]);

  // Open the drawer based on the search params
  const { searchParams, removeSearchParams } = useSearchParams();
  useEffect(() => {
    if (searchParams) {
      const params = new URLSearchParams(searchParams);
      const action = params.get('action');
      if (action) {
        if (action === 'remediate-a-risk') {
          setIsCTAOpen(true);
        }
      }
      // clear the search params
      removeSearchParams('action');
    }
  }, [searchParams]);

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

  function getAlertDescription(query: string) {
    const statusCode = query.split(':')[1] as AssetStatus | RiskStatus;
    switch (statusCode) {
      case RiskStatus.Opened:
      case RiskStatus.MachineOpen:
        return (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              These are all your open risks that need remediation
            </h1>
            <p className="mt-4 text-sm text-gray-700">
              <span className="font-semibold">Recommended Action:</span>{' '}
              Remediate the risk, then either rescan to confirm or close if no
              longer valid
            </p>
          </>
        );
      case RiskStatus.Triaged:
        return (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              These are newly discovered risks that require triaging
            </h1>
            <p className="mt-4 text-sm text-gray-700">
              <span className="font-semibold">Recommended Action:</span> Accept
              the risk if it is valid, or reject it if it is invalid
            </p>
          </>
        );
      case RiskStatus.MachineDeleted:
        return (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              These risks were previously open but are no longer detected
            </h1>
            <p className="mt-4 text-sm text-gray-700">
              <span className="font-semibold">Recommended Action:</span> Confirm
              that the risk is no longer present or reopen the risk if necessary
            </p>
          </>
        );
      case AssetStatus.ActiveLow:
        return (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              These assets are not being scanned for risks
            </h1>
            <p className="mt-4 text-sm text-gray-700">
              <span className="font-semibold">Recommended Action:</span> Enable
              risk scanning for these assets or delete them if they are not of
              interest
            </p>
          </>
        );
      default:
        return (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              These are all your exposure risks
            </h1>
            <p className="mt-4 text-sm text-gray-700">
              <span className="font-semibold">Recommended Action:</span> Open or
              close the risk as needed
            </p>
          </>
        );
    }
  }

  return (
    <>
      <RenderHeaderExtraContentSection>
        <div
          role={hasRemediatedRisk ? 'button' : 'none'}
          onClick={() => (hasRemediatedRisk ? setIsCTAOpen(true) : {})}
          className="m-auto flex w-full flex-col items-center rounded-lg border-2 border-dashed border-header-dark bg-header p-8 text-center"
        >
          <Loader className="w-8" isLoading={risksStatus === 'pending'}>
            {hasRemediatedRisk ? (
              <CheckCircleIcon className="size-10 text-green-400" />
            ) : (
              <BellIcon className="size-10 animate-bounce text-white" />
            )}
          </Loader>
          <h1 className="text-3xl font-bold text-white">Remediate a Risk</h1>
          <p className="max-w-[700px] text-sm text-gray-500">
            Keep your environment secure by addressing risks regularly
          </p>
        </div>
      </RenderHeaderExtraContentSection>
      <FancyTable
        addNew={{ onClick: () => onOpenRiskChange(true) }}
        search={{
          value: filters.search,
          onChange: search => {
            setFilters({ search, query: '' });
          },
        }}
        className="h-0 min-h-0"
        name="risk"
        otherFilters={
          <>
            {alerts.length > 0 && (
              <CategoryFilter
                value={filters.query ? [filters.query] : []}
                hideHeader={true}
                onChange={alerts => {
                  setFilters({
                    ...filters,
                    search: '',
                    query: alerts[0],
                  });
                }}
                category={[
                  {
                    label: 'Security Alerts',
                    options: alerts.map(({ name, value }) => ({
                      label: name,
                      value,
                      count: '0', // No need to show count
                    })),
                  },
                ]}
                status={alertsStatus}
              />
            )}
            {conditions.length > 0 && (
              <CategoryFilter
                value={filters.query ? [filters.query] : []}
                hideHeader={true}
                onChange={attributes => {
                  setFilters({
                    ...filters,
                    search: '',
                    query: attributes[0],
                  });
                }}
                category={[
                  {
                    label: 'Exposure Risks',
                    options: conditions.map(({ name, value }) => ({
                      label: name,
                      value,
                      count: '0',
                    })),
                    showCount: false,
                  },
                ]}
                alert={{
                  value: (conditions || []).map(condition => condition.value),
                }}
                status={alertsStatus}
              />
            )}
          </>
        }
        tableHeader={
          <div className="w-full">
            <div className="flex w-full items-center justify-between">
              <div>{getAlertDescription(query)}</div>
              {conditions.find(({ value }) => value === filters.query) && (
                <AlertIcon
                  value={[filters.query]}
                  currentValue={filters.query}
                  styleType="button"
                />
              )}
            </div>
          </div>
        }
      >
        {query && (
          <Alerts query={query} setQuery={() => {}} hideFilters={true} />
        )}
        {!query && (
          <div className="mt-12 flex flex-col items-center justify-center">
            <QuestionMarkCircleIcon className="mb-4 size-16 text-gray-400" />
            <p className="text-2xl font-bold">
              Your search returned no results.
            </p>
          </div>
        )}
      </FancyTable>
      <Drawer
        open={isCTAOpen}
        onClose={closeCTADrawer}
        onBack={closeCTADrawer}
        className={'w-full rounded-t-sm bg-zinc-100 p-0 shadow-lg'}
        skipBack={true}
      >
        <div className="mx-12 mt-6">
          <div className="flex w-full flex-row items-center justify-between">
            <h1 className="mb-4 text-4xl font-extrabold">Remediated Risks</h1>
          </div>
          <Table
            name={'remediated-risks'}
            resize={true}
            columns={columns}
            data={risksGeneric?.risks || []}
            status={risksStatus}
            error={risksError}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </div>
      </Drawer>
    </>
  );
};

export default RisksBeta;
