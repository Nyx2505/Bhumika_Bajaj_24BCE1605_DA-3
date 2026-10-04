import React, { useState } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
import {
  Activity,
  Server,
  Send,
  Filter
} from 'lucide-react';
import { MetricCard } from '../common/MetricCard';
import { MetricChart } from '../charts/MetricChart';

interface MetricsExplorerProps {
  initialResourceId?: string;
}

export const MetricsExplorer: React.FC<MetricsExplorerProps> = ({ initialResourceId }) => {
  const { resources, metricHistory, injectDatapoint, theme } = useCloudWatch();

  const isDark = theme === 'dark';

  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    initialResourceId || resources[0]?.id || ''
  );

  const selectedResource = resources.find((r) => r.id === selectedResourceId) || resources[0];

  const [selectedMetric, setSelectedMetric] = useState<string>(
    selectedResource?.supportedMetrics[0] || 'CPUUtilization'
  );

  const handleResourceChange = (resId: string) => {
    setSelectedResourceId(resId);
    const res = resources.find((r) => r.id === resId);
    if (res && !res.supportedMetrics.includes(selectedMetric)) {
      setSelectedMetric(res.supportedMetrics[0]);
    }
  };

  const metricKey = `${selectedResource.id}:${selectedMetric}`;
  const points = metricHistory[metricKey] || [];
  const metricDef = METRIC_DEFINITIONS[selectedMetric];

  // Manual injector state
  const [manualValue, setManualValue] = useState<number>(
    metricDef ? metricDef.defaultThreshold : 50
  );

  // Formatted chart data
  const chartData = points.map((pt) => ({
    time: new Date(pt.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    value: pt.value
  }));

  const valuesArray = points.map((p) => p.value);
  const currentVal = valuesArray.length > 0 ? valuesArray[valuesArray.length - 1] : 0;
  const maxVal = valuesArray.length > 0 ? Math.max(...valuesArray) : 0;
  const minVal = valuesArray.length > 0 ? Math.min(...valuesArray) : 0;
  const avgVal =
    valuesArray.length > 0
      ? (valuesArray.reduce((a, b) => a + b, 0) / valuesArray.length).toFixed(1)
      : '0';

  const getNamespace = (type: string) => {
    switch (type) {
      case 'EC2':
        return 'AWS/EC2';
      case 'RDS':
        return 'AWS/RDS';
      case 'Lambda':
        return 'AWS/Lambda';
      case 'ALB':
        return 'AWS/ApplicationELB';
      default:
        return 'AWS/Custom';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <Activity className="w-5 h-5 text-sky-500 mr-2" />
            CloudWatch Metrics Explorer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Analyze time-series telemetry across AWS namespaces, dimensions, and statistical aggregations
          </p>
        </div>
        <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
          Namespace: <strong className="text-slate-900 dark:text-white">{getNamespace(selectedResource.type)}</strong>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center">
            <Server className="w-3.5 h-3.5 mr-1.5 text-sky-500" />
            1. Select Monitored Dimension (Target Resource)
          </label>
          <select
            value={selectedResourceId}
            onChange={(e) => handleResourceChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
          >
            {resources.map((res) => (
              <option key={res.id} value={res.id}>
                [{res.type}] {res.name} ({res.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
            2. Select CloudWatch Metric
          </label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
          >
            {selectedResource.supportedMetrics.map((m) => (
              <option key={m} value={m}>
                {METRIC_DEFINITIONS[m]?.displayName || m} ({METRIC_DEFINITIONS[m]?.unit || 'Units'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Telemetry Card & Stats */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {metricDef?.displayName || selectedMetric}
              </h2>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                Unit: {metricDef?.unit}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {metricDef?.description}
            </p>
          </div>

          {/* Quick Metrics KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 w-full lg:w-auto">
            <MetricCard
              title="CURRENT"
              value={currentVal}
              unit={metricDef?.unit}
              threshold={metricDef?.defaultThreshold}
              status={metricDef?.defaultThreshold && currentVal > metricDef.defaultThreshold ? 'breached' : 'healthy'}
            />
            <MetricCard
              title="AVERAGE"
              value={avgVal}
              unit={metricDef?.unit}
            />
            <MetricCard
              title="MAX PEAK"
              value={maxVal}
              unit={metricDef?.unit}
            />
            <MetricCard
              title="MIN VALUE"
              value={minVal}
              unit={metricDef?.unit}
            />
          </div>
        </div>

        {/* Chart View */}
        <div className="h-72 w-full pt-2">
          <MetricChart
            data={chartData}
            lines={[
              {
                key: 'value',
                name: metricDef?.displayName || selectedMetric,
                color: '#0284c7'
              }
            ]}
            threshold={metricDef?.defaultThreshold}
            thresholdLabel="Threshold"
            height={280}
            yAxisUnit={metricDef?.unit === 'Percent' ? 'Percent' : ''}
            isDark={isDark}
          />
        </div>

        {/* Interactive Manual Injector Section */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
              <Send className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Manual Metric Injection (Test Telemetry Ingestion)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate a custom telemetry datapoint to test immediate alarm evaluation on this resource.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={manualValue}
                onChange={(e) => setManualValue(Number(e.target.value))}
                className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:border-amber-500"
              />
              <span className="text-xs text-slate-400 font-mono">{metricDef?.unit}</span>
            </div>
            <button
              onClick={() => injectDatapoint(selectedResource.id, selectedMetric, manualValue)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-lg transition flex items-center shadow-xs"
            >
              Inject Datapoint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
