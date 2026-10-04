import React, { useState } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { PRESET_CHAOS_SCENARIOS } from '../../engine/metricGenerator';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
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
  Layers
} from 'lucide-react';

export const SimulatorControlPanel: React.FC = () => {
  const {
    isSimulating,
    toggleSimulation,
    simSpeed,
    setSimSpeed,
    activeChaos,
    triggerChaos,
    stopChaos,
    resetAllChaos,
    resources,
    injectDatapoint,
    pipelineAuditLogs
  } = useCloudWatch();

  // Custom manual injector state
  const [selectedResId, setSelectedResId] = useState<string>(resources[0]?.id || '');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <Sliders className="w-5 h-5 text-amber-500 mr-2" />
            Telemetry Engine & Incident Simulation Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Control metric generation rates, inject operational incidents, and observe end-to-end pipeline propagation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeChaos.length > 0 && (
            <button
              onClick={resetAllChaos}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/20 transition flex items-center"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Reset All to Normal
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Controls + Manual Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Engine Master Controls */}
        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Simulation Engine State
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Tick interval & time dilation
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Engine State
              </span>
              <button
                onClick={toggleSimulation}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                  isSimulating
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-amber-500 text-black shadow-xs'
                }`}
              >
                {isSimulating ? (
                  <>
                    <Pause className="w-3 h-3 mr-1" /> Running
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1" /> Paused
                  </>
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Simulation Speed
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {simSpeed}x Speed
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setSimSpeed(speed)}
                    className={`py-1.5 rounded-lg text-xs font-bold font-mono transition border ${
                      simSpeed === speed
                        ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-black border-transparent'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>Telemetry Cycle:</strong> Generates time-series points every{' '}
              <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                {Math.round(3000 / simSpeed) / 1000}s
              </span>
              , feeds into the sliding evaluation window, checks thresholds, and emits CloudWatch
              audit events.
            </div>
          </div>
        </div>

        {/* Card 2: Chaos Incident Studio */}
        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Operational Incident Injection
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Trigger multi-service outages and observe CloudWatch alarm reactions
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              {activeChaos.length} Active Incidents
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESET_CHAOS_SCENARIOS.map((scenario) => {
              const isActive = activeChaos.some((c) => c.id === scenario.id);

              return (
                <div
                  key={scenario.id}
                  className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                    isActive
                      ? 'bg-rose-500/10 border-rose-500 ring-1 ring-rose-500/50'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {scenario.resourceId}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {scenario.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {scenario.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                      {scenario.multiplier}x Multiplier
                    </span>
                    {isActive ? (
                      <button
                        onClick={() => stopChaos(scenario.id)}
                        className="px-2.5 py-1 rounded text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerChaos(scenario.id)}
                        className="px-2.5 py-1 rounded text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Inject
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Instant Datapoint Injector */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Custom Metric Injection Studio
            </h3>
            <form
              onSubmit={handleManualInject}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs"
            >
              <select
                value={selectedResId}
                onChange={(e) => {
                  setSelectedResId(e.target.value);
                  const res = resources.find((r) => r.id === e.target.value);
                  if (res) setSelectedMetric(res.supportedMetrics[0]);
                }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
              >
                {selectedResource.supportedMetrics.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
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
                <span className="text-[10px] text-slate-400 font-mono">
                  {metricDef?.unit === 'Percent' ? '%' : ''}
                </span>
              </div>

              <button
                type="submit"
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg transition"
              >
                Inject Datapoint
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Live Pipeline Audit Log */}
      <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              End-to-End Pipeline Telemetry Trace Log
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {pipelineAuditLogs.length} events captured
          </span>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1.5 font-mono text-xs">
          {pipelineAuditLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic">
              No recent alarm state changes yet. Adjust thresholds or inject chaos to observe transitions.
            </div>
          ) : (
            pipelineAuditLogs.map((audit) => (
              <div
                key={audit.id}
                className={`p-2.5 rounded-lg border flex items-center justify-between text-[11px] ${
                  audit.severity === 'alarm'
                    ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-slate-400 text-[10px]">
                    {new Date(audit.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    {audit.stage}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {audit.resourceId}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="truncate">{audit.details}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
