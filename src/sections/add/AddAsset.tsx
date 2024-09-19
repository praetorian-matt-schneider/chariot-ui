import { useMemo, useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowUpRight } from 'lucide-react';

import { Inputs, Values } from '@/components/form/Inputs';
import { AssetsIcon } from '@/components/icons';
import { Modal } from '@/components/Modal';
import { useCreateAsset } from '@/hooks/useAssets';
import { contactUs } from '@/hooks/useUpgrade';
import { useGlobalState } from '@/state/global.state';
import { AssetStatus } from '@/types';
import { cn } from '@/utils/classname';

// Regex patterns for asset types
const assetTypePatterns = {
  IPAddress: /^(\d{1,3}\.){3}\d{1,3}$/,
  CIDRRange: /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/,
  GitHubOrg: /^https:\/\/github\.com\/[\w-]+$/,
  Domain: /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
};

// Labels for asset types
const assetLabels: { [key: string]: string } = {
  IPAddress: 'IP Address',
  CIDRRange: 'CIDR Range',
  GitHubOrg: 'GitHub Organization',
  Domain: 'Domain Name',
};

const AddAssetExamples = () => (
  <div className="mt-4 rounded-md bg-gray-100 p-3 text-sm text-gray-600">
    <p className="mb-2 font-medium text-gray-800">What is an asset?</p>
    <p>
      Chariot defines an asset as anything that can transport data. You may be
      asked to provide ownership of an asset before adding it to your attack
      surface.
    </p>
  </div>
);

export function AddAsset() {
  const {
    modal: {
      asset: { open, onOpenChange },
    },
  } = useGlobalState();

  const [formData, setFormData] = useState<Values>({});
  const {
    mutateAsync: createAsset,
    status: creatingAsset,
    failureReason,
  } = useCreateAsset();

  const licenseHit = useMemo(() => {
    return failureReason && String(failureReason)?.includes('License');
  }, [failureReason]);

  const assetType = useMemo(() => {
    const assetName = String(formData.asset || '');

    for (const [key, pattern] of Object.entries(assetTypePatterns)) {
      if (pattern.test(assetName)) return key;
    }

    return null;
  }, [formData.asset]) as keyof typeof assetTypePatterns;

  const isAddButtonDisabled = useMemo(() => !assetType, [assetType]);

  function onClose() {
    onOpenChange(false);
  }

  async function handleAddAsset() {
    if (assetType) {
      await createAsset({
        name: String(formData.asset),
        status: AssetStatus.Active,
      });

      onClose();
    }
  }

  return (
    <Modal
      title="Add Asset"
      className="px-8 py-6"
      open={open}
      onClose={onClose}
      footer={{
        isLoading: creatingAsset === 'pending',
        text: 'Add',
        onClick: handleAddAsset,
        disabled: isAddButtonDisabled,
      }}
      size="lg"
      closeOnOutsideClick={false}
      icon={<AssetsIcon className="size-6 text-default-light" />}
    >
      <div className="space-y-6">
        <Inputs
          values={formData}
          onChange={setFormData}
          className="space-y-4"
          inputs={[
            {
              label: 'Asset',
              value: '',
              placeholder: 'e.g., 192.168.1.1',
              name: 'asset',
              required: true,
              className: 'h-10 w-full p-3 rounded-md border border-gray-300',
            },
          ]}
        />
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-gray-800">Asset Type</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(assetTypePatterns).map(type => (
              <div
                key={type}
                className={cn(
                  'flex items-center px-4 py-2 rounded-md border',
                  assetType === type
                    ? 'bg-green-100 border-green-400'
                    : 'bg-gray-100 border-gray-300'
                )}
              >
                <CheckCircleIcon
                  className={cn(
                    'size-5 mr-2',
                    assetType === type ? 'text-green-500' : 'text-gray-300'
                  )}
                />
                <p className="text-sm">{assetLabels[type]}</p>
              </div>
            ))}
          </div>
        </div>
        {!licenseHit && <AddAssetExamples />}
        {licenseHit && (
          <div
            className={cn(
              'mt-8 flex flex-col space-y-3 rounded-md border border-red-400 bg-red-50 p-4'
            )}
          >
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="size-5 text-red-600" />
              <span className={cn('font-semibold text-red-600')}>
                {'License Limit Reached'}
              </span>
            </div>
            <p className="text-gray-700">
              You&apos;ve reached the maximum number of assets allowed by your
              license. Please upgrade to add more assets.
            </p>

            <button
              onClick={() => {
                contactUs();
              }}
              className="flex w-full items-center justify-center space-x-1 rounded-md bg-blue-500 p-3 font-medium text-white hover:bg-blue-600"
            >
              <span>Request a Free Upgrade</span>
              <ArrowUpRight className="size-4" />
            </button>

            <p className="text-center text-xs text-gray-500">
              {`We'll reach out to help you with the setup.`}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
