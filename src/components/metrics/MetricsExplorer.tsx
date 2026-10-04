import React, { useState } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
import {
  Activity,
  Server,
  Layers,
  Send,
  Info,
  Calendar,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface MetricsExplorerProps {
  initialResourceId?: string;
}

export const MetricsExplorer: React.FC<MetricsExplorerProps> = ({ initialResourceId }) => {
  const { resources, metricHistory, injectDatapoint } = useCloudWatch();

  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    initialResourceId || resources[0]?.id || ''
  );

  const selectedResource = resources.find((r) => r.id === selectedResourceId) || resources[0];

  const [selectedMetric, setSelectedMetric] = useState<string>(
    selectedResource?.supportedMetrics[0] || 'CPUUtilization'
  );

  // If resource changes, ensure selected metric is supported
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
      case 'EC2': return 'AWS/EC2';
      case 'RDS': return 'AWS/RDS';
      case 'Lambda': return 'AWS/Lambda';
      case 'ALB': return 'AWS/ApplicationELB';
      default: return 'AWS/Custom';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-700/80 gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center">
            <Activity className="w-5 h-5 text-sky-400 mr-2" />
            CloudWatch Metrics Explorer
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Query time-series telemetry across AWS namespaces, dimensions, and statistical aggregations
          </p>
        </div>
        <div className="text-xs font-mono bg-slate-800 text-sky-300 px-3 py-1 rounded-md border border-slate-700">
          Namespace: <strong className="text-white">{getNamespace(selectedResource.type)}</strong>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#1e293b] p-4 rounded-xl border border-slate-700">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
            <Server className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
            1. Select AWS Resource (Dimension)
          </label>
          <select
            value={selectedResourceId}
            onChange={(e) => handleResourceChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
          >
            {resources.map((res) => (
              <option key={res.id} value={res.id}>
                [{res.type}] {res.name} ({res.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            2. Select Metric
          </label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
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
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-slate-700 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white">
                {metricDef?.displayName || selectedMetric}
              </h2>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                Unit: {metricDef?.unit}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {metricDef?.description}
            </p>
          </div>

          {/* Quick Metrics KPI */}
          <div className="flex items-center space-x-4 text-xs font-mono">
            <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">CURRENT</span>
              <span className="text-white font-bold text-sm">{currentVal}</span>
            </div>
            <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">AVERAGE</span>
              <span className="text-sky-300 font-bold text-sm">{avgVal}</span>
            </div>
            <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">MAX PEAK</span>
              <span className="text-amber-400 font-bold text-sm">{maxVal}</span>
            </div>
            <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">MIN</span>
              <span className="text-slate-300 font-bold text-sm">{minVal}</span>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="metricColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#475569',
                  borderRadius: '8px',
                  fontSize: '11px'
                }}
              />
              {metricDef && (
                <ReferenceLine
                  y={metricDef.defaultThreshold}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: `Default CloudWatch Alarm Threshold: ${metricDef.defaultThreshold}`,
                    fill: '#f87171',
                    fontSize: 10,
                    position: 'top'
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#metricColor)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive Manual Injector Section */}
        <div className="pt-4 border-t border-slate-700/80 bg-slate-900/60 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-white flex items-center">
              <Send className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Manual Metric Injection (Test CloudWatch Ingestion)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulate a custom telemetry datapoint to test immediate alarm evaluation on this resource.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={manualValue}
                onChange={(e) => setManualValue(Number(e.target.value))}
                className="w-24 bg-slate-850 bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500"
              />
              <span className="text-xs text-slate-400 font-mono">{metricDef?.unit}</span>
            </div>
            <button
              onClick={() => injectDatapoint(selectedResource.id, selectedMetric, manualValue)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded transition flex items-center shadow"
            >
              Inject Datapoint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
