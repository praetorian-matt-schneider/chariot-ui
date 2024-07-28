import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, ChevronRight, Inbox, Square } from 'lucide-react';

import { Dropdown } from '@/components/Dropdown';
import { SeverityBadge } from '@/components/GlobalSearch';
import { MenuItemProps } from '@/components/Menu';
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

  const handleStatusChange = (newStatus?: string) => {
    console.log(`Changing status of selected items to ${newStatus}`);
    // Implement status change logic for all selected items
    setSelectedItems([]);
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
        className="flex w-full cursor-pointer flex-row items-center justify-between border-b border-gray-200 bg-white px-8 py-4 hover:bg-gray-50"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          navigate(handleViewLink);
        }}
      >
        <div className="flex items-center space-x-3">
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
          <span className="text-md font-medium text-gray-800 hover:text-gray-900">
            {item.name ?? (isAsset(item) ? item.dns : item.key)}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(item.updated)}
          </span>
        </div>
        <div className="ml-auto rounded border border-gray-300 px-3 py-1 text-xs text-gray-700">
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
    estimateSize: () => 60,
    overscan: 5,
  });

  const selectedAlert = (alerts as Array<Alert>)?.find(
    alert => alert.query === query
  );

  const currentStatus =
    items.length > 0
      ? isAsset(items[0])
        ? AssetStatusLabel[items[0].status as AssetStatus]
        : RiskStatusLabel[items[0].status[0] as RiskStatus]
      : '';

  const dropdownItems: MenuItemProps[] =
    items.length > 0
      ? isAsset(items[0])
        ? Object.entries(AssetStatusLabel)
            .filter(([value]) => value !== items[0].status)
            .map(([value, label]) => ({
              value,
              label,
              color: 'default',
            }))
        : Object.entries(RiskStatusLabel)
            .filter(([value]) => value !== items[0].status[0])
            .map(([value, label]) => ({
              value,
              label,
              color: 'default',
            }))
      : [];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="h-full w-1/4 overflow-auto border-r border-gray-300 bg-gray-50 p-4">
        <h2 className="mb-6 flex items-center px-3 py-4 text-lg font-semibold text-gray-800">
          <Inbox className="mr-3 size-6 stroke-2" />
          My Alerts ({totalItems})
        </h2>
        <div className="space-y-2">
          {(alerts as Array<Alert>)?.map((alert, index) => (
            <div
              key={index}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-md p-3 shadow-sm',
                query === alert.query
                  ? 'bg-blue-100 border-l-4 border-blue-600'
                  : 'hover:bg-gray-100'
              )}
              onClick={() => {
                searchParams.set('query', alert.query);
                setSelectedItems([]);
                setSearchParams(searchParams);
                handleCategoryClick(alert.query);
              }}
            >
              <p className="text-md font-medium text-gray-800">{alert.label}</p>

              <div className="flex items-center space-x-2">
                <span className="text-md font-medium text-gray-800">
                  {alert.count}
                </span>
                <ChevronRight className="size-5 text-gray-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden border-l border-gray-300 bg-white">
        {selectedAlert && (
          <div className="border-b border-gray-300 bg-gray-50 px-8 py-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-semibold capitalize text-gray-800">
                <span className="font-extrabold">{items.length}</span>{' '}
                <span className="font-normal">
                  {isAsset(items[0]) ? 'assets' : 'risks'} found
                </span>
              </h2>
            </div>
            <div className="pt-2 text-sm text-gray-600">
              {selectedAlert.label}
            </div>
          </div>
        )}
        {query && (
          <div className="flex h-full flex-col">
            <div className="flex items-center space-x-2 border-b border-gray-300 bg-gray-50 px-8 py-4">
              <div
                className="flex flex-1 cursor-pointer items-center space-x-2"
                onClick={toggleSelectAll}
              >
                {selectedItems.length === items.length ? (
                  <Check className="text-green-500" />
                ) : (
                  <Square className="text-gray-400" />
                )}
                <span className="text-light text-gray-800">
                  {selectedItems.length > 0 ? (
                    <span className="text-gray-600">
                      {selectedItems.length} selected
                    </span>
                  ) : (
                    <span className="italic text-gray-500">
                      Select {isAsset(items[0]) ? 'asset' : 'risk'}s to
                      remediate
                    </span>
                  )}
                </span>
              </div>

              {currentStatus && (
                <Dropdown
                  styleType="error"
                  menu={{
                    items: dropdownItems,
                    onClick: handleStatusChange,
                  }}
                  disabled={selectedItems.length === 0}
                  endIcon={<ChevronDownIcon className="size-5" />}
                >
                  {currentStatus}
                </Dropdown>
              )}
            </div>
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
