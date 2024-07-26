import React, { useState } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { Divider } from '@tremor/react';
import { Inbox } from 'lucide-react';

import { Button } from '@/components/Button';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { AssetStatus, RiskStatus } from '@/types';
import { getRoute } from '@/utils/route.util';

const isAssetStatus = (status: string): boolean => {
  return Object.values(AssetStatus).includes(status as AssetStatus);
};

const getStatusParam = (status: string): string => {
  return isAssetStatus(status) ? 'asset-priority' : 'risk-status';
};

const getEnumKeyByValue = (
  enumObj: Record<string, string>,
  value: string
): string | null => {
  const keys = Object.keys(enumObj).filter(key => enumObj[key] === value);
  return keys.length > 0 ? enumObj[keys[0]] : null;
};

const MyInbox: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shouldRenderDropdown, setShouldRenderDropdown] = useState(false);
  const navigate = useNavigate();

  const { data: alerts } = useGetAccountAlerts();

  const toggleDropdown = () => {
    if (dropdownOpen) {
      setDropdownOpen(false);
      setTimeout(() => setShouldRenderDropdown(false), 300); // Match the duration of your transition
    } else {
      setShouldRenderDropdown(true);
      setTimeout(() => setDropdownOpen(true), 0); // Allow time for mount
    }
  };

  const totalItems =
    alerts?.reduce((total, alert) => total + alert.count, 0) || 0;

  const handleReviewClick = (query: string) => {
    const status = query.split(':')[1];
    const statusParam = getStatusParam(status);
    const statusValue =
      statusParam === 'asset-priority'
        ? getEnumKeyByValue(AssetStatus, status)
        : getEnumKeyByValue(RiskStatus, status);

    if (!statusValue) return;

    navigate({
      pathname: getRoute([
        'app',
        statusParam === 'asset-priority' ? 'assets' : 'risks',
      ]),
      search: createSearchParams({
        [statusParam]: JSON.stringify([statusValue]),
        review: '1',
      }).toString(),
    });
  };

  return (
    <div className="relative border-r border-dashed border-gray-700 pr-4">
      <div
        className="flex cursor-pointer items-center"
        onClick={toggleDropdown}
      >
        <div className="relative">
          <Inbox className="size-6 stroke-1 text-gray-200" />
          {totalItems > 0 && (
            <span className="absolute -right-4 -top-3 inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-1 text-xs font-bold leading-none text-white">
              {totalItems}
            </span>
          )}
        </div>
      </div>
      {shouldRenderDropdown && (
        <div
          className={`absolute right-0 z-10 mt-2 w-[550px] rounded-sm border border-gray-300 bg-white shadow-lg transition-all duration-100 ease-[cubic-bezier(0.95,0.05,0.795,0.035)]
            ${dropdownOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}
          `}
          style={{ transitionProperty: 'opacity, transform' }}
        >
          <div className="space-y-4 p-4">
            {alerts?.map((alert, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <div className="text-gray-700">
                  <div className="flex flex-row items-center space-x-2">
                    <p className="w-16 border-r border-gray-300 text-2xl font-extrabold">
                      {alert.count}
                    </p>
                    <p className="w-full text-sm">{alert.label}</p>
                    <Button
                      styleType="secondary"
                      className="mt-2 rounded-sm border border-gray-300 py-2 font-normal text-gray-700 hover:bg-gray-100"
                      onClick={() => handleReviewClick(alert.query)}
                    >
                      Review
                    </Button>
                  </div>
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
