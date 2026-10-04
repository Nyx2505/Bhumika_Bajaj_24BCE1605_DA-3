import React, { useState } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { AWSResourceType } from '../../types/cloudwatch';
import { Server, Search } from 'lucide-react';
import { ResourceCard } from './ResourceCard';

interface ResourcesManagerProps {
  onNavigateTab: (tab: string) => void;
  onSelectResourceForMetrics: (resourceId: string) => void;
}

export const ResourcesManager: React.FC<ResourcesManagerProps> = ({
  onNavigateTab,
  onSelectResourceForMetrics
}) => {
  const { resources, alarms, toggleResourceHealth } = useCloudWatch();

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
          const resAlarms = alarms.filter((a) => a.resourceId === res.id && a.state === 'ALARM');
          return (
            <ResourceCard
              key={res.id}
              resource={res}
              activeAlarmsCount={resAlarms.length}
              onToggleHealth={toggleResourceHealth}
              onSelectMetrics={(id) => {
                onSelectResourceForMetrics(id);
                onNavigateTab('metrics');
              }}
              onViewLogs={() => onNavigateTab('logs')}
            />
          );
        })}
      </div>
    </div>
  );
};
