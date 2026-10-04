import React, { useState } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
import { Alarm, AlarmState, ComparisonOperator, MetricStatistic } from '../../types/cloudwatch';
import {
  Bell,
  Plus,
  Trash2,
  Clock,
  ChevronRight,
  X,
  Sliders,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

export const AlarmManager: React.FC = () => {
  const { alarms, resources, metricHistory, createAlarm, deleteAlarm, theme } =
    useCloudWatch();

  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const textFill = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#475569' : '#cbd5e1';

  const [activeFilter, setActiveFilter] = useState<'ALL' | AlarmState>('ALL');
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Form state for creating a new alarm
  const [formResourceId, setFormResourceId] = useState<string>(resources[0]?.id || '');
  const [formMetricName, setFormMetricName] = useState<string>('CPUUtilization');
  const [formName, setFormName] = useState<string>('Custom-Alarm-WebTier');
  const [formDescription, setFormDescription] = useState<string>('Triggers on sustained metric breach');
  const [formStatistic, setFormStatistic] = useState<MetricStatistic>('Average');
  const [formPeriod, setFormPeriod] = useState<number>(60);
  const [formEvaluationPeriods, setFormEvaluationPeriods] = useState<number>(3);
  const [formDatapointsToAlarm, setFormDatapointsToAlarm] = useState<number>(3);
  const [formOperator, setFormOperator] = useState<ComparisonOperator>('GreaterThanOrEqualToThreshold');
  const [formThreshold, setFormThreshold] = useState<number>(75);
  const [formSnsTopic, setFormSnsTopic] = useState<string>('arn:aws:sns:us-east-1:123456789012:cloudwatch-alerts');

  const filteredAlarms = alarms.filter((a) => {
    if (activeFilter === 'ALL') return true;
    return a.state === activeFilter;
  });

  const handleOpenCreateModal = () => {
    const res = resources[0];
    setFormResourceId(res.id);
    setFormMetricName(res.supportedMetrics[0]);
    setIsCreateModalOpen(true);
  };

  const handleResourceChangeInForm = (resId: string) => {
    setFormResourceId(resId);
    const res = resources.find((r) => r.id === resId);
    if (res) {
      setFormMetricName(res.supportedMetrics[0]);
      const def = METRIC_DEFINITIONS[res.supportedMetrics[0]];
      if (def) setFormThreshold(def.defaultThreshold);
    }
  };

  const handleCreateAlarmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAlarm({
      name: formName,
      description: formDescription,
      resourceId: formResourceId,
      metricName: formMetricName,
      statistic: formStatistic,
      period: formPeriod,
      evaluationPeriods: formEvaluationPeriods,
      datapointsToAlarm: formDatapointsToAlarm,
      comparisonOperator: formOperator,
      threshold: formThreshold,
      actions: {
        snsTopic: formSnsTopic
      }
    });
    setIsCreateModalOpen(false);
  };

  const currentSelectedAlarm = selectedAlarm
    ? alarms.find((a) => a.id === selectedAlarm.id) || selectedAlarm
    : null;

  const selectedAlarmHistory = currentSelectedAlarm
    ? (metricHistory[`${currentSelectedAlarm.resourceId}:${currentSelectedAlarm.metricName}`] || []).map(
        (pt) => ({
          time: new Date(pt.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          value: pt.value
        })
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <Bell className="w-5 h-5 text-rose-500 mr-2" />
            CloudWatch Alarms & Multi-Period State Machine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluate time-series metrics against statistical thresholds using sliding evaluation windows (M of N)
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg shadow-xs transition flex items-center self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create CloudWatch Alarm
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-black shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Alarms ({alarms.length})
        </button>
        <button
          onClick={() => setActiveFilter('ALARM')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
            activeFilter === 'ALARM'
              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5 animate-pulse"></span>
          In Alarm ({alarms.filter((a) => a.state === 'ALARM').length})
        </button>
        <button
          onClick={() => setActiveFilter('OK')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
            activeFilter === 'OK'
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
          OK ({alarms.filter((a) => a.state === 'OK').length})
        </button>
        <button
          onClick={() => setActiveFilter('INSUFFICIENT_DATA')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
            activeFilter === 'INSUFFICIENT_DATA'
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
          Insufficient Data ({alarms.filter((a) => a.state === 'INSUFFICIENT_DATA').length})
        </button>
      </div>

      {/* Alarms List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredAlarms.map((alarm) => {
          let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
          let borderHighlight = 'border-slate-200 dark:border-slate-700';

          if (alarm.state === 'ALARM') {
            badgeColor = 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30';
            borderHighlight = 'border-rose-300 dark:border-rose-900/60 hover:border-rose-500';
          } else if (alarm.state === 'OK') {
            badgeColor = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30';
            borderHighlight = 'border-slate-200 dark:border-slate-700 hover:border-emerald-500/50';
          } else if (alarm.state === 'INSUFFICIENT_DATA') {
            badgeColor = 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30';
            borderHighlight = 'border-slate-200 dark:border-slate-700 hover:border-amber-500/50';
          }

          return (
            <div
              key={alarm.id}
              onClick={() => setSelectedAlarm(alarm)}
              className={`cursor-pointer bg-white dark:bg-[#1e293b] p-4 rounded-xl border ${borderHighlight} transition shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 group`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start space-x-3">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${badgeColor} mt-0.5`}
                  >
                    {alarm.state}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                      {alarm.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{alarm.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block text-[10px]">EVALUATION BUFFER</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {alarm.datapointsToAlarm} of {alarm.evaluationPeriods} datapoints
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
                </div>
              </div>

              {/* Status Reason Bar */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                <div className="text-slate-600 dark:text-slate-300 text-[11px] truncate flex items-center">
                  <span className="text-slate-400 mr-1.5 font-semibold">Evaluation Reason:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">{alarm.stateReason}</span>
                </div>
                <div className="text-slate-400 text-[10px] font-mono whitespace-nowrap">
                  Updated: {new Date(alarm.stateUpdatedTimestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Alarm Detail Modal / Drawer */}
      {currentSelectedAlarm && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full p-6 flex flex-col shadow-2xl overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {currentSelectedAlarm.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {currentSelectedAlarm.resourceId} : {currentSelectedAlarm.metricName}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    deleteAlarm(currentSelectedAlarm.id);
                    setSelectedAlarm(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Delete Alarm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedAlarm(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Current State Indicator */}
            <div className="my-4 p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">
                  Current Evaluated State
                </span>
                <span
                  className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                    currentSelectedAlarm.state === 'ALARM'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                      : currentSelectedAlarm.state === 'OK'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {currentSelectedAlarm.state}
                </span>
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono leading-relaxed">
                <strong>Evaluation Reason: </strong>
                {currentSelectedAlarm.stateReason}
              </div>
            </div>

            {/* Sliding Window Datapoint Buffer */}
            <div className="bg-slate-50 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                  <Sliders className="w-4 h-4 mr-1.5 text-amber-500" />
                  Sliding Evaluation Window ({currentSelectedAlarm.datapointsToAlarm} of{' '}
                  {currentSelectedAlarm.evaluationPeriods} Breaching Required)
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Threshold: {currentSelectedAlarm.threshold}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 pt-1">
                {currentSelectedAlarm.evaluationBuffer.map((val, idx) => {
                  const isBreaching =
                    currentSelectedAlarm.comparisonOperator.includes('Greater')
                      ? val >= currentSelectedAlarm.threshold
                      : val <= currentSelectedAlarm.threshold;

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-center font-mono ${
                        isBreaching
                          ? 'bg-rose-500/15 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                          : 'bg-emerald-500/15 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400">
                        Period -{currentSelectedAlarm.evaluationBuffer.length - idx}
                      </div>
                      <div className="text-sm font-bold">{val}</div>
                      <div className="text-[9px] mt-0.5 uppercase font-bold">
                        {isBreaching ? 'BREACH' : 'OK'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time-Series Graph */}
            <div className="my-4 bg-slate-50 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Metric Evaluation vs Threshold
              </h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedAlarmHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.6} />
                    <XAxis dataKey="time" stroke={textFill} fontSize={9} tickLine={false} />
                    <YAxis stroke={textFill} fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: '8px',
                        fontSize: '10px',
                        color: isDark ? '#fff' : '#000'
                      }}
                    />
                    <ReferenceLine
                      y={currentSelectedAlarm.threshold}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{
                        value: `Threshold: ${currentSelectedAlarm.threshold}`,
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'top'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* State Transition History */}
            <div className="bg-slate-50 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                State Transition History
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {currentSelectedAlarm.history.map((hist, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <span className="text-slate-400">{hist.fromState}</span>
                        <span>➔</span>
                        <span
                          className={
                            hist.toState === 'ALARM'
                              ? 'text-rose-600 dark:text-rose-400'
                              : hist.toState === 'OK'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }
                        >
                          {hist.toState}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(hist.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{hist.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Alarm Wizard Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Create CloudWatch Alarm
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure metric threshold and M of N evaluation periods
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlarmSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Alarm Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Target Resource
                  </label>
                  <select
                    value={formResourceId}
                    onChange={(e) => handleResourceChangeInForm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Metric
                  </label>
                  <select
                    value={formMetricName}
                    onChange={(e) => setFormMetricName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    {resources
                      .find((r) => r.id === formResourceId)
                      ?.supportedMetrics.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Comparison Operator
                  </label>
                  <select
                    value={formOperator}
                    onChange={(e) => setFormOperator(e.target.value as ComparisonOperator)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="GreaterThanOrEqualToThreshold">Greater Than or Equal (≥)</option>
                    <option value="GreaterThanThreshold">Greater Than (&gt;)</option>
                    <option value="LessThanOrEqualToThreshold">Less Than or Equal (≤)</option>
                    <option value="LessThanThreshold">Less Than (&lt;)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Threshold Value
                  </label>
                  <input
                    type="number"
                    required
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* M of N evaluation settings */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1" />
                  Multi-Period Sliding Evaluation Buffer (M out of N):
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block mb-1">
                      Evaluation Periods (N):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formEvaluationPeriods}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setFormEvaluationPeriods(n);
                        if (formDatapointsToAlarm > n) setFormDatapointsToAlarm(n);
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block mb-1">
                      Datapoints to Alarm (M):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={formEvaluationPeriods}
                      value={formDatapointsToAlarm}
                      onChange={(e) => setFormDatapointsToAlarm(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-xs"
                >
                  Create Alarm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
