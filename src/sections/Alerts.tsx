import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRightIcon, Inbox, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/Button';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { Tooltip } from '@/components/Tooltip';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import {
  Asset,
  AssetStatus,
  AssetStatusLabel,
  Risk,
  RiskSeverity,
  RiskStatus,
  RiskStatusLabel,
} from '@/types';
import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';

const isAsset = (item: Asset | Risk): item is Asset => {
  return Object.values(AssetStatus).includes(item?.status as AssetStatus);
};

const Alerts: React.FC = () => {
  const [query, setQuery] = useState<string | null>(null);

  const { data: alerts } = useGetAccountAlerts();
  const { getRiskDrawerLink, getAssetDrawerLink } = getDrawerLink();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const initialQuery = searchParams.get('query');
    if (initialQuery) {
      setQuery(initialQuery);
    } else if (alerts && alerts.length > 0) {
      setQuery(alerts[0].query);
    }
  }, [alerts, searchParams]);

  const handleCategoryClick = (query: string) => {
    setQuery(query);
  };

  const { data } = useGenericSearch(
    {
      query: query ?? '',
    },
    {
      enabled: !!query,
    }
  );

  const renderItemDetails = (item: Asset | Risk) => {
    const handleViewLink = isAsset(item)
      ? getAssetDrawerLink(item)
      : getRiskDrawerLink(item);

    return (
      <div
        className="flex w-full cursor-pointer items-center space-x-4 border-b border-gray-200 bg-white p-4 px-8 hover:bg-gray-100"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          navigate(handleViewLink);
        }}
      >
        <div className="flex space-x-2">
          {isAsset(item) ? (
            <>
              <Button styleType="primary" className="h-8">
                Enable
              </Button>
              <Button styleType="secondary" className="h-8">
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button styleType="primary" className="h-8">
                Open
              </Button>
              <Button styleType="secondary" className="h-8">
                Reject
              </Button>
            </>
          )}
        </div>
        <div className="flex flex-1 items-center space-x-3">
          {!isAsset(item) && (
            <Tooltip title="Severity">
              {getRiskSeverityIcon(item.status[1] as RiskSeverity)}
            </Tooltip>
          )}
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-gray-800 hover:text-gray-900">
              {item.name ?? (isAsset(item) ? item.dns : item.key)}
            </span>
            <span className="text-xs text-gray-500">
              {item.created !== item.updated ? (
                <Tooltip title={`Created on ${formatDate(item.created)}`}>
                  Updated on {formatDate(item.updated)}
                </Tooltip>
              ) : (
                <span>
                  {isAsset(item)
                    ? item.source === 'provided'
                      ? 'Added'
                      : 'Discovered'
                    : 'Identified'}{' '}
                  {formatDate(item.created)}
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isAsset(item) && (
            <span className="rounded-md border border-gray-300 p-1 text-xs">
              {item.dns}
            </span>
          )}
          <span
            className={cn(
              'rounded-md border border-gray-300 p-1 text-xs',
              isAsset(item) && 'capitalize'
            )}
          >
            {item.source}
          </span>
          <Tooltip title="Status">
            <span className="rounded border border-red-400 px-2 py-1 text-xs font-medium text-red-500">
              {isAsset(item)
                ? AssetStatusLabel[item.status as AssetStatus]
                : RiskStatusLabel[item.status[0] as RiskStatus]}
            </span>
          </Tooltip>
        </div>
        <ChevronRightIcon className="ml-auto size-5 text-gray-500" />
      </div>
    );
  };

  const items = useMemo(() => data?.assets || data?.risks || [], [data]);
  const totalAlerts = alerts?.reduce((acc, alert) => acc + alert.count, 0);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 77, // Adjusted size to fit the new layout
    overscan: 5,
  });

  return (
    <div className="flex h-[60vh] shadow-sm">
      {/* Sidebar */}
      <div className="w-1/4 overflow-auto rounded-l-md rounded-r-none border border-r-0 border-gray-200 bg-zinc-50 bg-gradient-to-l py-4">
        <h2 className="mb-4 flex items-center py-2 text-lg font-medium text-gray-800">
          <Inbox className="ml-3 mr-2 size-8 stroke-[2px] " />
          <span className="mr-2 text-xl font-bold">
            All Alerts {alerts && alerts.length && <span>({totalAlerts})</span>}
          </span>
        </h2>
        {alerts === null && (
          <div className="flex items-center justify-between px-3 italic text-gray-500">
            <p className="text-md select-none font-medium">No alerts found</p>
          </div>
        )}
        <div>
          {(alerts ?? []).map((alert, index) => (
            <div
              key={index}
              className={cn(
                'flex cursor-pointer items-start p-4 ',
                query === alert.query
                  ? 'bg-highlight/10 '
                  : ' hover:bg-gray-100'
              )}
              onClick={() => {
                searchParams.set('query', alert.query);
                setSearchParams(searchParams);
                handleCategoryClick(alert.query);
              }}
            >
              <div className="flex flex-col space-y-1">
                <p className="text-md select-none font-medium">{alert.label}</p>

                <span className="text-xs font-normal text-gray-500">
                  {alert.count} {alert.label.split(' ')[0].toLowerCase()}
                </span>
              </div>
            </div>
          ))}
          {alerts?.length === 0 && (
            <div
              className="flex cursor-pointer items-center justify-between space-x-2 border-l-[3px] border-brand bg-highlight/10 p-3"
              onClick={() => {
                searchParams.set('query', '');
                setSearchParams(searchParams);
              }}
            >
              <p className="text-md select-none font-medium">No alerts found</p>
              <span className="text-md font-medium">View Alerts</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="border-l-none flex-1 rounded-sm rounded-l-none border border-gray-200 bg-white">
        {alerts === null && (
          <div className="mt-16 flex flex-1 items-center justify-center">
            <div className="text-center">
              <ShieldCheck className="mx-auto mb-4 size-52 stroke-[1px] text-gray-900" />
              <h3 className="mt-10 text-5xl font-bold text-gray-900">
                You’re all caught up!
              </h3>
              <p className="mt-4 text-lg text-gray-600">
                No alerts to show. Enjoy your peace of mind.
              </p>
            </div>
          </div>
        )}
        {query && (
          <div className="flex h-full flex-col">
            <div ref={parentRef} className="grow overflow-auto">
              <div
                className="relative"
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                }}
              >
                {virtualizer.getVirtualItems().map(virtualItem => (
                  <div
                    key={virtualItem.key}
                    className="absolute left-0 top-0 w-full"
                    style={{
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {renderItemDetails(items[virtualItem.index])}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
