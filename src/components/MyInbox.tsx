import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { RisksIcon } from '@/components/icons';
import { getAssetStatusIcon } from '@/components/icons/AssetStatus.icon';
import { AssetStatus } from '@/types';

interface Props {
  folder: string;
  assets: number;
  risks: number;
}
const MyInbox: React.FC<Props> = ({ folder, risks, assets }) => {
  const [, addSearchParams] = useSearchParams();
  if (assets === 0 && risks === 0) return null;

  return (
    <div className="w-full">
      <div className="flex flex-col border border-gray-600 bg-gray-900">
        {assets > 0 && folder === 'Assets' && (
          <div
            className={`flex w-full flex-row items-center px-4 py-1 text-white `}
            role="alert"
          >
            <div className="flex grow flex-row items-center">
              {getAssetStatusIcon(AssetStatus.ActiveLow, 'size-6')}
              <p className="text-md ml-2 w-44 font-semibold">
                New Assets Detected
              </p>
              <p className="text-sm text-gray-400">
                Enable risk scanning to protect{' '}
                <span className="font-semibold">
                  {assets} newly identified assets
                </span>{' '}
                from potential threats.
              </p>
            </div>

            <Button
              styleType="none"
              className="w-20 text-white"
              onClick={() => {
                addSearchParams({
                  'asset-priority': 'AL',
                });
              }}
            >
              View
            </Button>
            <Button styleType="primary" className="w-32 rounded-r-none py-2">
              Enable Now
            </Button>
          </div>
        )}

        {risks > 0 && folder === 'Risks' && (
          <div
            className="flex w-full flex-row items-center px-4 py-1 text-white"
            role="alert"
          >
            <div className="flex grow flex-row items-center">
              <RisksIcon className="size-6" />
              <p className="text-md ml-2 w-44 font-semibold">
                New Risks Detected
              </p>
              <p className="text-sm text-gray-400">
                Triage{' '}
                <span className="font-semibold">
                  {risks} newly discovered risks
                </span>{' '}
                to protect your organization from potential threats.
              </p>
            </div>

            <Button
              styleType="none"
              className="w-20 text-white"
              onClick={() => {
                addSearchParams({
                  'risk-status': 'T',
                });
              }}
            >
              View
            </Button>
            <Button styleType="primary" className="w-32 py-2">
              Triage Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInbox;
