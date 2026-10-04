import React, { useState, useMemo } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import {
  Server,
  Bell,
  Activity,
  FileText,
  RotateCcw,
  Clock,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  AlertTriangle,
  CheckCircle,
  Database,
  Sliders,
  Flame,
  Info
} from 'lucide-react';
import { MetricChart } from '../charts/MetricChart';
import { AlarmStatusBadge } from '../alarms/AlarmStatusBadge';

interface OperationalDashboardProps {
  onNavigateTab: (tab: string) => void;
  onSelectResourceForMetrics: (resourceId: string) => void;
  onOpenAbout?: () => void;
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({
  onNavigateTab,
  onSelectResourceForMetrics,
  onOpenAbout
}) => {
  const {
    resources,
    alarms,
    logs,
    metricHistory,
    totalMetricsTracked,
    resetSimulation,
    activeIncident,
    triggerIncident,
    theme
  } = useCloudWatch();

  const isDark = theme === 'dark';

  // Filters state
  const [selectedResource, setSelectedResource] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<'10m' | '30m' | '1h'>('10m');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Active alarms count
  const activeAlarmsCount = alarms.filter((a) => a.state === 'ALARM').length;

  // Determine number of slice points based on selected time range
  const sliceCount = useMemo(() => {
    switch (timeRange) {
      case '10m':
        return 10;
      case '30m':
        return 30;
      case '1h':
        return 60;
      default:
        return 10;
    }
  }, [timeRange]);

  // Helper to extract sliced points for resource and metric
  const getPoints = (resId: string, metric: string) => {
    const raw = metricHistory[`${resId}:${metric}`] || [];
    return raw.slice(-sliceCount);
  };

  // 1. CPU Utilization time-series data
  const cpuChartData = useMemo(() => {
    const ec1 = getPoints('EC2-Web-01', 'CPUUtilization');
    const ec2 = getPoints('EC2-Web-02', 'CPUUtilization');
    const db1 = getPoints('Database-01', 'CPUUtilization');

    const maxLength = Math.max(ec1.length, ec2.length, db1.length);
    const data = [];

    for (let i = 0; i < maxLength; i++) {
      const p1 = ec1[i];
      const p2 = ec2[i];
      const p3 = db1[i];
      const timeStr = p1
        ? new Date(p1.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : `T-${maxLength - i}`;

      data.push({
        time: timeStr,
        'EC2-Web-01': p1?.value ?? null,
        'EC2-Web-02': p2?.value ?? null,
        'Database-01': p3?.value ?? null
      });
    }

    return data;
  }, [metricHistory, sliceCount]);

  // 2. Request Count time-series data
  const requestChartData = useMemo(() => {
    const ec1 = getPoints('EC2-Web-01', 'RequestCount');
    const ec2 = getPoints('EC2-Web-02', 'RequestCount');
    const app = getPoints('Application-Server-01', 'RequestCount');

    const maxLength = Math.max(ec1.length, ec2.length, app.length);
    const data = [];

    for (let i = 0; i < maxLength; i++) {
      const p1 = ec1[i];
      const p2 = ec2[i];
      const pApp = app[i];
      const timeStr = p1
        ? new Date(p1.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : `T-${maxLength - i}`;

      data.push({
        time: timeStr,
        'EC2-Web-01': p1?.value ?? null,
        'EC2-Web-02': p2?.value ?? null,
        'Application-Server-01': pApp?.value ?? null
      });
    }

    return data;
  }, [metricHistory, sliceCount]);

  // 3. Error Rate time-series data (Application-Server-01)
  const errorRateChartData = useMemo(() => {
    const errRatePts = getPoints('Application-Server-01', 'ErrorRate');
    return errRatePts.map((p) => ({
      time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      'Error Rate (%)': p.value
    }));
  }, [metricHistory, sliceCount]);

  // 4. Network Traffic (Network In / Network Out) data
  const networkChartData = useMemo(() => {
    const targetId = selectedResource === 'ALL' || selectedResource === 'Database-01' || selectedResource === 'Application-Server-01'
      ? 'EC2-Web-01'
      : selectedResource;

    const netIn = getPoints(targetId, 'NetworkIn');
    const netOut = getPoints(targetId, 'NetworkOut');

    const maxLength = Math.max(netIn.length, netOut.length);
    const data = [];

    for (let i = 0; i < maxLength; i++) {
      const pIn = netIn[i];
      const pOut = netOut[i];
      const timeStr = pIn
        ? new Date(pIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : `T-${maxLength - i}`;

      data.push({
        time: timeStr,
        'Network In (MB)': pIn?.value ?? null,
        'Network Out (MB)': pOut?.value ?? null
      });
    }

    return data;
  }, [metricHistory, sliceCount, selectedResource]);

  const handleResetConfirm = () => {
    resetSimulation();
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ================= TOP SECTION: SUMMARY CARDS ================= */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <Activity className="w-5 h-5 text-amber-500 mr-2" />
              CloudWatch Monitoring Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-resource real-time metrics telemetry, active threshold evaluations, and log event stream
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2">
            {onOpenAbout && (
              <button
                onClick={onOpenAbout}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-500/30 transition flex items-center shadow-2xs cursor-pointer"
                title="About this Educational Simulator"
              >
                <Info className="w-3.5 h-3.5 mr-1 text-amber-500" />
                About Simulator
              </button>
            )}
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition flex items-center shadow-2xs hover:border-amber-500"
              title="Reset all time-series telemetry and alarms to initial clean state"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Reset Simulation
            </button>
          </div>
        </div>

        {/* 4 Required Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {/* Card 1: Resources Monitored */}
          <div
            onClick={() => onNavigateTab('resources')}
            className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-sky-500 transition group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Resources Monitored</span>
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {resources.length}
              </span>
              <span className="text-[11px] text-slate-400">active targets</span>
            </div>
          </div>

          {/* Card 2: Active Alarms */}
          <div
            onClick={() => onNavigateTab('alarms')}
            className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-rose-500 transition group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Active Alarms</span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition">
                <Bell className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span
                className={`text-3xl font-black ${
                  activeAlarmsCount > 0
                    ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {activeAlarmsCount}
              </span>
              <span className="text-[11px] text-slate-400">
                {activeAlarmsCount > 0 ? 'breaches in alarm' : 'all healthy (OK)'}
              </span>
            </div>
          </div>

          {/* Card 3: Metrics Tracked */}
          <div
            onClick={() => onNavigateTab('metrics')}
            className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-amber-500 transition group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Metrics Tracked</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {totalMetricsTracked}
              </span>
              <span className="text-[11px] text-slate-400">live streams</span>
            </div>
          </div>

          {/* Card 4: Log Events */}
          <div
            onClick={() => onNavigateTab('logs')}
            className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-purple-500 transition group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Log Events</span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {logs.length}
              </span>
              <span className="text-[11px] text-slate-400">ingested lines</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONNECTED SIMULATION INCIDENT STATUS BANNER ================= */}
      {activeIncident !== 'NORMAL' && activeIncident !== 'RECOVERY' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Active Simulation Incident:
                </span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-xs rounded font-bold">
                  {activeIncident.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Telemetry metrics are surging in real-time. Notice the graphs rising below, crossing thresholds, evaluating consecutive periods, and triggering alarms.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => triggerIncident('RECOVERY')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center shadow-xs cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Trigger Recovery
            </button>
            <button
              onClick={() => onNavigateTab('simulator')}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center cursor-pointer"
            >
              <Sliders className="w-4 h-4 mr-1.5" />
              Simulator Controls
            </button>
          </div>
        </div>
      )}

      {activeIncident === 'RECOVERY' && (
        <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-500 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  Recovery Mode Active
                </span>
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-700 dark:text-teal-300 font-mono text-xs rounded font-bold">
                  Cooling Down
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Metrics are stepping down gradually towards normal operating baselines. Alarms will transition to OK once recovery evaluation criteria are met.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => triggerIncident('NORMAL')}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center cursor-pointer"
            >
              Set Normal Steady State
            </button>
            <button
              onClick={() => onNavigateTab('simulator')}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center cursor-pointer"
            >
              <Sliders className="w-4 h-4 mr-1.5" />
              Simulator Controls
            </button>
          </div>
        </div>
      )}

      {activeIncident === 'NORMAL' && (
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>
              <strong>Environment Status:</strong> Normal Steady Operation. Telemetry within standard thresholds.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => triggerIncident('CPU_SPIKE')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center shadow-2xs cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 mr-1" />
              Simulate CPU Spike
            </button>
            <button
              onClick={() => onNavigateTab('simulator')}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition flex items-center cursor-pointer"
            >
              Open Simulator →
            </button>
          </div>
        </div>
      )}

      {/* ================= CONTROLS: RESOURCE & TIME RANGE SELECTORS ================= */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Resource Selector */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Filter Resource:
          </span>
          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Resources (Aggregate View)</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.type})
              </option>
            ))}
          </select>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto justify-end">
          <Clock className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1 whitespace-nowrap">
            Time Range:
          </span>
          {(['10m', '30m', '1h'] as const).map((range) => {
            const label = range === '10m' ? 'Last 10 minutes' : range === '30m' ? 'Last 30 minutes' : 'Last hour';
            return (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition font-mono ${
                  timeRange === range
                    ? 'bg-amber-500 text-black shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= MAIN TIME-SERIES CHARTS GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: CPU Utilization */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                  <Cpu className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  CPU Utilization (%)
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Target Threshold: <strong className="text-rose-500 font-mono">≥ 80%</strong> · Multi-resource compute consumption
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
              Unit: Percent
            </span>
          </div>

          <div className="h-60 w-full mt-2">
            <MetricChart
              data={cpuChartData}
              lines={[
                ...(selectedResource === 'ALL' || selectedResource === 'EC2-Web-01' ? [{ key: 'EC2-Web-01', color: '#0284c7' }] : []),
                ...(selectedResource === 'ALL' || selectedResource === 'EC2-Web-02' ? [{ key: 'EC2-Web-02', color: '#10b981' }] : []),
                ...(selectedResource === 'ALL' || selectedResource === 'Database-01' ? [{ key: 'Database-01', color: '#f59e0b' }] : [])
              ]}
              threshold={80}
              thresholdLabel="Alarm Threshold 80%"
              height={240}
              yAxisUnit="Percent"
              isDark={isDark}
            />
          </div>
        </div>

        {/* Chart 2: Request Count */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-sky-500/10 text-sky-500 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Request Count (Req / min)
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Incoming traffic rates across web instances and backend application server
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
              Unit: Count
            </span>
          </div>

          <div className="h-60 w-full mt-2">
            <MetricChart
              data={requestChartData}
              lines={[
                ...(selectedResource === 'ALL' || selectedResource === 'EC2-Web-01' ? [{ key: 'EC2-Web-01', color: '#0284c7' }] : []),
                ...(selectedResource === 'ALL' || selectedResource === 'EC2-Web-02' ? [{ key: 'EC2-Web-02', color: '#10b981' }] : []),
                ...(selectedResource === 'ALL' || selectedResource === 'Application-Server-01' ? [{ key: 'Application-Server-01', color: '#8b5cf6' }] : [])
              ]}
              height={240}
              isDark={isDark}
            />
          </div>
        </div>

        {/* Chart 3: Error Rate (Application-Server-01) */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Error Rate (%) – Application-Server-01
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Target Threshold: <strong className="text-rose-500 font-mono">≥ 5.0%</strong> · HTTP 5XX failure responses
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
              Unit: Percent
            </span>
          </div>

          <div className="h-60 w-full mt-2">
            <MetricChart
              data={errorRateChartData}
              lines={[{ key: 'Error Rate (%)', color: '#ef4444' }]}
              threshold={5}
              thresholdLabel="Alarm Threshold 5.0%"
              height={240}
              yAxisUnit="Percent"
              isDark={isDark}
            />
          </div>
        </div>

        {/* Chart 4: Network Traffic */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Layers className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Network Traffic (MB) – {selectedResource === 'ALL' ? 'EC2-Web-01' : selectedResource}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Network Ingress & Egress bandwidth consumption
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
              Unit: Megabytes
            </span>
          </div>

          <div className="h-60 w-full mt-2">
            <MetricChart
              data={networkChartData}
              lines={[
                { key: 'Network In (MB)', color: '#38bdf8' },
                { key: 'Network Out (MB)', color: '#6366f1' }
              ]}
              height={240}
              isDark={isDark}
            />
          </div>
        </div>
      </div>

      {/* ================= SIMULATED RESOURCES HEALTH BREAKDOWN ================= */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Simulated Infrastructure Target Status & Current Metrics
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('resources')}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center"
          >
            All Resources <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map((res) => {
            const cpuPts = metricHistory[`${res.id}:CPUUtilization`] || [];
            const latestCpu = cpuPts[cpuPts.length - 1]?.value ?? '--';

            // Key metric per resource
            let keyMetricLabel = 'Requests';
            let keyMetricValue = '--';

            if (res.type === 'Database') {
              keyMetricLabel = 'DB Connections';
              const pts = metricHistory[`${res.id}:DatabaseConnections`] || [];
              keyMetricValue = pts[pts.length - 1]?.value?.toString() ?? '--';
            } else if (res.type === 'Application') {
              keyMetricLabel = 'Error Rate';
              const pts = metricHistory[`${res.id}:ErrorRate`] || [];
              keyMetricValue = pts[pts.length - 1] ? `${pts[pts.length - 1].value}%` : '--';
            } else {
              const pts = metricHistory[`${res.id}:RequestCount`] || [];
              keyMetricValue = pts[pts.length - 1]?.value?.toString() ?? '--';
            }

            const resAlarms = alarms.filter((a) => a.resourceId === res.id);
            const hasBreach = resAlarms.some((a) => a.state === 'ALARM');

            return (
              <div
                key={res.id}
                onClick={() => {
                  onSelectResourceForMetrics(res.id);
                  onNavigateTab('metrics');
                }}
                className={`p-4 rounded-xl border transition cursor-pointer group flex flex-col justify-between ${
                  hasBreach
                    ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 hover:border-amber-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-mono">
                      {res.type}
                    </span>
                    <AlarmStatusBadge state={hasBreach ? 'ALARM' : 'OK'} size="sm" />
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2 group-hover:text-amber-500 transition">
                    {res.name}
                  </h4>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {res.region}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">CPU LOAD</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {latestCpu}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans uppercase truncate">
                      {keyMetricLabel}
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {keyMetricValue}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= RESET CONFIRMATION MODAL ================= */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scaleIn text-xs">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reset Simulation Telemetry?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Restores clean baseline metrics & initial state
                </p>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed my-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              This will clear all custom chaos spikes, restore historical time-series datapoints to a clean 60-minute baseline, and reset alarm evaluation states back to initial defaults.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
