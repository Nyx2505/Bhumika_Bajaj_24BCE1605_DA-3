import React from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import {
  Bell,
  Play,
  Pause,
  Zap,
  Activity,
  Server,
  Terminal,
  GraduationCap,
  LayoutDashboard,
  LineChart
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openChaosDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openChaosDrawer
}) => {
  const {
    alarms,
    isSimulating,
    toggleSimulation,
    simSpeed,
    setSimSpeed,
    activeChaos
  } = useCloudWatch();

  const alarmCount = alarms.filter((a) => a.state === 'ALARM').length;
  const okCount = alarms.filter((a) => a.state === 'OK').length;

  return (
    <header className="bg-[#131921] border-b border-[#232f3e] sticky top-0 z-50">
      {/* Top AWS Management Console Strip */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 font-bold text-base text-white tracking-wide">
            <span className="bg-[#ec7211] text-black px-1.5 py-0.5 rounded font-black text-xs">AWS</span>
            <span className="text-white hover:text-amber-400 transition-colors">CloudWatch</span>
            <span className="text-slate-400 font-normal text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              Interactive Simulator
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Simulation Controls */}
          <div className="flex items-center bg-slate-800 rounded-md p-1 border border-slate-700 space-x-1">
            <button
              onClick={toggleSimulation}
              className={`flex items-center px-2 py-1 rounded text-xs font-medium transition ${
                isSimulating
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
              }`}
              title={isSimulating ? 'Pause Telemetry Simulation' : 'Resume Telemetry Simulation'}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3 h-3 mr-1" /> Simulating
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" /> Paused
                </>
              )}
            </button>

            <div className="flex items-center space-x-0.5 text-slate-300">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSimSpeed(speed)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                    simSpeed === speed
                      ? 'bg-amber-500 text-black font-bold'
                      : 'hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Chaos / Incident Injector Button */}
          <button
            onClick={openChaosDrawer}
            className={`flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium border transition ${
              activeChaos.length > 0
                ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-500 hover:text-amber-400'
            }`}
          >
            <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Chaos Scenarios
            {activeChaos.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 text-[10px] font-bold">
                {activeChaos.length} active
              </span>
            )}
          </button>

          {/* Region Badge */}
          <div className="hidden md:flex items-center text-slate-400 bg-slate-900/60 px-2 py-1 rounded border border-slate-800 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-ping"></span>
            us-east-1 (N. Virginia)
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="flex items-center px-4 overflow-x-auto bg-[#232f3e] text-slate-300">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex items-center px-3 py-2.5 border-b-2 text-xs font-medium transition whitespace-nowrap ${
            currentTab === 'dashboard'
              ? 'border-[#ec7211] text-white font-bold bg-[#1e293b]/50'
              : 'border-transparent hover:text-white hover:border-slate-500'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
          Dashboard
        </button>

        <button
          onClick={() => setCurrentTab('metrics')}
          className={`flex items-center px-3 py-2.5 border-b-2 text-xs font-medium transition whitespace-nowrap ${
            currentTab === 'metrics'
              ? 'border-[#ec7211] text-white font-bold bg-[#1e293b]/50'
              : 'border-transparent hover:text-white hover:border-slate-500'
          }`}
        >
          <LineChart className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
          Metrics Explorer
        </button>

        <button
          onClick={() => setCurrentTab('alarms')}
          className={`flex items-center px-3 py-2.5 border-b-2 text-xs font-medium transition whitespace-nowrap ${
            currentTab === 'alarms'
              ? 'border-[#ec7211] text-white font-bold bg-[#1e293b]/50'
              : 'border-transparent hover:text-white hover:border-slate-500'
          }`}
        >
          <Bell className="w-3.5 h-3.5 mr-1.5 text-red-400" />
          Alarms
          {alarmCount > 0 ? (
            <span className="ml-1.5 bg-red-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
              {alarmCount}
            </span>
          ) : (
            <span className="ml-1.5 bg-emerald-600/60 text-emerald-200 rounded-full px-1.5 py-0.2 text-[10px]">
              {okCount} OK
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('logs')}
          className={`flex items-center px-3 py-2.5 border-b-2 text-xs font-medium transition whitespace-nowrap ${
            currentTab === 'logs'
              ? 'border-[#ec7211] text-white font-bold bg-[#1e293b]/50'
              : 'border-transparent hover:text-white hover:border-slate-500'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
          Logs Insights
        </button>

        <div className="h-4 w-px bg-slate-600 mx-2" />

        {/* Unique Enhancement Tab */}
        <button
          onClick={() => setCurrentTab('learning')}
          className={`flex items-center px-3 py-2.5 border-b-2 text-xs font-semibold transition whitespace-nowrap ${
            currentTab === 'learning'
              ? 'border-amber-400 text-amber-300 font-bold bg-amber-500/15'
              : 'border-transparent text-amber-400/80 hover:text-amber-300 hover:border-amber-400'
          }`}
        >
          <GraduationCap className="w-4 h-4 mr-1.5 text-amber-400 animate-bounce" />
          Interactive Learning Mode (Lab)
          <span className="ml-1.5 bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
            Enhancement
          </span>
        </button>
      </nav>
    </header>
  );
};
