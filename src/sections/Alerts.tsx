import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRightIcon, Inbox, Square, SquareMinus } from 'lucide-react';

import { CopyToClipboard } from '@/components/CopyToClipboard';
import { Dropdown } from '@/components/Dropdown';
import { getAssetStatusIcon } from '@/components/icons/AssetStatus.icon';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { getRiskStatusIcon } from '@/components/icons/RiskStatus.icon';
import { MenuItemProps } from '@/components/Menu';
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
        className={cn(
          'flex w-full cursor-pointer flex-row items-center justify-between border-t border-gray-200 bg-white px-8 py-4 hover:bg-gray-50',
          isSelected && 'bg-highlight/10 hover:bg-highlight/2s0'
        )}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          navigate(handleViewLink);
        }}
      >
        <div className="mr-2 flex items-center space-x-3">
          <div
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              toggleSelectItem(isAsset(item) ? item.dns : item.key);
            }}
          >
            {isSelected ? (
              <Square className="size-6 text-brand" fill="rgb(95,71,183)" />
            ) : (
              <Square className="size-6 text-gray-400" />
            )}
          </div>
          {!isAsset(item) && (
            <Tooltip title="Severity">
              {getRiskSeverityIcon(item.status[1] as RiskSeverity)}
            </Tooltip>
          )}
          <CopyToClipboard textToCopy={isAsset(item) ? item.dns : item.key}>
            <div>
              <span
                role="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSelectItem(isAsset(item) ? item.dns : item.key);
                }}
                className="text-md mr-2 select-none font-medium text-gray-800 hover:text-gray-900"
              >
                {item.name ?? (isAsset(item) ? item.dns : item.key)}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(item.updated)}
              </span>
            </div>
          </CopyToClipboard>
        </div>
        <Tooltip title="Status">
          <span className="ml-1 rounded border border-red-400 px-2 py-1 text-xs font-medium text-red-500">
            {isAsset(item)
              ? AssetStatusLabel[item.status as AssetStatus]
              : RiskStatusLabel[item.status[0] as RiskStatus]}
          </span>
        </Tooltip>
        <Tooltip title="Source">
          <div className="ml-1 mr-auto rounded border border-gray-400 px-3 py-1 text-xs capitalize text-gray-700">
            {item.source}
          </div>
        </Tooltip>
        <ChevronRightIcon className="size-5 text-gray-500" />
      </div>
    );
  };

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
              icon: getAssetStatusIcon(value as AssetStatus),
            }))
        : Object.entries(RiskStatusLabel)
            .filter(([value]) => value !== items[0].status[0])
            .map(([value, label]) => ({
              value,
              label,
              color: 'default',
              icon: getRiskStatusIcon(value as RiskStatus),
            }))
      : [];

  return (
    <div className="flex h-screen border border-default">
      {/* Sidebar */}
      <div className="h-full w-1/4 overflow-auto border-r border-gray-200 bg-zinc-50 bg-gradient-to-l p-4 ">
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
                  : 'hover:bg-gray-100'
              )}
              onClick={() => {
                searchParams.set('query', alert.query);
                setSelectedItems([]);
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
      <div className="flex-1 overflow-hidden border-l border-gray-200 bg-white shadow-2xl">
        {selectedAlert && (
          <div className="relative border-b border-gray-200 bg-white px-8 py-4 pb-9 ">
            <div className="pt-2 text-3xl font-light text-default">
              <span className="mr-2 font-extrabold">
                {items.length?.toLocaleString()}
              </span>{' '}
              {selectedAlert.label}
            </div>
          </div>
        )}
        {query && (
          <div className="flex h-full flex-col">
            <div className="flex items-center space-x-2 border-b border-gray-200 bg-gray-50 px-8 py-4">
              <div
                className="flex flex-1 cursor-pointer select-none items-center space-x-2"
                onClick={toggleSelectAll}
              >
                {selectedItems.length === items.length ? (
                  <Square className="text-brand" fill="rgb(95,71,183)" />
                ) : selectedItems.length === 0 ? (
                  <Square className="text-gray-400" />
                ) : (
                  <SquareMinus className="text-gray-400" />
                )}
                <span className="text-md font-medium text-default">
                  {selectedItems.length > 0 ? (
                    <span>
                      {selectedItems.length === items.length ? (
                        `All ${isAsset(items[0]) ? 'assets' : 'risks'} selected`
                      ) : (
                        <span>
                          {selectedItems.length} of {items.length}{' '}
                          {isAsset(items[0]) ? 'assets' : 'risks'} selected
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="italic">
                      Select all {isAsset(items[0]) ? 'asset' : 'risk'}s to
                      remediate
                    </span>
                  )}
                </span>
              </div>

              {currentStatus && (
                <Dropdown
                  styleType="primary"
                  menu={{
                    items: dropdownItems,
                    onClick: handleStatusChange,
                  }}
                  disabled={selectedItems.length === 0}
                  endIcon={<ChevronDownIcon className="size-5" />}
                  startIcon={
                    isAsset(items[0])
                      ? getAssetStatusIcon(items[0].status as AssetStatus)
                      : getRiskStatusIcon(items[0].status[0] as RiskStatus)
                  }
                >
                  Change Status
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
