import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import {
  BellIcon,
  CheckCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/solid';

import { Drawer } from '@/components/Drawer';
import { Dropdown } from '@/components/Dropdown';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { getRiskStatusIcon } from '@/components/icons/RiskStatus.icon';
import { Loader } from '@/components/Loader';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import {
  RISK_DROPDOWN_CLASS,
  riskSeverityOptions,
} from '@/components/ui/RiskDropdown';
import { useMy } from '@/hooks';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { Alerts } from '@/sections/Alerts';
import { AlertIcon, CategoryFilterProps, FancyTable } from '@/sections/Assets';
import { RenderHeaderExtraContentSection } from '@/sections/AuthenticatedApp';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { Empty } from '@/sections/Empty';
import { getCurrentPlan } from '@/sections/overview/Overview';
import RiskNotificationBar from '@/sections/RiskNotificationBar';
import { useAuth } from '@/state/auth';
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
import { cn } from '@/utils/classname';
import { getSeverityClass } from '@/utils/getSeverityClass.util';
import { Regex } from '@/utils/regex.util';
import { getRiskStatusLabel } from '@/utils/riskStatus.util';
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
      subQuery: '',
    },
  });
  const [notification, setNotification] = useState<{
    message: string;
  } | null>(null);

  const handleRiskAction = (message: string) => {
    setNotification({ message });

    // Automatically close the notification after 3 seconds (optional)
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

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

  const query = filters.search || filters.subQuery || filters.query || '';

  const { friend } = useAuth();
  const { data: accounts } = useMy({
    resource: 'account',
  });

  const currentPlan = getCurrentPlan({ accounts, friend });

  // Add default filter if none is selected
  useEffect(() => {
    if (!filters.search && !filters.query) {
      if (alerts && alerts.length > 0) {
        setFilters({
          search: '',
          query: alerts[0].value,
          subQuery: '',
        });
      } else if (conditions && conditions.length > 0) {
        setFilters({
          search: '',
          query: conditions[0].value,
          subQuery: '',
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
        if (action === 'remediate-a-risk' && hasRemediatedRisk) {
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
          const { status: riskStatusKey, severity: riskSeverityKey } =
            getRiskStatusLabel(risk.status);

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
          const riskStatusKey = getRiskStatusLabel(risk.status).status;
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

  const statusCode = filters.query.startsWith('exposure')
    ? 'E'
    : (filters.query.split(':')[1] as AssetStatus | RiskStatus);

  const category = useMemo((): CategoryFilterProps['category'] => {
    const ports = conditions.filter(({ key }) =>
      key.match(Regex.CONDITION_PORT)
    );
    const surfaces = conditions.filter(({ key }) =>
      key.match(Regex.CONDITION_SURFACE)
    );
    const protocols = conditions.filter(({ key }) =>
      key.match(Regex.CONDITION_PROTOCOL)
    );
    const rest = conditions.filter(
      ({ key }) =>
        !key.match(Regex.CONDITION_PORT) &&
        !key.match(Regex.CONDITION_SURFACE) &&
        !key.match(Regex.CONDITION_PROTOCOL)
    );

    return [
      ...(alerts.length > 0
        ? [
            {
              defaultOpen: true,
              label: 'Security Alerts',
              options: alerts.map(({ name, value, sort }) => ({
                label: name,
                value,
                count: '0', // No need to show count
                alert: false,
                subQueries: sort,
              })),
            },
          ]
        : []),
      ...(surfaces.length > 0
        ? [
            {
              defaultOpen: true,
              label: 'Exposure Risks: Surface',
              options: surfaces.map(({ key, name, value }) => ({
                label: key.match(Regex.CONDITION_SURFACE)?.[1] || name,
                value,
                count: '0',
              })),
              showCount: false,
            },
          ]
        : []),
      ...(ports.length > 0
        ? [
            {
              defaultOpen: true,
              label: 'Exposure Risks: Port',
              options: ports.map(({ key, name, value }) => ({
                label: key.match(Regex.CONDITION_PORT)?.[1] || name,
                value,
                count: '0',
              })),
              showCount: false,
            },
          ]
        : []),
      ...(protocols.length > 0
        ? [
            {
              defaultOpen: true,
              label: 'Exposure Risks: Protocol',
              options: protocols.map(({ key, name, value }) => ({
                label: key.match(Regex.CONDITION_PROTOCOL)?.[1] || name,
                value,
                count: '0',
              })),
              showCount: false,
            },
          ]
        : []),
      ...(rest.length > 0
        ? [
            {
              defaultOpen: true,
              label: 'Exposure Risks',
              options: rest.map(({ name, value }) => ({
                label: name,
                value,
                count: '0',
              })),
              showCount: false,
            },
          ]
        : []),
    ];
  }, [JSON.stringify({ alerts, conditions })]);

  const selectedCategory = useMemo(() => {
    return category.reduce(
      (acc, category) => {
        if (!acc.label) {
          const found = category.options.find(
            option => option.value === filters.query
          );

          if (found) {
            return {
              label: category.selectedLabel || category.label,
              value: found.selectedLabel || found.label,
              alert: found.alert ?? true,
              subQueries: found.subQueries || [],
            };
          }
        }

        return acc;
      },
      { label: '', value: '', alert: true, subQueries: [] } as {
        label: string;
        value: string;
        alert: boolean;
        subQueries: string[];
      }
    );
  }, [JSON.stringify({ category, query: filters.query })]);

  const selectedSeverity = useMemo(() => {
    return filters.subQuery ? filters.subQuery.slice(-1) : '';
  }, [JSON.stringify({ subQuery: filters.subQuery })]);

  const showHelper = (message?: string) => {
    if (message) {
      handleRiskAction(message);
    }
  };

  return (
    <>
      <RenderHeaderExtraContentSection>
        <div
          role="button"
          onClick={() => setIsCTAOpen(true)}
          className="m-auto flex w-full flex-col items-center rounded-lg border-2 border-dashed border-header-dark bg-header p-8 text-center"
        >
          <Loader className="w-8" isLoading={risksStatus === 'pending'}>
            {hasRemediatedRisk ? (
              <CheckCircleIcon className="size-10 text-green-400" />
            ) : (
              <BellIcon className="size-10 animate-bounce text-white" />
            )}
          </Loader>
          <h1 className="text-3xl font-bold text-white">
            {hasRemediatedRisk
              ? `${risksGeneric?.risks?.length} Risks Remediated`
              : 'Remediate a Risk'}
          </h1>
          <p className="max-w-[700px] text-sm text-gray-500">
            Keep your environment secure by addressing risks regularly
          </p>
        </div>
      </RenderHeaderExtraContentSection>

      <div className="relative">
        {/* The RiskNotificationBar appears on top of the list */}
        {notification && (
          <RiskNotificationBar
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
      <FancyTable
        addNew={{ onClick: () => onOpenRiskChange(true) }}
        search={{
          value: filters.search,
          onChange: search => {
            setFilters({ search, query: '', subQuery: '' });
          },
        }}
        className="h-0 min-h-0"
        name="risk"
        filter={{
          value: filters.query ? [filters.query] : [],
          hideHeader: true,
          onChange: alerts => {
            setFilters({
              ...filters,
              search: '',
              subQuery: '',
              query: alerts[0] || '',
            });
          },
          category,
          status: alertsStatus,
          alert: {
            value: (alertsWithoutAttributes || []).map(alert => alert.value),
          },
        }}
        tableHeader={
          <div className="w-full">
            <div className="flex w-full items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">
                {AlertDescriptions[statusCode]}
              </h1>
              {selectedCategory.subQueries.length > 0 && (
                <Dropdown
                  className={cn(
                    RISK_DROPDOWN_CLASS,
                    getSeverityClass(selectedSeverity)
                  )}
                  startIcon={
                    riskSeverityOptions.find(
                      option => option.value === selectedSeverity
                    )?.icon
                  }
                  endIcon={
                    <ChevronDownIcon className="size-3 text-default-light" />
                  }
                  menu={{
                    value: filters.subQuery,
                    onClick: value => {
                      if (value || value === '') {
                        setFilters({
                          ...filters,
                          subQuery: value,
                        });
                      }
                    },
                    items: [
                      {
                        label: `All Severities`,

                        value: '',
                      },
                      ...(selectedCategory.subQueries
                        .map(query => {
                          const severity = query.slice(-1);

                          const option = riskSeverityOptions.find(
                            o => o.value === severity
                          );
                          return { ...option, value: query };
                        })
                        .filter(Boolean)
                        .reverse() as { label: string; value: string }[]),
                    ],
                  }}
                >
                  <div className="flex-1 text-left">
                    {getRiskStatusLabel(filters.subQuery.slice(-2) || '')
                      .severityLabel || 'Filter by Severity'}
                  </div>
                </Dropdown>
              )}
              {selectedCategory.alert && (
                <AlertIcon
                  value={[filters.query]}
                  currentValue={filters.query}
                  styleType="button"
                  onRemove={() =>
                    setFilters({ search: '', query: '', subQuery: '' })
                  }
                />
              )}
            </div>
          </div>
        }
      >
        {query && (
          <Alerts
            query={query}
            setQuery={() => {}}
            hideFilters={true}
            refetch={showHelper}
          />
        )}
        {!query && <Empty />}
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

          {risksGeneric?.risks?.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-lg bg-zinc-50 p-8">
              <div className="mb-4">
                {/* Icon for illustration */}
                <ShieldExclamationIcon className="size-16 text-gray-400" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-700">
                No Remediated Risks Yet
              </h2>
              <p className="mb-6 text-center text-lg text-gray-500">
                A risk is a potential security issue that affects your system.
                You can view the risk details, including the description and
                remediation steps, for guidance on resolving it.
              </p>
              <ul className="mb-6 text-left text-gray-600">
                <li className="mb-2">
                  1. Open the risk to review its description and suggested
                  remediation. If a remediation isn&apos;t available, you can
                  generate one directly.
                </li>
                <li className="mb-2">
                  2. Review the proof of exploit, showing the detection details
                  and impacted assets.
                </li>
                <li className="mb-2">
                  3. We automatically recheck every 30 minutes. If it&apos;s
                  fixed, we&apos;ll close it for you, or you can manually close
                  it if you&apos;re certain it&apos;s no longer a risk.
                </li>
              </ul>
              <div className="text-gray-500">
                {currentPlan === 'managed' ? (
                  <p className="mt-4 text-center text-lg text-gray-500">
                    As a managed service customer, we can assist you with this
                    process.
                  </p>
                ) : (
                  <p className="mt-4 text-center text-lg text-gray-500">
                    Need help? Reach out to us about upgrading to our managed
                    service plan.
                  </p>
                )}
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </Drawer>
    </>
  );
};

export default RisksBeta;

export const AlertDescriptions: Record<string, string> = {
  [RiskStatus.Opened]: 'Remediated a risk and want to close it early?',

  [RiskStatus.MachineOpen]:
    'Chariot A.I. thinks these risks are valid. Should they be opened?',
  [RiskStatus.Triaged]: 'Are these risks valid?',
  [RiskStatus.MachineDeleted]:
    'Chariot A.I. thinks these risks are invalid. Should they be closed?',
  [AssetStatus.ActiveLow]: 'Should these assets be scanned for risks?',
  [RiskStatus.ExposedRisks]: 'Are these exposures risks?',
};

export const SingularAlertDescriptions: Record<string, string> = {
  [RiskStatus.Opened]: 'Should this risk be closed?',
  [RiskStatus.MachineOpen]:
    'Chariot A.I. thinks this risk is valid. Should it be opened?',
  [RiskStatus.Triaged]: 'Is this risk valid?',
  [RiskStatus.MachineDeleted]:
    'Chariot A.I. thinks this risk is invalid. Should it be closed?',
  [AssetStatus.ActiveLow]: 'Should this asset be scanned for risks?',
  [RiskStatus.ExposedRisks]: 'Is this exposure valid?',
};
