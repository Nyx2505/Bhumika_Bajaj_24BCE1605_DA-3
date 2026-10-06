import React from 'react';
import {
  X,
  Info,
  ShieldCheck,
  Cpu,
  GraduationCap,
  Activity,
  Layers,
  CheckCircle,
  ExternalLink,
  Zap,
  Sliders,
  Terminal,
  Server
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#131921] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn text-slate-800 dark:text-slate-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  About CloudWatch Simulator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black uppercase">
                  Academic Project
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Interactive AWS Monitoring & Learning Platform for Solutions Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close About Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
          {/* Important Educational Notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
            <div className="flex items-center space-x-2 font-bold text-sm text-amber-700 dark:text-amber-400 mb-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Educational Simulation Notice</span>
            </div>
            <p>
              This application is a <strong>self-contained browser-based simulator</strong> built for an AWS Solutions Architect college assignment. It demonstrates the practical concepts of <strong>Amazon CloudWatch</strong> without requiring a real AWS account, AWS credentials, or incurring any cloud billing.
            </p>
          </div>

          {/* Core Distinction: CloudWatch vs Interactive Learning Lab*/}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Clear Architectural Scope
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column 1: CloudWatch Simulation (Core) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Activity className="w-4 h-4" />
                  <span>CloudWatch Simulation (Core)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Simulates standard operational concepts of Amazon CloudWatch:
                </p>
                <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                  <li className="flex items-start space-x-1.5">
                    <span className="text-sky-500 font-bold">•</span>
                    <span><strong>Metrics Telemetry:</strong> Aggregated time-series datapoints across EC2, RDS, Lambda, and ALB namespaces.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-sky-500 font-bold">•</span>
                    <span><strong>Multi-Resource Dashboards:</strong> Operational visual widgets with customizable 10m, 30m, and 1h inspection windows.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-sky-500 font-bold">•</span>
                    <span><strong>Log Streams & Groups:</strong> Log ingestion across resources with level filtering (INFO, WARNING, ERROR).</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-sky-500 font-bold">•</span>
                    <span><strong>Alarms & Multi-Period Logic:</strong> Strict <em>M of N</em> consecutive periods evaluation with OK, ALARM, and INSUFFICIENT_DATA states.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-sky-500 font-bold">•</span>
                    <span><strong>Resource Health:</strong> Infrastructure status tracking and operational degradation simulation.</span>
                  </li>
                </ul>
              </div>

              {/* Column 2: Our Meaningful Enhancement */}
              <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-amber-500/20 pb-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Our Project Enhancement</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Interactive educational layer designed to explain CloudWatch internals:
                </p>
                <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                  <li className="flex items-start space-x-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Interactive Learning Lab:</strong> Build-your-own alarm wizard with live configuration previews.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>5-Period Metric Simulator:</strong> Interactive slider feeder to step through telemetry periods manually.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Visual Sliding Window Timeline:</strong> Period-by-period breakdown showing threshold crosses and evaluation progression.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Plain-English State Explanations:</strong> Clear rationales explaining why momentary spikes do not trip alarms.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Guided Learning Challenges:</strong> 4 practical architectural scenarios with instant rule verification and reward badges.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>Operational Incident Injector:</strong> Chaos simulation buttons (CPU Spike, Traffic Spike, Error Spike, DB Load, Recovery).</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Technical Implementation Details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center">
              <Cpu className="w-4 h-4 mr-1.5 text-purple-500" />
              Local Simulation Engine Architecture
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <strong className="block text-slate-800 dark:text-slate-200">Deterministic PRNG</strong>
                Mulberry32 seeded random walk generates realistic telemetry without erratic noise.
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <strong className="block text-slate-800 dark:text-slate-200">Physical Step Sizing</strong>
                Values step gradually (e.g. 32% → 45% → 61% → 83% → 91%) rather than jumping discontinuously.
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <strong className="block text-slate-800 dark:text-slate-200">Zero Storage Bloat</strong>
                Only custom alarms and progress persist in localStorage; high-frequency telemetry stays in memory.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
            Tech Stack: React 18 · TypeScript · Tailwind CSS · Recharts · Lucide Icons · Vite
          </div>

          <div className="flex items-center space-x-2">
            {onNavigateTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('learning');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Open Learning Lab
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
