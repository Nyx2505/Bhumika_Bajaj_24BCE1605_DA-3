import React, { useState } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
import { SimulationControls } from './SimulationControls';
import { EventTimeline } from './EventTimeline';
import { MetricCard } from '../common/MetricCard';
import {
  Sliders,
  Radio,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Database,
  LayoutDashboard,
  Bell,
  FileText
} from 'lucide-react';

interface SimulatorControlPanelProps {
  onNavigateTab?: (tab: string, subView?: string) => void;
}

export const SimulatorControlPanel: React.FC<SimulatorControlPanelProps> = ({ onNavigateTab }) => {
  const {
    isSimulating,
    toggleSimulation,
    simSpeed,
    setSimSpeed,
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
    selectedResource?.supportedMetrics[0] || 'CPUUtilization'
  );
  const metricDef = METRIC_DEFINITIONS[selectedMetric];

  const [customValue, setCustomValue] = useState<number>(
    metricDef ? metricDef.defaultThreshold + 15 : 90
  );

  const handleManualInject = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedResource) {
      injectDatapoint(selectedResource.id, selectedMetric, customValue);
    }
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
            <span
              className={`px-2 py-0.5 text-[11px] font-bold rounded border ${
                activeIncident === 'NORMAL'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : activeIncident === 'RECOVERY'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
              }`}
            >
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
      </div>

      {/* Connected Architecture Workflow Pipeline Bar */}
      <div className="bg-white dark:bg-[#131921] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Connected CloudWatch Monitoring Progression
            </h3>
          </div>
          {onNavigateTab && (
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 mr-1">Quick Links:</span>
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer"
              >
                <LayoutDashboard className="w-3 h-3 text-amber-500" />
                Dashboard Charts
              </button>
              <button
                onClick={() => onNavigateTab('alarms')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer"
              >
                <Bell className="w-3 h-3 text-rose-500" />
                Alarms ({alarms.filter((a) => a.state === 'ALARM').length})
              </button>
              <button
                onClick={() => onNavigateTab('logs')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3 h-3 text-purple-500" />
                Logs
              </button>
            </div>
          )}
        </div>

        {/* 8-stage visual sequence */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
          {[
            { step: '1', label: 'Simulator Event', tab: 'simulator', desc: 'Click Spike/Recovery' },
            { step: '2', label: 'Metric Changes', tab: 'metrics', desc: 'Gradual stepping' },
            { step: '3', label: 'Charts Update', tab: 'dashboard', desc: 'Time-series graphs' },
            { step: '4', label: 'Evaluation', tab: 'learning', desc: 'M of N periods check' },
            { step: '5', label: 'State Changes', tab: 'alarms', desc: 'OK ➔ ALARM' },
            { step: '6', label: 'Logs Emitted', tab: 'logs', desc: 'Correlated streams' },
            { step: '7', label: 'Counters Sync', tab: 'dashboard', desc: 'Dashboard badges' },
            { step: '8', label: 'History Saved', tab: 'alarms', subView: 'history', desc: 'Audit transition' }
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => onNavigateTab?.(item.tab, item.subView)}
              className="p-2.5 rounded-xl border bg-slate-50 hover:bg-amber-500/10 dark:bg-slate-900/60 dark:hover:bg-amber-500/10 border-slate-200 hover:border-amber-500/50 dark:border-slate-800 dark:hover:border-amber-500/50 cursor-pointer transition text-left group"
            >
              <div className="flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                <span>{item.step}</span>
                <span className="opacity-0 group-hover:opacity-100 transition">↗</span>
              </div>
              <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                {item.label}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reusable Component: SimulationControls */}
      <SimulationControls
        isSimulating={isSimulating}
        simSpeed={simSpeed}
        activeIncident={activeIncident}
        onToggleSimulation={toggleSimulation}
        onSetSpeed={setSimSpeed}
        onTriggerIncident={triggerIncident}
        onReset={resetSimulation}
      />

      {/* Middle Row: Gradual Transition Monitor & Live Telemetry Grid */}
      <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <TrendingUp className="w-4 h-4 mr-1.5 text-sky-500" />
              Realistic Gradual Transition Progression (EC2-Web-01 CPU)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Physical step increments model realistic queue accumulation and thread saturation over time
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
            Current: {ec2Cpu}%
          </span>
        </div>

        {/* 6 Stage Stepper Meter */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
          {[
            { label: 'Baseline', val: 32, desc: 'Normal 32%' },
            { label: 'Step 1', val: 45, desc: 'Rising 45%' },
            { label: 'Step 2', val: 61, desc: 'Elevated 61%' },
            { label: 'Step 3', val: 74, desc: 'Surging 74%' },
            { label: 'Threshold', val: 83, desc: 'Breached 83%' },
            { label: 'Peak / Alarm', val: 91, desc: 'Alarm 91%' }
          ].map((stage, idx) => {
            const isReached = ec2Cpu >= stage.val;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition ${
                  isReached
                    ? stage.val >= 80
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-800 dark:text-rose-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-200'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-mono text-base font-black">{stage.val}%</div>
                <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5">{stage.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lower Row: Event Timeline & Telemetry Snapshots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Reusable EventTimeline */}
        <div className="lg:col-span-7">
          <EventTimeline
            events={timelineEvents}
            onClear={clearTimeline}
            onNavigateTab={onNavigateTab}
          />
        </div>

        {/* Right Column: Reusable MetricCards & Manual Injector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <Cpu className="w-4 h-4 mr-1.5 text-amber-500" />
              Live Telemetry Snapshots
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MetricCard
                title="EC2 CPU Utilization"
                value={ec2Cpu}
                unit="Percent"
                threshold={80}
                resourceName="EC2-Web-01"
                status={ec2Cpu >= 80 ? 'breached' : 'healthy'}
                onClick={() => onNavigateTab?.('dashboard')}
              />

              <MetricCard
                title="EC2 Request Count"
                value={ec2Req}
                unit="req/s"
                resourceName="EC2-Web-01"
                subtitle={`Net: ${ec2NetIn} MB In / ${ec2NetOut} MB Out`}
                onClick={() => onNavigateTab?.('dashboard')}
              />

              <MetricCard
                title="App Error Rate"
                value={appErrRate}
                unit="Percent"
                threshold={5.0}
                resourceName="Application-01"
                status={appErrRate >= 5.0 ? 'breached' : 'healthy'}
                subtitle={`Error Count: ${appErrCount}`}
                onClick={() => onNavigateTab?.('metrics')}
              />

              <MetricCard
                title="DB Connections"
                value={dbConns}
                unit="conns"
                threshold={80}
                resourceName="Database-01"
                status={dbConns > 80 ? 'breached' : 'healthy'}
                subtitle={`Latency: ${dbLat}ms`}
                onClick={() => onNavigateTab?.('dashboard')}
              />
            </div>
          </div>

          {/* Manual Telemetry Injection */}
          <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center mb-3">
              <Radio className="w-4 h-4 mr-1.5 text-purple-500" />
              Manual Point Injector
            </h3>

            <form onSubmit={handleManualInject} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Resource:</label>
                  <select
                    value={selectedResId}
                    onChange={(e) => setSelectedResId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  >
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Metric:</label>
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  >
                    {selectedResource?.supportedMetrics.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => setCustomValue(Number(e.target.value))}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition cursor-pointer"
                >
                  Inject Point
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
