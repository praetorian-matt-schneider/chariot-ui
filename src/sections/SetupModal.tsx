import { useEffect, useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';

import { Button } from '@/components/Button';
import { getFormValues, Inputs, Values } from '@/components/form/Inputs';
import { Link } from '@/components/Link';
import { useModifyAccount } from '@/hooks';
import { Integrations } from '@/sections/overview/Integrations';
import { Account, IntegrationMeta, LinkAccount } from '@/types';

const SetupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  selectedIntegration?: Account;
  formData: Values;
}> = ({
  isOpen,
  onClose,
  onComplete,
  selectedIntegration,
  formData: formDataParent,
}) => {
  const { mutateAsync: link, status: linkStatus } = useModifyAccount('link');
  const { mutateAsync: unLink, status: unLinkStatus } =
    useModifyAccount('unlink');

  const integration = Integrations[
    selectedIntegration?.member as keyof typeof Integrations
  ] as IntegrationMeta;
  const defaultValues =
    integration?.inputs && formDataParent
      ? {
          ...getFormValues(integration.inputs),
          ...formDataParent,
        }
      : undefined;

  const [formData, setFormData] = useState<Values>();

  useEffect(() => {
    if (Object.keys(formDataParent).length > 0 && formData) {
      handleLinkIntegration();
    }
  }, [JSON.stringify({ formData, formDataParent })]);

  if (!selectedIntegration) return null;

  const handleInputsChange = (newValues: Values) => {
    setFormData(newValues);
  };

  async function handleLinkIntegration() {
    if (selectedIntegration) {
      await unLink({
        username: selectedIntegration.member,
        value: selectedIntegration.value,
        config: selectedIntegration.config,
      });
    }

    await link(formData as unknown as LinkAccount);
    onComplete();
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg overflow-hidden rounded-md bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {integration.name} Setup
                </Dialog.Title>
                {integration.help && (
                  <div className="mt-4 rounded-lg bg-gray-100 p-4">
                    <p className="mb-2 text-sm font-bold">Need help?</p>
                    <div className="flex flex-col space-y-2">
                      <Link
                        styleType="text"
                        to={integration.help.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        buttonClass="p-0 hover:underline text-indigo-600 font-normal"
                      >
                        <InformationCircleIcon className="size-5" />
                        <span>{integration.help.label}</span>
                      </Link>
                      {/* <Link
                        styleType="text"
                        to={''}
                        target="_blank"
                        rel="noopener noreferrer"
                        buttonClass="p-0 hover:underline text-indigo-600 font-normal"
                      >
                        <InformationCircleIcon className="size-5" />
                        <span>How to: Invite a teammate</span>
                      </Link> */}
                    </div>
                  </div>
                )}
                <div className="mt-4 space-y-4">
                  {integration.markup}
                  <Inputs
                    defaultValues={defaultValues}
                    inputs={integration.inputs || []}
                    onChange={handleInputsChange}
                  />
                </div>
                <div className="mt-4 flex flex-row justify-end space-x-1">
                  <Button
                    styleType="none"
                    onClick={onClose}
                    className="text-gray-600"
                  >
                    Setup Later
                  </Button>
                  <Button
                    styleType="primary"
                    onClick={handleLinkIntegration}
                    disabled={
                      unLinkStatus === 'pending' || linkStatus === 'pending'
                    }
                  >
                    Finish
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SetupModal;
