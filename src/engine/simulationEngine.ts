import {
  Resource,
  Alarm,
  MetricDataPoint,
  ChaosScenario,
  LogEvent,
  LogGroup,
  SimulationEvent
} from '../types/cloudwatch';
import { generateNextDatapoint } from './dataGenerator';
import { evaluateAlarm } from './alarmEvaluator';
import { METRIC_DEFINITIONS } from '../data/initialResources';

export interface TickResult {
  updatedMetrics: Record<string, MetricDataPoint[]>;
  updatedAlarms: Alarm[];
  newLogs: LogEvent[];
  newTimelineEvents: SimulationEvent[];
  alarmToasts: {
    type: 'ALARM' | 'OK' | 'INSUFFICIENT_DATA';
    title: string;
    message: string;
  }[];
}

/**
 * Simulation Engine Core
 * 
 * Orchestrates simulation ticks, metric generation, threshold breach detection,
 * multi-period alarm evaluation, and log stream correlation.
 */
export const SimulationEngine = {
  // Advance one tick of the entire CloudWatch monitoring environment
  processTick(
    resources: Resource[],
    currentMetrics: Record<string, MetricDataPoint[]>,
    activeChaos: ChaosScenario[],
    alarms: Alarm[],
    logGroups: LogGroup[],
    breachedMetricsTracker: Set<string>
  ): TickResult {
    const now = new Date();
    const nowIso = now.toISOString();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${h}:${m}`;

    const updatedMetrics: Record<string, MetricDataPoint[]> = {};
    const newLogs: LogEvent[] = [];
    const newTimelineEvents: SimulationEvent[] = [];
    const alarmToasts: TickResult['alarmToasts'] = [];

    // 1. Advance telemetry for each resource metric
    for (const res of resources) {
      if (res.status === 'stopped') continue;

      for (const metric of res.supportedMetrics) {
        const key = `${res.id}:${metric}`;
        const currentPoints = currentMetrics[key] || [];
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

        // Maintain rolling buffer of 60 datapoints (1 hour window)
        updatedMetrics[key] = [...currentPoints.slice(-59), nextPoint];

        // Detect threshold crossing for timeline logging
        const def = METRIC_DEFINITIONS[metric];
        if (def) {
          if (nextPoint.value > def.defaultThreshold) {
            if (!breachedMetricsTracker.has(key)) {
              breachedMetricsTracker.add(key);
              const metricTitle = metric === 'CPUUtilization' ? 'CPU' : def.displayName;
              newTimelineEvents.push({
                id: 'timeline-' + Math.random().toString(36).substring(2, 9),
                time: timeStr,
                timestamp: nowIso,
                title: `${metricTitle} threshold breached`,
                type: 'THRESHOLD_BREACHED',
                severity: 'warn',
                description: `${res.name} ${def.displayName} reached ${nextPoint.value}${def.unit === 'Percent' ? '%' : ' ' + def.unit}, breaching threshold of ${def.defaultThreshold}.`,
                resourceId: res.id
              });
            }
          } else if (nextPoint.value <= def.defaultThreshold * 0.95) {
            breachedMetricsTracker.delete(key);
          }
        }
      }
    }

    // 2. Evaluate all alarms against latest metrics
    const updatedAlarms = alarms.map((alarm) => {
      const key = `${alarm.resourceId}:${alarm.metricName}`;
      const points = updatedMetrics[key] || currentMetrics[key];
      if (!points || points.length === 0) return alarm;

      const latestPoint = points[points.length - 1];
      const result = evaluateAlarm(alarm, latestPoint.value, nowIso);

      if (result.stateChanged) {
        alarmToasts.push({
          type: result.updatedAlarm.state,
          title: `Alarm State Transition: ${alarm.name}`,
          message: `${alarm.state} ➔ ${result.updatedAlarm.state} (${result.explanation})`
        });

        // Push to timeline
        if (result.updatedAlarm.state === 'ALARM') {
          newTimelineEvents.push({
            id: 'timeline-' + Math.random().toString(36).substring(2, 9),
            time: timeStr,
            timestamp: nowIso,
            title: `${alarm.name} → ALARM`,
            type: 'ALARM_TRANSITION',
            severity: 'alarm',
            description: `${alarm.evaluationPeriods} consecutive periods exceeded threshold. ${result.explanation}`,
            resourceId: alarm.resourceId
          });
        } else if (result.updatedAlarm.state === 'OK') {
          newTimelineEvents.push({
            id: 'timeline-' + Math.random().toString(36).substring(2, 9),
            time: timeStr,
            timestamp: nowIso,
            title: `${alarm.name} → OK`,
            type: 'ALARM_TRANSITION',
            severity: 'ok',
            description: `Metric returned below threshold for recovery periods. ${result.explanation}`,
            resourceId: alarm.resourceId
          });
        }

        // Emit correlated log transition
        const matchedLogGroup = logGroups.find((lg) => lg.resourceId === alarm.resourceId);
        if (matchedLogGroup) {
          newLogs.push({
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

    // 3. Emit correlated operational logs when incidents/chaos are active
    if (activeChaos.length > 0 && Math.random() < 0.35) {
      const scenario = activeChaos[Math.floor(Math.random() * activeChaos.length)];
      const matchedLg = logGroups.find((lg) => lg.resourceId === scenario.resourceId) || logGroups[0];
      const isErr = Math.random() > 0.5;
      newLogs.push({
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

    return {
      updatedMetrics,
      updatedAlarms,
      newLogs,
      newTimelineEvents,
      alarmToasts
    };
  }
};
