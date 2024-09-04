import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { BellIcon } from '@heroicons/react/24/solid';

import { Drawer } from '@/components/Drawer';
import { Loader } from '@/components/Loader';
import { useMy } from '@/hooks';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { Alerts } from '@/sections/Alerts';
import { CategoryFilter, FancyTable } from '@/sections/Assets';
import { RenderHeaderExtraContentSection } from '@/sections/AuthenticatedApp';
import { useGlobalState } from '@/state/global.state';
import { RiskFilters } from '@/types';
import { useQueryFilters } from '@/utils/storage/useQueryParams.util';

const RisksBeta: React.FC = () => {
  const {
    modal: {
      risk: { onOpenChange: onOpenRiskChange },
    },
  } = useGlobalState();
  const [filters, setFilters] = useQueryFilters<RiskFilters>({
    key: 'riskFilters',
    defaultFilters: {
      search: '',
      alert: '',
      exposureRisk: '',
    },
  });

  const [isCTAOpen, setIsCTAOpen] = useState<boolean>(false);
  const closeCTADrawer = () => {
    setIsCTAOpen(false);
  };

  // Check for remediated risks to update the CTA
  const { data: risksGeneric, status: risksStatus } = useGenericSearch({
    query: 'status:R',
  });
  const hasRemediatedRisk = (risksGeneric?.risks || [])?.length > 0;

  //   Security alert options, count
  const { data: alerts, status: alertsStatus } = useGetAccountAlerts();

  //   Exposure risks
  const {
    data: conditions,
    status: conditionsStatus,
    refetch: refetchConditions,
  } = useMy({
    resource: 'condition',
  });

  const alertsOptions = useMemo(
    () =>
      (alerts || [])
        .map(alert => ({
          label: alert.name,
          value: alert.value,
          count: alert.count.toLocaleString(),
        }))
        .filter(({ value }) => !value.startsWith('#attribute')), // Filtered out attributes as they'll be shown in the exposure risks
    [JSON.stringify({ alerts })]
  );

  const exposureRiskOptions = useMemo(() => {
    // const conditionsWithCount = (conditions || []).filter(
    //   ({ count }) => count > 0
    // );
    return (
      conditions.map(({ count, name, value }) => ({
        label: name,
        value,
        count: (count || 0).toLocaleString(),
      })) || []
    );
  }, [JSON.stringify({ conditions })]);

  // Add default filter if none is selected
  useEffect(() => {
    if (!filters.search && !filters.alert && !filters.exposureRisk) {
      if (alertsOptions && alertsOptions.length > 0) {
        setFilters({
          search: '',
          alert: alertsOptions[0].value,
          exposureRisk: '',
        });
      }

      if (exposureRiskOptions && exposureRiskOptions.length > 0) {
        setFilters({
          search: '',
          alert: '',
          exposureRisk: exposureRiskOptions[0].value,
        });
      }
    }
  }, [JSON.stringify({ alertsOptions, filters, exposureRiskOptions })]);

  function refetch() {
    refetchConditions();
    setFilters({ search: '', alert: '', exposureRisk: '' });
  }

  const exposureRiskQuery = useMemo(() => {
    if (filters.exposureRisk) {
      const alertName = (alerts || []).find(
        alert => alert.value === filters.exposureRisk
      )?.name;
      return `name:${alertName}`;
    }
    return '';
  }, [filters.exposureRisk, JSON.stringify({ alerts })]);

  const query = filters.search || filters.alert || exposureRiskQuery || '';

  return (
    <>
      <RenderHeaderExtraContentSection>
        <div
          role="button"
          onClick={() => setIsCTAOpen(true)}
          className="m-auto flex w-full flex-col items-center rounded-lg border-2 border-dashed border-header-dark bg-header p-8 text-center"
        >
          <Loader className="w-8" isLoading={risksStatus === 'pending'}>
            {hasRemediatedRisk ? (
              <CheckCircleIcon className="size-10 text-green-400" />
            ) : (
              <BellIcon className="size-10 animate-bounce text-white" />
            )}
          </Loader>
          <h1 className="text-3xl font-bold text-white">Remediate a Risk</h1>
          <p className="max-w-[700px] text-sm text-gray-500">
            Keep your environment secure by addressing risks regularly.
          </p>
        </div>
      </RenderHeaderExtraContentSection>
      <FancyTable
        addNew={{ onClick: () => onOpenRiskChange(true) }}
        search={{
          value: filters.search,
          onChange: search => {
            setFilters({ search, alert: '', exposureRisk: '' });
          },
        }}
        className="h-0 min-h-0"
        name="risk"
        otherFilters={
          <>
            {alertsOptions.length > 0 && (
              <CategoryFilter
                value={filters.alert ? [filters.alert] : []}
                hideHeader={true}
                onChange={alerts => {
                  setFilters({
                    ...filters,
                    search: '',
                    exposureRisk: '',
                    alert: alerts[0],
                  });
                }}
                category={[
                  {
                    label: 'Security Alerts',
                    options: alertsOptions,
                    showCount: true,
                  },
                ]}
                status={alertsStatus}
              />
            )}
            {exposureRiskOptions.length > 0 && (
              <CategoryFilter
                value={filters.exposureRisk ? [filters.exposureRisk] : []}
                hideHeader={true}
                onChange={attributes => {
                  setFilters({
                    ...filters,
                    search: '',
                    alert: '',
                    exposureRisk: attributes[0],
                  });
                }}
                category={[
                  {
                    label: 'Exposure Risks',
                    options: exposureRiskOptions,
                    showCount: true,
                  },
                ]}
                alert={{
                  value: (conditions || []).map(condition => condition.value),
                }}
                status={conditionsStatus}
              />
            )}
          </>
        }
      >
        {query && (
          <Alerts
            query={query}
            setQuery={() => {}}
            hideFilters={true}
            refetch={refetch}
            unsubscribeAlert={filters.exposureRisk}
          />
        )}
        {!query && (
          <div className="mt-12 flex flex-col items-center justify-center">
            <QuestionMarkCircleIcon className="mb-4 size-16 text-gray-400" />
            <p className="text-2xl font-bold">
              Your search returned no results.
            </p>
          </div>
        )}
      </FancyTable>
      <Drawer
        open={isCTAOpen}
        onClose={closeCTADrawer}
        onBack={closeCTADrawer}
        className={'w-full rounded-t-sm bg-zinc-100 p-0 shadow-lg'}
        skipBack={true}
      >
        <div className="mx-12 mt-6 pb-10">
          <div className="flex w-full flex-row items-center justify-between">
            <h1 className="mb-4 text-4xl font-extrabold">Remediated Risks</h1>
          </div>
          <div className="flex w-full flex-row justify-between gap-x-10"></div>
        </div>
      </Drawer>
    </>
  );
};

export default RisksBeta;
