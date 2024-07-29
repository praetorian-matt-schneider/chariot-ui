import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRightIcon, Inbox } from 'lucide-react';

import { Button } from '@/components/Button';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { Tooltip } from '@/components/Tooltip';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { Alert, useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
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
        className="flex w-full cursor-pointer items-center space-x-4 border-b border-gray-200 bg-white p-4 hover:bg-gray-100"
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
          <span className="rounded-md border border-gray-300 p-1 text-xs">
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

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 77, // Adjusted size to fit the new layout
    overscan: 5,
  });

  const selectedAlert = (alerts as Array<Alert>)?.find(
    alert => alert.query === query
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="h-full w-1/4 overflow-auto rounded-l-md border border-r-0 border-gray-200 bg-zinc-50 bg-gradient-to-l p-4">
        <h2 className="mb-6 flex items-center px-3 py-4 text-lg font-medium text-gray-800">
          <Inbox className="mr-2 size-6 stroke-[2.5px]" />
          <span className="mr-2 text-xl">All Alerts</span>
        </h2>
        <div className="space-y-2">
          {(alerts as Array<Alert>)?.map((alert, index) => (
            <div
              key={index}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-sm p-3 space-x-2',
                query === alert.query
                  ? 'bg-highlight/10 border-l-[3px] border-brand'
                  : 'border-l-[3px] border-transparent hover:bg-gray-100'
              )}
              onClick={() => {
                searchParams.set('query', alert.query);
                setSearchParams(searchParams);
                handleCategoryClick(alert.query);
              }}
            >
              <p className="text-md select-none font-medium">{alert.label}</p>

              <span className="text-md font-medium">{alert.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="-my-1 flex-1 rounded-sm border-l border-zinc-200 bg-white shadow-2xl">
        {selectedAlert && (
          <div className="relative border-b border-gray-200 p-8">
            <div className="text-3xl font-light text-default">
              <span className="mr-2 font-extrabold">
                {items.length?.toLocaleString()}
              </span>{' '}
              {selectedAlert.label}
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
