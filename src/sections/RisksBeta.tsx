import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import {
  getRiskSeverityIcon,
  getSeverityButton,
} from '@/components/icons/RiskSeverity.icon';
import { getRiskStatusIcon } from '@/components/icons/RiskStatus.icon';
import { Loader } from '@/components/Loader';
import { Table } from '@/components/table/Table';
import { Columns, TableProps } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { ClosedStateModal } from '@/components/ui/ClosedStateModal';
import { useMy } from '@/hooks';
import { useAxios } from '@/hooks/useAxios';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { useUpdateRisk } from '@/hooks/useRisks';
import {
  AlertIcon,
  buildOpenRiskDataset,
  CategoryFilterProps,
  FancyTable,
} from '@/sections/Assets';
import { RenderHeaderExtraContentSection } from '@/sections/AuthenticatedApp';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { getCurrentPlan } from '@/sections/overview/Overview';
import RiskNotificationBar from '@/sections/RiskNotificationBar';
import { parseKeys } from '@/sections/SearchByType';
import { useAuth } from '@/state/auth';
import { useGlobalState } from '@/state/global.state';
import {
  AssetStatus,
  Attribute,
  GenericResource,
  Risk,
  RiskFilters,
  RiskSeverity,
  RiskStatus,
  RiskStatusLabel,
  SeverityDef,
} from '@/types';
import { mergeStatus, useMergeStatus, useQueries } from '@/utils/api';
import { partition } from '@/utils/array.util';
import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';
import { Regex } from '@/utils/regex.util';
import { getRiskStatusLabel } from '@/utils/riskStatus.util';
import { sortBySeverityAndUpdated } from '@/utils/sortBySeverityAndUpdated.util';
import { useQueryFilters } from '@/utils/storage/useQueryParams.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { generatePathWithSearch, useSearchParams } from '@/utils/url.util';

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

  const { riskNotification: riskNotificationGlobal } = useGlobalState();
  const { value: riskNotification, onChange: setRiskNotification } =
    riskNotificationGlobal;

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

  const riskType = filters.search
    ? 'Search'
    : filters.query.startsWith('status:')
      ? filters.query.startsWith('status:OX')
        ? 'Material'
        : 'Severity'
      : 'Exposure';

  const {
    data: queryData,
    refetch: refetchData,
    status: queryDataStatus,
    error: error,
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

  const { data: openRisks, status: openRisksStatus } = useGenericSearch({
    query: 'status:O',
  });

  const { data: risksMaterial, status: risksMaterialStatus } = useGenericSearch(
    {
      query: 'status:OX',
    }
  );

  const risksMaterialExist =
    risksMaterial?.risks.length && risksMaterial?.risks.length > 0;

  const openRiskDataset = useMemo(() => {
    return (openRisks?.risks || []).reduce(
      (acc, risk) => {
        return {
          ...acc,
          [risk.key]: true,
        };
      },
      {} as Record<string, boolean>
    );
  }, [JSON.stringify({ risks: openRisks?.risks })]);

  const riskItems = useMemo(
    () => getRisks(queryData, riskType),
    [riskType, JSON.stringify({ queryData })]
  );

  const axios = useAxios();

  const materialRisks = riskItems.filter(risk => risk.status.endsWith('X'));
  const materialRisksExists = materialRisks.length > 0;

  const { status: materialRiskAttributesStatus, data: materialRiskAttributes } =
    useQueries({
      queries: materialRisks.map(risk => {
        return {
          queryKey: ['MaterialRiskAttributes', risk.key],
          queryFn: async () => {
            const { dns, name } = parseKeys.riskKey(risk.key);

            const { data } = await axios.get<GenericResource>(`/my`, {
              params: {
                key: `source:#risk#${dns}#${name}`,
                exact: true,
              },
            });

            return data?.attributes || [];
          },
        };
      }),
      combine: results => {
        return {
          data: results.reduce(
            (acc, result, index) => {
              return {
                ...acc,
                [materialRisks[index].key]:
                  result.data?.filter(att => att.value.startsWith('#risk')) ||
                  [],
              };
            },
            {} as Record<string, Attribute[]>
          ),
          status: mergeStatus(...results.map(result => result.status)),
        };
      },
    });

  const dataStatus = useMergeStatus(
    queryDataStatus,
    openRisksStatus,
    materialRisksExists ? materialRiskAttributesStatus : 'success'
  );

  type LocalRisk = Risk & { remediatedText?: string };

  const items = useMemo(() => {
    return riskItems.map((risk): LocalRisk => {
      if (risk.status.endsWith('X')) {
        const attributes = materialRiskAttributes?.[risk.key] || [];

        const openRisk = attributes.filter(
          att => openRiskDataset[att.value]
        ).length;

        const remediatedRiskCount = attributes.length - openRisk;

        return {
          ...risk,
          remediatedText: `${remediatedRiskCount} of ${attributes.length} risks remediated`,
        };
      }

      return risk;
    });
  }, [riskItems, JSON.stringify({ materialRiskAttributes, openRiskDataset })]);

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

  const columns: Columns<LocalRisk> = useMemo(
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
        fixedWidth: 90,
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
      setRiskNotification({ message });
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

  const renderItemDetails = useCallback((item: LocalRisk) => {
    const { severity, status } = getRiskStatusLabel(item.status);
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
              <span className="text-sm text-gray-500">
                {item.remediatedText || item.dns}
              </span>
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
        {severity.toString() === 'X' && (
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
        {severity.toString() !== 'X' && status === RiskStatus.Opened && (
          <ClosedStateModal
            type="dropdown"
            risk={item}
            isOpen
            onClose={() => {}}
            onSuccess={showHelper}
          />
        )}
        {status === RiskStatus.ExposedRisks && (
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
  }, []);

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
          className="m-auto flex w-full flex-col items-center rounded-lg border-2 border-dashed border-header-dark bg-header p-4 pb-6 text-center"
        >
          <Loader className="w-8" isLoading={risksStatus === 'pending'}>
            {hasRemediatedRisk ? (
              <CheckCircleIcon className="size-10 text-green-400" />
            ) : (
              <BellIcon className="size-10 animate-bounce text-white" />
            )}
          </Loader>
          <h1 className="text-2xl font-bold text-white">
            {hasRemediatedRisk
              ? `${risksGeneric?.risks?.length} Risks Remediated`
              : 'Remediate a Risk'}
          </h1>
          <p className="max-w-[700px] text-sm text-white/70">
            Keep your environment secure by addressing risks regularly
          </p>
        </div>
      </RenderHeaderExtraContentSection>

      <div className="relative">
        {/* The RiskNotificationBar appears on top of the list */}
        {riskNotification && (
          <RiskNotificationBar
            message={riskNotification.message}
            onClose={() => setRiskNotification(null)}
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
            <div className="flex items-center justify-between gap-2 py-1 ">
              <h1 className="font-semibold">Material Risks</h1>
              {risksMaterialExist ? (
                <ShieldExclamationIcon className="size-5" />
              ) : (
                <CheckCircleIcon className="size-5 text-green-500" />
              )}
            </div>
            <p className="px-2 text-center text-xs font-medium text-gray-500">
              “The determination of whether an error is material is an objective
              assessment focused on whether there is a substantial likelihood it
              is important to the reasonable investor.”
            </p>
            {risksMaterialExist ? (
              <Button
                className="m-auto mb-2 bg-red-600 text-white"
                onClick={() => {
                  setFilters({ search: '', query: 'status:OX' });
                }}
              >
                View Material Risks
              </Button>
            ) : null}
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
                {riskType === 'Search' ? (
                  <div className="flex items-center gap-2">
                    Search:
                    <p className="text-lg font-semibold text-gray-500">
                      {filters.search}
                    </p>
                  </div>
                ) : riskType === 'Exposure' ? (
                  'Are these exposures risks?'
                ) : riskType === 'Severity' ? (
                  <div className="flex items-center gap-2">
                    Open Risks:
                    <p className="text-lg font-semibold text-gray-500">
                      {
                        SeverityDef[
                          filters.query.split(':')[1].slice(-1) as RiskSeverity
                        ]
                      }
                    </p>
                  </div>
                ) : (
                  'Material Risks'
                )}
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
        <div className="px-12 pt-6 size-full flex flex-col">
          <div className="flex w-full flex-col items-start gap-2 shrink-0">
            <div className="flex gap-2">
              <SelectableTab
                isSelected={drawerFilter.query === 'status:T'}
                onClick={() => {
                  setDrawerFilter({ query: 'status:T', search: '' });
                }}
              >
                Pending
              </SelectableTab>
              <div className="m-1 h-auto border-l border-dashed border-gray-500" />
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
            <div className="text-gray-500 pb-4">
              {drawerFilter.query === 'status:T'
                ? `These risks are awaiting review. Take action by opening or rejecting them to keep your security posture strong.`
                : drawerFilter.query === 'status:R'
                  ? 'Great work! These security vulnerabilities have been fixed and no longer pose a threat.'
                  : 'These risks have been filtered out due to being false positives or deemed unimportant for your environment.'}
            </div>
          </div>
          <div className="overflow-auto h-full">
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
                icon: (
                  <ShieldExclamationIcon className="size-16 text-gray-400" />
                ),
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
                      description and remediation steps, for guidance on
                      resolving it.
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
                        3. We automatically recheck every 30 minutes. If
                        it&apos;s fixed, we&apos;ll close it for you, or you can
                        manually close it if you&apos;re certain it&apos;s no
                        longer a risk.
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
        </div>
      </Drawer>
    </>
  );
};

export default RisksBeta;

function getRisks(
  data: GenericResource | undefined,
  riskType: 'Material' | 'Severity' | 'Exposure' | 'Search'
) {
  const queryRisks = data?.risks || [];

  const filteredRisks =
    riskType === 'Exposure'
      ? queryRisks.filter(risk => {
          return risk.status.includes(RiskStatus.ExposedRisks);
        })
      : queryRisks;

  return riskType === 'Exposure' || riskType === 'Search'
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
  [RiskStatus.Triaged]: 'Is this risk valid?',
  [AssetStatus.ActiveLow]: 'Should this asset be scanned for risks?',
  [RiskStatus.ExposedRisks]: 'Is this exposure valid?',
};
