import React from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import {
  LayoutDashboard,
  Server,
  LineChart,
  Bell,
  Terminal,
  GraduationCap,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Flame,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isCollapsed,
  setIsCollapsed
}) => {
  const { alarms, resources, activeChaos } = useCloudWatch();

  const alarmCount = alarms.filter((a) => a.state === 'ALARM').length;

  const navItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'resources',
      name: 'Resources',
      icon: Server,
      badge: `${resources.length}`
    },
    {
      id: 'metrics',
      name: 'Metrics',
      icon: LineChart,
      badge: null
    },
    {
      id: 'alarms',
      name: 'Alarms',
      icon: Bell,
      badge: alarmCount > 0 ? `${alarmCount}` : null,
      badgeVariant: alarmCount > 0 ? 'alarm' : 'neutral'
    },
    {
      id: 'logs',
      name: 'Logs',
      icon: Terminal,
      badge: null
    },
    {
      id: 'learning',
      name: 'Learning Mode',
      icon: GraduationCap,
      badge: 'Lab',
      badgeVariant: 'highlight'
    },
    {
      id: 'simulator',
      name: 'Simulator',
      icon: Sliders,
      badge: activeChaos.length > 0 ? `${activeChaos.length}⚡` : null,
      badgeVariant: activeChaos.length > 0 ? 'chaos' : 'neutral'
    }
  ];

  return (
    <aside
      className={`relative flex flex-col bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full p-1 shadow-sm transition hidden md:flex items-center justify-center z-40"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Nav List */}
      <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className={`px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${isCollapsed ? 'hidden' : 'block'}`}>
          Monitoring Suite
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
          if (item.badgeVariant === 'alarm') {
            badgeStyle = 'bg-rose-500 text-white font-bold animate-pulse';
          } else if (item.badgeVariant === 'highlight') {
            badgeStyle = 'bg-amber-500 text-black font-extrabold';
          } else if (item.badgeVariant === 'chaos') {
            badgeStyle = 'bg-orange-500/20 text-orange-500 font-bold border border-orange-500/30';
          }

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center rounded-xl px-3 py-2.5 text-xs font-semibold transition group relative ${
                isActive
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
              } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              title={isCollapsed ? item.name : undefined}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition ${
                    isActive
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </div>

              {!isCollapsed && item.badge && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${badgeStyle}`}>
                  {item.badge}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50">
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer with Health Summary */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Cluster Status:</span>
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Nominal
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              <span>{resources.length} Monitored Targets</span>
              <span>us-east-1</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
