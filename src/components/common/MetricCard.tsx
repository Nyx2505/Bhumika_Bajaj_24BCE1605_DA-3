import React from 'react';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  threshold?: number;
  resourceName?: string;
  status?: 'healthy' | 'warning' | 'breached';
  subtitle?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  threshold,
  resourceName,
  status = 'healthy',
  subtitle,
  onClick
}) => {
  const isBreached = status === 'breached';
  const isWarning = status === 'warning';

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border transition ${
        onClick ? 'cursor-pointer hover:border-amber-500 group shadow-2xs' : 'shadow-2xs'
      } ${
        isBreached
          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
          : isWarning
          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
          : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
          {title}
        </div>
        {resourceName && (
          <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {resourceName}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="flex items-baseline space-x-1.5">
          <span
            className={`text-2xl font-black font-mono tracking-tight ${
              isBreached
                ? 'text-rose-600 dark:text-rose-400'
                : isWarning
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {value}
          </span>
          {unit && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {unit === 'Percent' ? '%' : unit}
            </span>
          )}
        </div>

        {threshold !== undefined && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">
              Thresh: {threshold}
              {unit === 'Percent' ? '%' : ''}
            </span>
            <span
              className={`text-[10px] font-bold ${
                isBreached
                  ? 'text-rose-500'
                  : 'text-emerald-500'
              }`}
            >
              {isBreached ? 'BREACHED' : 'SAFE'}
            </span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
