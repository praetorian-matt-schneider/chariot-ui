import React, {
  PropsWithChildren,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  BellAlertIcon,
  BellSlashIcon,
  CheckIcon,
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  BellIcon,
  CheckCircleIcon,
  PuzzlePieceIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid';

import { Accordian } from '@/components/Accordian';
import { Button } from '@/components/Button';
import { ConditionalRender } from '@/components/ConditionalRender';
import { Drawer } from '@/components/Drawer';
import { Dropdown } from '@/components/Dropdown';
import { DEFAULT_CONDITIONS } from '@/components/form/constants';
import { InputText } from '@/components/form/InputText';
import { RisksIcon } from '@/components/icons';
import { getAssetStatusIcon } from '@/components/icons/AssetStatus.icon';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { Loader } from '@/components/Loader';
import { Table } from '@/components/table/Table';
import { Columns, TableActions } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { useMy } from '@/hooks';
import { useAddAlert, useRemoveAlert } from '@/hooks/useAlerts';
import { PartialAsset, useGetAssets, useUpdateAsset } from '@/hooks/useAssets';
import { useCounts } from '@/hooks/useCounts';
import { useIntegration } from '@/hooks/useIntegration';
import { useBulkReRunJob } from '@/hooks/useJobs';
import { AlertCategory } from '@/sections/Alerts';
import { AssetStatusWarning } from '@/sections/AssetStatusWarning';
import { RenderHeaderExtraContentSection } from '@/sections/AuthenticatedApp';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import {
  availableAttackSurfaceIntegrationsKeys,
  availableRiskIntegrations,
  availableRiskIntegrationsKeys,
  Integrations,
} from '@/sections/overview/Integrations';
import { parseKeys } from '@/sections/SearchByType';
import { useGlobalState } from '@/state/global.state';
import {
  AssetStatus,
  AssetStatusLabel,
  Risk,
  RiskSeverity,
  RiskStatus,
  Severity,
  SeverityDef,
  SeverityOpenCounts,
} from '@/types';
import { QueryStatus, useMergeStatus } from '@/utils/api';
import { cn } from '@/utils/classname';
import { capitalize } from '@/utils/lodash.util';
import { useGetScreenSize } from '@/utils/misc.util';
import { Regex } from '@/utils/regex.util';
import { getRiskSeverity, getRiskStatus } from '@/utils/riskStatus.util';
import { useSticky } from '@/utils/sticky.util';
import { useSearchParams } from '@/utils/url.util';

export function buildOpenRiskDataset(
  risks: Risk[]
): Record<string, SeverityOpenCounts> {
  return risks.reduce(
    (acc, risk) => {
      const status = getRiskStatus(risk.status);
      const severity = getRiskSeverity(risk.status);
      if (status !== RiskStatus.Opened) {
        return acc; // Skip this risk if is not in 'Open' status
      }

      return {
        ...acc,
        [risk.dns]: {
          ...(acc?.[risk?.dns] || {}),
          [severity]: [...(acc[risk.dns]?.[severity] || []), risk],
        },
      };
    },
    {} as Record<string, SeverityOpenCounts>
  );
}

const Assets: React.FC = () => {
  const {
    modal: {
      risk: {
        onOpenChange: setShowAddRisk,
        selectedAssets,
        onSelectedAssetsChange: setSelectedAssets,
      },
      asset: { onOpenChange: setShowAddAsset },
    },
  } = useGlobalState();

  const {
    data: assets,
    status: assetsStatus,
    error: assetsError,
    fetchNextPage,
    isFetchingNextPage,
    filters,
    setFilters,
  } = useGetAssets();
  const {
    data: attributeCounts = {} as Record<string, number>,
    status: attributeCountsStatus,
  } = useCombineAttributesCount();

  const {
    data: alerts,
    status: alertsStatus,
    refetch,
  } = useMy({
    resource: 'condition',
  });
  const { data: accounts, status: accountsStatus } = useMy({
    resource: 'account',
  });

  const integratedAttackSurface = useMemo(() => {
    return [
      ...new Set(
        accounts
          .filter(account => {
            return (
              availableAttackSurfaceIntegrationsKeys.includes(account.member) &&
              !['waitlisted', 'setup'].includes(account.value || '')
            );
          })
          .map(account => {
            return account.member;
          })
      ),
    ];
  }, [JSON.stringify(accounts)]);

  const { mutateAsync: bulkReRunJob } = useBulkReRunJob();
  const { mutateAsync: addAlert } = useAddAlert();
  const { mutateAsync: removeAlert } = useRemoveAlert();

  const { getAssetDrawerLink } = getDrawerLink();
  const {
    data: { integrations },
  } = useIntegration();
  const { mutateAsync: updateAsset } = useUpdateAsset();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showAssetStatusWarning, setShowAssetStatusWarning] =
    useState<boolean>(false);
  const [assetStatus, setAssetStatus] = useState<AssetStatus | ''>('');

  useEffect(() => {
    setSelectedRows([]);
  }, [JSON.stringify(filters)]);

  const columns: Columns<PartialAsset> = useMemo(() => {
    const selectedRowData = selectedRows
      .map(i => assets[Number(i)])
      .filter(Boolean);

    return [
      {
        label: '',
        id: 'name',
        to: item => getAssetDrawerLink(item),
        cell: asset => {
          const integration = integrations.find(
            account => account.member === asset.dns
          );

          return (
            <div className="flex items-center gap-2 text-black">
              <p className="font-semibold text-indigo-500">{asset.name}</p>
              <p className="text-blueGray-500">{asset.dns}</p>
              <RiskSummary riskSummary={asset.riskSummary} />
              {integration && (
                <Tooltip title="Integration">
                  <PuzzlePieceIcon className="size-5" />
                </Tooltip>
              )}
            </div>
          );
        },
        className: 'w-full h-full [&_button]:justify-start',
        copy: true,
      },
      {
        label: (
          <Tooltip
            title={selectedRows.length === 0 ? `No assets selected.` : ''}
          >
            <div className="h-4">
              <Dropdown
                className="absolute right-[-21px] top-2 -mr-10 h-4 text-sm font-semibold text-black "
                styleType="none"
                endIcon={<ChevronDownIcon className="size-3 stroke-[4px]" />}
                disabled={selectedRows.length === 0}
                {...renderActions(selectedRowData)}
              >
                Bulk actions
              </Dropdown>
            </div>
          </Tooltip>
        ),
        id: 'updated',
        cell: 'date',
        className: 'text-blueGray-500',
      },
    ];
  }, [JSON.stringify({ selectedRows, assets })]);
  const category = useMemo(() => {
    const nonDuplicateAttributes = Object.entries(attributeCounts).reduce(
      (acc, [attributeKey, value]) => {
        const [, attributeName = '', attributeValue = ''] =
          attributeKey.match(Regex.ATTIBUTE_KEY) || [];

        const currentATTvalue = acc[attributeName] || [];

        if (!['cloud', 'port', 'protocol'].includes(attributeName)) {
          return acc;
        }

        if (attributeName === 'cloud') {
          const parsedAttValue =
            attributeValue.match(/arn:aws:([^:]+)/)?.[0] || '';

          if (parsedAttValue) {
            if (
              !currentATTvalue.find(({ label }) => label === parsedAttValue)
            ) {
              currentATTvalue.push({
                label: parsedAttValue,
                count: value.toString(),
                value: `#attribute#cloud#${parsedAttValue}`,
              });
            }
          } else {
            currentATTvalue.push({
              label: attributeValue,
              count: value.toString(),
              value: `${attributeKey}#`,
            });
          }
        } else {
          currentATTvalue.push({
            label: attributeValue,
            count: value.toString(),
            value: `${attributeKey}#`,
          });
        }

        const updatedAttributes = {
          ...acc,
          [attributeName]: currentATTvalue,
        };

        // If the attribute is 'port', sort by numeric port value
        if (attributeName === 'port') {
          updatedAttributes[attributeName] = updatedAttributes[
            attributeName
          ].sort((a, b) => parseInt(a.label) - parseInt(b.label));
        }

        return updatedAttributes;
      },
      {} as Record<string, { label: string; count: string; value: string }[]>
    );

    return [
      {
        label: 'Recently Discovered',
        options: [
          {
            label: 'Last 24 hours',
            value: '#attribute#new#',
            count: '',
          },
        ],
      },
      ...(integratedAttackSurface.length > 0
        ? [
            {
              label: 'Surface',
              options: [
                {
                  label: 'Provided',
                  value: 'source:provided',
                  count: '',
                },
                ...integratedAttackSurface.map(surface => {
                  return {
                    label:
                      Integrations[surface as keyof typeof Integrations].name,
                    value: `#attribute#source##asset#${surface}`,
                    count: '',
                  };
                }),
              ],
            },
          ]
        : []),
      ...Object.entries(nonDuplicateAttributes).map(([label, value]) => {
        return {
          label: capitalize(label),
          options: value,
        };
      }),
    ];
  }, [
    JSON.stringify({
      attributeCounts,
      integratedAttackSurface,
    }),
  ]);

  function updateStatus(assets: string[], status: AssetStatus) {
    setShowAssetStatusWarning(false);
    setAssetStatus('');

    assets.forEach(assetKey => {
      updateAsset(
        {
          key: assetKey,
          name: parseKeys.assetKey(assetKey).name,
          status,
        },
        {
          onSuccess: () => {
            setSelectedRows([]);
          },
        }
      );
    });
  }

  function renderActions(assets: PartialAsset[]): TableActions {
    return {
      menu: {
        items: [
          {
            label: 'Add Risk',
            icon: <RisksIcon />,
            onClick: () => {
              setSelectedAssets(assets.map(asset => asset.key));
              setShowAddRisk(true);
            },
          },
          { type: 'divider', label: 'Divider' },
          {
            label: 'Scan Type',
            type: 'label',
          },
          {
            label: AssetStatusLabel[AssetStatus.ActiveHigh],
            icon: getAssetStatusIcon(AssetStatus.ActiveHigh),
            onClick: () => {
              setSelectedAssets(assets.map(asset => asset.key));
              setShowAssetStatusWarning(true);
              setAssetStatus(AssetStatus.ActiveHigh);
            },
          },
          {
            label: AssetStatusLabel[AssetStatus.Active],
            icon: getAssetStatusIcon(AssetStatus.Active),
            onClick: () => {
              updateStatus(
                assets.map(asset => asset.key),
                AssetStatus.Active
              );
            },
          },
          {
            label: AssetStatusLabel[AssetStatus.ActiveLow],
            icon: getAssetStatusIcon(AssetStatus.ActiveLow),
            onClick: () =>
              updateStatus(
                assets.map(asset => asset.key),
                AssetStatus.ActiveLow
              ),
          },
          { type: 'divider', label: 'Divider' },
          {
            label: 'Stop Scanning',
            type: 'label',
          },
          {
            label: AssetStatusLabel[AssetStatus.Frozen],
            icon: getAssetStatusIcon(AssetStatus.Frozen),
            onClick: () => {
              setSelectedAssets(assets.map(asset => asset.key));
              setShowAssetStatusWarning(true);
              setAssetStatus(AssetStatus.Frozen);
            },
          },
          {
            label: AssetStatusLabel[AssetStatus.Deleted],
            icon: getAssetStatusIcon(AssetStatus.Deleted),
            onClick: () => {
              setSelectedAssets(assets.map(asset => asset.key));
              setShowAssetStatusWarning(true);
              setAssetStatus(AssetStatus.Deleted);
            },
          },
          { type: 'divider', label: 'Divider' },
          {
            label: 'Scan now',
            onClick: () => {
              bulkReRunJob(
                assets.map(asset => {
                  return {
                    capability: 'nuclei',
                    jobKey: `#asset#${asset.name}#${asset.dns}`,
                  };
                })
              );
            },
          },
        ],
      },
    };
  }

  const hasCustomAttributes = useMemo(() => {
    return alerts.some(alert => alert.key.match(Regex.CUSTOM_ALERT_KEY));
  }, [alerts]);

  const [isCTAOpen, setIsCTAOpen] = useState<boolean>(false);
  const [selectedConditions] = useState([]);

  const closeCTADrawer = () => {
    setIsCTAOpen(false);
  };
  const ports = Object.keys(attributeCounts).filter(key =>
    key.match('#attribute#port#')
  );
  const protocols = Object.keys(attributeCounts).filter(key =>
    key.match('#attribute#protocol#')
  );
  const clouds = Object.keys(attributeCounts).filter(key =>
    key.match('#attribute#cloud#')
  );
  const surfaces = Object.keys(attributeCounts).filter(key =>
    key.match('#attribute#source##asset#')
  );

  // Open the drawer based on the search params
  const { searchParams, removeSearchParams } = useSearchParams();
  useEffect(() => {
    if (searchParams) {
      const params = new URLSearchParams(searchParams);
      const action = params.get('action');
      if (action) {
        if (action === 'set-exposure-alerts') {
          setIsCTAOpen(true);
        }
      }
      // clear the search params
      removeSearchParams('action');
    }
  }, [searchParams]);

  return (
    <>
      <RenderHeaderExtraContentSection>
        <div
          role="button"
          onClick={() => setIsCTAOpen(true)}
          className="m-auto flex w-full cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-header-dark bg-header p-8 text-center"
        >
          <Loader className="w-8" isLoading={alertsStatus === 'pending'}>
            {hasCustomAttributes ? (
              <CheckCircleIcon className="size-10 text-green-400" />
            ) : (
              <BellIcon className="size-10 animate-bounce text-white" />
            )}
          </Loader>
          <h1 className="text-3xl font-bold text-white">Set exposure alerts</h1>
          <p className="max-w-[700px] text-sm text-gray-500">
            Subscribe to changes in your attack surface and get notified when
            new assets are discovered
          </p>
        </div>
      </RenderHeaderExtraContentSection>
      <Drawer
        open={isCTAOpen}
        onClose={closeCTADrawer}
        onBack={closeCTADrawer}
        className={cn('w-full rounded-t-sm shadow-lg p-0 bg-zinc-100')}
        skipBack={true}
        footer={
          selectedConditions.length > 0 && (
            <Button
              styleType="primary"
              className="mx-20 mb-10 h-20 w-full text-xl font-bold"
              onClick={async () => {
                // add integration   accounts
                // const promises = selectedAttackSurfaceIntegrations
                //   .map((integration: string) => {

                //     return link({
                //       username: integration,
                //       value: isWaitlisted ? 'waitlisted' : 'setup',
                //       config: {},
                //     });
                //   })
                //   .map(promise => promise.catch(error => error));

                // const response = await Promise.all(promises);

                // const validResults = response.filter(
                //   result => !(result instanceof Error)
                // );

                // if (validResults.length > 0) {
                //   invalidateAccounts();
                // }

                closeCTADrawer();
              }}
            >
              Add Conditions ({selectedConditions.length} selected)
            </Button>
          )
        }
      >
        <div className="mx-12 mt-6 pb-10">
          <div className="flex w-full flex-row items-center justify-between">
            <h1 className="mb-4 text-4xl font-extrabold">
              Customize Your Exposure Alerts
            </h1>
            <div className="flex flex-row items-center">
              <Button
                styleType="primary"
                className="-translate-x-2 text-sm font-semibold"
                onClick={() => {
                  Object.keys(DEFAULT_CONDITIONS).forEach(key => {
                    DEFAULT_CONDITIONS[
                      key as keyof typeof DEFAULT_CONDITIONS
                    ].forEach(value => {
                      addAlert({
                        value: `exposure-${key}-${value}`,
                        name: `exposure-${key}-${value}`,
                      });
                    });
                  });
                  closeCTADrawer();
                }}
              >
                Apply Default Policy
              </Button>
            </div>
          </div>
          <div className="flex w-full flex-row justify-between gap-x-10">
            <AlertCategory
              title="Recently Discovered"
              icon={<img src="/icons/new.svg" className="size-20" />}
              items={['#attribute#new#']}
              alerts={alerts}
              refetch={refetch}
              addAlert={addAlert}
              removeAlert={removeAlert}
              attributeExtractor={item => item.split('#')[3]}
            />
            <AlertCategory
              title="Port"
              icon={<img src="/icons/port.svg" className="size-20" />}
              items={ports}
              alerts={alerts}
              refetch={refetch}
              addAlert={addAlert}
              removeAlert={removeAlert}
              attributeExtractor={item => item.split('#')[3]}
            />
            <AlertCategory
              title="Protocol"
              icon={<img src="/icons/shake.svg" className="size-20" />}
              items={protocols}
              alerts={alerts}
              refetch={refetch}
              addAlert={addAlert}
              removeAlert={removeAlert}
              attributeExtractor={item => item.split('#')[3]}
            />
            <AlertCategory
              title="Cloud"
              icon={<img src="/icons/lambda.svg" className="size-20" />}
              items={clouds}
              alerts={alerts}
              refetch={refetch}
              addAlert={addAlert}
              removeAlert={removeAlert}
              attributeExtractor={item => item.split('#')[3]}
            />
            <AlertCategory
              title="Surface"
              icon={<PuzzlePieceIcon className="size-20" />}
              items={surfaces}
              alerts={alerts}
              refetch={refetch}
              addAlert={addAlert}
              removeAlert={removeAlert}
              attributeExtractor={item => item.split('#')[4]}
            />
          </div>
        </div>
      </Drawer>
      <FancyTable
        addNew={{ onClick: () => setShowAddAsset(true) }}
        search={{
          value: filters.search,
          onChange: search => {
            setFilters({ search, attributes: [] });
          },
        }}
        filter={{
          value: filters.attributes,
          onChange: attributes => {
            setFilters({ attributes, search: '' });
          },
          category,
          status: useMergeStatus(accountsStatus, attributeCountsStatus),
          alert: {
            value: alerts.map(alert => alert.value),
          },
        }}
        name="asset"
      >
        <Table
          isTableView
          name="asset"
          selection={{
            value: selectedRows,
            onChange: setSelectedRows,
            selectAll: false,
          }}
          rowActions={(asset: PartialAsset) => {
            const assets = [asset];

            if (!asset) {
              return {
                menu: {
                  items: [],
                },
              };
            }

            return renderActions(assets);
          }}
          tableClassName="border-none"
          columns={columns}
          data={assets}
          error={assetsError}
          status={assetsStatus}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          noData={{
            title: 'No Assets found',
            description: filters.search
              ? 'Add an asset now to get started'
              : 'No assets found with this filter',
          }}
        />
      </FancyTable>
      <AssetStatusWarning
        open={showAssetStatusWarning}
        onClose={() => setShowAssetStatusWarning(false)}
        status={assetStatus}
        onConfirm={() => {
          if (assetStatus) {
            updateStatus(selectedAssets, assetStatus);
          }
        }}
      />
    </>
  );
};

export default Assets;

interface CategoryFilterProps {
  alert?: Omit<AlertIconProps, 'currentValue'>;
  value: string[];
  onChange: (value: string[]) => void;
  category: {
    showCount?: boolean;
    label: string;
    options: { label: string; value: string; count: string }[];
  }[];
  status: QueryStatus;
  className?: string;
  hideHeader?: boolean;
}

export function CategoryFilter(props: CategoryFilterProps) {
  const {
    value = [],
    category,
    status,
    onChange,
    className,
    alert,
    hideHeader,
  } = props;

  return (
    <div className={cn('flex flex-col gap-1 p-4', className)}>
      {hideHeader ? null : (
        <h1 className="flex items-center space-x-1 text-sm font-semibold">
          Configure Alerts
          <Tooltip
            title="Click the notification bell to get notified whenever a new asset with this attribute is detected."
            placement="top"
          >
            <QuestionMarkCircleIcon className="size-4 stroke-[2px] text-gray-400" />
          </Tooltip>
        </h1>
      )}
      {category.length > 0 && (
        <ul className="flex flex-col gap-3">
          {category.map((item, index) => {
            const isOptionSelectedOnInit = Boolean(
              item.options.find(option => value.includes(option.value))
            );

            return (
              <li
                key={index}
                className={
                  item.options.filter(option => value.includes(option.value))
                    .length > 0
                    ? 'rounded-sm border-2 border-brand/20'
                    : ''
                }
              >
                <Accordian
                  defaultValue={isOptionSelectedOnInit}
                  title={item.label}
                  headerClassName="px-3"
                  contentClassName={cn('max-h-52 overflow-auto')}
                >
                  {item.options.map((option, index) => {
                    return (
                      <div
                        className={cn(
                          'flex items-center rounded-sm px-3 cursor-pointer text-sm font-medium py-2 gap-2',
                          index % 2 !== 0 ? 'bg-layer1' : '',

                          value.includes(option.value) && 'bg-brand/20'
                        )}
                        key={index}
                        onClick={e => {
                          e.stopPropagation();
                          if (value.includes(option.value)) {
                            onChange(value.filter(v => v !== option.value));
                          } else {
                            onChange([option.value]);
                            ``;
                          }
                        }}
                      >
                        <p
                          className="flex-1"
                          style={{ wordBreak: 'break-word' }}
                        >
                          {option.label}
                        </p>
                        {value.includes(option.value) && (
                          <CheckIcon className="mr-auto size-4 shrink-0 stroke-[3px] text-brand" />
                        )}
                        {item.showCount && <p>{option.count}</p>}
                        {alert && (
                          <AlertIcon {...alert} currentValue={option.value} />
                        )}
                      </div>
                    );
                  })}
                </Accordian>
              </li>
            );
          })}
        </ul>
      )}
      {status === 'pending' &&
        Array(Math.max(5 - category.length, 1))
          .fill(0)
          .map((_, index) => {
            return (
              <Loader
                className="my-1 h-5 w-full"
                key={index}
                isLoading
              ></Loader>
            );
          })}
    </div>
  );
}

interface AlertIconProps {
  value: string[];
  onAdd?: () => void; // callback
  onRemove?: () => void; // callback
  currentValue: string;
  styleType?: 'filter' | 'button';
}

export function AlertIcon(props: AlertIconProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isSubscribed = props.value.includes(props.currentValue);
  const Icon = isSubscribed ? BellSlashIcon : BellAlertIcon;
  const { mutateAsync: addAlert } = useAddAlert();
  const { mutateAsync: removeAlert } = useRemoveAlert();

  async function handleAdd() {
    try {
      const attributeKey = props.currentValue;
      setIsLoading(true);
      const [, attributeType = '', attributeValue = ''] =
        attributeKey.match(Regex.ATTIBUTE_KEY) || [];

      const alertName = `exposure-${attributeType}-${attributeValue.endsWith('#') ? attributeValue.slice(0, -1) : attributeValue}`;

      await addAlert({
        value: alertName,
        name: alertName,
      });

      props.onAdd && props.onAdd();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemove() {
    try {
      setIsLoading(true);
      await removeAlert({
        key: `#condition#${props.currentValue}`,
      });
      props.onRemove && props.onRemove();
    } finally {
      setIsLoading(false);
    }
  }

  if (props.styleType === 'button') {
    return (
      <Button
        isLoading={isLoading}
        className="border border-default py-1"
        startIcon={
          <Icon className="size-6 shrink-0 rounded-full stroke-[2px] p-1" />
        }
        onClick={isSubscribed ? handleRemove : handleAdd}
      >
        {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
      </Button>
    );
  }

  return (
    <div className="ml-auto size-4">
      <Loader
        className="ml-auto size-4 shrink-0 cursor-not-allowed text-gray-400"
        type="spinner"
        isLoading={isLoading}
      >
        <Tooltip title={isSubscribed ? 'Unsubscribe' : 'Subscribe'}>
          <Icon
            className={cn(
              'ml-auto size-4 shrink-0 stroke-[2px]',
              !isSubscribed && 'text-gray-400'
            )}
            onClick={isSubscribed ? handleRemove : handleAdd}
          />
        </Tooltip>
      </Loader>
    </div>
  );
}

export function FancyTable(
  props: PropsWithChildren & {
    className?: string;
    tableheader?: ReactNode;
    addNew?: {
      label?: ReactNode;
      onClick: () => void;
      isLoading?: boolean;
    };
    search?: { value: string; onChange: (value: string) => void };
    filter?: CategoryFilterProps;
    otherFilters?: ReactNode;
    belowTitleContainer?: ReactNode;
    tableHeader?: ReactNode;
    name: string;
  }
) {
  const {
    addNew,
    search,
    filter,
    belowTitleContainer,
    otherFilters,
    tableHeader,
    name,
    children,
  } = props;
  const { maxMd } = useGetScreenSize();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { getSticky, useCreateSticky } = useSticky();
  const leftStickyRef = useCreateSticky<HTMLDivElement>({ id: '2L' });
  const rightStickyRef = useCreateSticky<HTMLDivElement>({ id: '2R' });

  const headerHeight = getSticky('1');
  const LHeaderHeight = getSticky('2L');

  useEffect(() => {
    const el = document.getElementById('body');
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [JSON.stringify(filter?.value)]);

  return (
    <div className="relative flex w-full flex-1 shadow-md">
      <ConditionalRender
        condition={maxMd}
        conditionalWrapper={children => (
          <Drawer
            onBack={() => {}}
            open={isFiltersOpen}
            onClose={() => {
              setIsFiltersOpen(false);
            }}
          >
            {children}
          </Drawer>
        )}
      >
        <div
          className={cn(
            'shrink-0 bg-gray-100 relative',
            maxMd ? 'w-full' : 'w-[300px]'
          )}
        >
          <div
            ref={leftStickyRef}
            className={cn(
              'sticky flex flex-col gap-4 bg-gray-100 py-4 border-r border-default',
              filter && 'pb-0'
            )}
            style={{
              top: headerHeight,
              zIndex: 1,
            }}
          >
            <div className="flex items-center justify-between  px-4">
              <p className="text-3xl font-bold">{capitalize(name)}</p>
              {addNew && (
                <Button
                  className="ml-auto"
                  styleType="primary"
                  isLoading={addNew.isLoading}
                  onClick={() => {
                    addNew.onClick();
                    setIsFiltersOpen(false);
                  }}
                >
                  {addNew.label || `New ${capitalize(name)}`}
                </Button>
              )}
            </div>
            {belowTitleContainer}
            {search && (
              <div className="flex flex-col gap-2 px-4">
                <label
                  className="text-sm font-semibold"
                  htmlFor={`${name}-search`}
                >
                  Search
                </label>
                <form
                  className="relative"
                  onSubmit={event => {
                    event.preventDefault();
                    setIsFiltersOpen(false);
                  }}
                >
                  <InputText
                    value={search?.value}
                    onChange={event => {
                      search?.onChange(event.target.value);
                    }}
                    name={`${name}-search`}
                    className="pl-8"
                    placeholder={
                      name === 'jobs' ? 'Go to source' : `Go to ${name}s`
                    }
                  />
                  <label className="cursor-pointer" htmlFor={`${name}-search`}>
                    <MagnifyingGlassIcon className="absolute left-0 top-0 ml-2 size-5 h-full stroke-[3px]" />
                  </label>
                </form>
              </div>
            )}
            {(filter || otherFilters) && (
              <hr className="mx-4 border-t-2 border-gray-300"></hr>
            )}
          </div>
          {(filter || otherFilters) && (
            <div
              className="sticky overflow-auto border-r border-default"
              style={{
                top: headerHeight + LHeaderHeight,
                maxHeight: `calc( 100vh - ${headerHeight + LHeaderHeight + 64}px)`,
                height: `calc( 100vh - ${headerHeight + LHeaderHeight + 64}px)`,
              }}
            >
              {filter && (
                <CategoryFilter
                  {...filter}
                  onChange={(...args) => {
                    setIsFiltersOpen(false);
                    filter?.onChange(...args);
                  }}
                />
              )}
              {otherFilters}
            </div>
          )}
        </div>
      </ConditionalRender>
      <div className={cn('flex w-full flex-col bg-white')}>
        <div
          ref={rightStickyRef}
          className={cn('sticky flex items-center bg-white px-4 py-2')}
          style={{
            top: headerHeight,
            zIndex: 1,
          }}
        >
          {maxMd && (
            <FunnelIcon
              onClick={() => {
                setIsFiltersOpen(true);
              }}
              className="m-2 size-9 cursor-pointer p-2"
            />
          )}
          {tableHeader}
          {filter &&
            filter.value?.length > 0 &&
            !tableHeader &&
            filter.value.map((attribute, index) => {
              const [, attributeName = '', attributeValue = ''] =
                attribute.match(Regex.ATTIBUTE_KEY) || [];

              let valueToDisplay = attributeValue
                .replace('#asset#', '')
                .replace(/#$/, '');

              let labelToDisplay =
                attributeName === 'source'
                  ? 'Surface'
                  : capitalize(attributeName);

              if (attribute === '#attribute#new#') {
                valueToDisplay = 'Last 24 hours';
                labelToDisplay = 'New';
              }

              if (attribute === 'source:provided') {
                valueToDisplay = 'Provided';
                labelToDisplay = 'Surface';
              }

              return (
                <div
                  key={index}
                  className="flex w-full items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">{labelToDisplay}:</p>
                    <p className="text-lg font-semibold text-gray-500">
                      {valueToDisplay}
                    </p>
                  </div>

                  {filter.alert && (
                    <AlertIcon
                      {...filter.alert}
                      currentValue={attribute}
                      styleType="button"
                    />
                  )}
                </div>
              );
            })}

          {filter && filter.value?.length === 0 && !tableHeader && (
            <div className="text-blueGray-500flex w-full items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold">Search:</p>
                  <p className="text-lg font-semibold text-gray-500">
                    {props.search && props.search?.value?.length > 0
                      ? props.search?.value
                      : `All ${capitalize(name)}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function IntegratedRisksNotifications() {
  const { data: accounts, status: accountsStatus } = useMy({
    resource: 'account',
  });

  const integratedRisksLogos = useMemo(() => {
    return accounts
      .filter(account => {
        return availableRiskIntegrationsKeys.includes(account.member);
      })
      .map(account => {
        return (
          availableRiskIntegrations.find(({ id }) => id === account.member)
            ?.logo || ''
        );
      });
  }, [JSON.stringify(accounts)]);

  return (
    <Loader isLoading={accountsStatus === 'pending'} className="h-8 w-full">
      <div className="flex gap-2 bg-gray-200 px-4 py-2">
        {integratedRisksLogos.map((logo, index) => {
          return <img key={index} className="size-5" src={logo} />;
        })}
      </div>
    </Loader>
  );
}

export const useCombineAttributesCount = () => {
  const {
    data: attributeCountsCloud = {} as Record<string, number>,
    status: attributesStatusCloud,
  } = useCounts({
    resource: 'attribute',
    query: '#cloud#',
  });
  const {
    data: attributeCountsPort = {} as Record<string, number>,
    status: attributesStatusPort,
  } = useCounts({
    resource: 'attribute',
    query: '#port#',
  });
  const {
    data: attributeCountsProtocol = {} as Record<string, number>,
    status: attributesStatusProtocol,
  } = useCounts({
    resource: 'attribute',
    query: '#protocol#',
  });

  return {
    data: {
      ...attributeCountsCloud,
      ...attributeCountsPort,
      ...attributeCountsProtocol,
    },
    status: useMergeStatus(
      attributesStatusCloud,
      attributesStatusPort,
      attributesStatusProtocol
    ),
  };
};

export function RiskSummary(asset: {
  riskSummary: PartialAsset['riskSummary'];
}) {
  if (!asset.riskSummary) {
    return null;
  }

  return (
    <Tooltip
      placement="top"
      title={
        <div className="flex flex-col gap-2">
          {Object.entries(asset.riskSummary).map((riskSeverity, index) => {
            const severity = riskSeverity[0] as Severity;
            const noOfRisks = riskSeverity[1].length;

            const severityIcon = getRiskSeverityIcon(
              severity as RiskSeverity,
              'size-5 text-white'
            );

            return (
              <div key={index} className="flex items-center ">
                {severityIcon}
                <div className="pl-2 pr-1">{noOfRisks}</div>
                {SeverityDef[severity]}
              </div>
            );
          })}
        </div>
      }
    >
      <div className="mr-1">
        <RisksIcon className="h-3 text-red-500" />
      </div>
    </Tooltip>
  );
}
