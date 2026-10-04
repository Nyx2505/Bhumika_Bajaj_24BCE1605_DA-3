import React from 'react';
import {
  Server,
  Activity,
  LayoutDashboard,
  Cpu,
  BellRing,
  FileText,
  ChevronRight,
  Info
} from 'lucide-react';
import { useCloudWatch } from '../../context/CloudWatchContext';

interface PipelineNavigatorProps {
  onNavigateTab: (tab: string) => void;
}

export const PipelineNavigator: React.FC<PipelineNavigatorProps> = ({ onNavigateTab }) => {
  const { activePipelineStep, setActivePipelineStep, alarms, activeChaos } = useCloudWatch();

  const steps = [
    {
      id: 'Resource',
      name: '1. Resources',
      desc: 'EC2, RDS, Lambda, ALB generate compute activity',
      icon: Server,
      tab: 'resources',
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/30'
    },
    {
      id: 'Metrics',
      name: '2. Metrics',
      desc: 'Telemetry aggregated into time-series data',
      icon: Activity,
      tab: 'metrics',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      id: 'Dashboard',
      name: '3. Dashboard',
      desc: 'Operational multi-resource health graphs',
      icon: LayoutDashboard,
      tab: 'dashboard',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30'
    },
    {
      id: 'AlarmEvaluation',
      name: '4. Evaluation',
      desc: 'M of N sliding window checks vs threshold',
      icon: Cpu,
      tab: 'learning',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
    {
      id: 'AlarmState',
      name: '5. State',
      desc: 'OK, ALARM, INSUFFICIENT_DATA triggers',
      icon: BellRing,
      tab: 'alarms',
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30'
    },
    {
      id: 'Logs',
      name: '6. Logs',
      desc: 'Correlated event logs and root cause audit',
      icon: FileText,
      tab: 'logs',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    }
  ];

  const activeAlarmsCount = alarms.filter((a) => a.state === 'ALARM').length;

  return (
    <div className="bg-slate-50 dark:bg-[#131921] border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Telemetry Pipeline:
          </span>
          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
            Interactive CloudWatch architecture progression
          </span>
        </div>

        {/* Steps Breadcrumbs */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activePipelineStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => {
                    setActivePipelineStep(step.id);
                    onNavigateTab(step.tab);
                  }}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                    isActive
                      ? `${step.bgColor} ${step.borderColor} text-slate-900 dark:text-white ring-1 ring-amber-500/50`
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300'
                  }`}
                  title={step.desc}
                >
                  <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                  <span className="whitespace-nowrap">{step.name}</span>
                  {step.id === 'AlarmState' && activeAlarmsCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  )}
                </button>

                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
