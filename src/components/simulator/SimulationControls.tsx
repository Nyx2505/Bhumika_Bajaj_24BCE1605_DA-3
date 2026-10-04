import React from 'react';
import { SimulatorIncidentType } from '../../types/cloudwatch';
import { Play, Pause, Zap, Flame, CheckCircle, RotateCcw, Activity } from 'lucide-react';

interface SimulationControlsProps {
  isSimulating: boolean;
  simSpeed: number;
  activeIncident: SimulatorIncidentType;
  onToggleSimulation: () => void;
  onSetSpeed: (speed: number) => void;
  onTriggerIncident: (incident: SimulatorIncidentType) => void;
  onReset?: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isSimulating,
  simSpeed,
  activeIncident,
  onToggleSimulation,
  onSetSpeed,
  onTriggerIncident,
  onReset
}) => {
  return (
    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Top Header & Simulation Clock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Simulation Incident Controls
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select an action to inject gradual physical telemetry transitions into the environment
            </p>
          </div>
        </div>

        {/* Play/Pause & Speed Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center shadow-xs cursor-pointer ${
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
                onClick={() => onSetSpeed(speed)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition cursor-pointer ${
                  simSpeed === speed
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {onReset && (
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
              title="Reset simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 7 Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Normal Operation */}
        <button
          onClick={() => onTriggerIncident('NORMAL')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeIncident === 'NORMAL'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/50 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              1. Normal Operation
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Steady baseline workload. Metrics stay within safe normal bounds.
          </p>
        </button>

        {/* 2. CPU Spike */}
        <button
          onClick={() => onTriggerIncident('CPU_SPIKE')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeIncident === 'CPU_SPIKE'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/50 shadow-xs animate-pulse'
              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              2. CPU Spike
            </span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            EC2-Web-01 CPU steps up gradually: 32% → 45% → 61% → 74% → 83% → 91%.
          </p>
        </button>

        {/* 3. Traffic Spike */}
        <button
          onClick={() => onTriggerIncident('TRAFFIC_SPIKE')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeIncident === 'TRAFFIC_SPIKE'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/50 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              3. Traffic Spike
            </span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            HTTP surges: RequestCount, Network throughput, and CPU increase.
          </p>
        </button>

        {/* 4. Error Spike */}
        <button
          onClick={() => onTriggerIncident('ERROR_SPIKE')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeIncident === 'ERROR_SPIKE'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/50 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              4. Error Spike
            </span>
            <span className="text-[10px] font-mono font-bold text-purple-500">5XX</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Backend microservice crash: ErrorCount and ErrorRate escalate.
          </p>
        </button>

        {/* 5. Database Load */}
        <button
          onClick={() => onTriggerIncident('DATABASE_LOAD')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeIncident === 'DATABASE_LOAD'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/50 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              5. Database Load
            </span>
            <span className="text-[10px] font-mono font-bold text-blue-500">DB</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            SQL saturation: DatabaseConnections, Latency, and DB CPU surge.
          </p>
        </button>

        {/* 6. Recovery */}
        <button
          onClick={() => onTriggerIncident('RECOVERY')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
            activeIncident === 'RECOVERY'
              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/50 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-teal-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              6. Recovery
            </span>
            <CheckCircle className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Cool-down mode: Sheds workload, metrics step down gradually to normal.
          </p>
        </button>

        {/* 7. Reset Environment */}
        {onReset && (
          <button
            onClick={onReset}
            className="p-3 rounded-xl border text-left transition flex flex-col justify-between bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-400 cursor-pointer col-span-1 sm:col-span-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                7. Reset Environment
              </span>
              <RotateCcw className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Restores initial 60-min history, clears timeline, and resets alarms.
            </p>
          </button>
        )}
      </div>
    </div>
  );
};
