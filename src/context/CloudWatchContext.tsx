import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { AWS_RESOURCES, METRIC_DEFINITIONS } from '../data/initialResources';
import { INITIAL_ALARMS } from '../data/initialAlarms';
import { INITIAL_LOG_GROUPS, INITIAL_LOG_EVENTS } from '../data/initialLogs';
import {
  AWSResource,
  Alarm,
  LogEvent,
  LogGroup,
  MetricDatapoint,
  ChaosScenario,
  SimulatorIncidentType,
  SimulatorTimelineEvent
} from '../types/cloudwatch';
import {
  generateInitialHistory,
  generateNextDatapoint,
  PRESET_CHAOS_SCENARIOS,
  getScenarioForIncident
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
  activeIncident: SimulatorIncidentType;
  triggerIncident: (incident: SimulatorIncidentType) => void;
  timelineEvents: SimulatorTimelineEvent[];
  clearTimeline: () => void;
  isSimulating: boolean;
  simSpeed: number; // 1, 2, 5
  toasts: NotificationToast[];
  dismissToast: (id: string) => void;
  toggleSimulation: () => void;
  setSimSpeed: (speed: number) => void;
  triggerChaos: (scenarioId: string) => void;
  stopChaos: (scenarioId: string) => void;
  resetAllChaos: () => void;
  resetSimulation: () => void;
  createAlarm: (newAlarm: Omit<Alarm, 'id' | 'state' | 'stateReason' | 'stateUpdatedTimestamp' | 'evaluationBuffer' | 'history'>) => void;
  deleteAlarm: (alarmId: string) => void;
  injectDatapoint: (resourceId: string, metricName: string, value: number) => void;
  addLog: (log: Omit<LogEvent, 'id' | 'timestamp'>) => void;
  activePipelineStep: string;
  setActivePipelineStep: (step: string) => void;
  pipelineAuditLogs: PipelineAuditLog[];
  toggleResourceHealth: (resourceId: string) => void;
  totalMetricsTracked: number;
}

const CloudWatchContext = createContext<CloudWatchContextType | undefined>(undefined);

export const CloudWatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('cw_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
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
  const [activeIncident, setActiveIncident] = useState<SimulatorIncidentType>('NORMAL');
  const [timelineEvents, setTimelineEvents] = useState<SimulatorTimelineEvent[]>(() => {
    const now = Date.now();
    const d1 = new Date(now - 1000 * 60 * 10);
    const h = d1.getHours().toString().padStart(2, '0');
    const m = d1.getMinutes().toString().padStart(2, '0');
    return [
      {
        id: 'evt-init-1',
        time: `${h}:${m}`,
        timestamp: d1.toISOString(),
        title: 'Normal operation',
        type: 'NORMAL',
        severity: 'ok',
        description: 'Simulated environment running with standard operational traffic and telemetry.'
      }
    ];
  });

  const breachedMetricsRef = useRef<Set<string>>(new Set());

  const pushTimelineEvent = (event: Omit<SimulatorTimelineEvent, 'id' | 'time' | 'timestamp'>) => {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const newEvt: SimulatorTimelineEvent = {
      ...event,
      id: 'timeline-' + Math.random().toString(36).substring(2, 9),
      time: `${h}:${m}`,
      timestamp: now.toISOString()
    };
    setTimelineEvents((prev) => [newEvt, ...prev.slice(0, 39)]);
  };

  const clearTimeline = () => {
    setTimelineEvents([]);
  };

  const triggerIncident = (incident: SimulatorIncidentType) => {
    setActiveIncident(incident);

    if (incident === 'NORMAL') {
      setActiveChaos([]);
      pushTimelineEvent({
        title: 'Normal operation',
        type: 'NORMAL',
        severity: 'ok',
        description: 'Simulation environment set to normal steady-state operation.'
      });
      pushToast({
        type: 'OK',
        title: 'Normal Operation',
        message: 'All metrics returning smoothly to baseline ranges.'
      });
    } else if (incident === 'RECOVERY') {
      setActiveChaos([]);
      pushTimelineEvent({
        title: 'Recovery triggered',
        type: 'RECOVERY_TRIGGERED',
        severity: 'ok',
        description: 'Mitigation initiated. Telemetry metrics will gradually return toward normal ranges.'
      });
      pushToast({
        type: 'OK',
        title: 'Recovery Initiated',
        message: 'Metrics are gradually descending to healthy baselines.'
      });
    } else {
      const scenarios = getScenarioForIncident(incident);
      setActiveChaos(scenarios);

      let title = '';
      let desc = '';
      if (incident === 'CPU_SPIKE') {
        title = 'CPU Spike triggered';
        desc = 'Heavy compute workload injected on EC2-Web-01. CPU will gradually rise: 45% → 61% → 74% → 83% → 91%.';
      } else if (incident === 'TRAFFIC_SPIKE') {
        title = 'Traffic Spike triggered';
        desc = 'Surge in inbound HTTP traffic: Request count, network throughput, and CPU load increasing.';
      } else if (incident === 'ERROR_SPIKE') {
        title = 'Error Spike triggered';
        desc = 'API backend failures cascading: Error count and error rate increasing.';
      } else if (incident === 'DATABASE_LOAD') {
        title = 'Database Load triggered';
        desc = 'Complex join saturation: Database CPU, connection pool, and latency increasing.';
      }

      pushTimelineEvent({
        title,
        type: 'INCIDENT_TRIGGERED',
        severity: 'warn',
        description: desc
      });

      pushToast({
        type: 'CHAOS',
        title,
        message: desc
      });
    }
  };

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

  // Helper to build initial stable telemetry map
  const buildInitialMetricMap = () => {
    const initialMap: Record<string, MetricDatapoint[]> = {};
    for (const res of AWS_RESOURCES) {
      for (const metric of res.supportedMetrics) {
        const key = `${res.id}:${metric}`;
        // 60 datapoints = 60 minutes of initial history
        initialMap[key] = generateInitialHistory(res.id, metric, 60, 60);
      }
    }
    return initialMap;
  };

  // Initialize metric history for each resource's metrics
  const [metricHistory, setMetricHistory] = useState<Record<string, MetricDatapoint[]>>(buildInitialMetricMap);

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

  // Reset simulation function
  const resetSimulation = () => {
    localStorage.removeItem('cloudwatch_sim_alarms');
    setAlarms(INITIAL_ALARMS);
    setResources(AWS_RESOURCES);
    setActiveChaos([]);
    setActiveIncident('NORMAL');
    setLogs(INITIAL_LOG_EVENTS);
    setMetricHistory(buildInitialMetricMap());
    setPipelineAuditLogs([]);
    breachedMetricsRef.current.clear();
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    setTimelineEvents([
      {
        id: 'evt-reset-' + Date.now(),
        time: `${h}:${m}`,
        timestamp: now.toISOString(),
        title: 'Normal operation',
        type: 'NORMAL',
        severity: 'ok',
        description: 'Simulation reset. Metrics, alarms, and baseline history restored.'
      }
    ]);
    pushToast({
      type: 'OK',
      title: 'Simulation Reset',
      message: 'All telemetry, metrics history, alarms, and chaos incidents have been restored to initial baseline.'
    });
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

      // 1. Generate new datapoint for each resource metric
      for (const res of resources) {
        if (res.status === 'stopped') continue;

        for (const metric of res.supportedMetrics) {
          const key = `${res.id}:${metric}`;
          const currentPoints = metricHistory[key] || [];
          const lastPoint = currentPoints[currentPoints.length - 1];

          const isDegraded = res.status === 'degraded';
          const effectiveChaos = isDegraded
            ? [
                ...activeChaos,
                {
                  id: 'degraded-' + res.id,
                  name: `${res.name} Degraded State`,
                  description: 'Resource operational degradation active',
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

          // Maintain a rolling buffer of 60 datapoints (1 hour)
          updatedMetrics[key] = [...currentPoints.slice(-59), nextPoint];

          // Check for threshold breach in timeline
          const def = METRIC_DEFINITIONS[metric];
          if (def) {
            if (nextPoint.value > def.defaultThreshold) {
              if (!breachedMetricsRef.current.has(key)) {
                breachedMetricsRef.current.add(key);
                const metricTitle = metric === 'CPUUtilization' ? 'CPU' : def.displayName;
                pushTimelineEvent({
                  title: `${metricTitle} threshold breached`,
                  type: 'THRESHOLD_BREACHED',
                  severity: 'warn',
                  description: `${res.name} ${def.displayName} reached ${nextPoint.value}${def.unit === 'Percent' ? '%' : ' ' + def.unit}, breaching threshold of ${def.defaultThreshold}.`,
                  resourceId: res.id
                });
              }
            } else if (nextPoint.value <= def.defaultThreshold * 0.95) {
              breachedMetricsRef.current.delete(key);
            }
          }
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
            pushToast({
              type: result.updatedAlarm.state,
              title: `Alarm State Transition: ${alarm.name}`,
              message: `${alarm.state} ➔ ${result.updatedAlarm.state} (${result.explanation})`
            });

            newAuditEntries.push({
              id: 'audit-' + Math.random().toString(36).substring(2, 9),
              timestamp: nowIso,
              stage: 'AlarmState',
              resourceId: alarm.resourceId,
              details: `${alarm.name} state changed from ${alarm.state} to ${result.updatedAlarm.state}.`,
              severity: result.updatedAlarm.state === 'ALARM' ? 'alarm' : 'info'
            });

            // Log alarm transition to simulator event timeline
            if (result.updatedAlarm.state === 'ALARM') {
              pushTimelineEvent({
                title: `${alarm.name} → ALARM`,
                type: 'ALARM_TRANSITION',
                severity: 'alarm',
                description: `${alarm.evaluationPeriods} consecutive periods exceeded threshold. ${result.explanation}`,
                resourceId: alarm.resourceId
              });
            } else if (result.updatedAlarm.state === 'OK') {
              pushTimelineEvent({
                title: `${alarm.name} → OK`,
                type: 'ALARM_TRANSITION',
                severity: 'ok',
                description: `Metric returned below threshold for recovery periods. ${result.explanation}`,
                resourceId: alarm.resourceId
              });
            }

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

      // 3. When chaos is active, emit periodic correlated log entries
      if (activeChaos.length > 0 && Math.random() < 0.4) {
        const scenario = activeChaos[Math.floor(Math.random() * activeChaos.length)];
        const matchedLg = logGroups.find((lg) => lg.resourceId === scenario.resourceId) || logGroups[0];
        const isErr = Math.random() > 0.5;
        newLogsToAppend.push({
          id: 'log-' + Math.random().toString(36).substring(2, 9),
          timestamp: nowIso,
          level: isErr ? 'ERROR' : 'WARNING',
          logGroupName: matchedLg.name,
          resourceId: scenario.resourceId,
          message: isErr
            ? `Request timeout: Upstream worker pool under pressure on ${scenario.resourceId} (${scenario.metricTarget} elevated).`
            : `CPU utilization approaching threshold on ${scenario.resourceId} (active surge detected).`
        });
      }

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
        title: `Chaos Incident Injected: ${scenario.name}`,
        message: scenario.description
      });

      const matchedLg = logGroups.find((lg) => lg.resourceId === scenario.resourceId) || logGroups[0];
      const now = Date.now();
      
      // Correlated log sequence illustrating connected workflow:
      // Incident/Spike -> Metric Rises -> Alarms Evaluate -> Correlated Log Stream Output
      const correlatedLogs: LogEvent[] = [
        {
          id: 'log-spike-info-' + now,
          timestamp: new Date(now - 3000).toISOString(),
          level: 'INFO',
          logGroupName: matchedLg.name,
          resourceId: scenario.resourceId,
          message: `Elevated workload detected on ${scenario.resourceId}. Request arrival velocity spiked (${scenario.name}).`
        },
        {
          id: 'log-spike-warn-' + now,
          timestamp: new Date(now - 1500).toISOString(),
          level: 'WARNING',
          logGroupName: matchedLg.name,
          resourceId: scenario.resourceId,
          message: `${scenario.metricTarget} approaching threshold on ${scenario.resourceId}. Measured load exceeding standard baseline.`
        },
        {
          id: 'log-spike-err-' + now,
          timestamp: new Date(now).toISOString(),
          level: 'ERROR',
          logGroupName: matchedLg.name,
          resourceId: scenario.resourceId,
          message: `Request timeout: Upstream worker pool under pressure on ${scenario.resourceId} (${scenario.name}).`
        }
      ];

      setLogs((prev) => [...prev, ...correlatedLogs]);
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
      [key]: [...(prev[key] || []).slice(-59), newPoint]
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

  const totalMetricsTracked = useMemo(() => {
    return resources.reduce((acc, r) => acc + r.supportedMetrics.length, 0);
  }, [resources]);

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
      activeIncident,
      triggerIncident,
      timelineEvents,
      clearTimeline,
      isSimulating,
      simSpeed,
      toasts,
      dismissToast,
      toggleSimulation,
      setSimSpeed,
      triggerChaos,
      stopChaos,
      resetAllChaos,
      resetSimulation,
      createAlarm,
      deleteAlarm,
      injectDatapoint,
      addLog,
      activePipelineStep,
      setActivePipelineStep,
      pipelineAuditLogs,
      toggleResourceHealth,
      totalMetricsTracked
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
      activeIncident,
      timelineEvents,
      isSimulating,
      simSpeed,
      toasts,
      activePipelineStep,
      pipelineAuditLogs,
      totalMetricsTracked
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
