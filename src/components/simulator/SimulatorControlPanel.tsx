import React, { useState, useMemo } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
import { SimulatorIncidentType } from '../../types/cloudwatch';
import {
  Sliders,
  Play,
  Pause,
  Zap,
  RotateCcw,
  Activity,
  Flame,
  CheckCircle,
  Radio,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Database,
  AlertTriangle,
  HeartPulse,
  Clock,
  Sparkles,
  Server,
  ArrowDownRight,
  ShieldCheck,
  RefreshCw,
  Bell
} from 'lucide-react';

export const SimulatorControlPanel: React.FC = () => {
  const {
    isSimulating,
    toggleSimulation,
    simSpeed,
    setSimSpeed,
    activeChaos,
    activeIncident,
    triggerIncident,
    timelineEvents,
    clearTimeline,
    resetSimulation,
    resources,
    metricHistory,
    alarms,
    injectDatapoint
  } = useCloudWatch();

  // Custom manual injector state
  const [selectedResId, setSelectedResId] = useState<string>(resources[0]?.id || 'EC2-Web-01');
  const selectedResource = resources.find((r) => r.id === selectedResId) || resources[0];

  const [selectedMetric, setSelectedMetric] = useState<string>(
    selectedResource.supportedMetrics[0] || 'CPUUtilization'
  );
  const metricDef = METRIC_DEFINITIONS[selectedMetric];

  const [customValue, setCustomValue] = useState<number>(
    metricDef ? metricDef.defaultThreshold + 15 : 90
  );

  const handleManualInject = (e: React.FormEvent) => {
    e.preventDefault();
    injectDatapoint(selectedResource.id, selectedMetric, customValue);
  };

  // Helper to extract the most recent metric value
  const getLatestMetric = (resId: string, metric: string): number => {
    const points = metricHistory[`${resId}:${metric}`];
    if (!points || points.length === 0) return 0;
    return points[points.length - 1].value;
  };

  // Live values of key affected metrics
  const ec2Cpu = getLatestMetric('EC2-Web-01', 'CPUUtilization');
  const ec2Req = getLatestMetric('EC2-Web-01', 'RequestCount');
  const ec2NetIn = getLatestMetric('EC2-Web-01', 'NetworkIn');
  const ec2NetOut = getLatestMetric('EC2-Web-01', 'NetworkOut');
  const appReq = getLatestMetric('Application-Server-01', 'RequestCount');
  const appErrRate = getLatestMetric('Application-Server-01', 'ErrorRate');
  const appErrCount = getLatestMetric('Application-Server-01', 'ErrorCount');
  const dbCpu = getLatestMetric('Database-01', 'CPUUtilization');
  const dbConns = getLatestMetric('Database-01', 'DatabaseConnections');
  const dbLat = getLatestMetric('Database-01', 'Latency');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              CloudWatch Environment Simulator
            </h1>
            <span className={`px-2 py-0.5 text-[11px] font-bold rounded border ${
              activeIncident === 'NORMAL'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : activeIncident === 'RECOVERY'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
            }`}>
              {activeIncident === 'NORMAL' && 'Mode: Normal Operation'}
              {activeIncident === 'CPU_SPIKE' && 'Incident: CPU Spike Active'}
              {activeIncident === 'TRAFFIC_SPIKE' && 'Incident: Traffic Spike Active'}
              {activeIncident === 'ERROR_SPIKE' && 'Incident: Error Spike Active'}
              {activeIncident === 'DATABASE_LOAD' && 'Incident: Database Load Active'}
              {activeIncident === 'RECOVERY' && 'Mode: Recovery in Progress'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Intentionally generate operational events in the simulated AWS environment, test multi-metric correlation, and observe gradual transitions
          </p>
        </div>

        {/* Engine Controls Bar */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={toggleSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center shadow-xs ${
              isSimulating
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-black'
            }`}
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-1" /> Simulating
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1" /> Paused
              </>
            )}
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[10px] text-slate-400 px-1 font-mono uppercase">Speed:</span>
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition ${
                  simSpeed === speed
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Simulator Control Panel: 7 Required Actions */}
      <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <Zap className="w-4 h-4 mr-1.5 text-amber-500" />
              Simulated AWS Environment Event Controls
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Select an action below to inject realistic events. Metrics transition gradually over time without sudden unrealistic jumps.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            7 Simulator Actions
          </span>
        </div>

        {/* 7 Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Normal Operation */}
          <button
            onClick={() => triggerIncident('NORMAL')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              activeIncident === 'NORMAL'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/50 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  1. Normal Operation
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Standard Baseline
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Maintains steady normal operation across all resources and clears active chaos.
            </p>
          </button>

          {/* 2. CPU Spike */}
          <button
            onClick={() => triggerIncident('CPU_SPIKE')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              activeIncident === 'CPU_SPIKE'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/50 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  2. CPU Spike
                </span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                  EC2-Web-01 (45% → 91%)
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Gradually escalates CPU load: 32% → 45% → 61% → 74% → 83% → 91% until alarm triggers.
            </p>
          </button>

          {/* 3. Traffic Spike */}
          <button
            onClick={() => triggerIncident('TRAFFIC_SPIKE')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              activeIncident === 'TRAFFIC_SPIKE'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/50 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  3. Traffic Spike
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  Requests + Network + CPU
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Surges incoming HTTP requests, inbound/outbound network traffic, and CPU load together.
            </p>
          </button>

          {/* 4. Error Spike */}
          <button
            onClick={() => triggerIncident('ERROR_SPIKE')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              activeIncident === 'ERROR_SPIKE'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/50 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  4. Error Spike
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                  Application Error Rate
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Simulates microservice backend failures: increases Error Count and Error Rate past 5%.
            </p>
          </button>

          {/* 5. Database Load */}
          <button
            onClick={() => triggerIncident('DATABASE_LOAD')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              activeIncident === 'DATABASE_LOAD'
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/50 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-sky-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  5. Database Load
                </span>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                  CPU + Conns + Latency
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Saturates database connection pool (&gt;80) and drives query latency and CPU utilization.
            </p>
          </button>

          {/* 6. Recovery */}
          <button
            onClick={() => triggerIncident('RECOVERY')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              activeIncident === 'RECOVERY'
                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/50 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-teal-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  6. Recovery
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                  Gradual Metric Descent
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Sheds workload and gradually returns all metrics toward normal ranges until alarms resolve.
            </p>
          </button>

          {/* 7. Reset Environment */}
          <button
            onClick={resetSimulation}
            className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-400 text-left transition flex flex-col justify-between lg:col-span-2"
          >
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  7. Reset Environment
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  Restore Clean Baseline
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Wipes all incident overrides, resets telemetry history, restores initial alarms, and clears timeline.
            </p>
          </button>
        </div>
      </div>

      {/* Realistic Transition Demonstration Card */}
      <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Realistic Gradual Metric Transition Engine
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Demonstrates continuous step progression across evaluation periods without instantaneous 30% → 95% jumps
            </p>
          </div>
          <div className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            EC2-Web-01 CPU: <span className="text-amber-600 dark:text-amber-400">{ec2Cpu}%</span>
          </div>
        </div>

        {/* Stepped Transition Visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
            <span>Baseline (32%)</span>
            <span>Threshold (80%)</span>
            <span>Target Breach (91%+)</span>
          </div>

          <div className="grid grid-cols-6 gap-2 text-center text-xs font-mono">
            {[
              { val: 32, label: '32%', desc: 'Normal Base' },
              { val: 45, label: '45%', desc: 'Step 1' },
              { val: 61, label: '61%', desc: 'Step 2' },
              { val: 74, label: '74%', desc: 'Approaching' },
              { val: 83, label: '83%', desc: 'Breached (1/3)' },
              { val: 91, label: '91%', desc: 'ALARM (3/3)' }
            ].map((step, idx) => {
              const isPassed = ec2Cpu >= step.val;
              const isCurrent = Math.abs(ec2Cpu - step.val) <= 6;
              const isBreach = step.val >= 80;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border transition ${
                    isCurrent
                      ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500 shadow-xs'
                      : isPassed
                      ? isBreach
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-sm font-bold">{step.label}</div>
                  <div className="text-[10px] mt-0.5 truncate">{step.desc}</div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
            <strong>Observation Guide:</strong> Trigger <strong>CPU Spike</strong> and watch the values advance sequentially (e.g. 45% → 61% → 74% → 83% → 91%). Once 80% is breached across 3 consecutive periods, the alarm fires. Then trigger <strong>Recovery</strong> and observe the metric gradually descend back below 80% until the alarm transitions back to OK.
          </div>
        </div>
      </div>

      {/* Main Bottom Grid: Live Affected Metrics + Event Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Affected Telemetry Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-sky-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Live Affected Telemetry
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Updates live</span>
            </div>

            <div className="space-y-3">
              {/* EC2 CPU */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    EC2-Web-01 CPU Utilization
                  </span>
                  <span className={`text-xs font-mono font-bold ${
                    ec2Cpu > 80 ? 'text-rose-500' : ec2Cpu > 65 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {ec2Cpu}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      ec2Cpu > 80 ? 'bg-rose-500' : ec2Cpu > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, ec2Cpu)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>Threshold: 80%</span>
                  <span>{ec2Cpu > 80 ? 'BREACHING' : 'HEALTHY'}</span>
                </div>
              </div>

              {/* EC2 Request Count */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    EC2-Web-01 Request Count
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                    {ec2Req} req/min
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between font-mono">
                  <span>Network In: {ec2NetIn} MB</span>
                  <span>Network Out: {ec2NetOut} MB</span>
                </div>
              </div>

              {/* App Error Rate */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Application-Server-01 Error Rate
                  </span>
                  <span className={`text-xs font-mono font-bold ${
                    appErrRate > 5 ? 'text-purple-500' : 'text-slate-600 dark:text-slate-300'
                  }`}>
                    {appErrRate}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between font-mono">
                  <span>Total Errors: {appErrCount}</span>
                  <span>Threshold: 5.0%</span>
                </div>
              </div>

              {/* Database Connections & Latency */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Database-01 Connections
                  </span>
                  <span className={`text-xs font-mono font-bold ${
                    dbConns > 80 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'
                  }`}>
                    {dbConns} / 100
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between font-mono">
                  <span>Latency: {dbLat} ms</span>
                  <span>DB CPU: {dbCpu}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Manual Injector */}
          <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Manual Datapoint Injection
            </h4>
            <form onSubmit={handleManualInject} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <select
                value={selectedResId}
                onChange={(e) => {
                  setSelectedResId(e.target.value);
                  const res = resources.find((r) => r.id === e.target.value);
                  if (res) setSelectedMetric(res.supportedMetrics[0]);
                }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>{r.id}</option>
                ))}
              </select>

              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
              >
                {selectedResource.supportedMetrics.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => setCustomValue(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  placeholder="Value"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg transition"
                >
                  Inject
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Event Timeline */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Event Timeline
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  {timelineEvents.length} events
                </span>
                {timelineEvents.length > 0 && (
                  <button
                    onClick={clearTimeline}
                    className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="max-h-[500px] overflow-y-auto space-y-4 pr-1">
              {timelineEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  No timeline events recorded yet. Click one of the simulator action buttons above to generate events.
                </div>
              ) : (
                timelineEvents.map((evt, idx) => {
                  let badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  let dotColor = 'bg-slate-400';

                  if (evt.severity === 'ok') {
                    badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
                    dotColor = 'bg-emerald-500 ring-4 ring-emerald-500/20';
                  } else if (evt.severity === 'warn') {
                    badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
                    dotColor = 'bg-amber-500 ring-4 ring-amber-500/20';
                  } else if (evt.severity === 'alarm') {
                    badgeClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
                    dotColor = 'bg-rose-500 ring-4 ring-rose-500/20 animate-pulse';
                  }

                  return (
                    <div key={evt.id || idx} className="relative flex items-start space-x-3.5 group">
                      {/* Vertical line connecting nodes */}
                      {idx !== timelineEvents.length - 1 && (
                        <div className="absolute left-[13px] top-6 bottom-[-16px] w-[2px] bg-slate-200 dark:bg-slate-800" />
                      )}

                      {/* Node Circle */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${dotColor}`}>
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>

                      {/* Timeline Content */}
                      <div className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 transition hover:border-slate-300 dark:hover:border-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                            {evt.time}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                            {evt.type.replace('_', ' ')}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                          {evt.title}
                        </h4>

                        {evt.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {evt.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
