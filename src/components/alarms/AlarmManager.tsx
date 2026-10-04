import React, { useState } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
import { Alarm, AlarmState, ComparisonOperator, MetricStatistic } from '../../types/cloudwatch';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Clock,
  Send,
  Zap,
  ChevronRight,
  X,
  Sliders,
  ShieldAlert,
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
  const { alarms, resources, metricHistory, createAlarm, deleteAlarm, injectDatapoint } =
    useCloudWatch();

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

  // Sync selected alarm with latest live data from context
  const currentSelectedAlarm = selectedAlarm
    ? alarms.find((a) => a.id === selectedAlarm.id) || selectedAlarm
    : null;

  // Chart data for selected alarm
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-700/80 gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center">
            <Bell className="w-5 h-5 text-red-400 mr-2" />
            CloudWatch Alarms & Multi-Period State Machine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate time-series metrics against statistical thresholds using sliding evaluation windows (M of N)
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-3.5 py-2 bg-[#ec7211] hover:bg-[#eb5f07] text-black font-bold text-xs rounded-md shadow transition flex items-center self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create CloudWatch Alarm
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-700 pb-2">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeFilter === 'ALL'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          All Alarms ({alarms.length})
        </button>
        <button
          onClick={() => setActiveFilter('ALARM')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
            activeFilter === 'ALARM'
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'text-slate-400 hover:text-red-400 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
          In Alarm ({alarms.filter((a) => a.state === 'ALARM').length})
        </button>
        <button
          onClick={() => setActiveFilter('OK')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
            activeFilter === 'OK'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
          OK ({alarms.filter((a) => a.state === 'OK').length})
        </button>
        <button
          onClick={() => setActiveFilter('INSUFFICIENT_DATA')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
            activeFilter === 'INSUFFICIENT_DATA'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
          Insufficient Data ({alarms.filter((a) => a.state === 'INSUFFICIENT_DATA').length})
        </button>
      </div>

      {/* Alarms List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredAlarms.map((alarm) => {
          let badgeColor = 'bg-slate-700 text-slate-300';
          let borderHighlight = 'border-slate-700';

          if (alarm.state === 'ALARM') {
            badgeColor = 'bg-red-500/20 text-red-400 border border-red-500/50';
            borderHighlight = 'border-red-500/40 hover:border-red-500';
          } else if (alarm.state === 'OK') {
            badgeColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50';
            borderHighlight = 'border-slate-700 hover:border-emerald-500/40';
          } else if (alarm.state === 'INSUFFICIENT_DATA') {
            badgeColor = 'bg-amber-500/20 text-amber-300 border border-amber-500/50';
            borderHighlight = 'border-slate-700 hover:border-amber-500/40';
          }

          return (
            <div
              key={alarm.id}
              onClick={() => setSelectedAlarm(alarm)}
              className={`cursor-pointer bg-[#1e293b] p-4 rounded-xl border ${borderHighlight} transition shadow-sm hover:bg-slate-800/80 group`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start space-x-3">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${badgeColor} mt-0.5`}
                  >
                    {alarm.state}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                      {alarm.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{alarm.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block text-[10px]">EVALUATION BUFFER</span>
                    <span className="font-mono text-amber-300 font-semibold">
                      {alarm.datapointsToAlarm} of {alarm.evaluationPeriods} datapoints
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                </div>
              </div>

              {/* Status Reason Bar */}
              <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                <div className="text-slate-300 text-[11px] truncate flex items-center">
                  <span className="text-slate-400 mr-1.5 font-semibold">Reason:</span>
                  <span className="font-mono text-slate-200">{alarm.stateReason}</span>
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
          <div className="w-full max-w-2xl bg-[#131921] border-l border-slate-700 h-full p-6 flex flex-col shadow-2xl overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-base font-bold text-white">{currentSelectedAlarm.name}</h2>
                  <p className="text-xs text-slate-400 font-mono">
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
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition"
                  title="Delete Alarm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedAlarm(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Current State Indicator */}
            <div className="my-4 p-4 rounded-xl border bg-slate-900 border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                  Current State
                </span>
                <span
                  className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                    currentSelectedAlarm.state === 'ALARM'
                      ? 'bg-red-500/20 text-red-400 border border-red-500'
                      : currentSelectedAlarm.state === 'OK'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500'
                  }`}
                >
                  {currentSelectedAlarm.state}
                </span>
              </div>
              <div className="text-xs text-slate-300 bg-slate-800/80 p-3 rounded-lg border border-slate-700 font-mono leading-relaxed">
                <strong>Evaluation Reason: </strong>
                {currentSelectedAlarm.stateReason}
              </div>
            </div>

            {/* Sliding Window Datapoint Buffer */}
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                  <Sliders className="w-4 h-4 mr-1.5 text-amber-400" />
                  Sliding Evaluation Window ({currentSelectedAlarm.datapointsToAlarm} of{' '}
                  {currentSelectedAlarm.evaluationPeriods} Breaching Required)
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
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
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400">Period -{currentSelectedAlarm.evaluationBuffer.length - idx}</div>
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
            <div className="my-4 bg-[#1e293b] p-4 rounded-xl border border-slate-700">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Metric Evaluation vs Threshold
              </h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedAlarmHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#475569',
                        borderRadius: '8px',
                        fontSize: '10px'
                      }}
                    />
                    <ReferenceLine
                      y={currentSelectedAlarm.threshold}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{
                        value: `Threshold: ${currentSelectedAlarm.threshold}`,
                        fill: '#f87171',
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
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 flex-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                State Transition History
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {currentSelectedAlarm.history.map((hist, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <span className="text-slate-400">{hist.fromState}</span>
                        <span>➔</span>
                        <span
                          className={
                            hist.toState === 'ALARM'
                              ? 'text-red-400'
                              : hist.toState === 'OK'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }
                        >
                          {hist.toState}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(hist.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{hist.reason}</p>
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
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Create CloudWatch Alarm</h2>
                  <p className="text-xs text-slate-400">Configure metric condition and M of N evaluation</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlarmSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alarm Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Resource</label>
                  <select
                    value={formResourceId}
                    onChange={(e) => handleResourceChangeInForm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Metric</label>
                  <select
                    value={formMetricName}
                    onChange={(e) => setFormMetricName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
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
                  <label className="block text-slate-300 font-semibold mb-1">Comparison Operator</label>
                  <select
                    value={formOperator}
                    onChange={(e) => setFormOperator(e.target.value as ComparisonOperator)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="GreaterThanOrEqualToThreshold">Greater Than or Equal (≥)</option>
                    <option value="GreaterThanThreshold">Greater Than (&gt;)</option>
                    <option value="LessThanOrEqualToThreshold">Less Than or Equal (≤)</option>
                    <option value="LessThanThreshold">Less Than (&lt;)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Threshold Value</label>
                  <input
                    type="number"
                    required
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              {/* M of N evaluation settings */}
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700 space-y-2">
                <div className="font-semibold text-amber-300 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1" />
                  Multi-Period Evaluation Buffer (M out of N):
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">
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
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">
                      Datapoints to Alarm (M):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={formEvaluationPeriods}
                      value={formDatapointsToAlarm}
                      onChange={(e) => setFormDatapointsToAlarm(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#ec7211] hover:bg-[#eb5f07] text-black font-bold"
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
