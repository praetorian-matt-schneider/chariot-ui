import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';

import Chart from '@/components/charts/Chart';
import { useMy } from '@/hooks';
import { Account, ChartType, MyResourceKey, Risk } from '@/types';
import {
  getAggregates as getAccountAggregates,
  runAggregate as runAccountAggregate,
} from '@/utils/aggregates/account';
import {
  getAggregates as getRiskAggregates,
  runAggregate as runRiskAggregate,
} from '@/utils/aggregates/risk';

interface ChartWrapperProps {
  id: number;
  type: ChartType;
  width: string;
  endpoint: MyResourceKey;
  aggregate: string;
  label?: string;
  removeChart: (chartId: number) => void;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  id,
  type,
  width,
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
        default:
          return {};
      }
    };
    const runAggregate = (aggregate: string, data: Account[] | Risk[]) => {
      switch (endpoint) {
        case 'account':
          return runAccountAggregate(aggregate, data as Account[]);
        case 'risk':
          return runRiskAggregate(aggregate, data as Risk[]);
        default:
          return [];
      }
    };
    const aggregateFunction = getAggregates()[aggregate];
    const chartData = runAggregate(aggregate, data as Account[]);

    return (
      <div
        className={`w- relative p-2${width} border border-gray-200 bg-white`}
      >
        {label && (
          <h3 className=" dark:text-dark-tremor-content-strong pl-8 pt-6 text-lg font-medium text-tremor-content-strong">
            {label}
          </h3>
        )}
        <div className="p-6">
          <Chart
            type={type}
            data={chartData}
            xField={aggregateFunction.xField}
            yField={aggregateFunction.yField}
          />
        </div>
        <button
          onClick={() => removeChart(id)}
          className="absolute -right-[22px] -top-[22px] m-2 size-7 rotate-45 rounded-full border border-gray-200 bg-white text-gray-500"
          style={{
            borderBottomColor: 'transparent',
          }}
        >
          <XMarkIcon className="rotate-45" />
        </button>
      </div>
    );
  } else {
    return <div>Loading...</div>; // Handle loading state
  }
};

export default ChartWrapper;
