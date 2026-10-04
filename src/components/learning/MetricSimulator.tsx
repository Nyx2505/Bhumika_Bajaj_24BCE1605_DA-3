import React from 'react';
import { SimulatedPeriodValue } from '../../engine/learningEngine';
import { Activity, Flame, RotateCcw, Zap } from 'lucide-react';

interface MetricSimulatorProps {
  values: SimulatedPeriodValue[];
  onChangeValues: (values: SimulatedPeriodValue[]) => void;
  threshold: number;
  unit?: string;
  onSimulateNormal?: () => void;
  onSimulateSpike?: () => void;
  onReset?: () => void;
}

export const MetricSimulator: React.FC<MetricSimulatorProps> = ({
  values,
  onChangeValues,
  threshold,
  unit = '%',
  onSimulateNormal,
  onSimulateSpike,
  onReset
}) => {
  const handlePeriodChange = (id: number, val: number) => {
    onChangeValues(
      values.map((p) => (p.id === id ? { ...p, value: Math.max(0, val) } : p))
    );
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-sky-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Metric Values Simulator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inject time-series values across 5 periods or trigger preset scenarios
            </p>
          </div>
        </div>

        {/* Action Preset Buttons */}
        <div className="flex items-center space-x-2">
          {onSimulateNormal && (
            <button
              onClick={onSimulateNormal}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              Normal
            </button>
          )}

          {onSimulateSpike && (
            <button
              onClick={onSimulateSpike}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Spike
            </button>
          )}

          {onReset && (
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
              title="Reset values"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 5 Period Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-5">
        {values.map((p) => {
          const isBreach = p.value >= threshold;
          return (
            <div
              key={p.id}
              className={`p-3 rounded-xl border text-center transition ${
                isBreach
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                Period {p.id}
              </span>

              {/* Value display */}
              <div
                className={`text-2xl font-black font-mono my-1 ${
                  isBreach ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}
              >
                {p.value}
                <span className="text-xs font-normal text-slate-400 ml-0.5">{unit}</span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={0}
                max={120}
                value={p.value}
                onChange={(e) => handlePeriodChange(p.id, Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer mt-1"
              />

              {/* Breach status tag */}
              <span
                className={`text-[9px] font-mono font-bold uppercase tracking-wider block mt-1 ${
                  isBreach ? 'text-rose-500' : 'text-emerald-500'
                }`}
              >
                {isBreach ? 'Breaching' : 'Safe'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
