import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Divider } from '@tremor/react';
import { ChevronDown, Inbox } from 'lucide-react'; // Assuming lucide-react is already installed

import { Button } from '@/components/Button';
import { RisksIcon } from '@/components/icons';
import { getAssetStatusIcon } from '@/components/icons/AssetStatus.icon';
import { AssetStatus } from '@/types';

interface Props {
  assets: number;
  risks: number;
}

const MyInbox: React.FC<Props> = ({ risks, assets }) => {
  const [, addSearchParams] = useSearchParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const totalItems = assets + risks;

  return (
    <div className="relative">
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
        <ChevronDown className="ml-2 size-4 text-gray-700" />
      </div>
      {dropdownOpen && (
        <div className="absolute right-0 z-10 mt-2 w-64 rounded-md border border-gray-300 bg-white shadow-lg">
          <div className="space-y-4 p-4">
            {assets > 0 && (
              <div className="text-gray-700">
                <div className="flex items-center space-x-2">
                  {getAssetStatusIcon(AssetStatus.ActiveLow, 'size-6')}
                  <p className="text-md font-semibold">New Assets Discovered</p>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Enable risk scanning to protect from potential threats.
                </p>
                <Button
                  styleType="secondary"
                  className="rounded-smd mt-2 w-full border border-gray-300 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    addSearchParams({
                      'asset-priority': 'AL',
                      review: '1',
                    });
                    toggleDropdown(); // Close dropdown after action
                  }}
                >
                  ({assets}) Review Now
                </Button>
              </div>
            )}
            {risks > 0 && (
              <>
                <Divider />
                <div className="text-gray-700">
                  <div className="flex items-center space-x-2">
                    <RisksIcon className="size-6 text-gray-700" />
                    <p className="text-md font-semibold">
                      New Risks Identified
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Triage risks to protect your organization.
                  </p>
                  <Button
                    styleType="secondary"
                    className="mt-2 w-full rounded-sm border border-gray-300 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      addSearchParams({
                        'risk-status': 'T',
                        review: '1',
                      });
                      toggleDropdown(); // Close dropdown after action
                    }}
                  >
                    ({risks}) Review Now
                  </Button>
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
