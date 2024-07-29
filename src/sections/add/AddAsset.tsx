import { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { InfoIcon } from 'lucide-react';

import { Input } from '@/components/form/Input';
import { Inputs, Values } from '@/components/form/Inputs';
import { AssetsIcon } from '@/components/icons';
import { Modal } from '@/components/Modal';
import { useCreateAsset } from '@/hooks/useAssets';
import { useGlobalState } from '@/state/global.state';
import { Asset, AssetStatus, AssetStatusLabel, Module } from '@/types';

const AddAssetExamples = () => (
  <div className="text-md mt-4 rounded-md bg-gray-100 p-4 text-gray-700">
    <p className="mb-3 font-medium text-gray-800">Example asset:</p>
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
      module: moduleState,
    },
  } = useGlobalState();

  // eslint-disable-next-line
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [formData, setFormData] = useState<Values>({});
  const { mutateAsync: createAsset, status: creatingAsset } = useCreateAsset();

  function onClose() {
    onOpenChange(false);
    setSelectedIndex(0);
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
      className="px-10 py-6"
      open={open}
      onClose={onClose}
      footer={{
        isLoading: creatingAsset === 'pending',
        text: 'Add',
        onClick: handleAddAsset,
      }}
      size="md"
      closeOnOutsideClick={false}
      icon={<AssetsIcon className="size-6 text-default-light" />}
    >
      <div className="mb-4 flex items-center space-x-2 rounded-md  border border-yellow-500 bg-yellow-50 p-3 text-gray-700">
        <ExclamationTriangleIcon className="size-5 text-yellow-700" />
        <span>Looking for integrations?</span>
        <button
          onClick={() => {
            moduleState.onValueChange({
              module: Module.ASM,
              integration: '',
            });
          }}
          className="font-medium text-blue-600 hover:underline"
        >
          Add Integration
        </button>
      </div>
      <Inputs
        values={formData}
        onChange={setFormData}
        className="mb-4"
        inputs={[
          {
            label: 'Asset',
            value: '',
            placeholder: 'acme.com',
            name: 'asset',
            required: true,
            className: 'h-11 m-5',
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
            className: 'h-11 m-5',
          },
        ]}
      />
      <AddAssetExamples />
      <p className="mt-4 rounded bg-blue-100 p-2 text-sm">
        <InfoIcon className="mr-2 inline size-5 text-default" />
        <a
          href="https://github.com/praetorian-inc/praetorian-cli"
          target={'_blank'}
          rel={'noreferrer'}
          className="inline p-0 underline"
        >
          Praetorian CLI
        </a>{' '}
        is available for bulk asset addition.
      </p>
    </Modal>
  );
}
