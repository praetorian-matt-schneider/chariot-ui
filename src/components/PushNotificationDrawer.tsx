import { useEffect, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import { Unplug } from 'lucide-react'; // Importing Unplug icon from lucide-react

import { Drawer } from '@/components/Drawer';
import { Inputs, Values } from '@/components/form/Inputs';
import { RiskNotificationCard } from '@/sections/overview/IntegrationCards';
import { Integrations } from '@/sections/overview/Integrations';
import { Account, IntegrationMeta } from '@/types';
import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';

type PushNotificationDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: (integration: Account) => void;
  onConnect: (formData: Values) => void;
  streamingIntegrations: IntegrationMeta[];
  ticketingIntegrations: IntegrationMeta[];
  connectedIntegrations: Account[];
};

const PushNotificationDrawer = ({
  isOpen,
  onClose,
  onDisconnect,
  onConnect,
  streamingIntegrations,
  ticketingIntegrations,
  connectedIntegrations,
}: PushNotificationDrawerProps) => {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectIntegration = (integrationId: string) => {
    setSelectedIntegration(prev =>
      prev === integrationId ? null : integrationId
    );
  };

  useEffect(() => {
    if (isLoading) {
      setIsLoading(false);
    }
  }, [connectedIntegrations]);

  const handleLinkIntegration = async (formData: Values) => {
    if (selectedIntegration) {
      setSelectedIntegration(null);
      onConnect(formData);
    }
  };

  const renderConnectedIntegration = (integration: Account) => (
    <div
      key={integration.key}
      className="mb-4 flex w-full items-center rounded-md bg-white p-4"
    >
      <img
        className="mx-4 size-10"
        src={Integrations[integration.member as keyof typeof Integrations].logo}
        alt={`${integration.displayName} logo`}
      />
      <div className="flex-1">
        <p className="text-lg font-semibold">{integration.displayName}</p>
        <p className="text-sm text-gray-500">
          Last updated: {formatDate(integration.updated)}
        </p>
      </div>

      <div className="flex flex-row items-center">
        <span className="text-sm font-medium text-green-500">Connected</span>
        <CheckCircleIcon className="ml-1 size-6 text-green-500" />
        <Unplug
          className="ml-4 size-6 cursor-pointer text-gray-500"
          onClick={() => onDisconnect(integration)}
        />
      </div>
    </div>
  );

  const connectedStreaming = connectedIntegrations.filter(ci =>
    streamingIntegrations.find(i => i.id === ci.member)
  );
  const connectedTicketing = connectedIntegrations.filter(ci =>
    ticketingIntegrations.find(i => i.id === ci.member)
  );

  return (
    <Drawer
      open={isOpen}
      onBack={() => setSelectedIntegration(null)}
      onClose={onClose}
      className="w-full rounded-t-sm bg-zinc-100 pb-0 shadow-lg"
    >
      <div
        className={cn(
          'flex flex-row justify-between p-6 pb-0',
          !selectedIntegration && 'h-full'
        )}
      >
        {/* Streaming Integrations */}
        <div className={cn('w-1/2', selectedIntegration && 'pb-4')}>
          <h2 className="text-4xl font-bold">Streaming Alerts</h2>
          {/* Render connected streaming integrations */}
          {connectedStreaming.length === 0 && (
            <p
              className={cn(
                ' mt-4 text-gray-500',
                connectedStreaming.length === 0 &&
                  connectedIntegrations.length === 0
                  ? 'mb-6'
                  : 'mb-20'
              )}
            >
              Connect your streaming platform to receive alerts
            </p>
          )}
          {connectedStreaming.length > 0 && (
            <div className="mt-4">
              {connectedStreaming.map(renderConnectedIntegration)}
            </div>
          )}
          <div className="mt-6 flex flex-nowrap gap-2">
            {streamingIntegrations.map((integration, idx) => (
              <RiskNotificationCard
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
                className="w-full"
              />
            ))}
          </div>
        </div>
        <div className="mx-6 w-px bg-black/10" />
        {/* Ticketing System Integrations */}
        <div className="w-1/2">
          <h2 className="text-4xl font-bold">Ticketing System</h2>
          {/* Render connected ticketing integrations */}
          {connectedTicketing.length === 0 && (
            <p
              className={cn(
                'mt-4 text-gray-500',
                connectedStreaming.length === 0 &&
                  connectedIntegrations.length === 0
                  ? 'mb-6'
                  : 'mb-20'
              )}
            >
              Connect your ticketing system to receive alerts
            </p>
          )}
          {connectedTicketing.length > 0 && (
            <div className="mt-4">
              {connectedTicketing.map(renderConnectedIntegration)}
            </div>
          )}
          <div className="mt-6 flex flex-nowrap gap-2">
            {ticketingIntegrations.map((integration, idx) => (
              <RiskNotificationCard
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
                className="w-full"
              />
            ))}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {selectedIntegration && (
          <motion.div
            key="integrationCardForm"
            className="mx-auto flex w-1/2 flex-col space-y-6 border border-zinc-200 bg-zinc-200 p-px"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <IntegrationCardForm
              integration={[
                ...streamingIntegrations,
                ...ticketingIntegrations,
              ].find(i => i.id === selectedIntegration)}
              onSave={handleLinkIntegration}
              onDelete={() => setSelectedIntegration(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Drawer>
  );
};

const IntegrationCardForm: React.FC<{
  integration?: IntegrationMeta;
  onSave: (formData: Values) => void;
  onDelete: () => void;
}> = ({ integration, onSave }) => {
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
    <div className="relative rounded-sm bg-white p-6">
      <p className="mb-6 text-2xl font-bold">{integration?.name}</p>
      <Inputs
        inputs={integration?.inputs || []}
        onChange={handleInputsChange}
      />
      <button
        className="mt-4 rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-300"
        onClick={() => integration && onSave(formData)}
        disabled={!isFormValid}
      >
        Save
      </button>
    </div>
  );
};

export default PushNotificationDrawer;
