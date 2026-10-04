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
import { ToastContainer } from './components/common/ToastContainer';

export function AppLayout() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isChaosDrawerOpen, setIsChaosDrawerOpen] = useState<boolean>(false);
  const [metricResourceFilter, setMetricResourceFilter] = useState<string | undefined>(undefined);

  const handleSelectResourceForMetrics = (resourceId: string) => {
    setMetricResourceFilter(resourceId);
    setCurrentTab('metrics');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Application Header */}
      <Header
        onNavigateTab={(tab) => setCurrentTab(tab)}
        openChaosDrawer={() => setIsChaosDrawerOpen(true)}
      />

      {/* Main Body with Persistent Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Content Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Telemetry Flow Navigator */}
          <PipelineNavigator onNavigateTab={(tab) => setCurrentTab(tab)} />

          {/* Main Workspace View Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
            {currentTab === 'dashboard' && (
              <OperationalDashboard
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onSelectResourceForMetrics={handleSelectResourceForMetrics}
              />
            )}

            {currentTab === 'resources' && (
              <ResourcesManager
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onSelectResourceForMetrics={handleSelectResourceForMetrics}
              />
            )}

            {currentTab === 'metrics' && (
              <MetricsExplorer initialResourceId={metricResourceFilter} />
            )}

            {currentTab === 'alarms' && <AlarmManager />}

            {currentTab === 'logs' && <LogsViewer />}

            {currentTab === 'learning' && <LearningLab />}

            {currentTab === 'simulator' && <SimulatorControlPanel />}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-[#0f172a]/60 py-4 px-6 text-slate-500 text-xs mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  CloudWatch Simulator
                </span>
                <span>•</span>
                <span>Interactive AWS Monitoring Platform</span>
                <span>•</span>
                <span>AWS Solutions Architect Assignment</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Local Telemetry Engine · Zero Real AWS Credentials Required
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
