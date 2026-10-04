import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AWS_RESOURCES } from '../data/initialResources';
import { INITIAL_ALARMS } from '../data/initialAlarms';
import { INITIAL_LOG_GROUPS, INITIAL_LOG_EVENTS } from '../data/initialLogs';
import {
  AWSResource,
  Alarm,
  LogEvent,
  LogGroup,
  MetricDatapoint,
  ChaosScenario,
  AlarmState
} from '../types/cloudwatch';
import {
  generateInitialHistory,
  generateNextDatapoint,
  PRESET_CHAOS_SCENARIOS
} from '../engine/metricGenerator';
import { evaluateAlarm } from '../engine/alarmEvaluator';

export interface NotificationToast {
  id: string;
  timestamp: string;
  type: 'ALARM' | 'OK' | 'INSUFFICIENT_DATA' | 'CHAOS';
  title: string;
  message: string;
}

export interface PipelineAuditLog {
  id: string;
  timestamp: string;
  stage: 'Resource' | 'Metrics' | 'Dashboard' | 'AlarmEvaluation' | 'AlarmState' | 'Logs';
  resourceId: string;
  details: string;
  severity: 'info' | 'warn' | 'alarm';
}

interface CloudWatchContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  environment: string;
  setEnvironment: (env: string) => void;
  resources: AWSResource[];
  setResources: React.Dispatch<React.SetStateAction<AWSResource[]>>;
  alarms: Alarm[];
  logGroups: LogGroup[];
  logs: LogEvent[];
  metricHistory: Record<string, MetricDatapoint[]>;
  activeChaos: ChaosScenario[];
  isSimulating: boolean;
  simSpeed: number; // 1, 2, 5
  toasts: NotificationToast[];
  dismissToast: (id: string) => void;
  toggleSimulation: () => void;
  setSimSpeed: (speed: number) => void;
  triggerChaos: (scenarioId: string) => void;
  stopChaos: (scenarioId: string) => void;
  resetAllChaos: () => void;
  createAlarm: (newAlarm: Omit<Alarm, 'id' | 'state' | 'stateReason' | 'stateUpdatedTimestamp' | 'evaluationBuffer' | 'history'>) => void;
  deleteAlarm: (alarmId: string) => void;
  injectDatapoint: (resourceId: string, metricName: string, value: number) => void;
  addLog: (log: Omit<LogEvent, 'id' | 'timestamp'>) => void;
  activePipelineStep: string;
  setActivePipelineStep: (step: string) => void;
  pipelineAuditLogs: PipelineAuditLog[];
  toggleResourceHealth: (resourceId: string) => void;
}

const CloudWatchContext = createContext<CloudWatchContextType | undefined>(undefined);

export const CloudWatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('cw_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Default to dark for cloud monitoring dashboard
  });

  const [environment, setEnvironment] = useState<string>('Production (us-east-1)');
  const [resources, setResources] = useState<AWSResource[]>(AWS_RESOURCES);
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    const saved = localStorage.getItem('cloudwatch_sim_alarms');
    return saved ? JSON.parse(saved) : INITIAL_ALARMS;
  });
  const [logGroups] = useState<LogGroup[]>(INITIAL_LOG_GROUPS);
  const [logs, setLogs] = useState<LogEvent[]>(INITIAL_LOG_EVENTS);
  const [activeChaos, setActiveChaos] = useState<ChaosScenario[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [activePipelineStep, setActivePipelineStep] = useState<string>('Dashboard');
  const [pipelineAuditLogs, setPipelineAuditLogs] = useState<PipelineAuditLog[]>([]);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('cw_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initialize metric history for each resource's metrics
  const [metricHistory, setMetricHistory] = useState<Record<string, MetricDatapoint[]>>(() => {
    const initialMap: Record<string, MetricDatapoint[]> = {};
    for (const res of AWS_RESOURCES) {
      for (const metric of res.supportedMetrics) {
        const key = `${res.id}:${metric}`;
        initialMap[key] = generateInitialHistory(res.id, metric, 25, 60);
      }
    }
    return initialMap;
  });

  // Save alarms to localStorage
  useEffect(() => {
    localStorage.setItem('cloudwatch_sim_alarms', JSON.stringify(alarms));
  }, [alarms]);

  const pushToast = (toast: Omit<NotificationToast, 'id' | 'timestamp'>) => {
    const newToast: NotificationToast = {
      ...toast,
      id: 'toast-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString()
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleResourceHealth = (resourceId: string) => {
    setResources((prev) =>
      prev.map((r) => {
        if (r.id === resourceId) {
          const nextStatus = r.status === 'running' ? 'degraded' : 'running';
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  // Main simulation tick loop
  useEffect(() => {
    if (!isSimulating) return;

    // Base interval is 3000ms / simSpeed
    const intervalMs = Math.max(1000, 3000 / simSpeed);

    const interval = setInterval(() => {
      const nowIso = new Date().toISOString();
      const updatedMetrics: Record<string, MetricDatapoint[]> = {};
      const newLogsToAppend: LogEvent[] = [];
      const newAuditEntries: PipelineAuditLog[] = [];

      // 1. Generate new datapoints for all resources
      for (const res of resources) {
        // If resource is stopped, don't generate telemetry
        if (res.status === 'stopped') continue;

        for (const metric of res.supportedMetrics) {
          const key = `${res.id}:${metric}`;
          const currentPoints = metricHistory[key] || [];
          const lastPoint = currentPoints[currentPoints.length - 1];

          // Degraded resources get elevated metrics
          const isDegraded = res.status === 'degraded';
          const effectiveChaos = isDegraded
            ? [
                ...activeChaos,
                {
                  id: 'degraded-' + res.id,
                  name: `${res.name} Degraded State`,
                  description: 'Resource experiencing operational impairment',
                  resourceId: res.id,
                  metricTarget: metric,
                  multiplier: 2.0,
                  durationSeconds: 60
                }
              ]
            : activeChaos;

          const nextPoint = generateNextDatapoint(
            res.id,
            metric,
            lastPoint?.value,
            effectiveChaos
          );

          // Keep sliding window of last 30 datapoints
          updatedMetrics[key] = [...currentPoints.slice(-29), nextPoint];
        }
      }

      setMetricHistory((prev) => ({ ...prev, ...updatedMetrics }));

      // 2. Evaluate all alarms against latest datapoints
      setAlarms((prevAlarms) => {
        return prevAlarms.map((alarm) => {
          const key = `${alarm.resourceId}:${alarm.metricName}`;
          const points = updatedMetrics[key];
          if (!points || points.length === 0) return alarm;

          const latestPoint = points[points.length - 1];
          const result = evaluateAlarm(alarm, latestPoint.value, nowIso);

          if (result.stateChanged) {
            // Toast notification
            pushToast({
              type: result.updatedAlarm.state,
              title: `Alarm State Transition: ${alarm.name}`,
              message: `${alarm.state} ➔ ${result.updatedAlarm.state} (${result.explanation})`
            });

            // Pipeline audit entry
            newAuditEntries.push({
              id: 'audit-' + Math.random().toString(36).substring(2, 9),
              timestamp: nowIso,
              stage: 'AlarmState',
              resourceId: alarm.resourceId,
              details: `${alarm.name} state changed from ${alarm.state} to ${result.updatedAlarm.state}.`,
              severity: result.updatedAlarm.state === 'ALARM' ? 'alarm' : 'info'
            });

            // Correlate to CloudWatch Logs: automatically generate alarm state transition log!
            const matchedLogGroup = logGroups.find((lg) => lg.resourceId === alarm.resourceId);
            if (matchedLogGroup) {
              newLogsToAppend.push({
                id: 'log-' + Math.random().toString(36).substring(2, 9),
                timestamp: nowIso,
                level: result.updatedAlarm.state === 'ALARM' ? 'ERROR' : 'INFO',
                logGroupName: matchedLogGroup.name,
                resourceId: alarm.resourceId,
                message: `[CloudWatch:AlarmTransition] State changed: ${alarm.state} ➔ ${result.updatedAlarm.state} for "${alarm.name}". Evaluated ${result.breachingCount}/${alarm.evaluationPeriods} breaching points. Reason: ${result.explanation}`
              });
            }
          }

          return result.updatedAlarm;
        });
      });

      if (newLogsToAppend.length > 0) {
        setLogs((prev) => [...prev, ...newLogsToAppend]);
      }

      if (newAuditEntries.length > 0) {
        setPipelineAuditLogs((prev) => [...newAuditEntries, ...prev].slice(0, 30));
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed, resources, metricHistory, activeChaos, logGroups]);

  const toggleSimulation = () => setIsSimulating((prev) => !prev);

  const triggerChaos = (scenarioId: string) => {
    const scenario = PRESET_CHAOS_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;

    if (!activeChaos.some((c) => c.id === scenarioId)) {
      setActiveChaos((prev) => [...prev, scenario]);
      pushToast({
        type: 'CHAOS',
        title: `Chaos Incident Started: ${scenario.name}`,
        message: scenario.description
      });

      const matchedLg = logGroups.find((lg) => lg.resourceId === scenario.resourceId);
      if (matchedLg) {
        setLogs((prev) => [
          ...prev,
          {
            id: 'log-chaos-' + Date.now(),
            timestamp: new Date().toISOString(),
            level: 'WARN',
            logGroupName: matchedLg.name,
            resourceId: scenario.resourceId,
            message: `[SIMULATED_CHAOS_EVENT] Injected spike: ${scenario.name}. Target: ${scenario.metricTarget}, multiplier: ${scenario.multiplier}x.`
          }
        ]);
      }
    }
  };

  const stopChaos = (scenarioId: string) => {
    setActiveChaos((prev) => prev.filter((c) => c.id !== scenarioId));
  };

  const resetAllChaos = () => {
    setActiveChaos([]);
  };

  const createAlarm = (
    newAlarmData: Omit<Alarm, 'id' | 'state' | 'stateReason' | 'stateUpdatedTimestamp' | 'evaluationBuffer' | 'history'>
  ) => {
    const id = 'alarm-' + Math.random().toString(36).substring(2, 9);
    const nowIso = new Date().toISOString();
    const created: Alarm = {
      ...newAlarmData,
      id,
      state: 'INSUFFICIENT_DATA',
      stateReason: `Alarm created. Awaiting initial ${newAlarmData.evaluationPeriods} evaluation periods.`,
      stateUpdatedTimestamp: nowIso,
      evaluationBuffer: [],
      history: [
        {
          timestamp: nowIso,
          fromState: 'INSUFFICIENT_DATA',
          toState: 'INSUFFICIENT_DATA',
          reason: 'Alarm created in CloudWatch.'
        }
      ]
    };
    setAlarms((prev) => [created, ...prev]);
    pushToast({
      type: 'INSUFFICIENT_DATA',
      title: 'CloudWatch Alarm Created',
      message: `Created alarm "${created.name}" on ${created.resourceId}.`
    });
  };

  const deleteAlarm = (alarmId: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== alarmId));
  };

  const injectDatapoint = (resourceId: string, metricName: string, value: number) => {
    const key = `${resourceId}:${metricName}`;
    const nowIso = new Date().toISOString();
    const newPoint: MetricDatapoint = {
      timestamp: nowIso,
      value,
      unit: 'Simulated'
    };

    setMetricHistory((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []).slice(-29), newPoint]
    }));

    setAlarms((prevAlarms) =>
      prevAlarms.map((alarm) => {
        if (alarm.resourceId === resourceId && alarm.metricName === metricName) {
          const evalRes = evaluateAlarm(alarm, value, nowIso);
          if (evalRes.stateChanged) {
            pushToast({
              type: evalRes.updatedAlarm.state,
              title: `Alarm State Transition: ${alarm.name}`,
              message: `${alarm.state} ➔ ${evalRes.updatedAlarm.state}`
            });
          }
          return evalRes.updatedAlarm;
        }
        return alarm;
      })
    );
  };

  const addLog = (newLog: Omit<LogEvent, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      ...prev,
      {
        ...newLog,
        id: 'log-' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      environment,
      setEnvironment,
      resources,
      setResources,
      alarms,
      logGroups,
      logs,
      metricHistory,
      activeChaos,
      isSimulating,
      simSpeed,
      toasts,
      dismissToast,
      toggleSimulation,
      setSimSpeed,
      triggerChaos,
      stopChaos,
      resetAllChaos,
      createAlarm,
      deleteAlarm,
      injectDatapoint,
      addLog,
      activePipelineStep,
      setActivePipelineStep,
      pipelineAuditLogs,
      toggleResourceHealth
    }),
    [
      theme,
      environment,
      resources,
      alarms,
      logGroups,
      logs,
      metricHistory,
      activeChaos,
      isSimulating,
      simSpeed,
      toasts,
      activePipelineStep,
      pipelineAuditLogs
    ]
  );

  return (
    <CloudWatchContext.Provider value={value}>
      {children}
    </CloudWatchContext.Provider>
  );
};

export const useCloudWatch = () => {
  const context = useContext(CloudWatchContext);
  if (!context) {
    throw new Error('useCloudWatch must be used within a CloudWatchProvider');
  }
  return context;
};
