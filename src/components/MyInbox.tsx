import React, { useState } from 'react';
import { Divider } from '@tremor/react';
import { Check, ChevronDown, ChevronRight, Inbox, Square } from 'lucide-react';

import { Button } from '@/components/Button';
import { Link } from '@/components/Link';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { Alert, useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { Asset, AssetStatus, Risk } from '@/types';

const MyInbox: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shouldRenderDropdown, setShouldRenderDropdown] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { data: alerts } = useGetAccountAlerts();
  const { getRiskDrawerLink, getAssetDrawerLink } = getDrawerLink();

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
    if (!dropdownOpen) setShouldRenderDropdown(true);
  };

  const handleCategoryClick = (query: string, section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
      setQuery(null);
    } else {
      setQuery(query);
      setExpandedSection(section);
    }
  };

  const { data } = useGenericSearch(
    {
      query: query ?? '',
    },
    {
      enabled: !!query,
    }
  );

  const setAssetScanning = (type: string) => {
    console.log(`Setting selected assets to ${type}:`, selectedItems);
    setSelectedItems([]);
  };

  const setRiskStatus = (status: string) => {
    console.log(`Setting selected risks to ${status}:`, selectedItems);
    setSelectedItems([]);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const renderItemDetails = (item: Asset | Risk) => {
    const isAsset = (item: Asset | Risk): item is Asset =>
      Object.values(AssetStatus).includes(item.status as AssetStatus);

    const isSelected = selectedItems.includes(
      isAsset(item) ? item.dns : item.key
    );

    return (
      <div
        className={`flex cursor-pointer items-center justify-between rounded-md px-2 duration-200 hover:border-gray-200 hover:bg-gray-50 ${isSelected ? 'border-green-500' : 'border-gray-50 bg-white'}`}
        onClick={e => {
          e.stopPropagation();
          toggleSelectItem(isAsset(item) ? item.dns : item.key);
        }}
      >
        <div className="flex items-center space-x-2">
          {isSelected ? (
            <Check className="text-green-500" />
          ) : (
            <Square className="text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-800">
            {item.name ?? (isAsset(item) ? item.dns : item.key)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
            {item.source}
          </span>
          <Link
            to={
              isAsset(item) ? getAssetDrawerLink(item) : getRiskDrawerLink(item)
            }
            className="text-sm text-brand hover:text-brand-dark"
            onClick={e => e.stopPropagation()}
          >
            View
          </Link>
        </div>
      </div>
    );
  };

  const totalItems = (alerts as Array<Alert>)?.reduce(
    (acc, alert) => acc + alert.count,
    0
  );

  return (
    <div className="relative h-full">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={toggleDropdown}
          className="flex items-center text-white focus:outline-none"
        >
          <Inbox className="size-6 stroke-1" />
          {totalItems > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-1 text-xs font-bold leading-none text-white">
              {totalItems}
            </span>
          )}
        </button>
      </div>
      {shouldRenderDropdown && (
        <div className="absolute right-0 z-10 mt-2 w-[550px] rounded-md border border-gray-300 bg-white shadow-lg transition-all duration-100 ease-in-out">
          <div className="p-4">
            {(alerts as Array<Alert>)?.map((alert, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <div
                  className="flex cursor-pointer flex-col space-y-2"
                  onClick={() => handleCategoryClick(alert.query, alert.label)}
                >
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-bold text-gray-800">
                        {alert.count}
                      </p>
                      <div className="flex-1">
                        <p className="text-md text-gray-800">{alert.label}</p>
                      </div>
                    </div>
                    {expandedSection === alert.label ? (
                      <ChevronDown className="size-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="size-5 text-gray-500" />
                    )}
                  </div>
                  {expandedSection === alert.label && (
                    <div className="mt-2">
                      {data?.assets && (
                        <>
                          <div className="flex flex-col space-y-1">
                            {data.assets.map((item, index) => (
                              <div key={`asset-${index}`}>
                                {renderItemDetails(item)}
                              </div>
                            ))}
                          </div>
                          {selectedItems.length > 0 && (
                            <div className="mt-4 flex space-x-2">
                              <Button
                                styleType="primary"
                                className="w-1/2 py-2 text-sm"
                                onClick={() =>
                                  setAssetScanning('Standard Scanning')
                                }
                              >
                                Standard Scan
                              </Button>
                              <Button
                                styleType="secondary"
                                className="w-1/2 border border-brand py-2 text-sm text-brand"
                                onClick={() =>
                                  setAssetScanning('Comprehensive Scanning')
                                }
                              >
                                Comprehensive Scan
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                      {data?.risks && (
                        <div className="">
                          <div className="flex flex-col space-y-1">
                            {data.risks.map((item, index) => (
                              <div key={`risk-${index}`}>
                                {renderItemDetails(item)}
                              </div>
                            ))}
                          </div>
                          {selectedItems.length > 0 && (
                            <>
                              <div className="flex space-x-2">
                                <Button
                                  styleType="primary"
                                  className="w-1/2 py-2 text-sm"
                                  onClick={() => setRiskStatus('Open')}
                                >
                                  Open
                                </Button>
                                <Button
                                  styleType="secondary"
                                  className="w-1/2 border border-brand py-2 text-sm text-brand"
                                  onClick={() => setRiskStatus('Closed')}
                                >
                                  Closed
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInbox;
