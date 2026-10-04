import React from 'react';
import { Resource } from '../../types/cloudwatch';
import { Server, Database, Layers, Activity, AlertTriangle, CheckCircle2, ShieldAlert, Terminal } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onSelectMetrics?: (resourceId: string) => void;
  onToggleHealth?: (resourceId: string) => void;
  onViewLogs?: (resourceId: string) => void;
  activeAlarmsCount?: number;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onSelectMetrics,
  onToggleHealth,
  onViewLogs,
  activeAlarmsCount = 0
}) => {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'EC2':
        return <Server className="w-5 h-5 text-amber-500" />;
      case 'Database':
      case 'RDS':
        return <Database className="w-5 h-5 text-blue-500" />;
      default:
        return <Layers className="w-5 h-5 text-purple-500" />;
    }
  };

  const isDegraded = resource.status === 'degraded';
  const isRunning = resource.status === 'running';

  return (
    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between">
      <div>
        {/* Top Header: Icon + Name + Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
              {getResourceIcon(resource.type)}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {resource.name}
              </h3>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {resource.type} • {resource.region}
              </div>
            </div>
          </div>

          {/* Health Status Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider inline-flex items-center ${
              isRunning
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
            }`}
          >
            {isRunning ? (
              <CheckCircle2 className="w-3 h-3 mr-1" />
            ) : (
              <AlertTriangle className="w-3 h-3 mr-1" />
            )}
            {resource.status}
          </span>
        </div>

        {/* IP or Endpoint */}
        {resource.ipOrEndpoint && (
          <div className="mt-3.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span className="text-slate-400 text-[10px] uppercase">Endpoint:</span>
            <span className="truncate">{resource.ipOrEndpoint}</span>
          </div>
        )}

        {/* Supported Metrics Tags */}
        <div className="mt-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            CloudWatch Metrics ({resource.supportedMetrics.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {resource.supportedMetrics.map((metric) => (
              <span
                key={metric}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {metric}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          {activeAlarmsCount > 0 ? (
            <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-1 border border-rose-300 dark:border-rose-800 animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              {activeAlarmsCount} Active Alarm{activeAlarmsCount > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">Alarms: Clean</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onToggleHealth && (
            <button
              onClick={() => onToggleHealth(resource.id)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                isDegraded
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}
            >
              {isDegraded ? 'Restore Health' : 'Degrade'}
            </button>
          )}

          {onViewLogs && (
            <button
              onClick={() => onViewLogs(resource.id)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition flex items-center gap-1 text-[11px] font-medium"
              title="View Resource Logs"
            >
              <Terminal className="w-3 h-3 text-slate-400" />
              Logs
            </button>
          )}

          {onSelectMetrics && (
            <button
              onClick={() => onSelectMetrics(resource.id)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer"
            >
              <Activity className="w-3 h-3" />
              Metrics
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
