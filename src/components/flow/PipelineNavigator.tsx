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
      desc: 'EC2, RDS, Lambda, ALB generate compute & system activity',
      icon: Server,
      tab: 'metrics',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      id: 'Metrics',
      name: '2. Metrics',
      desc: 'Telemetry aggregated into time-series datapoints',
      icon: Activity,
      tab: 'metrics',
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/30'
    },
    {
      id: 'Dashboard',
      name: '3. Dashboard',
      desc: 'Consolidated real-time operational graphs and health',
      icon: LayoutDashboard,
      tab: 'dashboard',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30'
    },
    {
      id: 'AlarmEvaluation',
      name: '4. Alarm Evaluation',
      desc: 'M of N sliding window checks against configured thresholds',
      icon: Cpu,
      tab: 'learning',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
    {
      id: 'AlarmState',
      name: '5. Alarm State',
      desc: 'State triggers (OK, ALARM, INSUFFICIENT_DATA) + Actions',
      icon: BellRing,
      tab: 'alarms',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    },
    {
      id: 'Logs',
      name: '6. Logs',
      desc: 'Correlated event logs and root cause inspection',
      icon: FileText,
      tab: 'logs',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    }
  ];

  const currentStepObj = steps.find((s) => s.id === activePipelineStep) || steps[0];
  const activeAlarmsCount = alarms.filter((a) => a.state === 'ALARM').length;

  return (
    <div className="bg-[#1e293b] border-b border-slate-700/80 px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              CloudWatch Telemetry Flow:
            </span>
            <span className="text-xs text-amber-300 font-medium">
              Click any step to inspect how data travels end-to-end
            </span>
          </div>
          {activeChaos.length > 0 && (
            <div className="flex items-center text-xs text-red-400 font-semibold bg-red-950/40 px-2.5 py-0.5 rounded border border-red-800/60 animate-pulse">
              ⚠️ Anomaly active in pipeline: {activeChaos[0].name}
            </div>
          )}
        </div>

        {/* Steps Breadcrumb / Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activePipelineStep === step.id;

            return (
              <button
                key={step.id}
                onClick={() => {
                  setActivePipelineStep(step.id);
                  onNavigateTab(step.tab);
                }}
                className={`relative flex items-center p-2 rounded-lg text-left transition border ${
                  isActive
                    ? `${step.bgColor} ${step.borderColor} ring-1 ring-amber-400 shadow-sm`
                    : 'bg-slate-850 bg-slate-900/60 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                <div
                  className={`p-1.5 rounded-md mr-2.5 ${step.bgColor} ${step.color} border ${step.borderColor}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate flex items-center">
                    {step.name}
                    {step.id === 'AlarmState' && activeAlarmsCount > 0 && (
                      <span className="ml-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{step.desc}</div>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Step Explanation Banner */}
        <div className="mt-2 text-xs bg-slate-900/80 px-3 py-2 rounded-md border border-slate-700/60 flex items-start space-x-2 text-slate-300">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-semibold">{currentStepObj.name}: </strong>
            <span>{currentStepObj.desc}</span>
            <span className="text-slate-400 ml-2 font-mono text-[11px]">
              (Viewing {currentStepObj.tab} console view)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
