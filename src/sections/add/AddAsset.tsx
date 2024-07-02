import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  ChevronRightIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { Inputs, Values } from '@/components/form/Inputs';
import { AssetsIcon } from '@/components/icons';
import { Modal } from '@/components/Modal';
import { useGlobalState } from '@/state/global.state';
import { IntegrationType } from '@/types';
import {
  IntegrationMeta,
  IntegrationsMeta,
} from '@/utils/availableIntegrations';
import { cn } from '@/utils/classname';

const AddAssetMessage = () => (
  <div className="flex flex-col space-y-4 p-2">
    <div>
      <h3 className="mt-0 text-xl font-medium text-gray-700">
        What is an Asset?
      </h3>
      <p className="text-md mt-1 text-gray-500">
        {`An asset refers to any single component of your organization's IT
            infrastructure that could be a target for cyberattacks. Assets are
            the actual items we assess for risks.`}
      </p>
    </div>
    <p className="mt-1 rounded-sm bg-layer1 p-4 text-sm text-gray-500">
      For example, if you work for Acme Corporation, your assets might include:
      <ul className="mt-1 list-disc pl-5 text-sm text-gray-500">
        <li>
          Network Assets: <code className="font-extrabold">8.8.8.8</code>
        </li>
        <li>
          Host Assets: <code className="font-extrabold">server1.acme.com</code>,{' '}
          <code className="font-extrabold">workstation5.acme.com</code>
        </li>
        <li>
          Application Assets:{' '}
          <code className="font-extrabold">app.acme.com</code>
        </li>
        <li>
          Data Assets: <code className="font-extrabold">db.acme.com</code>
        </li>
        <li>
          Cloud Assets:{' '}
          <code className="font-extrabold">
            ec2-203-0-113-25.compute-1.amazonaws.com
          </code>
        </li>
      </ul>
    </p>

    <p className="mt-1 text-sm text-gray-500">
      We will monitor these assets, identify risks, and provide insights to
      enhance your security.
    </p>
  </div>
);

const Tabs: IntegrationMeta[] = [
  {
    id: 0,
    name: 'domain',
    displayName: 'Domain/IP',
    description: '',
    logo: '',
    connected: true,
    types: [IntegrationType.AssetDiscovery],
    inputs: [
      {
        name: 'username',
        value: 'asset',
        hidden: true,
      },
      {
        label: 'Domain/IP',
        value: '',
        placeholder: 'acme.com',
        name: 'asset',
        required: true,
        className: 'h-11',
      },
      {
        label: 'Add as Seed',
        value: 'false',
        placeholder: '',
        name: 'seed',
        type: Input.Type.CHECKBOX,
        required: true,
        className: 'h-11',
      },
    ],
    message: <AddAssetMessage />,
  },
  ...IntegrationsMeta.filter(({ types }) =>
    types?.includes(IntegrationType.AssetDiscovery)
  ),
];

export function AddAsset() {
  const {
    modal: {
      asset: { open, onOpenChange },
    },
  } = useGlobalState();
  // eslint-disable-next-line
  const [formData, setFormData] = useState<Values[]>([]);

  // const { mutateAsync: createAsset, status: creatingAsset } = useCreateAsset();

  function onClose() {
    onOpenChange(false);
  }

  function handleAddAsset() {
    // event.preventDefault();
    // await createAsset({ name: formData.asset, seed: formData.seed });
    onClose();
  }

  return (
    <Modal
      title="Add Asset"
      open={open}
      onClose={onClose}
      footer={{
        text: 'Add',
        onClick: handleAddAsset,
      }}
      size="lg"
      closeOnOutsideClick={false}
      icon={<AssetsIcon className="size-6 text-default-light" />}
    >
      <TabGroup className="flex gap-6">
        <TabList className="w-44 shrink-0 overflow-auto border-r-2 border-default p-1 pr-4">
          {Tabs.map(({ id, displayName, logo }) => (
            <Tab
              key={id}
              className={({ selected }) =>
                cn(
                  'w-full py-4 px-2 text-sm font-semibold leading-5 hover:bg-gray-50 focus:outline-0 border-b-2 border-gray-100 bg-layer0',
                  selected && 'bg-layer1'
                )
              }
            >
              {({ selected }) => (
                <div className="relative flex items-center justify-center">
                  {logo && (
                    <img
                      className="h-4"
                      src={logo || ''}
                      alt={displayName || ''}
                    />
                  )}
                  {!logo && displayName && <span>{displayName}</span>}
                  {selected && (
                    <ChevronRightIcon className="absolute right-0 size-4" />
                  )}
                </div>
              )}
            </Tab>
          ))}
        </TabList>
        <TabPanels className="w-full">
          {Tabs.map(tab => (
            <TabPanelContent tab={tab} key={tab.id} onChange={setFormData} />
          ))}
        </TabPanels>
      </TabGroup>
    </Modal>
  );
}

interface TabPanelContentProps {
  tab: IntegrationMeta;
  onChange: Dispatch<SetStateAction<Values[]>>;
}

const TabPanelContent = (props: TabPanelContentProps) => {
  const { tab, onChange } = props;
  const {
    description = '',
    markup = '',
    inputs = [],
    logo = '',
    displayName = '',
    multiple = false,
    message = '',
    warning = false,
  } = tab;
  const [count, setCount] = useState<number>(1);
  const [formData, setFormData] = useState<Values[]>([]);

  const showInputs = inputs?.some(input => !input.hidden);

  const handleLink = () => {
    // event.preventDefault();
    // if (formData) {
    //   formData.map(formValue => link(formValue as unknown as LinkAccount));
    //   handleClose();
    // }
  };

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <TabPanel className="prose max-w-none">
      {logo && (
        <img className="mt-4 h-6" src={logo || ''} alt={displayName || ''} />
      )}
      {description && <div className="text-sm">{description}</div>}
      {message && <div>{message}</div>}
      <form id="new-asset" className="mt-4" onSubmit={handleLink}>
        <div className={cn('space-y-4', description && 'cx-5')}>
          {markup && (
            <div className="relative space-y-2 rounded border-2 border-default bg-layer1 px-5 py-6">
              {markup}
            </div>
          )}
          {showInputs &&
            [...Array(count).keys()].map(index => (
              <div
                key={index}
                className="relative space-y-2 rounded border-2 border-default bg-layer1 px-5 py-6"
              >
                {index > 0 && (
                  <Button
                    aria-label="CloseIcon"
                    className="absolute right-0 top-0"
                    onClick={() => {
                      setCount(count => count - 1);
                      setFormData(values =>
                        values.filter((_, i) => {
                          return i !== index;
                        })
                      );
                    }}
                    styleType="none"
                  >
                    <XMarkIcon className="size-4" />
                  </Button>
                )}
                <Inputs
                  inputs={(inputs || []).map(input => ({
                    ...input,
                    value: input.value,
                  }))}
                  onChange={newValues =>
                    setFormData(values => {
                      if (!values) {
                        return [newValues];
                      }
                      if (values.length < index || !values[index]) {
                        return [...values, newValues];
                      }

                      return values?.map((value, i) =>
                        i === index ? newValues : value
                      );
                    })
                  }
                />
              </div>
            ))}
        </div>
        {multiple && (
          <Button
            styleType="textPrimary"
            className="!mt-0"
            endIcon={<ChevronRightIcon className="size-5" />}
            onClick={() => {
              setCount(count => count + 1);
            }}
          >
            Add Another
          </Button>
        )}
        {warning && (
          <p className="rounded bg-yellow-100 p-2 text-sm text-yellow-600">
            <ExclamationTriangleIcon className="inline size-5 text-yellow-700" />
            {warning}
          </p>
        )}
      </form>
    </TabPanel>
  );
};
