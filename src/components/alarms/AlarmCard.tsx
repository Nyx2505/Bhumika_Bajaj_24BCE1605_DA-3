import React from 'react';
import { Alarm } from '../../types/cloudwatch';
import { AlarmStatusBadge } from './AlarmStatusBadge';
import { getOperatorSymbol } from '../../engine/alarmEvaluator';
import { Bell, Trash2, ChevronRight, Activity, Clock, ShieldAlert } from 'lucide-react';

interface AlarmCardProps {
  alarm: Alarm;
  isSelected?: boolean;
  onSelect?: (alarm: Alarm) => void;
  onDelete?: (alarmId: string) => void;
  onTriggerTestDatapoint?: (alarm: Alarm, value: number) => void;
}

export const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  isSelected = false,
  onSelect,
  onDelete,
  onTriggerTestDatapoint
}) => {
  const operatorSymbol = getOperatorSymbol(alarm.comparisonOperator);

  return (
    <div
      onClick={() => onSelect?.(alarm)}
      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
          : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
      }`}
    >
      <div>
        {/* Header row: Status badge + Resource tag + Delete */}
        <div className="flex items-center justify-between gap-2">
          <AlarmStatusBadge state={alarm.state} size="sm" />
          <div className="flex items-center space-x-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {alarm.resourceId}
            </span>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(alarm.id);
                }}
                className="p-1 text-slate-400 hover:text-rose-500 transition rounded"
                title="Delete Alarm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Alarm Name & Description */}
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2 flex items-center">
          <Bell className="w-3.5 h-3.5 mr-1.5 text-amber-500 shrink-0" />
          <span className="truncate">{alarm.name}</span>
        </h3>
        {alarm.description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {alarm.description}
          </p>
        )}

        {/* Condition Box */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="font-medium text-[11px]">Condition:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {alarm.metricName} {operatorSymbol} {alarm.threshold}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <span>Evaluation:</span>
            <span className="font-mono">
              {alarm.datapointsToAlarm || alarm.evaluationPeriods} of {alarm.evaluationPeriods} periods
            </span>
          </div>
        </div>

        {/* Recent Evaluation Buffer preview */}
        {alarm.evaluationBuffer && alarm.evaluationBuffer.length > 0 && (
          <div className="mt-2.5 flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Buffer:</span>
            <div className="flex items-center space-x-1">
              {alarm.evaluationBuffer.map((val, idx) => {
                const isBreach =
                  (alarm.comparisonOperator.includes('GreaterThan') && val >= alarm.threshold) ||
                  (alarm.comparisonOperator.includes('LessThan') && val <= alarm.threshold);
                return (
                  <span
                    key={idx}
                    className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                      isBreach
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {val}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Quick Trigger */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 text-[10px] flex items-center font-mono">
          <Clock className="w-3 h-3 mr-1" />
          {new Date(alarm.stateUpdatedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {onTriggerTestDatapoint && (
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTriggerTestDatapoint(alarm, alarm.threshold + 15);
              }}
              className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-[10px] transition"
              title="Feed breaching datapoint"
            >
              +Breach
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTriggerTestDatapoint(alarm, Math.max(1, alarm.threshold - 15));
              }}
              className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] transition"
              title="Feed healthy datapoint"
            >
              +Normal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
