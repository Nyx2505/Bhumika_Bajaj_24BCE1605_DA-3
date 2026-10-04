import React, { useState } from 'react';
import { LogEvent, LogLevel } from '../../types/cloudwatch';
import { Terminal, Copy, Check, AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';

interface LogTableProps {
  logs: LogEvent[];
  maxHeight?: string;
  searchQuery?: string;
}

export const LogTable: React.FC<LogTableProps> = ({
  logs,
  maxHeight = '480px',
  searchQuery = ''
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'ERROR':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/15 text-rose-500 border border-rose-500/30">
            <AlertCircle className="w-2.5 h-2.5 mr-1" />
            ERROR
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
            WARN
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-500/15 text-sky-500 border border-sky-500/30">
            <Info className="w-2.5 h-2.5 mr-1" />
            INFO
          </span>
        );
    }
  };

  return (
    <div
      style={{ maxHeight }}
      className="overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300 rounded-xl border border-slate-800 shadow-inner"
    >
      <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 font-bold z-10">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-amber-500" />
          <span>CloudWatch Log Events Terminal Stream</span>
        </div>
        <span>{logs.length} entries</span>
      </div>

      <div className="divide-y divide-slate-800/60 p-1">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs italic">
            No log events matching current filters.
          </div>
        ) : (
          logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            const isSpikeOrTransition =
              log.message.includes('[CloudWatch:AlarmTransition]') ||
              log.message.includes('Approaching threshold') ||
              log.message.includes('Request timeout');

            return (
              <div
                key={log.id}
                className={`p-2.5 hover:bg-slate-900/80 transition flex items-start space-x-3 group ${
                  isSpikeOrTransition ? 'bg-amber-500/5' : ''
                }`}
              >
                {/* Timestamp */}
                <span className="text-[11px] text-slate-500 shrink-0 select-none pt-0.5">
                  {timeStr}
                </span>

                {/* Level Badge */}
                <div className="shrink-0">{getLevelBadge(log.level)}</div>

                {/* Resource / Stream tag */}
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 shrink-0 font-bold select-none">
                  {log.resourceId}
                </span>

                {/* Message body */}
                <div className="flex-1 break-all text-xs leading-relaxed text-slate-200">
                  {log.message}
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(log.id, log.message)}
                  className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  title="Copy log line"
                >
                  {copiedId === log.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
