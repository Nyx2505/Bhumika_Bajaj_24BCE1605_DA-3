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
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenAbout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  onOpenAbout
}) => {
  const { alarms, resources, activeChaos } = useCloudWatch();

  const alarmCount = alarms.filter((a) => a.state === 'ALARM').length;

  // Group 1: Core AWS CloudWatch Simulation
  const cloudWatchItems = [
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
    }
  ];

  // Group 2: Our Project Enhancement
  const enhancementItems = [
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

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavButton = (item: (typeof cloudWatchItems)[0]) => {
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
        onClick={() => handleSelectTab(item.id)}
        className={`w-full flex items-center rounded-xl px-3 py-2.5 text-xs font-semibold transition group relative ${
          isActive
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
        } ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between'}`}
        title={isCollapsed && !isMobileOpen ? item.name : undefined}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <Icon
            className={`w-4 h-4 flex-shrink-0 transition ${
              isActive
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
            }`}
          />
          {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.name}</span>}
        </div>

        {(!isCollapsed || isMobileOpen) && item.badge && (
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${badgeStyle}`}>
            {item.badge}
          </span>
        )}

        {/* Tooltip for desktop collapsed state */}
        {isCollapsed && !isMobileOpen && (
          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50">
            {item.name}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:relative md:z-30 flex flex-col bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 transition-all duration-300 select-none ${
          isMobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed && !isMobileOpen ? 'md:w-16' : 'md:w-60'}`}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-black text-xs">
              CW
            </div>
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
              CloudWatch Sim
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full p-1 shadow-sm transition hidden md:flex items-center justify-center z-40"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Nav List */}
        <div className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {/* SECTION 1: CLOUDWATCH SIMULATION */}
          <div>
            <div
              className={`px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between ${
                isCollapsed && !isMobileOpen ? 'hidden' : 'flex'
              }`}
            >
              <span>CloudWatch Simulation</span>
              <span className="text-[9px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-800">AWS</span>
            </div>
            <div className="space-y-1">
              {cloudWatchItems.map(renderNavButton)}
            </div>
          </div>

          {/* SECTION 2: OUR ENHANCEMENT */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div
              className={`px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-between ${
                isCollapsed && !isMobileOpen ? 'hidden' : 'flex'
              }`}
            >
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Our Enhancement
              </span>
              <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                Plus
              </span>
            </div>
            <div className="space-y-1">
              {enhancementItems.map(renderNavButton)}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
          {/* About this Simulator Button */}
          {onOpenAbout && (
            <button
              onClick={() => {
                onOpenAbout();
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center rounded-lg px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-start space-x-2'
              }`}
              title="About this Educational Simulator"
            >
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              {(!isCollapsed || isMobileOpen) && (
                <span className="font-semibold truncate">About this Simulator</span>
              )}
            </button>
          )}

          {/* Cluster Status Box */}
          {(!isCollapsed || isMobileOpen) && (
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Environment:</span>
                <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Active Sim
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>{resources.length} Targets</span>
                <span>Client-Side</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
