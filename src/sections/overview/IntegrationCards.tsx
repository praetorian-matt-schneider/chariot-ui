import { IntegrationMeta } from '@/types';
import { cn } from '@/utils/classname';

export function AttackSurfaceCard({
  integration,
  selectedIntegrations,
  setSelectedIntegrations,
}: {
  integration: IntegrationMeta;
  selectedIntegrations: string[];
  setSelectedIntegrations: (integrations: string[]) => void;
}) {
  return (
    <div
      key={integration.id}
      className={cn(
        ' w-[150px] resize-none rounded-sm bg-white p-6 text-center',
        selectedIntegrations.includes(integration.id) && 'border-2 border-brand'
      )}
      role="button"
      onClick={() => {
        if (selectedIntegrations.includes(integration.id)) {
          setSelectedIntegrations(
            selectedIntegrations.filter(id => id !== integration.id)
          );
        } else {
          setSelectedIntegrations([...selectedIntegrations, integration.id]);
        }
      }}
    >
      <div className="justify-items flex h-12 items-center">
        <img className="mx-auto my-3 w-12" src={integration.logo} />
      </div>
      <p className="text-lg font-bold">{integration.name?.split(' ')[0]}</p>
    </div>
  );
}

export function RiskNotificationCard({
  integration,
  selectedIntegrations,
  setSelectedIntegrations,
}: {
  integration: IntegrationMeta;
  selectedIntegrations: string[];
  setSelectedIntegrations: (integrations: string[]) => void;
}) {
  return (
    <div
      key={integration.id}
      className={cn(
        ' w-[150px] resize-none rounded-sm bg-white p-6 text-center',
        selectedIntegrations.includes(integration.id) && 'border-2 border-brand'
      )}
      role="button"
      onClick={() => {
        if (selectedIntegrations.includes(integration.id)) {
          setSelectedIntegrations(
            selectedIntegrations.filter(id => id !== integration.id)
          );
        } else {
          setSelectedIntegrations([...selectedIntegrations, integration.id]);
        }
      }}
    >
      <img className="mx-auto my-3 size-12" src={integration.logo} />
      <p className="text-lg font-bold">{integration.name?.split(' ')[0]}</p>
    </div>
  );
}
