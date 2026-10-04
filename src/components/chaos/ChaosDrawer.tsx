import React from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { PRESET_CHAOS_SCENARIOS } from '../../engine/metricGenerator';
import { Zap, X, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

interface ChaosDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChaosDrawer: React.FC<ChaosDrawerProps> = ({ isOpen, onClose }) => {
  const { activeChaos, triggerChaos, stopChaos, resetAllChaos } = useCloudWatch();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-[#131921] border-l border-slate-700 h-full p-6 flex flex-col shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Incident & Chaos Injection</h2>
              <p className="text-xs text-slate-400">Simulate real-world operational incidents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200">
          <p className="font-semibold mb-1 flex items-center">
            <Flame className="w-3.5 h-3.5 mr-1 text-amber-400" />
            How this works:
          </p>
          Injecting a chaos scenario forces telemetry values above normal operating ranges.
          Watch the metrics climb, the evaluation engine trigger, the alarm transition to
          <span className="text-red-400 font-bold ml-1">ALARM</span>, and correlated error logs appear automatically!
        </div>

        <div className="space-y-4 flex-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Available Scenarios ({PRESET_CHAOS_SCENARIOS.length})
          </h3>

          {PRESET_CHAOS_SCENARIOS.map((scenario) => {
            const isActive = activeChaos.some((c) => c.id === scenario.id);

            return (
              <div
                key={scenario.id}
                className={`p-4 rounded-xl border transition ${
                  isActive
                    ? 'bg-red-950/30 border-red-500/60 ring-1 ring-red-500'
                    : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center">
                      {scenario.name}
                      {isActive && (
                        <span className="ml-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
                          Active Anomaly
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {scenario.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="text-slate-400 font-mono text-[11px]">
                    Target: <span className="text-amber-400">{scenario.resourceId}</span> / {scenario.metricTarget}
                  </div>

                  {isActive ? (
                    <button
                      onClick={() => stopChaos(scenario.id)}
                      className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition text-xs"
                    >
                      Stop Incident
                    </button>
                  ) : (
                    <button
                      onClick={() => triggerChaos(scenario.id)}
                      className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-black font-bold transition text-xs flex items-center"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1" />
                      Inject Spike
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {activeChaos.length > 0 && (
          <div className="pt-4 border-t border-slate-800 mt-4">
            <button
              onClick={resetAllChaos}
              className="w-full py-2 px-4 rounded-lg bg-emerald-600/20 border border-emerald-500/50 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center justify-center transition"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Restore All Resources to Normal Health
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
