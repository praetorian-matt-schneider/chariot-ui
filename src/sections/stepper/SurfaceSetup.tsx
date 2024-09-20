import { useMemo, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/Button';
import { InputText } from '@/components/form/InputText';
import { ModalWrapper } from '@/components/Modal';
import { useModifyAccount, useMy } from '@/hooks';
import { IntegrationCard } from '@/sections/overview/IntegrationCard';
import {
  availableAttackSurfaceIntegrations,
  comingSoonAttackSurfaceIntegrations,
  Integrations,
} from '@/sections/overview/Integrations';
import { useGlobalState } from '@/state/global.state';

export const SurfaceSetup: React.FC = () => {
  const { modal } = useGlobalState();
  const { open, onOpenChange } = modal.surfaceSetup;
  const [search, setSearch] = useState('');
  const [
    selectedAttackSurfaceIntegrations,
    setSelectedAttackSurfaceIntegrations,
  ] = useState<string[]>([]);

  const { mutateAsync: link, status: linkStatus } = useModifyAccount(
    'link',
    true
  );
  const { invalidate: invalidateAccounts } = useMy({
    resource: 'account',
  });

  const { filteredMostCommonIntegrations, filteredAttackSurfaceIntegrations } =
    useMemo(() => {
      const mostCommonIntegrations = [
        Integrations.amazon,
        Integrations.github,
        Integrations.nessus,
      ];
      const mostCommonIntegrationsId = mostCommonIntegrations.map(
        ({ id }) => id
      );
      const filteredMostCommonIntegrations = mostCommonIntegrations.filter(
        integration =>
          integration.name.toLowerCase().includes(search?.toLowerCase())
      );

      const filteredAttackSurfaceIntegrations = [
        ...availableAttackSurfaceIntegrations.filter(
          ({ id }) => !mostCommonIntegrationsId.includes(id)
        ),
        ...comingSoonAttackSurfaceIntegrations,
      ].filter(integration =>
        integration.name.toLowerCase().includes(search?.toLowerCase())
      );

      filteredAttackSurfaceIntegrations.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      return {
        filteredAttackSurfaceIntegrations,
        filteredMostCommonIntegrations,
      };
    }, [search]);

  function handleClose() {
    onOpenChange(false);
    setSearch('');
    setSelectedAttackSurfaceIntegrations([]);
  }

  return (
    <ModalWrapper
      size="5xl"
      className="relative max-h-[90vh] overflow-auto rounded-lg pb-0 pl-6 pr-2 pt-4"
      open={open}
      onClose={() => onOpenChange(false)}
    >
      <div className="flex flex-col overflow-auto">
        <header className="">
          <div className="flex items-center gap-2">
            <h4 className="flex-1 text-2xl font-bold">Add Your Surfaces</h4>
            <InputText
              name="search"
              startIcon={<MagnifyingGlassIcon className="size-6" />}
              placeholder="Search integrations..."
              className="mr-2 w-[250px] rounded-sm bg-gray-200 text-lg"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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
            Once added, they’ll appear in your attack surface, ready for setup
            later
          </p>
        </header>
        <div className="my-6">
          {[
            {
              label: 'Most Common Surfaces',
              integrations: filteredMostCommonIntegrations,
            },
            {
              label: 'All Surfaces',
              integrations: filteredAttackSurfaceIntegrations,
            },
          ].map(({ label, integrations }, index) =>
            integrations.length === 0 ? null : (
              <section key={index} className="mb-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                  {label}
                </h2>
                <div className="flex flex-wrap gap-6">
                  {integrations.map((integration, index) => {
                    return (
                      <IntegrationCard
                        key={index}
                        integration={integration}
                        selectedIntegrations={selectedAttackSurfaceIntegrations}
                        setSelectedIntegrations={integrations => {
                          setSelectedAttackSurfaceIntegrations(integrations);
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            )
          )}
        </div>
      </div>

      {selectedAttackSurfaceIntegrations.length > 0 && (
        <div className="sticky bottom-0 flex w-full justify-end bg-layer0 p-4 pr-8">
          <Button
            styleType="primary"
            className="rounded"
            isLoading={linkStatus === 'pending'}
            onClick={async () => {
              // add integration   accounts
              const promises = selectedAttackSurfaceIntegrations
                .map((integration: string) => {
                  const isWaitlisted = comingSoonAttackSurfaceIntegrations.find(
                    i => i.id === integration
                  );

                  return link({
                    username: integration,
                    value: isWaitlisted ? 'waitlisted' : 'setup',
                    config: {},
                  });
                })
                .map(promise => promise.catch(error => error));

              const response = await Promise.all(promises);

              const validResults = response.filter(
                result => !(result instanceof Error)
              );

              if (validResults.length > 0) {
                invalidateAccounts();
              }

              handleClose();
            }}
          >
            Build Attack Surface ({selectedAttackSurfaceIntegrations.length}{' '}
            selected)
          </Button>
        </div>
      )}
    </ModalWrapper>
  );
};
