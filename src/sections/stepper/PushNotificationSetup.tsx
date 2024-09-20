import { useEffect, useMemo, useState } from 'react';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import { Unplug } from 'lucide-react'; // Importing Unplug icon from lucide-react

import { Button } from '@/components/Button';
import { Inputs, Values } from '@/components/form/Inputs';
import { Modal, ModalWrapper } from '@/components/Modal';
import { useModifyAccount } from '@/hooks';
import { useIntegration } from '@/hooks/useIntegration';
import { IntegrationCard } from '@/sections/overview/IntegrationCard';
import {
  Integrations,
  streamingRiskIntegrations,
  ticketingRiskIntegrations,
} from '@/sections/overview/Integrations';
import { useGlobalState } from '@/state/global.state';
import { IntegrationMeta, LinkAccount } from '@/types';
import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';

const PushNotificationSetup = () => {
  const { modal } = useGlobalState();
  const { open, onOpenChange } = modal.pushNotification;
  const { mutateAsync: link } = useModifyAccount('link', true);

  const {
    data: { connectedIntegrations },
  } = useIntegration();
  const connectedNotifications = useMemo(() => {
    return connectedIntegrations.filter(
      integration => integration.type === 'riskNotification'
    );
  }, [JSON.stringify(connectedIntegrations)]);

  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectIntegration = (integrationId: string) => {
    setSelectedIntegration(prev =>
      prev === integrationId ? null : integrationId
    );
  };

  useEffect(() => {
    if (isLoading) {
      setIsLoading(false);
    }
  }, [connectedNotifications]);

  const handleLinkIntegration = async (formData: Values) => {
    if (selectedIntegration) {
      setIsSubmitting(true);
      await link(formData as unknown as LinkAccount);
      setSelectedIntegration(null);
      setIsSubmitting(false);
      onOpenChange(false);
    }
  };

  function handleClose() {
    setSelectedIntegration(null);
    onOpenChange(false);
  }

  const sections = [
    {
      label: 'Streaming Alerts',
      integrations: streamingRiskIntegrations,
    },
    {
      label: 'Ticketing System',
      integrations: ticketingRiskIntegrations,
    },
  ];

  return (
    <>
      <ModalWrapper
        size="5xl"
        className="max-h-screen overflow-auto rounded-lg"
        open={open}
        onClose={handleClose}
      >
        <div
          className={cn(
            'grid grid-cols-1',
            selectedIntegration && 'grid-cols-2'
          )}
        >
          <div className="flex flex-col overflow-auto px-6 py-4">
            <div className="h-full">
              <header className="">
                <div className="flex items-center gap-2">
                  <BellIcon className="size-6" />
                  <h4 className="flex-1 text-2xl font-bold">
                    Push Notifications
                  </h4>
                  <Button
                    aria-label="CloseIcon"
                    className="p-0"
                    onClick={handleClose}
                    styleType="none"
                  >
                    <XMarkIcon className="size-6" />
                  </Button>
                </div>
                <p className="text-sm text-default-light">
                  We recommend connecting to both Streaming and Ticketing
                </p>
              </header>

              <div className="my-6">
                {sections.map(({ label, integrations }, index) => (
                  <section key={index} className="mt-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                      {label}
                    </h2>
                    <div className={cn('mt-6 flex flex-wrap gap-6')}>
                      {integrations.map((integration, idx) => (
                        <IntegrationCard
                          key={idx}
                          integration={integration}
                          selectedIntegrations={
                            selectedIntegration === integration.id
                              ? [selectedIntegration]
                              : []
                          }
                          setSelectedIntegrations={() =>
                            handleSelectIntegration(integration.id)
                          }
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {selectedIntegration && (
              <motion.div
                key="integrationCardForm"
                className="relative flex size-full flex-col space-y-6 border border-zinc-200 bg-zinc-200 p-px"
                initial={{ y: 200 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.2, type: 'tween' }}
              >
                <IntegrationCardForm
                  integration={[
                    ...streamingRiskIntegrations,
                    ...ticketingRiskIntegrations,
                  ].find(i => i.id === selectedIntegration)}
                  onSave={handleLinkIntegration}
                  onDelete={() => setSelectedIntegration(null)}
                  isSubmitting={isSubmitting}
                />
                <Button
                  aria-label="CloseIcon"
                  className="absolute right-4 top-0 p-0"
                  onClick={() => setSelectedIntegration(null)}
                  styleType="none"
                >
                  <XMarkIcon className="size-6" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ModalWrapper>
    </>
  );
};

export const ConnectedPushNotifications = () => {
  const [disconnectIntegrationKey, setDisconnectIntegrationKey] =
    useState<string>('');

  const { mutate: unlink } = useModifyAccount('unlink');

  const {
    data: { requiresSetupIntegrations, connectedIntegrations },
  } = useIntegration();

  const connectedNotifications = useMemo(() => {
    return connectedIntegrations.filter(
      integration => integration.type === 'riskNotification'
    );
  }, [JSON.stringify(connectedIntegrations)]);

  const disconnectIntegration = useMemo(() => {
    return [...connectedNotifications, ...requiresSetupIntegrations].find(
      integration => integration.key === disconnectIntegrationKey
    );
  }, [JSON.stringify(connectedNotifications), disconnectIntegrationKey]);

  return (
    <div>
      {connectedNotifications.length > 0 &&
        connectedNotifications.map(integration => (
          <div
            key={integration.key}
            className="mb-4 flex w-full items-center rounded-md bg-gray-200 p-4"
          >
            <img
              className="mx-4 size-10"
              src={
                Integrations[integration.member as keyof typeof Integrations]
                  .logo
              }
              alt={`${integration.displayName} logo`}
            />
            <div className="flex-1">
              <p className="text-lg font-semibold">{integration.displayName}</p>
              <p className="text-sm text-gray-500">
                Last updated: {formatDate(integration.updated)}
              </p>
            </div>

            <div className="flex flex-row items-center">
              <span className="text-sm font-medium text-green-500">
                Connected
              </span>
              <CheckCircleIcon className="ml-1 size-6 text-green-500" />
              <Unplug
                className="ml-4 size-6 cursor-pointer text-gray-500"
                onClick={() => setDisconnectIntegrationKey(integration.key)}
              />
            </div>
          </div>
        ))}
      <Modal
        icon={<ExclamationTriangleIcon className="size-7 text-yellow-600" />}
        title={'Disconnect Integration'}
        onClose={() => {
          setDisconnectIntegrationKey('');
        }}
        className="px-8"
        open={Boolean(disconnectIntegrationKey)}
        footer={{
          text: 'Disconnect',
          onClick: async () => {
            if (disconnectIntegration) {
              await unlink({
                username: disconnectIntegration.member,
                member: disconnectIntegration.member,
                config: disconnectIntegration.config,
                value: disconnectIntegration.value,
                key: disconnectIntegration.key,
              });
              setDisconnectIntegrationKey('');
            }
          },
        }}
      >
        Are you sure you want to disconnect{' '}
        <b>{disconnectIntegration?.member}</b> ?
      </Modal>
    </div>
  );
};

const IntegrationCardForm: React.FC<{
  integration?: IntegrationMeta;
  onSave: (formData: Values) => void;
  onDelete: () => void;
  isSubmitting?: boolean;
}> = ({ integration, onSave, isSubmitting }) => {
  const [formData, setFormData] = useState<Values>({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    if (integration?.name) {
      setFormData({});
    }
  }, [JSON.stringify(integration)]);

  const handleInputsChange = (newValues: Values) => {
    setFormData(newValues);
    const allFieldsFilled = integration?.inputs
      ?.filter(input => input.required)
      .every(
        input =>
          newValues[input.name] !== undefined && newValues[input.name] !== ''
      );
    setIsFormValid(allFieldsFilled || false);
  };

  return (
    <div className="relative flex size-full items-center bg-gray-200 p-6">
      <div className="w-full">
        {integration?.logo && (
          <div className="mb-4 w-fit rounded bg-white p-2">
            <img className="size-6" src={integration?.logo} />
          </div>
        )}
        <p className="mb-4 text-2xl font-bold">{integration?.name}</p>
        <Inputs
          inputs={integration?.inputs || []}
          onChange={handleInputsChange}
        />
        <Button
          styleType="primary"
          className="mt-4 rounded"
          onClick={() => integration && onSave(formData)}
          disabled={!isFormValid || isSubmitting}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default PushNotificationSetup;
