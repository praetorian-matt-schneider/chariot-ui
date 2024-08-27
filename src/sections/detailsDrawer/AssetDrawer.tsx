import { ReactNode, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { History as HistoryIcon, NotepadText } from 'lucide-react';

import { Drawer } from '@/components/Drawer';
import { AssetsIcon, RisksIcon } from '@/components/icons';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { Loader } from '@/components/Loader';
import { Table } from '@/components/table/Table';
import { Timeline } from '@/components/Timeline';
import { Tooltip } from '@/components/Tooltip';
import { AssetStatusDropdown } from '@/components/ui/AssetPriorityDropdown';
import { useMy } from '@/hooks';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useReRunJob } from '@/hooks/useJobs';
import { buildOpenRiskDataset } from '@/sections/Assets';
import { AddAttribute } from '@/sections/detailsDrawer/AddAttribute';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { parseKeys } from '@/sections/SearchByType';
import {
  Asset,
  AssetStatusLabel,
  EntityHistory,
  Risk,
  RiskSeverity,
  RiskStatus,
  SeverityDef,
} from '@/types';
import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';
import { getSeverityClass } from '@/utils/getSeverityClass.util';
import { Regex } from '@/utils/regex.util';
import { getRiskStatus } from '@/utils/riskStatus.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { useSearchParams } from '@/utils/url.util';

interface Props {
  compositeKey: string;
  open: boolean;
}

const { getAssetDrawerLink, getRiskDrawerLink } = getDrawerLink();

function getHistoryDiff(history: EntityHistory): {
  title: ReactNode;
  updated: string;
} {
  if (history.from === '') {
    return {
      title: (
        <div className="whitespace-break-spaces">
          <strong>First Tracked</strong> as{' '}
          <strong>
            {AssetStatusLabel[history.to as keyof typeof AssetStatusLabel]}
          </strong>
        </div>
      ),
      updated: formatDate(history.updated),
    };
  } else {
    return {
      title: (
        <div className="whitespace-break-spaces">
          {history.by ? (
            <span>
              {history.by} changed the{' '}
              <span className="font-semibold">Status</span> from{' '}
            </span>
          ) : (
            <span>
              Changed the <span className="font-semibold">Status</span> from{' '}
            </span>
          )}
          <strong>
            {AssetStatusLabel[history.from as keyof typeof AssetStatusLabel]}
          </strong>{' '}
          to{' '}
          <strong>
            {AssetStatusLabel[history.to as keyof typeof AssetStatusLabel]}
          </strong>
        </div>
      ),
      updated: formatDate(history.updated),
    };
  }
}

export const AssetDrawer: React.FC<Props> = ({ compositeKey, open }) => {
  const [, dns, name] = compositeKey.split('#');
  const riskFilter = `#${dns}`;
  const attributeFilter = `source:#asset#${dns}#${name}`;
  const childAssetsFilter = `#source##asset#${dns}#${name}`;

  const { removeSearchParams } = useSearchParams();
  const navigate = useNavigate();

  const { data: assets = [], status: assetsStatus } = useMy(
    {
      resource: 'asset',
      query: compositeKey,
    },
    { enabled: open }
  );
  const {
    data: attributesGenericSearch,
    status: attributesStatus,
    error: attributesGenericSearchError,
  } = useGenericSearch(
    {
      query: attributeFilter,
      exact: true,
    },
    { enabled: open }
  );

  const {
    data: childAssetsAttributes,
    status: childAssetsStatus,
    error: childAssetsError,
  } = useMy(
    {
      resource: 'attribute',
      query: childAssetsFilter,
    },
    { enabled: open }
  );

  const { data: risks = [], status: risksStatus } = useMy(
    {
      resource: 'risk',
      query: riskFilter,
    },
    { enabled: open }
  );

  const { mutateAsync: runJob } = useReRunJob();

  const openRiskDataset = useMemo(
    () => buildOpenRiskDataset(risks as Risk[]),
    [risks]
  );

  const asset: Asset = assets[0] || {};
  const history = useMemo(() => {
    const assetHistory = asset.history || [];
    const noHistory = assetHistory.length === 0;

    const firstTrackedHistory: EntityHistory = {
      from: '',
      to: noHistory ? asset.status : asset.history[0].from,
      updated: asset.created,
    };

    return [firstTrackedHistory, ...assetHistory];
  }, [asset.history]);

  const isInitialLoading =
    assetsStatus === 'pending' ||
    risksStatus === 'pending' ||
    attributesStatus === 'pending';

  const openRisks = risks.filter(
    ({ status }) => getRiskStatus(status) === RiskStatus.Opened
  );

  const parentAssets = useMemo(() => {
    return (
      attributesGenericSearch?.attributes?.filter?.(attribute => {
        return (
          attribute.name === 'source' && attribute.value.match(Regex.ASSET)
        );
      }) || []
    );
  }, [JSON.stringify(attributesGenericSearch?.attributes)]);

  const discovered = (
    <div
      className="flex w-full flex-wrap gap-2 overflow-hidden"
      style={{ wordBreak: 'break-word' }}
    >
      {asset.dns && asset.dns !== asset.name && (
        <>
          <p className="text-sm font-normal text-gray-500">{asset.dns}</p>
          <div className="border-l border-gray-400"></div>
        </>
      )}
      <Tooltip title="First Seen">
        <p className="text-sm font-normal text-gray-500">
          {formatDate(asset.created)}
        </p>
      </Tooltip>
      <p className="text-sm font-normal text-gray-500">-</p>
      <Tooltip title="Last Seen">
        <p className="text-sm font-normal text-gray-500">
          {formatDate(asset.updated)}
        </p>
      </Tooltip>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={() => removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY)}
      onBack={() => navigate(-1)}
      className={cn(
        'w-full rounded-t-lg pb-0 shadow-lg',
        openRisks.length === 0 ? 'bg-zinc-100' : 'bg-red-50'
      )}
    >
      <Loader isLoading={isInitialLoading} type="spinner">
        <div className="flex h-full flex-col gap-2 px-8 pt-0">
          <div className="grid grid-cols-2 gap-4">
            {/* Risks Section */}
            {openRisks.length === 0 ? (
              <div className="rounded-lg bg-white p-8  transition-all hover:rounded-lg hover:shadow-md">
                <h3 className="mb-4 text-2xl font-semibold tracking-wide text-green-600">
                  {asset.name} is Safe!
                  {discovered}
                </h3>

                <p className="text-sm text-gray-700">
                  No risks have been detected for this asset. However, it&apos;s
                  always a good practice to regularly monitor and scan for any
                  new potential threats.
                </p>
                <div className="mt-4">
                  <button
                    className="text-sm font-medium text-blue-500 hover:underline"
                    onClick={() => {
                      runJob({
                        capability: 'nuclei',
                        jobKey: `#asset#${asset.name}#${asset.dns}`,
                      });
                    }}
                  >
                    Schedule a scan now
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-red-500 bg-white p-8  transition-all hover:rounded-lg hover:shadow-md">
                <div className="flex flex-row justify-between">
                  <h3 className="mb-4 text-2xl font-semibold tracking-wide text-red-600">
                    {asset.name} is at Risk!
                    {discovered}
                  </h3>
                </div>
                <table className="min-w-full table-auto">
                  <thead>
                    <tr>
                      <th className="w-[80px] p-2 text-left text-sm font-medium text-red-600">
                        Priority
                      </th>
                      <th className="p-2 text-left text-sm font-medium text-red-600">
                        Name
                      </th>
                      <th className="p-2 text-left text-sm font-medium text-red-600">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {openRisks.map(({ dns, name, status, updated }) => {
                      const riskSeverityKey = status?.[1] as RiskSeverity;

                      return (
                        <tr
                          key={dns}
                          className={cn(
                            'border-b',
                            getSeverityClass(riskSeverityKey)
                          )}
                        >
                          <td className="p-2">
                            <div className="flex flex-row items-center space-x-2">
                              <Tooltip
                                title={
                                  SeverityDef[riskSeverityKey] + ' Severity'
                                }
                              >
                                {getRiskSeverityIcon(
                                  riskSeverityKey,
                                  'h-4 w-4 text-red-600'
                                )}
                              </Tooltip>
                              <span className="text-xs">
                                {SeverityDef[riskSeverityKey]}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-sm font-medium text-blue-500">
                            <Link
                              to={getRiskDrawerLink({ dns, name })}
                              className="hover:underline"
                            >
                              {name}
                            </Link>
                          </td>
                          <td className="p-2 text-sm">{formatDate(updated)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex w-full flex-col gap-2">
              {/* Actions Section */}
              <div className="flex flex-row justify-end space-x-4 text-right">
                <AddAttribute resourceKey={asset.key} />
                <AssetStatusDropdown asset={asset} />
              </div>

              {/* Attributes Section */}
              <div className="rounded-lg  bg-white p-8  transition-all hover:rounded-lg hover:shadow-md">
                <div className="flex flex-row justify-between">
                  <h3 className="mb-4 text-2xl font-semibold tracking-wide text-gray-900">
                    <NotepadText className="mr-1 inline size-6 text-gray-800" />
                    Attributes
                  </h3>
                </div>
                <div className="space-y-4">
                  {attributesGenericSearch?.attributes?.length === 0 ? (
                    <div className="text-center text-gray-500">
                      <p>No attributes added to this asset yet.</p>
                    </div>
                  ) : (
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr>
                          <th className="p-2 text-left text-sm font-medium text-gray-600">
                            Name
                          </th>
                          <th className="p-2 text-left text-sm font-medium text-gray-600">
                            Value
                          </th>
                          <th className="p-2 text-left text-sm font-medium text-gray-600">
                            Last Updated
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {attributesGenericSearch?.attributes?.map(data => (
                          <tr
                            key={data.name}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="p-2 text-sm font-medium text-gray-800">
                              {data.name}
                            </td>
                            <td className="break-all p-2 text-sm text-gray-500">
                              {data.value?.startsWith('#asset') ? (
                                <Link
                                  to={getAssetDrawerLink(
                                    parseKeys.assetKey(data.value)
                                  )}
                                  className="text-blue-500 hover:underline"
                                >
                                  {data.value}
                                </Link>
                              ) : (
                                data.value
                              )}
                            </td>
                            <td className="p-2 text-sm text-gray-500">
                              {formatDate(data.updated)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Parent Assets Section */}
            <div className="rounded-lg  bg-white p-8 transition-all hover:rounded-lg hover:shadow-md">
              <h3 className="mb-4 text-2xl font-semibold tracking-wide text-gray-900">
                <AssetsIcon className="mr-1 inline size-6 text-gray-800" />
                Parent Assets
              </h3>
              <Table
                tableClassName="border-0"
                name="parent assets"
                columns={[
                  {
                    label: 'Name',
                    id: 'name',
                    cell: item => {
                      const containsRisks = openRiskDataset[item.dns];

                      return (
                        <div className="flex flex-row items-center space-x-1">
                          {containsRisks && (
                            <Tooltip title="Contains open risks">
                              <RisksIcon className="size-4 text-red-500" />
                            </Tooltip>
                          )}
                          <Link
                            to={getAssetDrawerLink(item)}
                            className="text-brand hover:underline"
                          >
                            {item.name}
                          </Link>
                        </div>
                      );
                    },
                  },
                  {
                    className: 'text-default-light',
                    label: 'DNS',
                    id: 'dns',
                  },
                ]}
                data={parentAssets.map(({ value }) => {
                  return parseKeys.assetKey(value);
                })}
                error={attributesGenericSearchError}
                loadingRowCount={1}
                status={attributesStatus}
                noData={{
                  title: 'This asset has no parent assets.',
                  styleType: 'text',
                }}
              />
            </div>

            {/* Child Assets Section */}
            <div className="rounded-lg  bg-white p-8 transition-all hover:rounded-lg hover:shadow-md">
              <h3 className="mb-4 text-2xl font-semibold tracking-wide text-gray-900">
                <AssetsIcon className="mr-1 inline size-6 text-gray-800" />
                Child Assets
              </h3>
              <Table
                tableClassName="border-0"
                name="child assets"
                columns={[
                  {
                    label: 'Name',
                    id: 'name',
                    cell: item => {
                      const containsRisks = openRiskDataset[item.dns];

                      return (
                        <div className="flex flex-row items-center space-x-1">
                          {containsRisks && (
                            <Tooltip title="Contains open risks">
                              <RisksIcon className="size-4 text-red-500" />
                            </Tooltip>
                          )}
                          <Link
                            to={getAssetDrawerLink(item)}
                            className="text-brand hover:underline"
                          >
                            {item.name}
                          </Link>
                        </div>
                      );
                    },
                  },
                  {
                    className: 'text-default-light',
                    label: 'DNS',
                    id: 'dns',
                  },
                ]}
                data={childAssetsAttributes.map(({ source }) => {
                  return parseKeys.assetKey(source);
                })}
                error={childAssetsError}
                loadingRowCount={1}
                status={childAssetsStatus}
                noData={{
                  title: 'This asset has no child assets.',
                  styleType: 'text',
                }}
              />
            </div>
          </div>

          {/* History Section */}
          <div className="rounded-lg  bg-white p-8 transition-all hover:rounded-lg hover:shadow-md">
            <h3 className="mb-4 text-2xl font-semibold tracking-wide text-gray-900">
              <HistoryIcon className="mr-1 inline size-6 text-gray-800" />
              History
            </h3>
            <Timeline
              items={history.map((item, index) => {
                const { title, updated } = getHistoryDiff(item);
                return {
                  title,
                  description: updated,
                  icon:
                    index === 0 ? (
                      <AssetsIcon className="size-4 text-gray-800" />
                    ) : undefined,
                };
              })}
            />
          </div>
        </div>
      </Loader>
    </Drawer>
  );
};
