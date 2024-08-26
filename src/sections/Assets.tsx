import React, { ReactNode, useMemo, useState } from 'react';
import { ChevronDownIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

import { Accordian } from '@/components/Accordian';
import { Button } from '@/components/Button';
import { Dropdown } from '@/components/Dropdown';
import { InputText } from '@/components/form/InputText';
import { AssetsIcon, RisksIcon } from '@/components/icons';
import { getAssetStatusIcon } from '@/components/icons/AssetStatus.icon';
import { HorseIcon } from '@/components/icons/Horse.icon';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { Table } from '@/components/table/Table';
import { Columns, TableActions } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { getAssetStatusProperties } from '@/components/ui/AssetStatusChip';
import { useGetAssets, useUpdateAsset } from '@/hooks/useAssets';
import { useIntegration } from '@/hooks/useIntegration';
import { AssetStatusWarning } from '@/sections/AssetStatusWarning';
import { RenderHeaderExtraContentSection } from '@/sections/AuthenticatedApp';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { parseKeys } from '@/sections/SearchByType';
import { useGlobalState } from '@/state/global.state';
import {
  Asset,
  AssetStatus,
  AssetStatusLabel,
  AssetsWithRisk,
  Risk,
  RiskSeverity,
  Severity,
  SeverityDef,
  SeverityOpenCounts,
} from '@/types';
import { cn } from '@/utils/classname';
import { abbreviateNumber, useGetScreenSize } from '@/utils/misc.util';
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
  const { getSticky, useCreateSticky } = useSticky();
  const leftStickyRef = useCreateSticky<HTMLDivElement>({ id: '2L' });
  const rightStickyRef = useCreateSticky<HTMLDivElement>({ id: '2R' });

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
  } = useGetAssets();

  const { getAssetDrawerLink } = getDrawerLink();
  const { isAssetIntegration: isIntegration } = useIntegration();
  const { mutateAsync: updateAsset } = useUpdateAsset();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showAssetStatusWarning, setShowAssetStatusWarning] =
    useState<boolean>(false);
  const [assetStatus, setAssetStatus] = useState<AssetStatus | ''>('');

  const screenSize = useGetScreenSize();
  const isSmallScreen = screenSize < 730;

  const columns: Columns<AssetsWithRisk> = useMemo(() => {
    const selectedRowData = selectedRows
      .map(i => assets[Number(i)])
      .filter(Boolean);

    return [
      {
        label: 'Select all assets',
        id: 'name',
        to: item => getAssetDrawerLink(item),
        cell: asset => {
          const integration = isIntegration(asset);
          const simplifiedStatus = asset.status.startsWith('F')
            ? AssetStatus.Frozen
            : asset.status;
          const { detail } = getAssetStatusProperties(simplifiedStatus);
          const totalRisk = Object.values(asset.riskSummary || {}).reduce(
            (acc, items) => acc + items.length,
            0
          );

          return (
            <div className="flex items-center gap-2 text-black">
              <Tooltip title={detail || simplifiedStatus}>
                {getAssetStatusIcon(simplifiedStatus, 'size-5 font-semibold')}
              </Tooltip>
              <p className="font-semibold">{asset.name}</p>
              <p className="text-blueGray-600">{asset.dns}</p>
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
        className: 'w-full h-full ',
        copy: true,
      },
      {
        label: (
          <Tooltip
            title={selectedRows.length === 0 ? `No assets selected.` : ''}
          >
            <Dropdown
              className="absolute right-[-21px] top-3 -mr-10 h-4 text-sm font-bold text-black"
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
        className: 'text-blueGray-600',
      },
    ];
  }, [JSON.stringify({ selectedRows, assets })]);

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

  function renderActions(assets: Asset[]): TableActions {
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
            disabled: assets.every(
              asset => asset.status === AssetStatus.ActiveHigh
            ),
            onClick: () => {
              setSelectedAssets(assets.map(asset => asset.key));
              setShowAssetStatusWarning(true);
              setAssetStatus(AssetStatus.ActiveHigh);
            },
          },
          {
            label: AssetStatusLabel[AssetStatus.Active],
            icon: getAssetStatusIcon(AssetStatus.Active),
            disabled: assets.every(
              asset => asset.status === AssetStatus.Active
            ),
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
            disabled: assets.every(
              asset => asset.status === AssetStatus.ActiveLow
            ),
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
            disabled: assets.every(
              asset => asset.status === AssetStatus.Frozen
            ),
            onClick: () => {
              setSelectedAssets(assets.map(asset => asset.key));
              setShowAssetStatusWarning(true);
              setAssetStatus(AssetStatus.Frozen);
            },
          },
          {
            label: AssetStatusLabel[AssetStatus.Deleted],
            icon: getAssetStatusIcon(AssetStatus.Deleted),
            disabled: assets.every(
              asset => asset.status === AssetStatus.Deleted
            ),
            onClick: () => {
              setSelectedAssets(assets.map(asset => asset.key));
              setShowAssetStatusWarning(true);
              setAssetStatus(AssetStatus.Deleted);
            },
          },
          { type: 'divider', label: 'Divider' },
          {
            label: 'Scan now',
          },
        ],
      },
    };
  }

  return (
    <div className="flex w-full shadow-md">
      <RenderHeaderExtraContentSection>
        <div className="flex flex-wrap justify-between gap-4">
          <PageCounts
            resources={[
              { count: 15, label: 'Attack surfaces' },
              { count: 19199, label: 'Assets monitored' },
            ]}
            icon={<AssetsIcon />}
            className="grow"
          />
          <PageCounts
            resources={[
              { count: 2900, label: 'Pending triage' },
              { count: 12, label: 'Critical risks' },
              { count: 184, label: 'Open risks' },
              { count: 88, label: 'Remediated' },
            ]}
            icon={<RisksIcon />}
            className="grow"
          />
          <PageCounts
            resources={[
              { count: 3700, label: 'Jobs today' },
              { count: 32, label: 'Users' },
            ]}
            icon={<HorseIcon skipHover />}
            className="grow-2"
          />
        </div>
      </RenderHeaderExtraContentSection>
      {!isSmallScreen && (
        <div className="w-[300px] shrink-0 bg-gray-100">
          <div
            ref={leftStickyRef}
            className="sticky flex flex-col gap-4 bg-gray-100 p-4"
            style={{
              top: getSticky('1'),
              zIndex: 1,
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">Assets</p>
              <Button
                label="New Asset"
                styleType="primary"
                onClick={() => {
                  setShowAddAsset(true);
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Search</label>
              <InputText value={''} onChange={() => {}} name="" />
            </div>
          </div>
          <CategoryFilter />
        </div>
      )}
      <div className="flex w-full flex-col bg-white">
        <div
          ref={rightStickyRef}
          className="sticky border-l border-gray-300 bg-white"
          style={{
            top: getSticky('1'),
            zIndex: 1,
          }}
        >
          Services are entry points on a network that attackers can target, and
          by scanning them, we identify potential risks that could be exploited.
        </div>
        <Table
          isTableView
          name="assets"
          selection={{ value: selectedRows, onChange: setSelectedRows }}
          rowActions={(asset: Asset) => {
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
      </div>
    </div>
  );
};

export default Assets;

function PageCounts(props: {
  resources: { label: string; count: number }[];
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex justify-around gap-4 rounded-sm bg-header-dark px-6 py-3 text-white',
        props.className
      )}
    >
      <div className="absolute right-0 top-0 [&>svg]:size-5">{props.icon}</div>
      {props.resources.map((resource, index) => {
        return (
          <div key={index} className="flex flex-col items-center">
            <div className="text-nowrap text-sm font-semibold">
              {resource.label}
            </div>
            <div className="text-3xl font-bold">
              {abbreviateNumber(resource.count)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoryFilter() {
  const value: string[] = ['new'];
  const category: {
    label: string;
    options: { label: string; value: string }[];
  }[] = [
    {
      label: 'New & Interesting',
      options: [
        { label: 'new', value: 'new' },
        { label: 'interesting', value: 'interesting' },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-1 p-4">
      <h1 className="text-sm font-semibold">Category</h1>
      <ul className="flex flex-col gap-3">
        {category.map((item, index) => {
          return (
            <li key={index}>
              <Accordian title={item.label} headerClassName="px-3">
                {item.options.map((option, index) => {
                  return (
                    <div
                      className={cn(
                        'flex items-center rounded-sm px-3 cursor-pointer text-sm font-semibold py-2',
                        index % 2 !== 0 ? 'bg-layer1' : ''
                      )}
                      key={index}
                    >
                      {option.label}
                      {value.includes(option.value) && (
                        <CheckCircleIcon className="ml-2 size-4 text-brand" />
                      )}
                    </div>
                  );
                })}
              </Accordian>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
