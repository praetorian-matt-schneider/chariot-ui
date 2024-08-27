import React, { ReactNode, useMemo, useState } from 'react';
import {
  BellAlertIcon,
  BellSlashIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PuzzlePieceIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

import { Accordian } from '@/components/Accordian';
import { Button } from '@/components/Button';
import { Dropdown } from '@/components/Dropdown';
import { InputText } from '@/components/form/InputText';
import { RisksIcon } from '@/components/icons';
import { getAssetStatusIcon } from '@/components/icons/AssetStatus.icon';
import { HorseIcon } from '@/components/icons/Horse.icon';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { Loader } from '@/components/Loader';
import { Table } from '@/components/table/Table';
import { Columns, TableActions, TableProps } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { useMy } from '@/hooks';
import { useAddAlert, useRemoveAlert } from '@/hooks/useAlerts';
import { PartialAsset, useGetAssets, useUpdateAsset } from '@/hooks/useAssets';
import { useCounts } from '@/hooks/useCounts';
import { useIntegration } from '@/hooks/useIntegration';
import { useBulkReRunJob } from '@/hooks/useJobs';
import { AssetStatusWarning } from '@/sections/AssetStatusWarning';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { parseKeys } from '@/sections/SearchByType';
import { useGlobalState } from '@/state/global.state';
import {
  AssetStatus,
  AssetStatusLabel,
  Risk,
  RiskSeverity,
  Severity,
  SeverityDef,
  SeverityOpenCounts,
} from '@/types';
import { QueryStatus } from '@/utils/api';
import { cn } from '@/utils/classname';
import { capitalize } from '@/utils/lodash.util';
import { abbreviateNumber, useGetScreenSize } from '@/utils/misc.util';
import { Regex } from '@/utils/regex.util';
import { useSticky } from '@/utils/sticky.util';

export function buildOpenRiskDataset(
  risks: Risk[]
): Record<string, SeverityOpenCounts> {
  return risks.reduce(
    (acc, risk) => {
      if (!risk.status.startsWith('O')) {
        return acc; // Skip this risk if is not in 'Open' status
      }

      const severity = risk.status[1] as Severity;

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
    status: attributesStatus,
  } = useCounts({
    resource: 'attribute',
    query: '',
  });
  const { data: alerts } = useMy({ resource: 'condition' });

  const { mutateAsync: addAlert } = useAddAlert();
  const { mutateAsync: removeAlert } = useRemoveAlert();
  const { mutateAsync: bulkReRunJob } = useBulkReRunJob();

  const { getAssetDrawerLink } = getDrawerLink();
  const {
    data: { integrations },
  } = useIntegration();
  const { mutateAsync: updateAsset } = useUpdateAsset();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showAssetStatusWarning, setShowAssetStatusWarning] =
    useState<boolean>(false);
  const [assetStatus, setAssetStatus] = useState<AssetStatus | ''>('');

  const columns: Columns<PartialAsset> = useMemo(() => {
    const selectedRowData = selectedRows
      .map(i => assets[Number(i)])
      .filter(Boolean);

    return [
      {
        label: 'Select all assets',
        id: 'name',
        to: item => getAssetDrawerLink(item),
        cell: asset => {
          const integration = integrations.find(
            account => account.member === asset.dns
          );
          const totalRisk = Object.values(asset.riskSummary || {}).reduce(
            (acc, items) => acc + items.length,
            0
          );

          return (
            <div className="flex items-center gap-2 text-black">
              <p className="font-semibold text-indigo-500">{asset.name}</p>
              <p className="text-blueGray-500">{asset.dns}</p>
              {asset.riskSummary && (
                <Tooltip
                  placement="top"
                  title={
                    <div className="flex flex-col gap-2">
                      {Object.entries(asset.riskSummary).map(
                        (riskSeverity, index) => {
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
                        }
                      )}
                    </div>
                  }
                >
                  <div className="relative flex size-10 items-center">
                    <RisksIcon className="h-6" />
                    <span
                      role="label"
                      className={cn(
                        'text-white bg-red-500 rounded-full absolute flex justify-center items-center text-xs text-center font-semibold transition duration-150 ease-in-out',
                        totalRisk > 99
                          ? 'w-7 h-5 top-0 right-0'
                          : 'w-5 h-5 top-0 right-2'
                      )}
                    >
                      {abbreviateNumber(totalRisk)}
                    </span>
                  </div>
                </Tooltip>
              )}
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
            <Dropdown
              className="absolute right-[-21px] top-3 -mr-10 h-4 text-sm font-bold text-black disabled:bg-white"
              styleType="none"
              endIcon={<ChevronDownIcon className="size-3 stroke-[4px]" />}
              disabled={selectedRows.length === 0}
              {...renderActions(selectedRowData)}
            >
              Bulk actions
            </Dropdown>
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
        const [, attributeName, attributeValue] =
          attributeKey.match(Regex.ATTIBUTE_KEY) || [];

        if (attributeName === 'source') {
          return acc;
        }

        return {
          ...acc,
          [attributeName]: [
            ...(acc[attributeName] || []),
            {
              label: attributeValue,
              count: value.toString(),
              value: attributeKey,
            },
          ],
        };
      },
      {} as Record<string, { label: string; count: string; value: string }[]>
    );

    return Object.entries(nonDuplicateAttributes).map(([label, value]) => {
      return {
        label: label,
        options: value,
      };
    });
  }, [JSON.stringify(attributeCounts)]);

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
            // disabled: assets.every(
            //   asset => asset.status === AssetStatus.ActiveHigh
            // ),
            onClick: () => {
              setSelectedAssets(assets.map(asset => asset.key));
              setShowAssetStatusWarning(true);
              setAssetStatus(AssetStatus.ActiveHigh);
            },
          },
          {
            label: AssetStatusLabel[AssetStatus.Active],
            icon: getAssetStatusIcon(AssetStatus.Active),
            // disabled: assets.every(
            //   asset => asset.status === AssetStatus.Active
            // ),
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
            // disabled: assets.every(
            //   asset => asset.status === AssetStatus.ActiveLow
            // ),
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
            // disabled: assets.every(
            //   asset => asset.status === AssetStatus.Frozen
            // ),
            onClick: () => {
              setSelectedAssets(assets.map(asset => asset.key));
              setShowAssetStatusWarning(true);
              setAssetStatus(AssetStatus.Frozen);
            },
          },
          {
            label: AssetStatusLabel[AssetStatus.Deleted],
            icon: getAssetStatusIcon(AssetStatus.Deleted),
            // disabled: assets.every(
            //   asset => asset.status === AssetStatus.Deleted
            // ),
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

  return (
    <>
      <FancyTable
        addNew={() => setShowAddAsset(true)}
        search={{
          value: filters.search,
          onChange: search => {
            setFilters(prevFilter => {
              return { ...prevFilter, search };
            });
          },
        }}
        filter={{
          value: filters.attributes,
          filterDescription: getFilterDescription(filters.attributes[0] || ''),
          onChange: attributes => {
            setFilters(prevFilter => {
              return { ...prevFilter, attributes };
            });
          },
          category,
          status: attributesStatus,
          alert: {
            value: alerts.map(alert => alert.value),
            onAdd: async (attributeKey: string) => {
              const [, attributeType, attributeValue] =
                attributeKey.match(Regex.ATTIBUTE_KEY) || [];

              await addAlert({
                value: attributeKey,
                name: `Assets with a ${attributeType} value of ${attributeValue} identified`,
              });
            },
            onRemove: async (value: string) => {
              await removeAlert({
                key: `#condition#${value}`,
              });
            },
          },
        }}
        isTableView
        name="assets"
        selection={{ value: selectedRows, onChange: setSelectedRows }}
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
        tableClassName="border-r-0 border-l border-gray-300"
        columns={columns}
        data={assets}
        error={assetsError}
        status={assetsStatus}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        noData={{
          icon: <HorseIcon />,
          title:
            assets.length === 0
              ? 'Discovering Assets...'
              : 'No Matching Assets',
          description:
            assets.length === 0
              ? 'We are currently scanning for assets. They will appear here as soon as they are discovered. Please check back shortly.'
              : 'Try adjusting your filters or add new assets to see results.',
        }}
      />
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
  filterDescription?: ReactNode;
  value: string[];
  onChange: (value: string[]) => void;
  category: {
    label: string;
    options: { label: string; value: string; count: string }[];
  }[];
  status: QueryStatus;
  className?: string;
}

export function CategoryFilter(props: CategoryFilterProps) {
  const { value = [], category, status, onChange, className, alert } = props;

  return (
    <div className={cn('flex flex-col gap-1 p-4', className)}>
      <h1 className="text-sm font-semibold">Category</h1>
      {status === 'pending' &&
        Array(2)
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
      {status === 'success' && (
        <ul className="flex flex-col gap-3">
          {category.map((item, index) => {
            return (
              <li key={index}>
                <Accordian
                  defaultValue={false}
                  title={capitalize(item.label)}
                  headerClassName="px-3"
                  contentClassName="max-h-52 overflow-auto"
                >
                  {item.options.map((option, index) => {
                    return (
                      <div
                        className={cn(
                          'flex items-center rounded-sm px-3 cursor-pointer text-sm font-medium py-2 gap-2',
                          index % 2 !== 0 ? 'bg-layer1' : ''
                        )}
                        key={index}
                        onClick={() => {
                          if (value.includes(option.value)) {
                            onChange(value.filter(v => v !== option.value));
                          } else {
                            onChange([option.value]);
                          }
                        }}
                      >
                        <p className="">{option.label}</p>
                        {value.includes(option.value) && (
                          <CheckCircleIcon className="size-4 shrink-0 text-brand" />
                        )}
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
    </div>
  );
}

interface AlertIconProps {
  value: string[];
  onAdd: (value: string) => Promise<void>;
  onRemove: (value: string) => Promise<void>;
  currentValue: string;
}

function AlertIcon(props: AlertIconProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Loader
      className="ml-auto size-4 shrink-0 text-gray-400"
      type="spinner"
      isLoading={isLoading}
    >
      {props.value.includes(props.currentValue) ? (
        <BellSlashIcon
          className="ml-auto size-4 shrink-0 stroke-[2px]"
          onClick={async event => {
            event.stopPropagation();
            setIsLoading(true);
            try {
              await props.onRemove(props.currentValue);
            } finally {
              setIsLoading(false);
            }
          }}
        />
      ) : (
        <BellAlertIcon
          className="ml-auto size-4 shrink-0 stroke-[2px] text-gray-400"
          onClick={async event => {
            event.stopPropagation();
            setIsLoading(true);
            try {
              await props.onAdd(props.currentValue);
            } finally {
              setIsLoading(false);
            }
          }}
        />
      )}
    </Loader>
  );
}

export function FancyTable<TData>(
  props: TableProps<TData> & {
    tableheader?: ReactNode;
    addNew?: () => void;
    search?: { value: string; onChange: (value: string) => void };
    filter?: CategoryFilterProps;
  }
) {
  const { tableheader, addNew, search, filter, ...tableProps } = props;
  const screenSize = useGetScreenSize();
  const isSmallScreen = screenSize < 730;

  const { getSticky, useCreateSticky } = useSticky();
  const leftStickyRef = useCreateSticky<HTMLDivElement>({ id: '2L' });
  const rightStickyRef = useCreateSticky<HTMLDivElement>({ id: '2R' });

  return (
    <div className="flex w-full shadow-md">
      {tableheader}
      {!isSmallScreen && (
        <div className="w-[300px] shrink-0 bg-gray-100">
          <div
            ref={leftStickyRef}
            className={cn(
              'sticky flex flex-col gap-4 bg-gray-100 p-4',
              filter && 'pb-0'
            )}
            style={{
              top: getSticky('1'),
              zIndex: 1,
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">
                {capitalize(tableProps.name)}
              </p>
              {addNew && (
                <Button
                  label={`New ${capitalize(tableProps.name)}`}
                  styleType="primary"
                  onClick={() => {
                    addNew();
                  }}
                />
              )}
            </div>
            {search && (
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-semibold"
                  htmlFor={`${tableProps.name}-search`}
                >
                  Search
                </label>
                <div className="relative">
                  <InputText
                    value={search?.value}
                    onChange={event => {
                      search?.onChange(event.target.value);
                    }}
                    name={`${tableProps.name}-search`}
                    className="pl-8"
                  />
                  <label
                    className="cursor-pointer"
                    htmlFor={`${tableProps.name}-search`}
                  >
                    <MagnifyingGlassIcon className="absolute left-0 top-0 ml-2 size-5 h-full stroke-[3px]" />
                  </label>
                </div>
              </div>
            )}
            {filter && <hr className="border-t-2 border-gray-300"></hr>}
          </div>
          {filter && <CategoryFilter {...filter} />}
        </div>
      )}
      <div className="flex w-full flex-col bg-white">
        <div
          ref={rightStickyRef}
          className="sticky flex items-center bg-white"
          style={{
            top: getSticky('1'),
            zIndex: 1,
          }}
        >
          {filter && (
            <>
              {filter.value.map((attribute, index) => {
                const [, attributeName, attributeValue] =
                  attribute.match(Regex.ATTIBUTE_KEY) || [];

                return (
                  <div
                    key={index}
                    className="m-2 flex w-fit items-center gap-1 rounded-sm border border-gray-300 bg-gray-100 p-2"
                  >
                    {filter.alert && (
                      <AlertIcon {...filter.alert} currentValue={attribute} />
                    )}
                    <p className="text-base font-bold capitalize">
                      {attributeName}:
                    </p>
                    <p className="text-sm font-semibold text-gray-500">
                      {attributeValue}
                    </p>
                    <XMarkIcon
                      className="ml-1 size-5 shrink-0 cursor-pointer text-gray-500"
                      onClick={() => {
                        filter.onChange(
                          filter.value.filter(v => v !== attribute)
                        );
                      }}
                    />
                  </div>
                );
              })}
              <div className="ml-2 text-sm font-medium text-gray-600">
                {filter.filterDescription}
              </div>
            </>
          )}
        </div>
        <Table {...tableProps} isTableView tableClassName="border-none" />
      </div>
    </div>
  );
}

const filterDescription = {
  protocols:
    'Services are network access points that can be scanned to reveal vulnerabilities or potential attack vectors.',
  recentlyDiscovered:
    'Recently discovered assets, providing insights into the latest additions to your environment.',
  ports:
    'Network ports that define communication endpoints, crucial for identifying potential entry points.',
  tlds: 'Top-level domains that help categorize and manage assets based on their domain structure.',
  surfaces:
    'External platforms or systems that represent potential attack surfaces within your environment.',
  cpes: 'Standardized identifiers for software or hardware configurations, essential for managing vulnerabilities.',
  clouds:
    'Cloud-based resources that form part of your cloud integrations, critical for cloud infrastructure management.',
} as Record<string, string>;

function getFilterDescription(attribute: string) {
  const [, attributeName] = attribute.match(Regex.ATTIBUTE_KEY) || [];

  return filterDescription[attributeName];
}
