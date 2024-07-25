import React, { useState } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { Divider } from '@tremor/react';
import { Inbox } from 'lucide-react';

import { Button } from '@/components/Button';
import { AssetStatus, RiskStatus } from '@/types';
import { getRoute } from '@/utils/route.util';

interface Props {
  assets: number;
  risks: number;
}

const MyInbox: React.FC<Props> = ({ risks, assets }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shouldRenderDropdown, setShouldRenderDropdown] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    if (dropdownOpen) {
      setDropdownOpen(false);
      setTimeout(() => setShouldRenderDropdown(false), 300); // Match the duration of your transition
    } else {
      setShouldRenderDropdown(true);
      setTimeout(() => setDropdownOpen(true), 0); // Allow time for mount
    }
  };

  const totalItems = assets + risks;

  return (
    <div className="relative  border-r border-dashed border-gray-700 pr-4">
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
             ${
               dropdownOpen
                 ? 'translate-y-0 opacity-100'
                 : '-translate-y-2 opacity-0'
             }`}
          style={{ transitionProperty: 'opacity, transform' }}
        >
          <div className="space-y-4 p-4">
            {assets > 0 && (
              <div className="text-gray-700">
                <div className="flex flex-row items-center space-x-2">
                  <p className="w-16 border-r border-gray-300 text-2xl font-extrabold">
                    {assets}
                  </p>
                  <p className="w-full text-sm">
                    Discovered assets are not being scanned for risks
                  </p>
                  <Button
                    styleType="secondary"
                    className="mt-2 rounded-sm border border-gray-300 py-2 font-normal text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      navigate({
                        pathname: getRoute(['app', 'assets']),
                        search: createSearchParams({
                          'asset-priority': JSON.stringify([
                            AssetStatus.ActiveLow,
                          ]),
                          review: '1',
                        }).toString(),
                      });
                    }}
                  >
                    Review
                  </Button>
                </div>
              </div>
            )}
            {risks > 0 && (
              <>
                {assets > 0 && <Divider />}
                <div className="text-gray-700">
                  <div className="flex flex-row items-center space-x-2">
                    <p className="w-16 border-r border-gray-300 text-2xl font-extrabold">
                      {risks}
                    </p>
                    <p className="w-full text-sm">
                      Identified risks need to be triaged
                    </p>
                    <Button
                      styleType="secondary"
                      className="mt-2 rounded-sm border border-gray-300 py-2 font-normal text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        navigate({
                          pathname: getRoute(['app', 'risks']),
                          search: createSearchParams({
                            'risk-status': JSON.stringify([RiskStatus.Triaged]),
                            review: '1',
                          }).toString(),
                        });
                        toggleDropdown(); // Close dropdown after action
                      }}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInbox;
