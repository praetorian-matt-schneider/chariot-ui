import { useMemo, useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';
import { ArrowUpRight, CheckCircle, LoaderCircle } from 'lucide-react';

import { Inputs, Values } from '@/components/form/Inputs';
import { AssetsIcon } from '@/components/icons';
import { Modal } from '@/components/Modal';
import { useCreateAsset } from '@/hooks/useAssets';
import { useUpgrade } from '@/hooks/useUpgrade';
import { useGlobalState } from '@/state/global.state';
import { AssetStatus } from '@/types';
import { cn } from '@/utils/classname';

// Asset type regex patterns
const assetTypePatterns = {
  IPAddress: /^(\d{1,3}\.){3}\d{1,3}$/,
  CIDRRange: /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/,
  GitHubOrg: /^https:\/\/github\.com\/[\w-]+$/,
  Domain: /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
};

// Asset labels
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

const GithubWarning = () => (
  <div className="mt-4 rounded-md bg-indigo-100 p-3 text-sm text-indigo-700">
    <p className="font-medium">
      <InformationCircleIcon className="mr-1 inline size-5 text-indigo-500" />{' '}
      GitHub Organization
    </p>
    <p>
      GitHub organizations are valid assets, but they must be added as an attack
      surface integration.
    </p>
  </div>
);

export function AddAsset() {
  const {
    modal: {
      asset: { open, onOpenChange },
    },
  } = useGlobalState();

  const { mutate: upgrade, status: upgradeStatus } = useUpgrade();
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

  // Disable "Add" button if GitHubOrg is detected or no asset type is matched
  const isAddButtonDisabled = useMemo(
    () => !assetType || assetType === 'GitHubOrg',
    [assetType]
  );

  function onClose() {
    onOpenChange(false);
  }

  async function handleAddAsset() {
    if (assetType && assetType !== 'GitHubOrg') {
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
              placeholder: 'e.g., https://gladiator.systems',
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
                    : 'bg-gray-100 border-gray-300',
                  assetType === type &&
                    assetType === 'GitHubOrg' &&
                    'bg-indigo-100 border-indigo-400'
                )}
              >
                {assetType === type && assetType === 'GitHubOrg' ? (
                  <InformationCircleIcon
                    className={cn('size-5 mr-2', 'text-indigo-500')}
                  />
                ) : (
                  <CheckCircleIcon
                    className={cn(
                      'size-5 mr-2',
                      assetType === type ? 'text-green-500' : 'text-gray-300'
                    )}
                  />
                )}
                <p className="text-sm">{assetLabels[type]}</p>
              </div>
            ))}
          </div>
        </div>
        {!licenseHit && assetType !== 'GitHubOrg' && <AddAssetExamples />}
        {!licenseHit && assetType === 'GitHubOrg' && <GithubWarning />}
        {licenseHit && (
          <div
            className={cn(
              'mt-8 flex flex-col space-y-3 rounded-md border border-red-400 bg-red-50 p-4',
              upgradeStatus === 'pending' && 'border-blue-500 bg-blue-50',
              upgradeStatus === 'success' && 'border-green-500 bg-green-50'
            )}
          >
            <div className="flex items-center space-x-2">
              {upgradeStatus === 'pending' && (
                <LoaderCircle className="size-6 animate-spin text-blue-500" />
              )}
              {upgradeStatus === 'success' && (
                <CheckCircle className="size-5 text-green-600" />
              )}
              {upgradeStatus === 'idle' && (
                <ExclamationTriangleIcon className="size-5 text-red-600" />
              )}

              <span
                className={cn(
                  'font-semibold text-red-600',
                  upgradeStatus === 'success' && 'text-green-600',
                  upgradeStatus === 'pending' && 'text-blue-500'
                )}
              >
                {upgradeStatus === 'success'
                  ? 'Upgrade Request Sent'
                  : 'License Limit Reached'}
              </span>
            </div>
            <p className="text-gray-700">
              You&apos;ve reached the maximum number of assets allowed by your
              license. Please upgrade to add more assets.
            </p>
            {upgradeStatus === 'idle' && (
              <button
                onClick={() => {
                  upgrade();
                }}
                className="flex w-full items-center justify-center space-x-1 rounded-md bg-blue-500 p-3 font-medium text-white hover:bg-blue-600"
              >
                <span>Request a Free Upgrade</span>
                <ArrowUpRight className="size-4" />
              </button>
            )}
            <p className="text-center text-xs text-gray-500">
              We’ll reach out to help you with the setup.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
