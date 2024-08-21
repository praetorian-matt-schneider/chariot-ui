import { useMemo, useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ArrowUpRight, CheckCircle, LoaderCircle } from 'lucide-react';

import { Input } from '@/components/form/Input';
import { Inputs, Values } from '@/components/form/Inputs';
import { AssetsIcon } from '@/components/icons';
import { Modal } from '@/components/Modal';
import { useCreateAsset } from '@/hooks/useAssets';
import { useUpgrade } from '@/hooks/useUpgrade';
import { useGlobalState } from '@/state/global.state';
import { Asset, AssetStatus, AssetStatusLabel } from '@/types';
import { cn } from '@/utils/classname';

const AddAssetExamples = () => (
  <div className="mt-4 rounded-md bg-gray-100 p-3 text-sm text-gray-600">
    <p className="mb-2 font-medium text-gray-800">Example asset:</p>
    <p>
      <span className="font-semibold">acme.com</span>: Domain name
    </p>
    <p>
      <span className="font-semibold">8.8.8.8</span>: IP Addresses
    </p>
    <p>
      <span className="font-semibold">8.8.8.0/24</span>: CIDR Ranges
    </p>
    <p>
      <span className="font-semibold">https://github.com/acme-corp</span>:
      GitHub Org
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

  function onClose() {
    onOpenChange(false);
  }

  async function handleAddAsset() {
    await createAsset({
      name: String(formData.asset),
      status: formData.status as Asset['status'],
    });

    onClose();
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
              placeholder: 'acme.com',
              name: 'asset',
              required: true,
              className: 'h-10 w-full p-3 rounded-md border border-gray-300',
            },
            {
              label: 'Status',
              value: AssetStatus.Active,
              type: Input.Type.SELECT,
              placeholder: 'Select Status',
              name: 'status',
              options: [
                {
                  label: AssetStatusLabel[AssetStatus.ActiveHigh],
                  value: AssetStatus.ActiveHigh,
                },
                {
                  label: AssetStatusLabel[AssetStatus.Active],
                  value: AssetStatus.Active,
                },
                {
                  label: AssetStatusLabel[AssetStatus.ActiveLow],
                  value: AssetStatus.ActiveLow,
                },
                {
                  label: AssetStatusLabel[AssetStatus.Frozen],
                  value: AssetStatus.Frozen,
                },
              ],
              required: true,
              className: 'h-10 w-full p-3 rounded-md border border-gray-300',
            },
          ]}
        />
        {!licenseHit && <AddAssetExamples />}
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
