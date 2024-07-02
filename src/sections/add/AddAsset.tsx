import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';

import { Button } from '@/components/Button';
import { Dropzone, Files } from '@/components/Dropzone';
import { Input } from '@/components/form/Input';
import { Inputs, Values } from '@/components/form/Inputs';
import { AssetsIcon } from '@/components/icons';
import { Link } from '@/components/Link';
import { Modal } from '@/components/Modal';
import { Tooltip } from '@/components/Tooltip';
import { useModifyAccount } from '@/hooks';
import { useBulkAddAsset, useCreateAsset } from '@/hooks/useAssets';
import { useIntegration } from '@/hooks/useIntegration';
import { useGlobalState } from '@/state/global.state';
import { Asset, AssetStatus, IntegrationType, LinkAccount } from '@/types';
import {
  IntegrationMeta,
  IntegrationsMeta,
} from '@/utils/availableIntegrations';
import { cn } from '@/utils/classname';
import { GetSeeds } from '@/utils/regex.util';

const PUBLIC_ASSET = 'publicAsset';

const AddAssetMessage = () => (
  <div className="flex flex-col space-y-4 p-2">
    <div>
      <h3 className="mt-0 text-xl font-medium text-gray-700">
        What is an Asset?
      </h3>
      <p className="mb-0 text-sm text-gray-500">
        {`An asset refers to any single component of your organization's IT
            infrastructure that could be a target for cyberattacks. Assets are
            the actual items we assess for risks.`}
      </p>
    </div>
    <p className=" rounded-sm bg-layer1 p-4 text-sm text-gray-500">
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
    name: PUBLIC_ASSET,
    displayName: 'Public Asset',
    description: '',
    logo: '',
    connected: true,
    types: [IntegrationType.AssetDiscovery],
    inputs: [
      {
        name: 'username',
        value: PUBLIC_ASSET,
        hidden: true,
      },
      {
        label: 'Public Asset',
        value: '',
        placeholder: 'acme.com',
        name: 'asset',
        required: true,
        className: 'h-11',
      },
      {
        label: 'Priority',
        value: AssetStatus.Active,
        type: Input.Type.SELECT,
        placeholder: 'Select Priority',
        name: 'status',
        options: [
          {
            label: 'High Priority',
            value: AssetStatus.ActiveHigh,
          },
          {
            label: 'Standard Priority',
            value: AssetStatus.Active,
          },
          {
            label: 'Low Priority',
            value: AssetStatus.ActiveLow,
          },
        ],
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

  const { mutateAsync: createAsset, status: creatingAsset } = useCreateAsset();
  const { mutate: link } = useModifyAccount('link');
  const { isIntegrationConnected } = useIntegration();

  function onClose() {
    onOpenChange(false);
  }

  async function handleAddAsset() {
    // if domain is selected
    if (formData[0].username === PUBLIC_ASSET) {
      await createAsset({
        name: String(formData[0].asset),
        status: formData[0].status as Asset['status'],
      });
    } else {
      // if other integrations are selected
      formData.map(data => link(data as unknown as LinkAccount));
    }

    onClose();
  }

  return (
    <Modal
      title="Add Asset"
      className="h-[82vh] px-0 pl-6"
      open={open}
      onClose={onClose}
      footer={{
        isLoading: creatingAsset === 'pending',
        text: 'Add',
        onClick: handleAddAsset,
      }}
      size="xl"
      closeOnOutsideClick={false}
      icon={<AssetsIcon className="size-6 text-default-light" />}
    >
      <TabGroup className="flex h-full gap-6">
        <TabList className="w-60 shrink-0 overflow-auto border-r-2 border-default p-1 pr-4">
          {Tabs.map(({ id, displayName, logo, connected, name }) => {
            const isConnected = connected && isIntegrationConnected(name);
            return (
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
                    {isConnected && (
                      <CheckCircleIcon className="absolute left-0 size-5 text-green-500" />
                    )}
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
            );
          })}
        </TabList>
        <TabPanels className="size-full overflow-auto pr-6">
          {Tabs.map(tab => {
            const isConnected =
              tab?.connected && isIntegrationConnected(tab.name);

            return (
              <TabPanelContent
                isConnected={isConnected}
                key={tab.id}
                onChange={setFormData}
                tab={tab}
                onClose={onClose}
              />
            );
          })}
        </TabPanels>
      </TabGroup>
    </Modal>
  );
}

interface TabPanelContentProps {
  isConnected: boolean;
  onChange: Dispatch<SetStateAction<Values[]>>;
  tab: IntegrationMeta;
  onClose: () => void;
}

const TabPanelContent = (props: TabPanelContentProps) => {
  const { isConnected, tab, onChange, onClose } = props;
  const {
    description = '',
    markup = '',
    inputs = [],
    logo = '',
    name = '',
    displayName = '',
    multiple = false,
    message = '',
    warning = false,
  } = tab;
  const [count, setCount] = useState<number>(1);
  const [formData, setFormData] = useState<Values[]>([]);
  const { mutate: bulkAddAsset } = useBulkAddAsset();

  const showInputs = inputs?.some(input => !input.hidden);

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  const handleFilesDrop = (files: Files<'string'>): void => {
    onClose();

    const concatFiles = files.map(({ content }) => content).join('');
    const assets = GetSeeds(concatFiles, 500);

    bulkAddAsset(assets);
  };

  return (
    <TabPanel className="prose max-w-none">
      <div className="flex items-center gap-2">
        {isConnected && <CheckCircleIcon className="size-6 text-green-500" />}
        {logo && (
          <img className="h-6" src={logo || ''} alt={displayName || ''} />
        )}
      </div>
      {description && <div className="text-sm">{description}</div>}
      {message && <div>{message}</div>}
      <div className="flex">
        <form id="new-asset" className="mt-4 w-full">
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
        {name === PUBLIC_ASSET && (
          <>
            <div className="px-10 text-center">
              <div className="relative m-auto ml-4 flex h-[400px] w-full">
                <div className=" w-px bg-gray-200"></div>
                <div className="absolute -left-[50%] top-[50%] w-full bg-layer0 text-center text-sm text-gray-300">
                  or
                </div>
              </div>
            </div>
            <div>
              <Dropzone
                className="h-[330px]"
                type="string"
                onFilesDrop={handleFilesDrop}
                title={'Bulk Upload'}
                subTitle={`Add a document with a list of Domains, IP addresses, CIDR ranges, or GitHub organizations.`}
                maxFileSizeInMb={6}
                maxFileSizeMessage={
                  <div className="flex items-center justify-center gap-1 text-xs italic text-gray-500">
                    Uploads are limited to 500 assets and 6MB.
                    <Tooltip
                      title={
                        <div className="max-w-xs p-4">
                          The Chariot frontend allows 500 Seeds to be added at
                          once. For larger uploads, please use the{' '}
                          <Link
                            to={
                              'https://github.com/praetorian-inc/praetorian-cli/blob/main/README.md'
                            }
                            target={'_blank'}
                            rel={'noreferrer'}
                            className="underline"
                          >
                            Praetorian CLI
                          </Link>
                          .
                        </div>
                      }
                      placement="top"
                    >
                      <Button styleType="none" className="p-0">
                        <InformationCircleIcon className="size-5 text-gray-400" />
                      </Button>
                    </Tooltip>
                  </div>
                }
                maxFileSizeErrorMessage={
                  <span>
                    Bulk uploads cannot exceed 500 Seeds or 6MB in file size.
                    Get help{' '}
                    <a
                      onClick={e => e.stopPropagation()}
                      href="https://docs.praetorian.com/hc/en-us/articles/25814362281627-Adding-and-Managing-Seeds"
                      className="cursor-pointer text-indigo-600"
                      target={'_blank'}
                      rel="noreferrer"
                    >
                      formatting your Seed File.
                    </a>
                  </span>
                }
              />
            </div>
          </>
        )}
      </div>
    </TabPanel>
  );
};
