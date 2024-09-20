import { CheckIcon } from '@heroicons/react/24/solid';

import { IntegrationMeta } from '@/types';
import { cn } from '@/utils/classname';

export function IntegrationCard({
  integration,
  selectedIntegrations,
  setSelectedIntegrations,
}: {
  integration: IntegrationMeta;
  selectedIntegrations: string[];
  setSelectedIntegrations: (integrations: string[]) => void;
}) {
  const isSelected = selectedIntegrations.includes(integration.id);
  return (
    <div
      key={integration.id}
      className={cn(
        'w-28 h-28 relative resize-none text-center flex items-center justify-center bg-gray-200 rounded',
        isSelected && 'border-2 border-brand bg-white'
      )}
      role="button"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        if (isSelected) {
          setSelectedIntegrations(
            selectedIntegrations.filter(id => id !== integration.id)
          );
        } else {
          setSelectedIntegrations([...selectedIntegrations, integration.id]);
        }
      }}
    >
      <div>
        <div className="justify-items flex h-14 items-center">
          <img className="mx-auto w-14" src={integration.logo} />
        </div>
        <p className="mt-2 text-sm font-bold">
          {integration.name?.split(' ')[0]}
        </p>
      </div>
      {isSelected && (
        <CheckIcon className="absolute -right-2 -top-2 size-5 rounded-full bg-brand p-0.5 text-white" />
      )}
    </div>
  );
}
