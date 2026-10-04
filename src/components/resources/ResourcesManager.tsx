import React, { useState } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
import { AWSResourceType } from '../../types/cloudwatch';
import {
  Server,
  Database,
  CloudLightning,
  Layers,
  Search,
  Filter,
  ArrowUpRight,
  Terminal,
  Activity,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Tag
} from 'lucide-react';

interface ResourcesManagerProps {
  onNavigateTab: (tab: string) => void;
  onSelectResourceForMetrics: (resourceId: string) => void;
}

export const ResourcesManager: React.FC<ResourcesManagerProps> = ({
  onNavigateTab,
  onSelectResourceForMetrics
}) => {
  const { resources, metricHistory, toggleResourceHealth } = useCloudWatch();

  const [typeFilter, setTypeFilter] = useState<'ALL' | AWSResourceType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = resources.filter((res) => {
    if (typeFilter !== 'ALL' && res.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        res.name.toLowerCase().includes(q) ||
        res.id.toLowerCase().includes(q) ||
        res.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getResourceIcon = (type: AWSResourceType) => {
    switch (type) {
      case 'EC2':
        return <Server className="w-4 h-4 text-sky-500" />;
      case 'RDS':
        return <Database className="w-4 h-4 text-blue-500" />;
      case 'Lambda':
        return <CloudLightning className="w-4 h-4 text-amber-500" />;
      case 'ALB':
        return <Layers className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <Server className="w-5 h-5 text-amber-500 mr-2" />
            Monitored Cloud Infrastructure Resources
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            EC2 compute instances, managed RDS databases, serverless Lambdas, and load balancers emitting telemetry
          </p>
        </div>

        <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          Total Targets: <strong className="text-slate-900 dark:text-white">{resources.length} Active</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Type Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          {(['ALL', 'EC2', 'RDS', 'Lambda', 'ALB'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                typeFilter === type
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by resource name, ID, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredResources.map((res) => {
          const isDegraded = res.status === 'degraded';

          return (
            <div
              key={res.id}
              className={`bg-white dark:bg-[#1e293b] p-5 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                isDegraded
                  ? 'border-amber-500/80 bg-amber-50/20 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div>
                {/* Top Resource Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {getResourceIcon(res.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {res.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                          {res.type}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        {res.id} · {res.region}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center ${
                      res.status === 'running'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        res.status === 'running' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    ></span>
                    {res.status}
                  </span>
                </div>

                {/* Endpoint/Address */}
                {res.ipOrEndpoint && (
                  <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 truncate">
                    Endpoint: {res.ipOrEndpoint}
                  </div>
                )}

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Object.entries(res.tags).map(([k, v]) => (
                    <span
                      key={k}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 flex items-center"
                    >
                      <Tag className="w-2.5 h-2.5 mr-1 text-slate-400" />
                      {k}: <strong className="ml-1 text-slate-800 dark:text-slate-200">{v}</strong>
                    </span>
                  ))}
                </div>

                {/* Live Key Metrics Snapshot */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                    Live Telemetry Streams:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {res.supportedMetrics.map((metric) => {
                      const key = `${res.id}:${metric}`;
                      const points = metricHistory[key] || [];
                      const latestPoint = points[points.length - 1];
                      const def = METRIC_DEFINITIONS[metric];

                      return (
                        <div
                          key={metric}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {def?.displayName || metric}
                          </div>
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                            {latestPoint ? latestPoint.value : '--'}
                            <span className="text-[9px] font-normal text-slate-400 ml-1">
                              {def?.unit === 'Percent' ? '%' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => toggleResourceHealth(res.id)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md border transition ${
                    isDegraded
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                  title={isDegraded ? 'Restore resource health' : 'Simulate operational degradation'}
                >
                  {isDegraded ? 'Restore Healthy' : 'Simulate Degradation'}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onNavigateTab('logs')}
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition flex items-center text-[11px]"
                    title="View Resource Logs"
                  >
                    <Terminal className="w-3.5 h-3.5 mr-1" />
                    Logs
                  </button>
                  <button
                    onClick={() => {
                      onSelectResourceForMetrics(res.id);
                      onNavigateTab('metrics');
                    }}
                    className="px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-amber-500 dark:text-black font-bold text-[11px] transition flex items-center"
                  >
                    Metrics <ArrowUpRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
