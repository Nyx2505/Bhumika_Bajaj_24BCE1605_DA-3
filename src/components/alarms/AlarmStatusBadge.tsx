import React from 'react';
import { AlarmState } from '../../types/cloudwatch';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface AlarmStatusBadgeProps {
  state: AlarmState;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animatePulse?: boolean;
}

export const AlarmStatusBadge: React.FC<AlarmStatusBadgeProps> = ({
  state,
  size = 'md',
  showIcon = true,
  animatePulse = true
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3 mr-1',
    md: 'w-3.5 h-3.5 mr-1.5',
    lg: 'w-4 h-4 mr-1.5'
  }[size];

  switch (state) {
    case 'OK':
      return (
        <span
          className={`inline-flex items-center font-bold rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 ${sizeClasses}`}
        >
          {showIcon && <CheckCircle2 className={iconSizes} />}
          OK
        </span>
      );
    case 'ALARM':
      return (
        <span
          className={`inline-flex items-center font-bold rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 ${
            animatePulse ? 'animate-pulse' : ''
          } ${sizeClasses}`}
        >
          {showIcon && <AlertTriangle className={iconSizes} />}
          ALARM
        </span>
      );
    case 'INSUFFICIENT_DATA':
    default:
      return (
        <span
          className={`inline-flex items-center font-bold rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 ${sizeClasses}`}
        >
          {showIcon && <AlertCircle className={iconSizes} />}
          INSUFFICIENT DATA
        </span>
      );
  }
};
