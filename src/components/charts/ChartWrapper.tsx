import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';

import Chart from '@/components/charts/Chart';
import { useMy } from '@/hooks';
import { Account, Asset, ChartType, MyResourceKey, Risk, Seed } from '@/types';
import {
  getAggregates as getAccountAggregates,
  runAggregate as runAccountAggregate,
} from '@/utils/aggregates/account';
import {
  getAggregates as getAssetAggregates,
  runAggregate as runAssetAggregate,
} from '@/utils/aggregates/asset';
import {
  getAggregates as getRiskAggregates,
  runAggregate as runRiskAggregate,
} from '@/utils/aggregates/risk';
import {
  getAggregates as getSeedAggregates,
  runAggregate as runSeedAggregate,
} from '@/utils/aggregates/seed';

interface ChartWrapperProps {
  id: number;
  type: ChartType;
  width: string;
  endpoint: MyResourceKey;
  aggregate: string;
  label: string;
  removeChart: (chartId: number) => void;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  id,
  type,
  endpoint,
  aggregate,
  label,
  removeChart,
}) => {
  const { data, isLoading } = useMy({
    resource: endpoint,
    query: '',
  });

  if (!isLoading && data) {
    const getAggregates = () => {
      switch (endpoint) {
        case 'account':
          return getAccountAggregates();
        case 'risk':
          return getRiskAggregates();
        case 'seed':
          return getSeedAggregates();
        case 'asset':
          return getAssetAggregates();
        default:
          return {};
      }
    };
    const runAggregate = (
      aggregate: string,
      data: Account[] | Risk[] | Seed[] | Asset[]
    ) => {
      switch (endpoint) {
        case 'account':
          return runAccountAggregate(aggregate, data as Account[]);
        case 'risk':
          return runRiskAggregate(aggregate, data as Risk[]);
        case 'seed':
          return runSeedAggregate(aggregate, data as Seed[]);
        case 'asset':
          return runAssetAggregate(aggregate, data as Asset[]);
        default:
          return [];
      }
    };
    const aggregateFunction = getAggregates()[aggregate];
    const chartData = runAggregate(aggregate, data as Account[]);

    return (
      <div className={`relative border border-gray-200 bg-white`}>
        <div className="flex w-full items-center pl-6 pr-5 pt-6">
          <h3 className="dark:text-dark-tremor-content-strong flex-1 text-lg font-medium text-tremor-content-strong">
            {label}
          </h3>
          <button
            onClick={() => removeChart(id)}
            className="size-7 rotate-45  text-gray-500"
            style={{
              borderBottomColor: 'transparent',
            }}
          >
            <XMarkIcon className="rotate-45" />
          </button>
        </div>
        <div className="p-6">
          <Chart
            type={type}
            data={chartData}
            xField={aggregateFunction.xField}
            yField={aggregateFunction.yField}
          />
        </div>
      </div>
    );
  } else {
    return <></>;
  }
};

export default ChartWrapper;
