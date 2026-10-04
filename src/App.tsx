import React, { useState } from 'react';
import { CloudWatchProvider } from './context/CloudWatchContext';
import { Navbar } from './components/common/Navbar';
import { PipelineNavigator } from './components/flow/PipelineNavigator';
import { OperationalDashboard } from './components/dashboard/OperationalDashboard';
import { MetricsExplorer } from './components/metrics/MetricsExplorer';
import { AlarmManager } from './components/alarms/AlarmManager';
import { LogsViewer } from './components/logs/LogsViewer';
import { LearningLab } from './components/learning/LearningLab';
import { ChaosDrawer } from './components/chaos/ChaosDrawer';
import { ToastContainer } from './components/common/ToastContainer';

export function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isChaosOpen, setIsChaosOpen] = useState<boolean>(false);
  const [metricResourceFilter, setMetricResourceFilter] = useState<string | undefined>(undefined);

  const handleSelectResourceForMetrics = (resourceId: string) => {
    setMetricResourceFilter(resourceId);
    setCurrentTab('metrics');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans">
      {/* AWS Management Console Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openChaosDrawer={() => setIsChaosOpen(true)}
      />

      {/* Visual Pipeline Navigator: Resource -> Metrics -> Dashboard -> Alarm evaluation -> Alarm state -> Logs */}
      <PipelineNavigator onNavigateTab={(tab) => setCurrentTab(tab)} />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {currentTab === 'dashboard' && (
          <OperationalDashboard
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
      </main>

      {/* Incident & Chaos Injection Drawer */}
      <ChaosDrawer isOpen={isChaosOpen} onClose={() => setIsChaosOpen(false)} />

      {/* Floating Notifications Toast Container */}
      <ToastContainer />

      {/* Footer */}
      <footer className="bg-[#131921] border-t border-slate-800 text-slate-500 text-xs py-4 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">Amazon CloudWatch Simulator</span>
            <span>•</span>
            <span>AWS Solutions Architect (DA-3 Assignment)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Simulated AWS Telemetry Pipeline with Interactive Learning Lab Mode
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <CloudWatchProvider>
      <AppContent />
    </CloudWatchProvider>
  );
}
