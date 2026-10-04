import React, { useState } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import {
  Bell,
  Play,
  Pause,
  Sun,
  Moon,
  Zap,
  Globe,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  Flame,
  X
} from 'lucide-react';

interface HeaderProps {
  onNavigateTab: (tab: string) => void;
  openChaosDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateTab, openChaosDrawer }) => {
  const {
    theme,
    toggleTheme,
    environment,
    setEnvironment,
    alarms,
    isSimulating,
    toggleSimulation,
    simSpeed,
    setSimSpeed,
    activeChaos
  } = useCloudWatch();

  const [isAlertPopoverOpen, setIsAlertPopoverOpen] = useState(false);

  const alarmItems = alarms.filter((a) => a.state === 'ALARM');
  const insufficientItems = alarms.filter((a) => a.state === 'INSUFFICIENT_DATA');
  const okItems = alarms.filter((a) => a.state === 'OK');

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: App Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-sm shadow-amber-500/30">
              <span className="text-black font-black text-xs tracking-tighter">CW</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5 leading-none">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  CloudWatch
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                  Platform
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
                Interactive AWS Monitoring Simulator
              </span>
            </div>
          </div>
        </div>

        {/* Center: Environment & Region */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="flex items-center text-xs bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300">
            <Globe className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
            <span className="text-slate-400 dark:text-slate-500 mr-1 text-[11px]">Env:</span>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="Production (us-east-1)" className="dark:bg-slate-900">
                Production (us-east-1)
              </option>
              <option value="Staging (eu-west-1)" className="dark:bg-slate-900">
                Staging (eu-west-1)
              </option>
            </select>
          </div>
        </div>

        {/* Right: Simulation Controls, Alarm Indicator, Theme Toggle */}
        <div className="flex items-center space-x-2.5">
          {/* Simulation Engine Widget */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={toggleSimulation}
              className={`flex items-center px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                isSimulating
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
              }`}
              title={isSimulating ? 'Pause Telemetry' : 'Resume Telemetry'}
            >
              {isSimulating ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 mr-1.5 animate-pulse"></span>
                  <Pause className="w-3 h-3 mr-1" />
                  Live
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Paused
                </>
              )}
            </button>

            <div className="flex items-center ml-1 space-x-0.5">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSimSpeed(speed)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                    simSpeed === speed
                      ? 'bg-amber-500 text-black font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Alarm Notifications Popover Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsAlertPopoverOpen((prev) => !prev)}
              className={`relative p-2 rounded-lg border transition ${
                alarmItems.length > 0
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="CloudWatch Alarm Alerts"
            >
              <Bell className="w-4 h-4" />
              {alarmItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {alarmItems.length}
                </span>
              )}
            </button>

            {/* Alarm Popover Drawer */}
            {isAlertPopoverOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-3 z-50 text-xs animate-scaleIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-white flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-1.5 text-rose-500" />
                    Alarm Status Overview
                  </span>
                  <button
                    onClick={() => setIsAlertPopoverOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                  {alarmItems.length === 0 ? (
                    <div className="flex items-center space-x-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>All alarms healthy. Zero breaches in progress.</span>
                    </div>
                  ) : (
                    alarmItems.map((alarm) => (
                      <div
                        key={alarm.id}
                        onClick={() => {
                          onNavigateTab('alarms');
                          setIsAlertPopoverOpen(false);
                        }}
                        className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 cursor-pointer hover:border-rose-400 transition"
                      >
                        <div className="font-bold text-rose-700 dark:text-rose-300 truncate">
                          {alarm.name}
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                          {alarm.resourceId} : {alarm.metricName}
                        </div>
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 line-clamp-2">
                          {alarm.stateReason}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    {okItems.length} OK · {insufficientItems.length} Insufficient
                  </span>
                  <button
                    onClick={() => {
                      onNavigateTab('alarms');
                      setIsAlertPopoverOpen(false);
                    }}
                    className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    View All Alarms ➔
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white transition"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
