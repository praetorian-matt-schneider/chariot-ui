import React, { useState } from 'react';

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

  console.log('chart', charts);

  return (
    <div className="w-full p-4">
      <button
        onClick={() => setIsFormVisible(!isFormVisible)}
        className="mb-4 rounded bg-green-500 p-2 text-white"
      >
        {isFormVisible ? 'Cancel' : 'New Chart'}
      </button>

      {isFormVisible && (
        <div className="mb-4">
          <label className="mr-2">Chart Type:</label>
          <select
            value={newChartType}
            onChange={e => setNewChartType(e.target.value as ChartType)}
          >
            <option value="area">Area Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="donut">Donut Chart</option>
          </select>
          <label className="ml-4 mr-2">Width:</label>
          <select
            value={newChartWidth}
            onChange={e => setNewChartWidth(e.target.value)}
          >
            <option value="w-full">Full Width</option>
            <option value="w-1/2">Half Width</option>
            <option value="w-1/3">One Third Width</option>
            <option value="w-1/4">One Fourth Width</option>
          </select>
          <label className="ml-4 mr-2">Endpoint:</label>
          <select
            value={newEndpoint}
            onChange={e => setNewEndpoint(e.target.value as MyResourceKey)}
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
          <label className="ml-4 mr-2">Aggregate:</label>
          <select
            value={aggregate}
            onChange={e => setAggregate(e.target.value)}
          >
            {Object.keys(getAggregates()).map(id => (
              <option key={id} value={id}>
                {getAggregates()[id].label}
              </option>
            ))}
          </select>

          <button
            onClick={addChart}
            className="ml-4 rounded bg-blue-500 p-2 text-white"
          >
            Add Chart
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
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
