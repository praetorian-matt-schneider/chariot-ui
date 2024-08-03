import { ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Drawer } from '@/components/Drawer';
import { AssetsIcon, RisksIcon } from '@/components/icons';
import { getAssetStatusIcon } from '@/components/icons/AssetStatus.icon';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { getRiskStatusIcon } from '@/components/icons/RiskStatus.icon';
import { Loader } from '@/components/Loader';
import { Timeline } from '@/components/Timeline';
import { Tooltip } from '@/components/Tooltip';
import { AssetStatusDropdown } from '@/components/ui/AssetPriorityDropdown';
import { getAssetStatusProperties } from '@/components/ui/AssetStatusChip';
import { useMy } from '@/hooks';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { buildOpenRiskDataset } from '@/sections/Assets';
import { AddAttribute } from '@/sections/detailsDrawer/AddAttribute';
import {
  Asset,
  AssetStatusLabel,
  EntityHistory,
  Risk,
  RiskSeverity,
  RiskStatus,
  RiskStatusLabel,
  SeverityDef,
} from '@/types';
import { formatDate } from '@/utils/date.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { useSearchParams } from '@/utils/url.util';

interface Props {
  compositeKey: string;
  open: boolean;
}

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
  const [, dns] = compositeKey.split('#');
  const riskFilter = `#${dns}`;
  const attributeFilter = `source:#asset${compositeKey}`;
  const linkedIpsFilter = `#${dns}#`;
  const { removeSearchParams } = useSearchParams();
  const navigate = useNavigate();

  const { data: assets = [], status: assetsStatus } = useMy(
    {
      resource: 'asset',
      query: compositeKey,
    },
    { enabled: open }
  );
  const { data: attributesGenericSearch, status: attributesStatus } =
    useGenericSearch(
      {
        query: attributeFilter,
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
  const {
    data: rawLinkedHostnamesIncludingSelf = [],
    status: linkedIpsStatus,
  } = useMy(
    {
      resource: 'asset',
      query: linkedIpsFilter,
    },
    { enabled: open }
  );

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
    linkedIpsStatus === 'pending' ||
    attributesStatus === 'pending';

  const linkedHostnames = rawLinkedHostnamesIncludingSelf.filter(
    ({ dns }) => dns !== asset.dns
  );
  const linkedIps = rawLinkedHostnamesIncludingSelf.filter(
    ({ name }) => name !== asset.dns
  );

  return (
    <Drawer
      open={open}
      onClose={() => removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY)}
      onBack={() => navigate(-1)}
      className="w-full rounded-t-md"
      header={
        isInitialLoading ? null : (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{asset.name}</h2>
              <p className="text-sm text-gray-500">{asset.dns}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Tooltip placement="top" title="Change scan status">
                <AssetStatusDropdown asset={asset} />
              </Tooltip>
            </div>
          </div>
        )
      }
    >
      <Loader isLoading={isInitialLoading} type="spinner">
        <div className="flex h-full flex-col space-y-8 px-6 py-4">
          <div className="grid grid-cols-2 gap-8">
            {/* Risks Table */}
            <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Risks</h3>
              {risks.length === 0 ? (
                <div className="text-center text-gray-500">
                  <p>No risks found for this asset.</p>
                  <p>Your asset appears safe and secure.</p>
                </div>
              ) : (
                <table className="min-w-full table-auto">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-500">
                        Priority
                      </th>
                      <th className="p-2 text-left text-sm font-medium text-gray-500">
                        Name
                      </th>
                      <th className="p-2 text-left text-sm font-medium text-gray-500">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {risks.map(({ dns, name, status, updated }) => {
                      const riskStatusKey =
                        `${status?.[0]}${status?.[2] || ''}` as RiskStatus;
                      const riskSeverityKey = status?.[1] as RiskSeverity;

                      return (
                        <tr
                          key={dns}
                          className="border-b border-gray-100 bg-white"
                        >
                          <td className="p-2">
                            <div className="flex items-center space-x-2">
                              <Tooltip
                                title={
                                  SeverityDef[riskSeverityKey] + ' Severity'
                                }
                              >
                                {getRiskSeverityIcon(riskSeverityKey, 'size-5')}
                              </Tooltip>
                              <Tooltip
                                title={
                                  RiskStatusLabel[riskStatusKey] + ' Status'
                                }
                              >
                                {getRiskStatusIcon(riskStatusKey, 'size-5')}
                              </Tooltip>
                            </div>
                          </td>
                          <td className="p-2 text-sm font-medium text-gray-900">
                            {name}
                          </td>
                          <td className="p-2 text-sm text-gray-500">
                            {formatDate(updated)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Attributes Table */}
            <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Attributes</h3>
              <div className="space-y-4">
                <AddAttribute resourceKey={asset.key} />
                {attributesGenericSearch?.attributes?.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <p>No attributes added to this asset yet.</p>
                  </div>
                ) : (
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-sm font-medium text-gray-500">
                          Name
                        </th>
                        <th className="p-2 text-left text-sm font-medium text-gray-500">
                          Value
                        </th>
                        <th className="p-2 text-left text-sm font-medium text-gray-500">
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attributesGenericSearch?.attributes?.map(data => (
                        <tr
                          key={data.name}
                          className="border-b border-gray-100 bg-white"
                        >
                          <td className="p-2 text-sm font-medium text-gray-900">
                            {data.name}
                          </td>
                          <td className="p-2 text-sm text-gray-500">
                            {data.value}
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

          {/* Related Assets Table */}
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Related Assets</h3>
            {linkedHostnames.length === 0 && linkedIps.length === 0 ? (
              <div className="text-center text-gray-500">
                <p>No related assets found.</p>
                <p>This asset has no related hostnames or IPs.</p>
              </div>
            ) : (
              <table className="min-w-full table-auto">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                      DNS
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                      Last Updated
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linkedHostnames.map(data => {
                    const { detail } = getAssetStatusProperties(data.status);
                    const containsRisks = openRiskDataset[data.dns];

                    return (
                      <tr
                        key={data.dns}
                        className="border-b border-gray-100 bg-white"
                      >
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          Hostname
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          {data.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {data.dns}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {formatDate(data.updated)}
                        </td>
                        <td className="px-4 py-2">
                          <Tooltip title={detail}>
                            {getAssetStatusIcon(data.status, 'size-5')}
                          </Tooltip>
                          {containsRisks && (
                            <Tooltip title="Contains open risks">
                              <RisksIcon className="size-5" />
                            </Tooltip>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {linkedIps.map(data => {
                    const { detail } = getAssetStatusProperties(data.status);
                    const containsRisks = openRiskDataset[data.dns];

                    return (
                      <tr
                        key={data.dns}
                        className="border-b border-gray-100 bg-white"
                      >
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          IP Address
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          {data.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {data.dns}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {formatDate(data.updated)}
                        </td>
                        <td className="px-4 py-2">
                          <Tooltip title={detail}>
                            {getAssetStatusIcon(data.status, 'size-5')}
                          </Tooltip>
                          {containsRisks && (
                            <Tooltip title="Contains open risks">
                              <RisksIcon className="size-5" />
                            </Tooltip>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* History Timeline */}
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">History</h3>
            <Timeline
              items={history.map((item, index) => {
                const { title, updated } = getHistoryDiff(item);
                return {
                  title,
                  description: updated,
                  icon:
                    index === 0 ? (
                      <AssetsIcon className="stroke-1" />
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
