import { ComparisonOperator, AlarmState, Metric } from '../types/cloudwatch';
import { isDatapointBreaching, getOperatorSymbol } from './alarmEvaluator';

export interface SimulatedPeriodValue {
  id: number;
  value: number;
}

export interface LearningAlarmConfig {
  resourceId: string;
  metricName: string;
  statistic: string;
  operator: ComparisonOperator;
  threshold: number;
  evaluationPeriods: number;
  datapointsToAlarm?: number;
}

export interface PeriodEvaluationStep {
  period: number;
  value: number;
  isBreaching: boolean;
  activeWindow: number[];
  breachingCountInWindow: number;
  requiredBreaches: number;
  stateAtStep: AlarmState;
  explanation: string;
}

/**
 * Learning Mode Logic Engine
 * 
 * Separates educational evaluation, challenge validation, and interactive
 * sliding window explainability from UI display components.
 */
export const LearningEngine = {
  // Generate baseline 5 periods of normal steady traffic
  generateNormalPeriods(metricDef?: Metric): SimulatedPeriodValue[] {
    const min = metricDef ? metricDef.normalMin : 20;
    const max = metricDef ? metricDef.normalMax : 50;
    const step = (max - min) / 4;
    return [
      { id: 1, value: Math.round(min + step * 0.5) },
      { id: 2, value: Math.round(min + step * 1.5) },
      { id: 3, value: Math.round(min + step * 2.5) },
      { id: 4, value: Math.round(min + step * 1.8) },
      { id: 5, value: Math.round(min + step * 1.0) }
    ];
  },

  // Generate 5 periods simulating a gradual spike crossing threshold
  generateSpikePeriods(threshold: number): SimulatedPeriodValue[] {
    return [
      { id: 1, value: Math.max(1, Math.round(threshold - 15)) },
      { id: 2, value: Math.max(1, Math.round(threshold - 8)) },
      { id: 3, value: Math.round(threshold + 4) },
      { id: 4, value: Math.round(threshold + 9) },
      { id: 5, value: Math.round(threshold + 14) }
    ];
  },

  // Default initial values
  getDefaultPeriods(): SimulatedPeriodValue[] {
    return [
      { id: 1, value: 72 },
      { id: 2, value: 76 },
      { id: 3, value: 84 },
      { id: 4, value: 88 },
      { id: 5, value: 91 }
    ];
  },

  // Evaluate a sliding window step-by-step across all periods
  evaluateSlidingWindow(
    periods: SimulatedPeriodValue[],
    config: LearningAlarmConfig
  ): PeriodEvaluationStep[] {
    const N = Math.max(1, config.evaluationPeriods);
    const M = config.datapointsToAlarm || N;
    const steps: PeriodEvaluationStep[] = [];
    const buffer: number[] = [];

    periods.forEach((p, idx) => {
      buffer.push(p.value);
      const activeWindow = buffer.slice(-N);
      const isBreaching = isDatapointBreaching(p.value, config.threshold, config.operator);
      const breachingCount = activeWindow.filter((val) =>
        isDatapointBreaching(val, config.threshold, config.operator)
      ).length;

      let stateAtStep: AlarmState = 'INSUFFICIENT_DATA';
      let explanation = '';

      if (activeWindow.length < N) {
        stateAtStep = 'INSUFFICIENT_DATA';
        explanation = `Period ${idx + 1}: Insufficient datapoints. Only ${activeWindow.length} of ${N} evaluation periods gathered.`;
      } else if (breachingCount >= M) {
        stateAtStep = 'ALARM';
        explanation = `Period ${idx + 1}: ${breachingCount} of ${N} periods breached threshold (${config.threshold}). Condition met (requires ${M} of ${N}). Alarm is ALARM.`;
      } else {
        stateAtStep = 'OK';
        explanation = `Period ${idx + 1}: ${breachingCount} of ${N} periods breached. Threshold not crossed. State is OK.`;
      }

      steps.push({
        period: idx + 1,
        value: p.value,
        isBreaching,
        activeWindow,
        breachingCountInWindow: breachingCount,
        requiredBreaches: M,
        stateAtStep,
        explanation
      });
    });

    return steps;
  },

  // Generate plain-English explanation for an alarm transition
  generateExplanation(
    fromState: AlarmState,
    toState: AlarmState,
    config: LearningAlarmConfig,
    datapoints: number[]
  ): string {
    const op = getOperatorSymbol(config.operator);
    const N = config.evaluationPeriods;
    const M = config.datapointsToAlarm || N;

    if (toState === 'ALARM') {
      return `Threshold Crossed: CloudWatch evaluated the sliding window of ${N} consecutive periods [${datapoints.join(', ')}]. At least ${M} points satisfied condition "${op} ${config.threshold}". The state transitioned from ${fromState} to ALARM and triggered automated alerting.`;
    }
    if (toState === 'OK') {
      return `Threshold Not Crossed: In the most recent ${N} evaluation periods [${datapoints.join(', ')}], fewer than ${M} points breached the threshold (${config.threshold}). The health check satisfied recovery criteria, returning state to OK.`;
    }
    return `Insufficient Datapoints: CloudWatch requires ${N} consecutive periods to evaluate, but only ${datapoints.length} points were received. State set to INSUFFICIENT_DATA.`;
  },

  // Validate a challenge against current user alarm configuration
  validateChallenge(
    challengeId: string,
    config: LearningAlarmConfig
  ): boolean {
    switch (challengeId) {
      case 'ch-1':
        // High CPU: CPUUtilization, threshold between 70 and 85, >= 2 periods
        return (
          config.metricName === 'CPUUtilization' &&
          (config.operator === 'GreaterThanOrEqualToThreshold' || config.operator === 'GreaterThanThreshold') &&
          config.threshold >= 70 &&
          config.threshold <= 85 &&
          config.evaluationPeriods >= 2
        );
      case 'ch-2':
        // Low Capacity / Disk / Connections: < or <=, threshold <= 20
        return (
          (config.operator === 'LessThanThreshold' || config.operator === 'LessThanOrEqualToThreshold') &&
          config.threshold <= 20
        );
      case 'ch-3':
        // Filter out transient spikes / flap prevention: N >= 3, threshold <= 85
        return (
          config.metricName === 'CPUUtilization' &&
          config.evaluationPeriods >= 3 &&
          config.threshold <= 85
        );
      case 'ch-4':
        // DB Connections saturation: Database-01, DatabaseConnections, operator >, threshold = 80
        return (
          config.resourceId === 'Database-01' &&
          config.metricName === 'DatabaseConnections' &&
          (config.operator === 'GreaterThanThreshold' || config.operator === 'GreaterThanOrEqualToThreshold') &&
          config.threshold === 80
        );
      default:
        return false;
    }
  }
};
