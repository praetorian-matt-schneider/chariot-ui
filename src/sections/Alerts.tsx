import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, ChevronRight, Inbox, Square } from 'lucide-react';

import { Button } from '@/components/Button';
import { SeverityBadge } from '@/components/GlobalSearch';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { Alert, useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { Asset, AssetStatus, Risk, RiskSeverity } from '@/types';
import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';

const isAsset = (item: Asset | Risk): item is Asset => {
  return Object.values(AssetStatus).includes(item?.status as AssetStatus);
};

const Alerts: React.FC = () => {
  const [query, setQuery] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
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

  const setItemStatus = (type: string) => {
    console.log(`Setting selected items to ${type}:`, selectedItems);
    setSelectedItems([]);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      const allItemIds = items.map(item =>
        isAsset(item) ? item.dns : item.key
      );
      setSelectedItems(allItemIds);
    }
  };

  const renderItemDetails = (item: Asset | Risk) => {
    const isSelected = selectedItems.includes(
      isAsset(item) ? item.dns : item.key
    );

    const handleViewLink = isAsset(item)
      ? getAssetDrawerLink(item)
      : getRiskDrawerLink(item);

    return (
      <div
        className="flex w-full cursor-pointer flex-row items-center justify-between rounded-sm bg-white px-2 py-4 hover:bg-gray-50"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          navigate(handleViewLink);
        }}
      >
        <div className="flex items-center space-x-2">
          <div
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              toggleSelectItem(isAsset(item) ? item.dns : item.key);
            }}
          >
            {isSelected ? (
              <Check className="text-green-500" />
            ) : (
              <Square className="text-gray-400" />
            )}
          </div>
          {!isAsset(item) && (
            <span className="text-xs font-medium text-gray-500">
              <SeverityBadge severity={item.status?.[1] as RiskSeverity} />
            </span>
          )}
          <span className="text-sm font-medium text-gray-800 hover:text-gray-900">
            {item.name ?? (isAsset(item) ? item.dns : item.key)}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(item.updated)}
          </span>
        </div>
        <div className="ml-auto rounded border border-gray-300 px-2 py-1 text-xs text-gray-700">
          {item.source}
        </div>
      </div>
    );
  };

  const totalItems = (alerts as Array<Alert>)?.reduce(
    (acc, alert) => acc + alert.count,
    0
  );

  const items = useMemo(() => data?.assets || data?.risks || [], [data]);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  const selectedAlert = (alerts as Array<Alert>)?.find(
    alert => alert.query === query
  );

  return (
    <div className="flex h-screen space-x-4">
      {/* Sidebar */}
      <div className="h-full w-1/3 overflow-auto border border-gray-300 bg-white">
        <h2 className="mb-4 flex items-center px-6 py-4 text-3xl font-normal">
          <Inbox className="mr-2 size-10 stroke-[2.5px]" />
          My Alerts ({totalItems})
        </h2>
        <div className="space-y-1">
          {(alerts as Array<Alert>)?.map((alert, index) => (
            <div
              key={index}
              className={cn(
                'flex text-sm cursor-pointer items-center justify-between rounded-sm p-4',
                query === alert.query
                  ? 'bg-brand-lighter border-l-4 border-brand'
                  : 'hover:bg-gray-100'
              )}
              onClick={() => {
                searchParams.set('query', alert.query);
                setSearchParams(searchParams);
                handleCategoryClick(alert.query);
              }}
            >
              <p className="text-md font-medium text-gray-800">{alert.label}</p>

              <div className="flex items-center space-x-2">
                <span className="text-md font-extrabold text-gray-800">
                  {alert.count}
                </span>
                <ChevronRight className="size-5 text-gray-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden border border-gray-300 bg-white ">
        {selectedAlert && (
          <div className="border-b border-default px-8 py-4 ">
            <div className="flex items-center justify-between ">
              <h2 className="text-3xl font-semibold capitalize text-default">
                <span className="font-extrabold">{items.length}</span>{' '}
                <span className="font-normal">
                  {isAsset(items[0]) ? 'assets' : 'risks'} found
                </span>
              </h2>

              <Button styleType="primary" className="px-4 py-2 text-sm">
                {isAsset(items[0]) ? 'Standard Scan for All' : 'Open for All'}
              </Button>
            </div>
            <div className="pt-2 text-sm text-gray-500">
              {selectedAlert.label}
            </div>
          </div>
        )}
        {query && (
          <div className="flex h-full flex-col">
            <div className="flex items-center space-x-2 border-b border-gray-300 bg-gray-50 px-8 py-4">
              <div
                className="flex cursor-pointer items-center space-x-2"
                onClick={toggleSelectAll}
              >
                {selectedItems.length === items.length ? (
                  <Check className="text-green-500" />
                ) : (
                  <Square className="text-gray-400" />
                )}
                <span className="text-sm font-medium capitalize text-gray-800">
                  all {isAsset(items[0]) ? 'assets' : 'risks'}
                </span>
              </div>
              <div className="grow"></div>
              <Button
                styleType="secondary"
                className="py-2 text-sm"
                onClick={() => setItemStatus('Closed')}
                disabled={selectedItems.length === 0}
              >
                {isAsset(items[0]) ? 'Comprehensive Scan' : 'Closed'}
              </Button>
              <Button
                styleType="primary"
                className="py-2 text-sm"
                onClick={() => setItemStatus('Open')}
                disabled={selectedItems.length === 0}
              >
                {isAsset(items[0]) ? 'Standard Scan' : 'Open'}
              </Button>
            </div>
            <div ref={parentRef} className="grow overflow-auto px-6">
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
