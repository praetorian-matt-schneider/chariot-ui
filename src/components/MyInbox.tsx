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

  if (!['assets', 'risks'].includes(folder.toLowerCase())) return null;
  if (assets === 0 && folder?.toLowerCase() === 'assets') return null;
  if (risks === 0 && folder?.toLowerCase() === 'risks') return null;

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
              <p className="text-md ml-2 w-52 font-semibold">
                New Assets Discovered
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
              styleType="primary"
              className="py-2 text-white"
              onClick={() => {
                addSearchParams({
                  'asset-priority': 'AL',
                  review: '1',
                });
              }}
            >
              Review Now
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
              <p className="text-md ml-2 w-52 font-semibold">
                New Risks Identified
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
              styleType="primary"
              className=" py-2 text-white"
              onClick={() => {
                addSearchParams({
                  'risk-status': 'T',
                  review: '1',
                });
              }}
            >
              Review Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInbox;
