import React, { useState } from 'react';
import { AreaChart, BarChart, DonutChart, LineChart } from '@tremor/react';

// Example data for AreaChart
const areaChartData = [
  { date: 'Jan 22', SolarPanels: 2890, Inverters: 2338 },
  { date: 'Feb 22', SolarPanels: 2756, Inverters: 2103 },
  { date: 'Mar 22', SolarPanels: 3322, Inverters: 2194 },
  { date: 'Apr 22', SolarPanels: 3470, Inverters: 2108 },
  { date: 'May 22', SolarPanels: 3475, Inverters: 1812 },
  { date: 'Jun 22', SolarPanels: 3129, Inverters: 1726 },
  { date: 'Jul 22', SolarPanels: 3490, Inverters: 1982 },
  { date: 'Aug 22', SolarPanels: 2903, Inverters: 2012 },
  { date: 'Sep 22', SolarPanels: 2643, Inverters: 2342 },
  { date: 'Oct 22', SolarPanels: 2837, Inverters: 2473 },
  { date: 'Nov 22', SolarPanels: 2954, Inverters: 3848 },
  { date: 'Dec 22', SolarPanels: 3239, Inverters: 3736 },
];

// Example data for BarChart
const barChartData = [
  { name: 'Amphibians', 'Number of threatened species': 2488 },
  { name: 'Birds', 'Number of threatened species': 1445 },
  { name: 'Crustaceans', 'Number of threatened species': 743 },
  { name: 'Ferns', 'Number of threatened species': 281 },
  { name: 'Arachnids', 'Number of threatened species': 251 },
  { name: 'Corals', 'Number of threatened species': 232 },
  { name: 'Algae', 'Number of threatened species': 98 },
];

// Example data for LineChart
const lineChartData = [
  { date: 'Jan 22', value: 30 },
  { date: 'Feb 22', value: 50 },
  { date: 'Mar 22', value: 40 },
  { date: 'Apr 22', value: 60 },
  { date: 'May 22', value: 70 },
  { date: 'Jun 22', value: 80 },
  { date: 'Jul 22', value: 90 },
  { date: 'Aug 22', value: 100 },
  { date: 'Sep 22', value: 110 },
  { date: 'Oct 22', value: 120 },
  { date: 'Nov 22', value: 130 },
  { date: 'Dec 22', value: 140 },
];

// Example data for DonutChart
const donutChartData = [
  { category: 'Electronics', value: 45 },
  { category: 'Clothing', value: 25 },
  { category: 'Home Appliances', value: 15 },
  { category: 'Books', value: 10 },
  { category: 'Others', value: 5 },
];

const dataFormatter = (number: number | bigint) =>
  `$${Intl.NumberFormat('us').format(number).toString()}`;

const Dashboard = () => {
  const [chartType, setChartType] = useState('area');

  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <AreaChart
            className="h-96 w-full"
            data={areaChartData}
            index="date"
            categories={['SolarPanels', 'Inverters']}
            colors={['indigo', 'rose']}
            valueFormatter={dataFormatter}
            yAxisWidth={60}
          />
        );
      case 'bar':
        return (
          <BarChart
            className="h-96 w-full"
            data={barChartData}
            index="name"
            categories={['Number of threatened species']}
            colors={['blue']}
            valueFormatter={number =>
              Intl.NumberFormat('us').format(number).toString()
            }
            yAxisWidth={48}
          />
        );
      case 'line':
        return (
          <LineChart
            className="h-96 w-full"
            data={lineChartData}
            index="date"
            yAxisWidth={65}
            categories={['value']}
            colors={['green']}
            valueFormatter={number =>
              Intl.NumberFormat('us').format(number).toString()
            }
          />
        );
      case 'donut':
        return (
          <DonutChart
            className="h-96 w-full"
            data={donutChartData}
            index="category"
            colors={['purple', 'orange', 'red', 'blue', 'green']}
            valueFormatter={dataFormatter}
          />
        );
      default:
        return <span>{chartType}</span>;
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="mr-2">Select Chart Type:</label>
        <select onChange={e => setChartType(e.target.value)}>
          <option value="area">Area Chart</option>
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
          <option value="donut">Donut Chart</option>
        </select>
      </div>
      <div className="flex w-full justify-center">{renderChart()}</div>
    </div>
  );
};

export default Dashboard;
