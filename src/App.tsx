import React, { useState } from 'react';
import { CloudWatchProvider, useCloudWatch } from './context/CloudWatchContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { PipelineNavigator } from './components/flow/PipelineNavigator';
import { OperationalDashboard } from './components/dashboard/OperationalDashboard';
import { ResourcesManager } from './components/resources/ResourcesManager';
import { MetricsExplorer } from './components/metrics/MetricsExplorer';
import { AlarmManager } from './components/alarms/AlarmManager';
import { LogsViewer } from './components/logs/LogsViewer';
import { LearningLab } from './components/learning/LearningLab';
import { SimulatorControlPanel } from './components/simulator/SimulatorControlPanel';
import { ChaosDrawer } from './components/chaos/ChaosDrawer';
import { AboutModal } from './components/common/AboutModal';
import { ToastContainer } from './components/common/ToastContainer';
import { Info } from 'lucide-react';

export function AppLayout() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isChaosDrawerOpen, setIsChaosDrawerOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [metricResourceFilter, setMetricResourceFilter] = useState<string | undefined>(undefined);
  const [alarmInitialView, setAlarmInitialView] = useState<'ALARMS' | 'HISTORY'>('ALARMS');

  const handleNavigateTab = (tab: string, subView?: string) => {
    if (tab === 'alarms' && subView === 'history') {
      setAlarmInitialView('HISTORY');
    } else if (tab === 'alarms') {
      setAlarmInitialView('ALARMS');
    }
    setCurrentTab(tab);
  };

  const handleSelectResourceForMetrics = (resourceId: string) => {
    setMetricResourceFilter(resourceId);
    setCurrentTab('metrics');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Application Header */}
      <Header
        onNavigateTab={handleNavigateTab}
        openChaosDrawer={() => setIsChaosDrawerOpen(true)}
        onOpenMobile={() => setIsMobileMenuOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      {/* Main Body with Persistent / Mobile-Responsive Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenAbout={() => setIsAboutModalOpen(true)}
        />

        {/* Content Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Telemetry Flow Navigator */}
          <PipelineNavigator onNavigateTab={handleNavigateTab} />

          {/* Main Workspace View Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
            {currentTab === 'dashboard' && (
              <OperationalDashboard
                onNavigateTab={handleNavigateTab}
                onSelectResourceForMetrics={handleSelectResourceForMetrics}
                onOpenAbout={() => setIsAboutModalOpen(true)}
              />
            )}

            {currentTab === 'resources' && (
              <ResourcesManager
                onNavigateTab={handleNavigateTab}
                onSelectResourceForMetrics={handleSelectResourceForMetrics}
              />
            )}

            {currentTab === 'metrics' && (
              <MetricsExplorer initialResourceId={metricResourceFilter} />
            )}

            {currentTab === 'alarms' && (
              <AlarmManager
                initialView={alarmInitialView}
                onNavigateTab={handleNavigateTab}
              />
            )}

            {currentTab === 'logs' && <LogsViewer />}

            {currentTab === 'learning' && <LearningLab />}

            {currentTab === 'simulator' && (
              <SimulatorControlPanel onNavigateTab={handleNavigateTab} />
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-[#0f172a]/60 py-4 px-4 sm:px-6 text-slate-500 text-xs mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  CloudWatch Simulator
                </span>
                <span>•</span>
                <span>AWS Solutions Architect Assignment</span>
                <span>•</span>
                <button
                  onClick={() => setIsAboutModalOpen(true)}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  About this Simulator
                </button>
              </div>
              <div className="text-[11px] text-slate-400 text-center sm:text-right font-mono">
                100% Client-Side Simulation · No Real AWS Account Connected
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Incident & Chaos Drawer */}
      <ChaosDrawer
        isOpen={isChaosDrawerOpen}
        onClose={() => setIsChaosDrawerOpen(false)}
      />

      {/* About this Simulator Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        onNavigateTab={handleNavigateTab}
      />

      {/* Floating Notifications Toast Container */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <CloudWatchProvider>
      <AppLayout />
    </CloudWatchProvider>
  );
}
