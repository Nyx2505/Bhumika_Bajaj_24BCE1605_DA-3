import React from 'react';
import { SimulationEvent } from '../../types/cloudwatch';
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface EventTimelineProps {
  events: SimulationEvent[];
  onClear?: () => void;
  onNavigateTab?: (tab: string, subView?: string) => void;
  maxHeight?: string;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  onClear,
  onNavigateTab,
  maxHeight = '500px'
}) => {
  return (
    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Simulation Event Timeline
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-mono">
            {events.length} events
          </span>
          {onClear && events.length > 0 && (
            <button
              onClick={onClear}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stream List */}
      <div style={{ maxHeight }} className="overflow-y-auto space-y-4 pr-1">
        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs italic">
            No timeline events recorded yet. Trigger a simulator action above.
          </div>
        ) : (
          events.map((evt, idx) => {
            let badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            let dotColor = 'bg-slate-400';

            if (evt.severity === 'ok') {
              badgeClass =
                'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
              dotColor = 'bg-emerald-500 ring-4 ring-emerald-500/20';
            } else if (evt.severity === 'warn') {
              badgeClass =
                'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
              dotColor = 'bg-amber-500 ring-4 ring-amber-500/20';
            } else if (evt.severity === 'alarm') {
              badgeClass =
                'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
              dotColor = 'bg-rose-500 ring-4 ring-rose-500/20 animate-pulse';
            }

            return (
              <div key={evt.id || idx} className="relative flex items-start space-x-3.5 group">
                {/* Vertical line connecting nodes */}
                {idx !== events.length - 1 && (
                  <div className="absolute left-[13px] top-6 bottom-[-16px] w-[2px] bg-slate-200 dark:bg-slate-800" />
                )}

                {/* Node Circle */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${dotColor}`}>
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>

                {/* Timeline Content Card */}
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

                  {/* Contextual navigation actions */}
                  {onNavigateTab && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2 flex-wrap">
                      {evt.type === 'ALARM_TRANSITION' && (
                        <>
                          <button
                            onClick={() => onNavigateTab('alarms', 'history')}
                            className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            View Alarm History →
                          </button>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <button
                            onClick={() => onNavigateTab('logs')}
                            className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            View Ingested Logs →
                          </button>
                        </>
                      )}

                      {evt.type === 'THRESHOLD_BREACHED' && (
                        <>
                          <button
                            onClick={() => onNavigateTab('dashboard')}
                            className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            View Dashboard Charts →
                          </button>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <button
                            onClick={() => onNavigateTab('metrics')}
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            Inspect Metric History →
                          </button>
                        </>
                      )}

                      {(evt.type === 'INCIDENT_TRIGGERED' || evt.type === 'NORMAL' || evt.type === 'RECOVERY_TRIGGERED') && (
                        <button
                          onClick={() => onNavigateTab('dashboard')}
                          className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Observe Live Charts →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
