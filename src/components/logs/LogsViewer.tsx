import React, { useState, useMemo, useRef } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import {
  Terminal,
  Search,
  Server,
  Database,
  Layers,
  Flame,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  ChevronRight,
  Send,
  ArrowUpDown,
  Zap
} from 'lucide-react';
import { LogLevel } from '../../types/cloudwatch';

export const LogsViewer: React.FC = () => {
  const {
    logGroups,
    logs,
    addLog,
    resources,
    activeChaos,
    triggerChaos,
    stopChaos
  } = useCloudWatch();

  // Filters State
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | LogLevel>('ALL');
  const [resourceFilter, setResourceFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | '5m' | '15m' | '1h'>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Custom log emitter state
  const [customResource, setCustomResource] = useState<string>(resources[0]?.id || 'EC2-Web-01');
  const [customGroup, setCustomGroup] = useState<string>(logGroups[0]?.name || '/application/web');
  const [customLevel, setCustomLevel] = useState<LogLevel>('INFO');
  const [customMessage, setCustomMessage] = useState<string>('Request received: GET /api/v1/health HTTP/1.1 200 OK');

  const terminalScrollRef = useRef<HTMLDivElement>(null);

  // When custom resource changes, match default log group
  const handleResourceChange = (resId: string) => {
    setCustomResource(resId);
    const matched = logGroups.find((lg) => lg.resourceId === resId);
    if (matched) setCustomGroup(matched.name);
  };

  // Check if any filter is actively applied
  const isFilterActive = useMemo(() => {
    return (
      selectedGroup !== 'ALL' ||
      searchQuery.trim() !== '' ||
      levelFilter !== 'ALL' ||
      resourceFilter !== 'ALL' ||
      timeFilter !== 'ALL'
    );
  }, [selectedGroup, searchQuery, levelFilter, resourceFilter, timeFilter]);

  // Clear all filters handler
  const handleClearFilters = () => {
    setSelectedGroup('ALL');
    setSearchQuery('');
    setLevelFilter('ALL');
    setResourceFilter('ALL');
    setTimeFilter('ALL');
  };

  // Helper for time window filtering
  const isWithinTimeWindow = (isoTimestamp: string, window: 'ALL' | '5m' | '15m' | '1h') => {
    if (window === 'ALL') return true;
    const logTime = new Date(isoTimestamp).getTime();
    const now = Date.now();
    if (window === '5m') return now - logTime <= 5 * 60 * 1000;
    if (window === '15m') return now - logTime <= 15 * 60 * 1000;
    if (window === '1h') return now - logTime <= 60 * 60 * 1000;
    return true;
  };

  // Filtered and sorted logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        if (selectedGroup !== 'ALL' && log.logGroupName !== selectedGroup) return false;
        if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
        if (resourceFilter !== 'ALL' && log.resourceId !== resourceFilter) return false;
        if (!isWithinTimeWindow(log.timestamp, timeFilter)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchMessage = log.message.toLowerCase().includes(q);
          const matchResource = log.resourceId.toLowerCase().includes(q);
          const matchLevel = log.level.toLowerCase().includes(q);
          const matchGroup = log.logGroupName.toLowerCase().includes(q);
          const matchTime = log.timestamp.toLowerCase().includes(q);
          if (!matchMessage && !matchResource && !matchLevel && !matchGroup && !matchTime) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [logs, selectedGroup, levelFilter, resourceFilter, timeFilter, searchQuery, sortOrder]);

  const infoCount = useMemo(() => logs.filter((l) => l.level === 'INFO').length, [logs]);
  const warningCount = useMemo(() => logs.filter((l) => l.level === 'WARNING').length, [logs]);
  const errorCount = useMemo(() => logs.filter((l) => l.level === 'ERROR').length, [logs]);

  const isCpuSpikeActive = activeChaos.some((c) => c.id === 'chaos-cpu-spike');

  const handleToggleCpuSpikeIncident = () => {
    if (isCpuSpikeActive) {
      stopChaos('chaos-cpu-spike');
    } else {
      triggerChaos('chaos-cpu-spike');
    }
  };

  const handleSendCustomLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim()) return;

    addLog({
      level: customLevel,
      logGroupName: customGroup,
      resourceId: customResource,
      message: customMessage.trim()
    });

    setCustomMessage('');
  };

  const formatTimeOnly = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toTimeString().split(' ')[0];
    } catch {
      return iso;
    }
  };

  const getStreamIcon = (groupName: string) => {
    if (groupName.includes('system') || groupName.includes('ec2')) {
      return <Server className="w-3.5 h-3.5 text-sky-400" />;
    }
    if (groupName.includes('database')) {
      return <Database className="w-3.5 h-3.5 text-blue-400" />;
    }
    return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Terminal className="w-6 h-6 text-emerald-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              CloudWatch Logs
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Live Ingestion
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulated CloudWatch Log Streams, multi-parameter filtering, and automated cross-service incident correlation
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            Total Logs: <strong className="text-slate-900 dark:text-white">{logs.length}</strong>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 flex items-center space-x-1">
            <Info className="w-3 h-3" />
            <span>INFO: <strong>{infoCount}</strong></span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>WARNING: <strong>{warningCount}</strong></span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>ERROR: <strong>{errorCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Connected Monitoring Workflow Banner */}
      <div className={`p-4 rounded-xl border transition-all ${
        isCpuSpikeActive
          ? 'bg-rose-950/20 border-rose-500 shadow-md ring-1 ring-rose-500/50'
          : 'bg-gradient-to-r from-emerald-950/20 via-sky-950/20 to-slate-900/40 dark:bg-[#131b2e] border-slate-200 dark:border-slate-700/80'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Zap className={`w-4 h-4 ${isCpuSpikeActive ? 'text-rose-400 animate-bounce' : 'text-amber-400'}`} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Connected Monitoring Workflow Demonstration
              </h3>
              {isCpuSpikeActive && (
                <span className="animate-pulse px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                  INCIDENT LIVE
                </span>
              )}
            </div>
            
            {/* 4-Step Pipeline Flow */}
            <div className="flex items-center flex-wrap text-[11px] gap-2 text-slate-600 dark:text-slate-300 pt-1 font-mono">
              <span className="flex items-center space-x-1 font-semibold text-amber-600 dark:text-amber-400">
                <span>1. CPU Spike Occurs</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </span>
              <span className="flex items-center space-x-1 font-semibold text-sky-600 dark:text-sky-400">
                <span>2. Metric Increases</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </span>
              <span className="flex items-center space-x-1 font-semibold text-purple-600 dark:text-purple-400">
                <span>3. Alarm Evaluates</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </span>
              <span className="flex items-center space-x-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span>4. Correlated Logs Emitted</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              When a major event occurs, metric changes propagate to CloudWatch alarms and stream correlated WARNING/ERROR logs to the associated log streams.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleToggleCpuSpikeIncident}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition shadow-sm ${
                isCpuSpikeActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isCpuSpikeActive ? 'Stop Active CPU Spike' : 'Simulate CPU Spike & Correlated Logs'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Log Streams / Groups Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
            <Layers className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
            Simulated Log Streams & Groups
          </label>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Filter by target log stream or view all streams
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* All Streams Pill */}
          <button
            onClick={() => setSelectedGroup('ALL')}
            className={`p-3 rounded-xl border text-left transition ${
              selectedGroup === 'ALL'
                ? 'bg-emerald-50 dark:bg-slate-800 border-emerald-500 ring-1 ring-emerald-500'
                : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                All Streams
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span>{logs.length} events</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Aggregated</span>
            </div>
          </button>

          {/* Individual Groups */}
          {logGroups.map((lg) => {
            const isSelected = selectedGroup === lg.name;
            const count = logs.filter((l) => l.logGroupName === lg.name).length;

            return (
              <button
                key={lg.name}
                onClick={() => setSelectedGroup(lg.name)}
                className={`p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-slate-800 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  {getStreamIcon(lg.name)}
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate" title={lg.name}>
                    {lg.name}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>{count} events</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[60px]" title={lg.resourceId}>{lg.resourceId}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs: message, resource, timestamp, or level..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Level Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Level:
            </span>
            {(['ALL', 'INFO', 'WARNING', 'ERROR'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition font-mono ${
                  levelFilter === lvl
                    ? lvl === 'ERROR'
                      ? 'bg-rose-600 text-white'
                      : lvl === 'WARNING'
                      ? 'bg-amber-600 text-white'
                      : lvl === 'INFO'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-900 text-white dark:bg-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Resource Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Resource:
            </span>
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="ALL">All Resources</option>
              {resources.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.id}
                </option>
              ))}
            </select>
          </div>

          {/* Time Filter */}
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="ALL">All Time</option>
              <option value="5m">Last 5 minutes</option>
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last 1 hour</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {isFilterActive && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center space-x-1 transition shrink-0"
              title="Reset all search queries and filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Quick query chips */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase tracking-wider font-semibold">Quick Filters:</span>
          <button
            onClick={() => setSearchQuery('CPU utilization approaching threshold')}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 text-[11px] border border-slate-200 dark:border-slate-700 whitespace-nowrap"
          >
            "CPU utilization approaching threshold"
          </button>
          <button
            onClick={() => setSearchQuery('Request timeout')}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-300 text-[11px] border border-slate-200 dark:border-slate-700 whitespace-nowrap"
          >
            "Request timeout"
          </button>
          <button
            onClick={() => setSearchQuery('Request received')}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 text-[11px] border border-slate-200 dark:border-slate-700 whitespace-nowrap"
          >
            "Request received"
          </button>
          <button
            onClick={() => setSearchQuery('AlarmTransition')}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-purple-700 dark:text-purple-300 text-[11px] border border-slate-200 dark:border-slate-700 whitespace-nowrap"
          >
            [AlarmTransition]
          </button>
        </div>
      </div>

      {/* Log Events Stream Terminal */}
      <div className="bg-[#0b132b] rounded-2xl border border-slate-800 font-mono text-xs overflow-hidden shadow-xl text-slate-100">
        {/* Terminal Header Bar */}
        <div className="bg-[#131921] px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-400 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-white font-bold">
              {selectedGroup === 'ALL' ? 'Aggregated Stream (All Groups)' : selectedGroup}
            </span>
            <span className="text-slate-400">
              ({filteredLogs.length} matching events)
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Sort order toggle */}
            <button
              onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="flex items-center space-x-1 hover:text-white transition"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Sort: {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
            </button>

            {/* Structure legend */}
            <span className="hidden md:inline text-slate-500">
              Format: [Timestamp] [Resource] [Level] [Message]
            </span>
          </div>
        </div>

        {/* Stream Log Lines */}
        <div
          ref={terminalScrollRef}
          className="p-4 max-h-[500px] overflow-y-auto space-y-2 divide-y divide-slate-800/40"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-400 font-sans text-xs">
                No log events matched your current search and filter criteria.
              </p>
              {isFilterActive && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition inline-flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          ) : (
            filteredLogs.map((log) => {
              // Level badge colors
              let levelBadge = 'text-sky-400 bg-sky-950/60 border-sky-800';
              if (log.level === 'WARNING') levelBadge = 'text-amber-400 bg-amber-950/60 border-amber-800';
              if (log.level === 'ERROR') levelBadge = 'text-rose-400 bg-rose-950/60 border-rose-800';

              const isAlarmTransition = log.message.includes('AlarmTransition');
              const isChaos = log.message.includes('SIMULATED_CHAOS_EVENT') || log.message.includes('Elevated workload');

              return (
                <div
                  key={log.id}
                  className={`pt-2 p-2.5 rounded-lg border transition ${
                    isAlarmTransition
                      ? 'bg-purple-950/20 border-purple-500/40 text-purple-200'
                      : isChaos
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : log.level === 'ERROR'
                      ? 'bg-rose-950/20 border-rose-900/60 text-slate-100 hover:border-rose-700'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2.5">
                    {/* Timestamp (e.g. 10:41:02) */}
                    <div className="flex items-center space-x-1.5 shrink-0 text-slate-400 text-[11px] font-mono" title={new Date(log.timestamp).toISOString()}>
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="font-semibold text-slate-300">
                        {formatTimeOnly(log.timestamp)}
                      </span>
                    </div>

                    {/* Resource identifier */}
                    <div className="shrink-0 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[10px] text-slate-300 font-mono">
                      <Server className="w-3 h-3 text-sky-400" />
                      <span>{log.resourceId}</span>
                    </div>

                    {/* Level Badge (INFO, WARNING, ERROR) */}
                    <div className="shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${levelBadge}`}
                      >
                        {log.level}
                      </span>
                    </div>

                    {/* Stream Tag */}
                    <span className="shrink-0 text-[10px] text-slate-500 font-mono hidden lg:inline">
                      {log.logGroupName}
                    </span>

                    {/* Message Body */}
                    <div className="flex-1 text-xs leading-relaxed break-words font-mono">
                      {log.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Manual Test Log Ingestion Form */}
      <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
              <Send className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Emit Custom Simulated Log Event
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Inject custom telemetry log payloads directly into CloudWatch streams to test live query filtering
            </p>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
            <span>Quick Samples:</span>
            <button
              type="button"
              onClick={() => {
                setCustomResource('EC2-Web-01');
                setCustomLevel('INFO');
                setCustomMessage('Request received: GET /catalog HTTP/1.1 from 192.168.1.10 - 200 OK');
              }}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-300 font-mono text-[10px]"
            >
              INFO: Request received
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomResource('EC2-Web-01');
                setCustomLevel('WARNING');
                setCustomMessage('CPU utilization approaching threshold (79.2% measured across cores)');
              }}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-300 font-mono text-[10px]"
            >
              WARNING: CPU approaching threshold
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomResource('EC2-Web-01');
                setCustomLevel('ERROR');
                setCustomMessage('Request timeout: Upstream socket timed out after 5000ms');
              }}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-300 font-mono text-[10px]"
            >
              ERROR: Request timeout
            </button>
          </div>
        </div>

        <form onSubmit={handleSendCustomLog} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Resource select */}
          <div className="sm:col-span-3">
            <select
              value={customResource}
              onChange={(e) => handleResourceChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-white font-mono"
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} ({r.type})
                </option>
              ))}
            </select>
          </div>

          {/* Log Group select */}
          <div className="sm:col-span-3">
            <select
              value={customGroup}
              onChange={(e) => setCustomGroup(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-white font-mono"
            >
              {logGroups.map((lg) => (
                <option key={lg.name} value={lg.name}>
                  {lg.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level select */}
          <div className="sm:col-span-2">
            <select
              value={customLevel}
              onChange={(e) => setCustomLevel(e.target.value as LogLevel)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-white font-mono"
            >
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          {/* Message input */}
          <div className="sm:col-span-3">
            <input
              type="text"
              required
              placeholder="Log message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
            />
          </div>

          {/* Emit button */}
          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center shadow-xs"
            >
              Emit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
