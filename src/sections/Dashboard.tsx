import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/20/solid';

import { Button } from '@/components/Button';
import ChartWrapper from '@/sections/dashboard/ChartWrapper';
import { ChartType, MyResourceKey } from '@/types'; // Adjust paths as needed
import { getAggregates as getAccountAggregates } from '@/utils/aggregates/account';
import { getAggregates as getRiskAggregates } from '@/utils/aggregates/risk';

interface ChartConfig {
  id: number;
  type: ChartType;
  width: string;
  endpoint: MyResourceKey;
  aggregate: string;
}

const Dashboard: React.FC = () => {
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [newChartType, setNewChartType] = useState<ChartType>('area');
  const [newChartWidth, setNewChartWidth] = useState<string>('w-full');
  const [newEndpoint, setNewEndpoint] = useState<MyResourceKey>('account');
  const [aggregate, setAggregate] = useState<string>('');

  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);

  const getAggregates = () => {
    switch (newEndpoint) {
      case 'account':
        return getAccountAggregates();
      case 'risk':
        return getRiskAggregates();
      default:
        return {};
    }
  };

  const addChart = () => {
    if (aggregate && aggregate in getAggregates()) {
      setCharts([
        ...charts,
        {
          id: Date.now(),
          type: newChartType,
          width: newChartWidth,
          endpoint: newEndpoint,
          aggregate,
        },
      ]);
      setIsFormVisible(false);
    }
  };

  const removeChart = (chartId: number) => {
    setCharts(charts.filter(chart => chart.id !== chartId));
  };

  return (
    <div className="w-full px-4 py-2">
      <div className="relative inline-block">
        <Button
          onClick={() => setIsFormVisible(!isFormVisible)}
          type="button"
          styleType="primary"
          startIcon={<PlusIcon className="size-4" />}
        >
          Add Chart
        </Button>

        {isFormVisible && (
          <div className="absolute left-0 top-[50px] z-10 mb-2 w-[600px] rounded-[4px] bg-white p-4 shadow-md">
            <div className="flex flex-col space-y-4">
              <div
                className="grid grid-cols-2 whitespace-nowrap"
                style={{
                  gridTemplateColumns: '30% 1fr',
                }}
              >
                <label className="block font-semibold text-gray-700">
                  Chart Type
                </label>
                <select
                  className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newChartType}
                  onChange={e => setNewChartType(e.target.value as ChartType)}
                >
                  <option value="area">Area Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="donut">Donut Chart</option>
                </select>
              </div>
              <div
                className="grid grid-cols-2 whitespace-nowrap"
                style={{
                  gridTemplateColumns: '30% 1fr',
                }}
              >
                <label className="block font-semibold text-gray-700">
                  Size
                </label>
                <select
                  className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newChartWidth}
                  onChange={e => setNewChartWidth(e.target.value)}
                >
                  <option value="w-full">Full Width</option>
                  <option value="w-1/2">Half Width</option>
                  <option value="w-1/3">One Third Width</option>
                  <option value="w-1/4">One Fourth Width</option>
                </select>
              </div>
              <div
                className="grid grid-cols-2 whitespace-nowrap"
                style={{
                  gridTemplateColumns: '30% 1fr',
                }}
              >
                <label className="block font-semibold text-gray-700">
                  Resource
                </label>
                <select
                  className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newEndpoint}
                  onChange={e =>
                    setNewEndpoint(e.target.value as MyResourceKey)
                  }
                >
                  <option value="account">Account</option>
                  <option value="risk">Risk</option>
                  <option value="asset">Asset</option>
                  <option value="ref">Reference</option>
                  <option value="job">Job</option>
                  <option value="seed">Seed</option>
                  <option value="attribute">Attribute</option>
                  <option value="file">File</option>
                  <option value="threat">Threat</option>
                </select>
              </div>
              <div
                className="grid grid-cols-2 whitespace-nowrap"
                style={{
                  gridTemplateColumns: '30% 1fr',
                }}
              >
                <label className="block font-semibold text-gray-700">
                  Metric
                </label>
                <select
                  className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={aggregate}
                  onChange={e => setAggregate(e.target.value)}
                >
                  <option disabled value="">
                    Select an Aggregate
                  </option>
                  {Object.keys(getAggregates()).map(id => (
                    <option key={id} value={id}>
                      {getAggregates()[id].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              onClick={addChart}
              type="button"
              styleType="secondary"
              className="ml-auto mt-4"
            >
              Add Chart
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        {charts.map(chart => (
          <ChartWrapper
            key={chart.id}
            id={chart.id}
            type={chart.type}
            width={chart.width}
            endpoint={chart.endpoint}
            aggregate={chart.aggregate}
            removeChart={removeChart}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
