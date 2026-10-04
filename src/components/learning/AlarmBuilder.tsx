import React, { useState, useEffect } from 'react';
import { Resource, ComparisonOperator, MetricStatistic } from '../../types/cloudwatch';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
import { LearningAlarmConfig } from '../../engine/learningEngine';
import { Sliders, Bell, Sparkles } from 'lucide-react';

interface AlarmBuilderProps {
  resources: Resource[];
  initialResourceId?: string;
  initialMetricName?: string;
  initialThreshold?: number;
  initialEvaluationPeriods?: number;
  initialOperator?: ComparisonOperator;
  onAlarmChange?: (config: LearningAlarmConfig) => void;
  showPreview?: boolean;
}

export const AlarmBuilder: React.FC<AlarmBuilderProps> = ({
  resources,
  initialResourceId,
  initialMetricName,
  initialThreshold,
  initialEvaluationPeriods = 3,
  initialOperator = 'GreaterThanThreshold',
  onAlarmChange,
  showPreview = true
}) => {
  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    initialResourceId || resources[0]?.id || 'EC2-Web-01'
  );
  const selectedResource = resources.find((r) => r.id === selectedResourceId) || resources[0];

  const [selectedMetric, setSelectedMetric] = useState<string>(
    initialMetricName || selectedResource?.supportedMetrics[0] || 'CPUUtilization'
  );
  const metricDef = METRIC_DEFINITIONS[selectedMetric];

  const [statistic, setStatistic] = useState<MetricStatistic>('Average');
  const [operator, setOperator] = useState<ComparisonOperator>(initialOperator);
  const [threshold, setThreshold] = useState<number>(
    initialThreshold !== undefined ? initialThreshold : (metricDef?.defaultThreshold || 80)
  );
  const [evaluationPeriods, setEvaluationPeriods] = useState<number>(initialEvaluationPeriods);
  const [alarmName, setAlarmName] = useState<string>('High-Utilization-Alarm');

  // Notify parent on change
  useEffect(() => {
    onAlarmChange?.({
      resourceId: selectedResourceId,
      metricName: selectedMetric,
      statistic,
      operator,
      threshold,
      evaluationPeriods,
      datapointsToAlarm: evaluationPeriods
    });
  }, [selectedResourceId, selectedMetric, statistic, operator, threshold, evaluationPeriods]);

  const handleResourceChange = (resId: string) => {
    setSelectedResourceId(resId);
    const res = resources.find((r) => r.id === resId);
    if (res && !res.supportedMetrics.includes(selectedMetric)) {
      const nextMetric = res.supportedMetrics[0];
      setSelectedMetric(nextMetric);
      const def = METRIC_DEFINITIONS[nextMetric];
      if (def) setThreshold(def.defaultThreshold);
    }
  };

  const handleMetricChange = (mName: string) => {
    setSelectedMetric(mName);
    const def = METRIC_DEFINITIONS[mName];
    if (def) setThreshold(def.defaultThreshold);
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <Sliders className="w-5 h-5 text-amber-500" />
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Alarm Builder
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define resource, metric, threshold comparison, and evaluation window
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {/* Resource Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Resource:
          </label>
          <select
            value={selectedResourceId}
            onChange={(e) => handleResourceChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          >
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.type})
              </option>
            ))}
          </select>
        </div>

        {/* Metric Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Metric:
          </label>
          <select
            value={selectedMetric}
            onChange={(e) => handleMetricChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          >
            {selectedResource?.supportedMetrics.map((m) => (
              <option key={m} value={m}>
                {METRIC_DEFINITIONS[m]?.displayName || m} ({m})
              </option>
            ))}
          </select>
        </div>

        {/* Statistic */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Statistic:
          </label>
          <select
            value={statistic}
            onChange={(e) => setStatistic(e.target.value as MetricStatistic)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          >
            <option value="Average">Average</option>
            <option value="Maximum">Maximum</option>
            <option value="Minimum">Minimum</option>
          </select>
        </div>

        {/* Comparison Operator */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Comparison Operator:
          </label>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value as ComparisonOperator)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="GreaterThanThreshold">&gt; (Greater than)</option>
            <option value="GreaterThanOrEqualToThreshold">&gt;= (Greater than or equal)</option>
            <option value="LessThanThreshold">&lt; (Less than)</option>
            <option value="LessThanOrEqualToThreshold">&lt;= (Less than or equal)</option>
          </select>
        </div>

        {/* Threshold */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Threshold Value:
          </label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Evaluation Periods */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Evaluation Periods (N consecutive):
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={evaluationPeriods}
            onChange={(e) => setEvaluationPeriods(Math.max(1, Number(e.target.value)))}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Alarm Name */}
      <div className="mt-4">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          Alarm Name:
        </label>
        <input
          type="text"
          value={alarmName}
          onChange={(e) => setAlarmName(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
        />
      </div>

      {/* Preview Box */}
      {showPreview && (
        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-2 text-amber-500 font-bold mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Active Alarm Definition Preview:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">TARGET:</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedResourceId}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">METRIC:</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedMetric}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">RULE:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {statistic} {operator.includes('Greater') ? '>' : '<'} {threshold}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">WINDOW:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {evaluationPeriods} of {evaluationPeriods} periods
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
