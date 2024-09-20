import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDownIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

import { Drawer } from '@/components/Drawer';
import { Dropdown } from '@/components/Dropdown';
import {
  getRiskSeverityIcon,
  getSeverityButton,
} from '@/components/icons/RiskSeverity.icon';
import { getRiskStatusIcon } from '@/components/icons/RiskStatus.icon';
import { Loader } from '@/components/Loader';
import { Table } from '@/components/table/Table';
import { Columns, TableProps } from '@/components/table/types';
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
  GenericResource,
  Risk,
  RiskFilters,
  RiskSeverity,
  RiskStatus,
  RiskStatusLabel,
  SeverityDef,
} from '@/types';
import { partition } from '@/utils/array.util';
import { Regex } from '@/utils/regex.util';
import { getRiskStatusLabel } from '@/utils/riskStatus.util';
import { sortBySeverityAndUpdated } from '@/utils/sortBySeverityAndUpdated.util';
import { useQueryFilters } from '@/utils/storage/useQueryParams.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { generatePathWithSearch, useSearchParams } from '@/utils/url.util';
import { useMergeStatus } from '@/utils/api';
import { formatDate } from '@/utils/date.util';
import { cn } from '@/utils/classname';
import {
  ClosedStateModal,
  riskClosedStatusList,
} from '@/components/ui/ClosedStateModal';
import { useDeleteRisk, useUpdateRisk } from '@/hooks/useRisks';
import { Button } from '@/components/Button';

const DefaultFilter = {
  search: '',
  query: 'status:OC',
};
const RisksBeta: React.FC = () => {
  const {
    modal: {
      risk: { onChange: onOpenRiskChange },
    },
  } = useGlobalState();
  const [filters, setFiltersFn] = useQueryFilters<RiskFilters>({
    key: StorageKey.RISK_FILTERS,
    defaultFilters: DefaultFilter,
  });

  function setFilters(filters: RiskFilters) {
    if (!filters.query && !filters.search) {
      setFiltersFn(DefaultFilter);
    } else {
      setFiltersFn(filters);
    }
  }

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

  const [drawerFilter, setDrawerFilter] = useState<RiskFilters>({
    query: 'status:R',
    search: '',
  });

  const {
    data: risksGeneric,
    status: risksStatus,
    error: risksError,
    isFetchingNextPage,
    fetchNextPage,
  } = useGenericSearch(
    {
      query: drawerFilter.query,
    },
    { enabled: isCTAOpen }
  );
  console.log('risksGeneric', risksGeneric, drawerFilter.query);
  const hasRemediatedRisk = (risksGeneric?.risks || [])?.length > 0;
  const { getRiskDrawerLink } = getDrawerLink();

  //   Security alert options
  const {
    data: alertsWithConditions,
    status: alertsStatus,
    refetch: refetchAlerts,
  } = useGetAccountAlerts();
  const alertsWithoutAttributes = (alertsWithConditions || []).filter(
    alert => !alert.value.startsWith('#attribute')
  );

  const [alerts, conditions] = partition(
    alertsWithoutAttributes,
    ({ source }) => source === 'system'
  );

  const query = filters.search || filters.query || '';

  const [exportingFilter, setExportingFilter] = useState<RiskFilters>();
  const exportingQuery = exportingFilter
    ? exportingFilter.search || exportingFilter.query || ''
    : '';

  const riskType = filters.query.startsWith('status:')
    ? filters.query.startsWith('status:OX')
      ? 'Material'
      : 'Severity'
    : 'Exposure';

  const {
    data: queryData,
    refetch: refetchData,
    status: dataStatus,
    error: error,
    isFetching: isFetchingQueryData,
    fetchNextPage: fetchRisksNextPage,
  } = useGenericSearch(
    {
      query: query ?? '',
    },
    {
      enabled: !!query,
    }
  );

  const {
    data: exportingData,
    isFetching: isFetchingExportingData,
    hasNextPage: exportingDataHasNextPage,
    fetchNextPage: exportingDataFetchNextPage,
  } = useGenericSearch(
    {
      query: exportingQuery,
    },
    {
      enabled: Boolean(exportingFilter),
    }
  );

  const items = useMemo(
    () => getRisks(queryData, riskType),
    [riskType, JSON.stringify({ queryData })]
  );

  useEffect(() => {
    if (exportingFilter && !isFetchingExportingData) {
      if (exportingDataHasNextPage) {
        exportingDataFetchNextPage();
      } else {
        // End of all assets

        setExportingFilter(undefined);

        let fileName = '';

        const filteredExportingData = getRisks(exportingData, riskType);

        if (filters.search) {
          fileName = `Risks with search ${filters.search}`;
        } else if (filters.query.startsWith('exposure')) {
          const [, name, value] = filters.query.split('-');

          fileName = `Exposure risk with ${name} ${value}`;
        } else {
          const { severityLabel } = getRiskStatusLabel(
            exportingQuery.split(':')[1]
          );
          fileName = `Risks with severity ${severityLabel}`;
        }

        const exportingDataString = exportingData
          ? JSON.stringify(filteredExportingData, null, 2)
          : '';
        const blob = new Blob([exportingDataString], {
          type: 'application/json',
        });
        const href = URL.createObjectURL(blob);

        // create "a" HTLM element with href to file
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName + '.json';
        document.body.appendChild(link);
        link.click();

        // clean up "a" element & remove ObjectURL
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
      }
    }
  }, [
    exportingQuery,
    isFetchingExportingData,
    exportingDataHasNextPage,
    riskType,
    JSON.stringify({ exportingFilter }),
  ]);

  const { friend } = useAuth();
  const { data: accounts } = useMy({
    resource: 'account',
  });

  const currentPlan = getCurrentPlan({ accounts, friend });

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
      {
        label: 'Action',
        id: '',
        fixedWidth: 50,
        align: 'center',
        cell: risk => (
          <Button
            styleType="primary"
            className="py-2"
            onClick={() => {
              handleRiskChange(
                risk,
                RiskStatus.Opened,
                getRiskStatusLabel(risk.status).severity
              );
            }}
          >
            {drawerFilter.query === 'status:T' ? 'Open' : 'Re open'}
          </Button>
        ),
      },
    ],
    [drawerFilter.query]
  );

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
      {
        defaultOpen: true,
        label: 'Severity',
        selectedLabel: 'asd',
        options: Object.entries(RiskSeverity)
          .reverse()
          .map(([name, value]) => ({
            label: name,
            value: `status:O${value}`,
            count: '0', // No need to show count
            alert: false,
          })),
      },
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
            };
          }
        }

        return acc;
      },
      { label: '', value: '', alert: true } as {
        label: string;
        value: string;
        alert: boolean;
      }
    );
  }, [category, JSON.stringify({ query: filters.query })]);

  const showHelper = (message?: string) => {
    refetchData();
    refetchAlerts();
    if (message) {
      handleRiskAction(message);
    }
  };

  const navigate = useNavigate();

  const { mutateAsync: updateRisk, status: updateRiskStatus } = useUpdateRisk();

  function handleRiskChange(
    risk: Risk,
    status: RiskStatus,
    severity?: RiskSeverity
  ) {
    updateRisk({
      key: risk.key,
      name: risk.name,
      status: `${status}${severity ? severity : ''}`,
      showSnackbar: true,
      comment: risk.comment,
    }).then(() => {
      if (status === RiskStatus.Remediated) {
        showHelper(`Great work! ${risk.name} has been remediated.`);
      } else if (status === RiskStatus.DeletedRisks) {
        showHelper(`${risk.name} has been closed.`);
      } else {
        const { severityLabel } = getRiskStatusLabel(
          `${status}${severity ? severity : ''}`
        );

        const sentence = `${risk.name} has been moved to Severity ${severityLabel}.`;
        showHelper(sentence);
      }
    });
  }

  const renderItemDetails = useCallback(
    (item: Risk) => {
      const { severity } = getRiskStatusLabel(item.status);
      return (
        <div
          className="flex w-full cursor-pointer items-center gap-2 p-4 hover:bg-gray-100"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            const link = getRiskDrawerLink(item as Risk);
            link && navigate(link);
          }}
        >
          <div className="flex flex-1 items-center space-x-3 overflow-hidden">
            {getSeverityButton(severity)}
            <div className="flex flex-1 items-center space-x-3 overflow-hidden">
              <div className="flex w-full flex-col overflow-hidden">
                <Tooltip title={item.name ?? item.key}>
                  <span className="truncate text-base font-semibold text-indigo-500">
                    {item.name}
                  </span>
                </Tooltip>
                <span className="text-sm text-gray-500">{item.dns}</span>
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {item.created !== item.updated ? (
              <Tooltip title={`Created ${formatDate(item.created)}`}>
                Identified {formatDate(item.updated)}
              </Tooltip>
            ) : (
              <span>
                {'Identified'} {formatDate(item.created)}
              </span>
            )}
          </span>
          {riskType === 'Material' && (
            <Tooltip placement="top" title="Remediate the Risk">
              <Button
                styleType="primary"
                className="h-8"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRiskChange(item, RiskStatus.Remediated, severity);
                }}
                disabled={updateRiskStatus === 'pending'}
              >
                Yes
              </Button>
            </Tooltip>
          )}
          {riskType === 'Severity' && (
            <ClosedStateModal
              type="dropdown"
              risk={item}
              isOpen
              onClose={() => {}}
              onSuccess={showHelper}
            />
          )}
          {riskType === 'Exposure' && (
            <>
              <Tooltip placement="top" title="Open the Risk">
                <Button
                  styleType="primary"
                  className="h-8"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRiskChange(item, RiskStatus.Opened, RiskSeverity.Low);
                  }}
                  disabled={updateRiskStatus === 'pending'}
                >
                  Yes
                </Button>
              </Tooltip>
              <ClosedStateModal
                type="dropdownWithNoButton"
                risk={item}
                isOpen
                onClose={() => {}}
                onSuccess={showHelper}
              />
            </>
          )}
        </div>
      );
    },
    [riskType]
  );

  const riskPageColumns = useMemo((): TableProps<Risk>['columns'] => {
    return [
      {
        id: '',
        label: '',
        cell: renderItemDetails,
        className: cn(dataStatus === 'success' && 'p-0'),
      },
    ];
  }, [renderItemDetails, dataStatus]);

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
        addNew={{ onClick: () => onOpenRiskChange(true, 'selectorScreen') }}
        search={{
          value: filters.search,
          onChange: search => {
            setFilters({ search, query: '' });
          },
        }}
        className="h-0 min-h-0"
        name="risk"
        otherFilters={
          <div
            className={cn(
              'flex flex-col gap-2 m-4 mb-0 bg-white border border-gray-300 py-2 px-5 rounded-sm',
              filters.query === 'status:OX' && 'border-[3px] border-brand/20'
            )}
          >
            <div className="py-1 flex items-center justify-between gap-2 ">
              <h1 className="font-semibold">Material Risks</h1>
              <ShieldExclamationIcon className="size-5" />
            </div>
            <p className="font-medium text-xs text-center px-2 text-gray-500">
              “The determination of whether an error is material is an objective
              assessment focused on whether there is a substantial likelihood it
              is important to the reasonable investor.”
            </p>
            <Button
              className="m-auto mb-2 bg-red-600 text-white"
              onClick={() => {
                setFilters({ search: '', query: 'status:OX' });
              }}
            >
              View Material Risks
            </Button>
          </div>
        }
        filter={{
          value: filters.query ? [filters.query] : [],
          onChange: alerts => {
            setFilters({
              ...filters,
              search: '',
              query: alerts[0] || '',
            });
          },
          allowEmpty: false,
          category,
          status: alertsStatus,
          alert: {
            value: (alertsWithoutAttributes || []).map(alert => alert.value),
          },
        }}
        export={{
          onClick: () => {
            setExportingFilter(filters);
          },
          isExporting: exportingQuery !== '',
          disbled: items.length === 0,
        }}
        tableHeader={
          <div className="w-full">
            <div className="flex w-full items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">
                {filters.query.startsWith('exposure')
                  ? 'Are these exposures risks?'
                  : 'Open Risks'}
              </h1>
              {selectedCategory.alert && (
                <AlertIcon
                  value={[filters.query]}
                  currentValue={filters.query}
                  styleType="button"
                  onRemove={() => setFilters({ search: '', query: '' })}
                />
              )}
            </div>
          </div>
        }
      >
        <Table
          tableClassName="border-none"
          isTableView
          hideTableHeader
          data={items}
          status={dataStatus}
          columns={riskPageColumns}
          error={error}
          name="risk"
          fetchNextPage={fetchRisksNextPage}
          noData={{
            title: filters.search
              ? 'Your search returned no result'
              : 'All Clear!',
            description: filters.search
              ? ''
              : 'Great job! No risks have been detected in your environment.\nKeep monitoring to stay secure.',
          }}
        />
      </FancyTable>
      <Drawer
        open={isCTAOpen}
        onClose={closeCTADrawer}
        onBack={closeCTADrawer}
        className={'w-full rounded-t-sm bg-zinc-100 p-0 shadow-lg'}
        skipBack={true}
        zIndex={11}
      >
        <div className="mx-12 mt-6">
          <div className="flex w-full flex-row items-center justify-between">
            <h1 className="mb-4 text-xl font-extrabold">
              Review Non-Open Risks
            </h1>
            <div className="flex gap-2">
              <SelectableTab
                isSelected={drawerFilter.query === 'status:T'}
                onClick={() => {
                  setDrawerFilter({ query: 'status:T', search: '' });
                }}
              >
                Pending
              </SelectableTab>
              <div className="h-auto border-l border-dashed border-gray-500 m-1" />
              <SelectableTab
                isSelected={drawerFilter.query === 'status:R'}
                onClick={() => {
                  setDrawerFilter({ query: 'status:R', search: '' });
                }}
              >
                Remediated
              </SelectableTab>
              <SelectableTab
                isSelected={drawerFilter.query === 'status:D'}
                onClick={() => {
                  setDrawerFilter({ query: 'status:D', search: '' });
                }}
              >
                Noise
              </SelectableTab>
            </div>
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
            noData={{
              icon: <ShieldExclamationIcon className="size-16 text-gray-400" />,
              title:
                drawerFilter.query === 'status:R'
                  ? 'No Remediated Risks Yet'
                  : drawerFilter.query === 'status:T'
                    ? 'No Pending Risks'
                    : 'No Noisy Risks',
              description: drawerFilter.query === 'status:R' && (
                <>
                  <p className="mb-6 text-center text-lg text-gray-500">
                    A risk is a potential security issue that affects your
                    system. You can view the risk details, including the
                    description and remediation steps, for guidance on resolving
                    it.
                  </p>
                  <ul className="mb-6 text-left text-gray-600">
                    <li className="mb-2">
                      1. Open the risk to review its description and suggested
                      remediation. If a remediation isn&apos;t available, you
                      can generate one directly.
                    </li>
                    <li className="mb-2">
                      2. Review the proof of exploit, showing the detection
                      details and impacted assets.
                    </li>
                    <li className="mb-2">
                      3. We automatically recheck every 30 minutes. If it&apos;s
                      fixed, we&apos;ll close it for you, or you can manually
                      close it if you&apos;re certain it&apos;s no longer a
                      risk.
                    </li>
                  </ul>
                  <div className="text-gray-500">
                    {currentPlan === 'managed' ? (
                      <p className="mt-4 text-center text-lg text-gray-500">
                        As a managed service customer, we can assist you with
                        this process.
                      </p>
                    ) : (
                      <p className="mt-4 text-center text-lg text-gray-500">
                        Need help? Reach out to us about upgrading to our
                        managed service plan.
                      </p>
                    )}
                  </div>
                </>
              ),
            }}
          />
        </div>
      </Drawer>
    </>
  );
};

export default RisksBeta;

const securityAlertLookup = (status: string) => {
  switch (status) {
    case 'O':
      return 'Requires Remediation';
    case 'R':
      return 'Remediated';
    case 'T':
      return 'Pending Triage';
    default:
      return status;
  }
};

function getRisks(
  data: GenericResource | undefined,
  riskType: 'Material' | 'Severity' | 'Exposure'
) {
  const queryRisks = data?.risks || [];

  const filteredRisks =
    riskType === 'Exposure'
      ? queryRisks.filter(risk => {
          return risk.status.includes(RiskStatus.ExposedRisks);
        })
      : queryRisks;

  return riskType === 'Exposure'
    ? sortBySeverityAndUpdated(filteredRisks)
    : queryRisks;
}

function SelectableTab({
  children,
  isSelected,
  onClick,
}: {
  children: string;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'font-semibold px-2 cursor-pointer',
        isSelected && 'text-brand border-b-[2px] border-brand'
      )}
    >
      {children}
    </div>
  );
}

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
