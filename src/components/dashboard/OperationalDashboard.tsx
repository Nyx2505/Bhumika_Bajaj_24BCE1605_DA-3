import React from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Server,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  HardDrive,
  Cpu,
  Database,
  CloudLightning
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';

interface OperationalDashboardProps {
  onNavigateTab: (tab: string) => void;
  onSelectResourceForMetrics?: (resourceId: string) => void;
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({
  onNavigateTab,
  onSelectResourceForMetrics
}) => {
  const { resources, alarms, metricHistory, logs, triggerChaos } = useCloudWatch();

  const alarmCount = alarms.filter((a) => a.state === 'ALARM').length;
  const okCount = alarms.filter((a) => a.state === 'OK').length;
  const insufficientCount = alarms.filter((a) => a.state === 'INSUFFICIENT_DATA').length;

  // Format data for Web Server CPU chart
  const ec2CpuPoints = (metricHistory['i-0a812fec99:CPUUtilization'] || []).map((pt) => ({
    time: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: pt.value
  }));

  // Format data for RDS Connections chart
  const rdsConnPoints = (metricHistory['db-orders-postgres:DatabaseConnections'] || []).map((pt) => ({
    time: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: pt.value
  }));

  // Format data for Lambda Errors chart
  const lambdaErrPoints = (metricHistory['order-processing-fn:Errors'] || []).map((pt) => ({
    time: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: pt.value
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-700/80 gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center">
            <Activity className="w-5 h-5 text-amber-400 mr-2" />
            CloudWatch Cross-Service Operational Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Production environment aggregate health, multi-resource metric streams, and live alarm telemetry
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateTab('learning')}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black text-xs font-bold rounded-md shadow-md transition flex items-center"
          >
            Launch Learning Lab 🚀
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('alarms')}
          className="cursor-pointer bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl p-4 transition shadow-sm hover:border-red-500/50 group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Alarms in ALARM</span>
            <div className="p-1.5 rounded-md bg-red-500/10 text-red-400 group-hover:scale-110 transition">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span
              className={`text-2xl font-black ${
                alarmCount > 0 ? 'text-red-500 animate-pulse' : 'text-slate-100'
              }`}
            >
              {alarmCount}
            </span>
            <span className="text-[11px] text-slate-400">
              {alarmCount > 0 ? 'breaches active' : 'all thresholds safe'}
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('alarms')}
          className="cursor-pointer bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl p-4 transition shadow-sm hover:border-emerald-500/50 group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Alarms in OK State</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-400">{okCount}</span>
            <span className="text-[11px] text-slate-400">evaluating normal</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('metrics')}
          className="cursor-pointer bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl p-4 transition shadow-sm hover:border-sky-500/50 group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Monitored Resources</span>
            <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 group-hover:scale-110 transition">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-sky-400">{resources.length}</span>
            <span className="text-[11px] text-slate-400">EC2, RDS, Lambda, ALB</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('logs')}
          className="cursor-pointer bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl p-4 transition shadow-sm hover:border-purple-500/50 group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Ingested Log Events</span>
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-purple-400">{logs.length}</span>
            <span className="text-[11px] text-slate-400">streams active</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: EC2 CPU Utilization */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 bg-amber-500/10 text-amber-400 rounded">
                  <Cpu className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-white">web-server-prod-01 : CPUUtilization</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Target Threshold: <strong className="text-red-400">≥ 80%</strong> | Period: 1m
              </p>
            </div>
            <button
              onClick={() => triggerChaos('chaos-ec2-cpu-spike')}
              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-600 px-2 py-1 rounded transition"
              title="Inject sudden traffic surge"
            >
              Surge Spike ⚡
            </button>
          </div>

          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ec2CpuPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} unit="%" tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '8px', fontSize: '11px' }}
                />
                <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Alarm Threshold 80%', fill: '#ef4444', fontSize: 10, position: 'top' }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#38bdf8' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: RDS Database Connections */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 bg-blue-500/10 text-blue-400 rounded">
                  <Database className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-white">orders-primary-db : DatabaseConnections</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Target Threshold: <strong className="text-red-400">&gt; 80 connections</strong> | Period: 1m
              </p>
            </div>
            <button
              onClick={() => triggerChaos('chaos-rds-leak')}
              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-600 px-2 py-1 rounded transition"
              title="Simulate connection leak"
            >
              Simulate Leak ⚡
            </button>
          </div>

          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rdsConnPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '8px', fontSize: '11px' }}
                />
                <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Alarm Threshold 80', fill: '#ef4444', fontSize: 10, position: 'top' }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#a855f7' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CloudWatch Alarms Overview Table */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Active CloudWatch Alarms Evaluation Status</h3>
          </div>
          <button
            onClick={() => onNavigateTab('alarms')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center"
          >
            Manage All Alarms <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-2">State</th>
                <th className="pb-2">Alarm Name</th>
                <th className="pb-2">Resource</th>
                <th className="pb-2">Condition</th>
                <th className="pb-2">Evaluation Buffer (M of N)</th>
                <th className="pb-2">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {alarms.map((alarm) => {
                let badgeClass = 'bg-slate-700 text-slate-300';
                if (alarm.state === 'ALARM') badgeClass = 'bg-red-500/20 text-red-400 border border-red-500/40 font-bold';
                if (alarm.state === 'OK') badgeClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
                if (alarm.state === 'INSUFFICIENT_DATA') badgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';

                return (
                  <tr key={alarm.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 pr-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${badgeClass}`}>
                        {alarm.state}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-white">
                      {alarm.name}
                    </td>
                    <td className="py-3 font-mono text-slate-300 text-[11px]">
                      {alarm.resourceId}
                    </td>
                    <td className="py-3 text-slate-300">
                      {alarm.metricName} {alarm.comparisonOperator.includes('Greater') ? '≥' : '≤'} {alarm.threshold}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-1 font-mono text-[11px]">
                        <span className="text-amber-400 font-bold">{alarm.datapointsToAlarm}</span>
                        <span className="text-slate-400">of</span>
                        <span className="text-slate-200">{alarm.evaluationPeriods}</span>
                        <span className="text-slate-400 ml-1">
                          [{alarm.evaluationBuffer.join(', ')}]
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">
                      {new Date(alarm.stateUpdatedTimestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monitored AWS Resources Grid */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Simulated AWS Infrastructure Topology</h3>
          </div>
          <span className="text-xs text-slate-400">
            Telemetry streamed to CloudWatch continuously
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res) => (
            <div
              key={res.id}
              onClick={() => {
                if (onSelectResourceForMetrics) onSelectResourceForMetrics(res.id);
                onNavigateTab('metrics');
              }}
              className="cursor-pointer bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 hover:border-sky-500 rounded-lg p-3.5 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase">
                  {res.type}
                </span>
                <span className="flex items-center text-[11px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                  {res.status}
                </span>
              </div>
              <div className="mt-2 font-bold text-sm text-white group-hover:text-amber-400 transition truncate">
                {res.name}
              </div>
              <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                {res.id}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {res.supportedMetrics.map((m) => (
                  <span
                    key={m}
                    className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
