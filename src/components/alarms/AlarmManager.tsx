import React, { useState, useMemo, useEffect } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
import { Alarm, AlarmState, ComparisonOperator, MetricStatistic } from '../../types/cloudwatch';
import { getOperatorSymbol } from '../../engine/alarmEvaluator';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Clock,
  ChevronRight,
  X,
  Sliders,
  Send,
  ArrowRight,
  ShieldAlert,
  Play,
  History,
  RotateCcw,
  Info
} from 'lucide-react';
import { AlarmCard } from './AlarmCard';
import { AlarmStatusBadge } from './AlarmStatusBadge';
import { MetricChart } from '../charts/MetricChart';

interface AlarmManagerProps {
  initialView?: 'ALARMS' | 'HISTORY';
  onNavigateTab?: (tab: string) => void;
}

export const AlarmManager: React.FC<AlarmManagerProps> = ({
  initialView = 'ALARMS',
  onNavigateTab
}) => {
  const {
    alarms,
    resources,
    metricHistory,
    createAlarm,
    deleteAlarm,
    injectDatapoint,
    theme
  } = useCloudWatch();

  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const textFill = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#475569' : '#cbd5e1';

  // Navigation tab within Alarms section: 'ALARMS' vs 'HISTORY'
  const [activeView, setActiveView] = useState<'ALARMS' | 'HISTORY'>(initialView);

  useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'ALL' | AlarmState>('ALL');
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Form state for creating a new alarm
  const [formResourceId, setFormResourceId] = useState<string>(resources[0]?.id || 'EC2-Web-01');
  const [formMetricName, setFormMetricName] = useState<string>('CPUUtilization');
  const [formName, setFormName] = useState<string>('EC2-Web-01-High-CPU');
  const [formDescription, setFormDescription] = useState<string>(
    'Triggers when CPU exceeds threshold for consecutive periods'
  );
  const [formStatistic, setFormStatistic] = useState<MetricStatistic>('Average');
  const [formPeriod, setFormPeriod] = useState<number>(60);
  const [formEvaluationPeriods, setFormEvaluationPeriods] = useState<number>(3);
  const [formOperator, setFormOperator] = useState<ComparisonOperator>('GreaterThanThreshold');
  const [formThreshold, setFormThreshold] = useState<number>(80);
  const [formSnsTopic, setFormSnsTopic] = useState<string>(
    'arn:aws:sns:us-east-1:123456789012:ops-critical-alerts'
  );

  // In-modal manual test injection value
  const [testFeedValue, setTestFeedValue] = useState<number>(85);

  const filteredAlarms = alarms.filter((a) => {
    if (activeFilter === 'ALL') return true;
    return a.state === activeFilter;
  });

  // Collect all history items across all alarms for global history feed
  const allHistoryItems = useMemo(() => {
    const list: {
      alarmId: string;
      alarmName: string;
      resourceId: string;
      metricName: string;
      timestamp: string;
      fromState: AlarmState;
      toState: AlarmState;
      reason: string;
    }[] = [];

    alarms.forEach((alarm) => {
      alarm.history.forEach((h) => {
        list.push({
          alarmId: alarm.id,
          alarmName: alarm.name,
          resourceId: alarm.resourceId,
          metricName: alarm.metricName,
          timestamp: h.timestamp,
          fromState: h.fromState,
          toState: h.toState,
          reason: h.reason
        });
      });
    });

    return list.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [alarms]);

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
      datapointsToAlarm: formEvaluationPeriods, // Consecutive periods
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

  // Helper to fetch latest metric value for an alarm
  const getCurrentMetricValue = (alarm: Alarm) => {
    const pts = metricHistory[`${alarm.resourceId}:${alarm.metricName}`] || [];
    if (pts.length === 0) return '--';
    const lastVal = pts[pts.length - 1].value;
    const def = METRIC_DEFINITIONS[alarm.metricName];
    return `${lastVal}${def?.unit === 'Percent' ? '%' : ' ' + (def?.unit || '')}`;
  };

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
            Simulate threshold evaluations, consecutive evaluation period logic, and real-time state transitions
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle: Alarms vs History */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center">
            <button
              onClick={() => setActiveView('ALARMS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeView === 'ALARMS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Alarms ({alarms.length})
            </button>
            <button
              onClick={() => setActiveView('HISTORY')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center ${
                activeView === 'HISTORY'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5 mr-1" />
              History Feed ({allHistoryItems.length})
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg shadow-xs transition flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Alarm
          </button>
        </div>
      </div>

      {activeView === 'ALARMS' ? (
        /* ======================== ALARMS VIEW ======================== */
        <div className="space-y-4">
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

          {/* Alarm Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAlarms.map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                isSelected={currentSelectedAlarm?.id === alarm.id}
                onSelect={setSelectedAlarm}
                onDelete={deleteAlarm}
                onTriggerTestDatapoint={(a, val) => injectDatapoint(a.resourceId, a.metricName, val)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* ======================== ALARM HISTORY SECTION ======================== */
        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  CloudWatch Alarm State Transition History
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chronological audit of state changes (e.g. OK → ALARM, ALARM → OK)
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-800">
              {allHistoryItems.length} Total Transitions
            </span>
          </div>

          <div className="space-y-3">
            {allHistoryItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs italic">
                No alarm state transitions recorded yet. Adjust thresholds or feed datapoints to observe transitions.
              </div>
            ) : (
              allHistoryItems.map((hist, idx) => {
                const isToAlarm = hist.toState === 'ALARM';
                const isToOk = hist.toState === 'OK';

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isToAlarm
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                        : isToOk
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-center font-mono pt-0.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {new Date(hist.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(hist.timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="h-9 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {hist.alarmName}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {hist.resourceId} : {hist.metricName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed font-mono">
                          {hist.reason}
                        </p>
                      </div>
                    </div>

                    {/* Transition Badge: OK → ALARM or ALARM → OK */}
                    <div className="flex items-center space-x-2 self-end md:self-center flex-shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center ${
                          hist.fromState === 'ALARM'
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                            : hist.fromState === 'OK'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {hist.fromState}
                      </span>

                      <ArrowRight className="w-4 h-4 text-slate-400" />

                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center ${
                          isToAlarm
                            ? 'bg-rose-600 text-white font-black shadow-xs animate-pulse'
                            : isToOk
                            ? 'bg-emerald-600 text-white font-black shadow-xs'
                            : 'bg-amber-500 text-black font-black shadow-xs'
                        }`}
                      >
                        {hist.toState}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= ALARM DETAIL & TEST DRAWER ================= */}
      {currentSelectedAlarm && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full p-6 flex flex-col shadow-2xl overflow-y-auto">
            {/* Header */}
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

            {/* Current State & Parameters Banner */}
            <div className="my-4 p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">
                    CURRENT STATE
                  </span>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Updated:{' '}
                    {new Date(currentSelectedAlarm.stateUpdatedTimestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>

                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                    currentSelectedAlarm.state === 'ALARM'
                      ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                      : currentSelectedAlarm.state === 'OK'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-amber-500 text-black shadow-xs'
                  }`}
                >
                  {currentSelectedAlarm.state}
                </span>
              </div>

              {/* Grid of parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">STATISTIC</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {currentSelectedAlarm.statistic}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">OPERATOR</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {getOperatorSymbol(currentSelectedAlarm.comparisonOperator)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">THRESHOLD</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {currentSelectedAlarm.threshold}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">EVALUATION</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {currentSelectedAlarm.evaluationPeriods} consecutive
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono leading-relaxed">
                <strong>Evaluation Status Reason: </strong>
                {currentSelectedAlarm.stateReason}
              </div>
            </div>

            {/* Consecutive Periods Sliding Buffer */}
            <div className="bg-slate-50 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                  <Sliders className="w-4 h-4 mr-1.5 text-amber-500" />
                  Consecutive Periods Evaluation Buffer ({currentSelectedAlarm.evaluationPeriods} periods)
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Breaching Rule: {getOperatorSymbol(currentSelectedAlarm.comparisonOperator)}{' '}
                  {currentSelectedAlarm.threshold}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 pt-1">
                {currentSelectedAlarm.evaluationBuffer.map((val, idx) => {
                  const isBreaching =
                    currentSelectedAlarm.comparisonOperator === 'GreaterThanThreshold'
                      ? val > currentSelectedAlarm.threshold
                      : currentSelectedAlarm.comparisonOperator === 'GreaterThanOrEqualToThreshold'
                      ? val >= currentSelectedAlarm.threshold
                      : currentSelectedAlarm.comparisonOperator === 'LessThanThreshold'
                      ? val < currentSelectedAlarm.threshold
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
                        Period #{idx + 1}
                      </div>
                      <div className="text-sm font-bold">{val}</div>
                      <div className="text-[9px] mt-0.5 uppercase font-bold">
                        {isBreaching ? 'BREACH' : 'OK'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <strong>Consecutive Period Rule:</strong> CloudWatch requires all{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentSelectedAlarm.evaluationPeriods} consecutive periods
                </span>{' '}
                to breach threshold before transitioning to <strong className="text-rose-500">ALARM</strong>.
                If metrics recover, it transitions back to <strong className="text-emerald-500">OK</strong>.
              </div>
            </div>

            {/* Interactive Step-by-Step Feeder */}
            <div className="my-4 bg-slate-50 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                  <Play className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                  Test Consecutive Evaluation In Real-Time
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Simulate Datapoint</span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={testFeedValue}
                  onChange={(e) => setTestFeedValue(Number(e.target.value))}
                  className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                />
                <button
                  onClick={() =>
                    injectDatapoint(
                      currentSelectedAlarm.resourceId,
                      currentSelectedAlarm.metricName,
                      testFeedValue
                    )
                  }
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg transition"
                >
                  Feed Value
                </button>
                <button
                  onClick={() =>
                    injectDatapoint(
                      currentSelectedAlarm.resourceId,
                      currentSelectedAlarm.metricName,
                      currentSelectedAlarm.threshold + 5
                    )
                  }
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-lg transition"
                >
                  + Breaching ({currentSelectedAlarm.threshold + 5})
                </button>
                <button
                  onClick={() =>
                    injectDatapoint(
                      currentSelectedAlarm.resourceId,
                      currentSelectedAlarm.metricName,
                      currentSelectedAlarm.threshold - 10
                    )
                  }
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-lg transition"
                >
                  + Safe ({currentSelectedAlarm.threshold - 10})
                </button>
              </div>
            </div>

            {/* Time-Series Graph */}
            <div className="my-2 bg-slate-50 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Metric Evaluation vs Threshold Line
              </h4>
              <MetricChart
                data={selectedAlarmHistory}
                lines={[{ key: 'value', color: '#f59e0b', name: currentSelectedAlarm.metricName }]}
                threshold={currentSelectedAlarm.threshold}
                thresholdLabel="Threshold"
                height={175}
                isDark={isDark}
              />
            </div>

            {/* State Transition History */}
            <div className="bg-slate-50 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                Alarm State Transition History
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
                        {new Date(hist.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {hist.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CREATE ALARM WIZARD MODAL ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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
                    Configure metric threshold and consecutive evaluation periods
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

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
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
                        {r.name} ({r.type})
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
                    <option value="GreaterThanThreshold">&gt; (Greater Than)</option>
                    <option value="GreaterThanOrEqualToThreshold">&gt;= (Greater Than or Equal)</option>
                    <option value="LessThanThreshold">&lt; (Less Than)</option>
                    <option value="LessThanOrEqualToThreshold">&lt;= (Less Than or Equal)</option>
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

              {/* Consecutive evaluation periods */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1" />
                  Consecutive Evaluation Periods:
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">
                    Consecutive Periods Required (N):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formEvaluationPeriods}
                    onChange={(e) => setFormEvaluationPeriods(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Alarm will trigger OK → ALARM only if condition is satisfied for {formEvaluationPeriods} consecutive periods.
                  </span>
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
