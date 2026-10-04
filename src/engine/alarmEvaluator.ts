import { Alarm, AlarmState, ComparisonOperator } from '../types/cloudwatch';

export function isDatapointBreaching(
  value: number,
  threshold: number,
  operator: ComparisonOperator
): boolean {
  switch (operator) {
    case 'GreaterThanOrEqualToThreshold':
      return value >= threshold;
    case 'GreaterThanThreshold':
      return value > threshold;
    case 'LessThanOrEqualToThreshold':
      return value <= threshold;
    case 'LessThanThreshold':
      return value < threshold;
    default:
      return false;
  }
}

export function formatOperator(operator: ComparisonOperator): string {
  switch (operator) {
    case 'GreaterThanOrEqualToThreshold':
      return 'greater than or equal to (≥)';
    case 'GreaterThanThreshold':
      return 'greater than (>)';
    case 'LessThanOrEqualToThreshold':
      return 'less than or equal to (≤)';
    case 'LessThanThreshold':
      return 'less than (<)';
  }
}

export interface EvaluationResult {
  updatedAlarm: Alarm;
  stateChanged: boolean;
  breachingCount: number;
  explanation: string;
}

export function evaluateAlarm(
  alarm: Alarm,
  newDatapoint: number,
  timestamp: string = new Date().toISOString()
): EvaluationResult {
  // Update sliding buffer (maintain last N evaluation periods)
  const N = alarm.evaluationPeriods;
  const M = alarm.datapointsToAlarm;
  const newBuffer = [...alarm.evaluationBuffer, Number(newDatapoint.toFixed(1))].slice(-N);

  let nextState: AlarmState = alarm.state;
  let explanation = '';
  let breachingCount = 0;

  if (newBuffer.length < N) {
    nextState = 'INSUFFICIENT_DATA';
    explanation = `Insufficient Datapoints: CloudWatch requires ${N} evaluation periods to reliably determine state, but currently only has ${newBuffer.length} datapoint(s) [${newBuffer.join(', ')}].`;
  } else {
    // Count breaching points
    breachingCount = newBuffer.filter((val) =>
      isDatapointBreaching(val, alarm.threshold, alarm.comparisonOperator)
    ).length;

    const opDesc = formatOperator(alarm.comparisonOperator);

    if (breachingCount >= M) {
      nextState = 'ALARM';
      explanation = `Threshold Crossed: ${breachingCount} out of the last ${N} datapoints [${newBuffer.join(', ')}] were ${opDesc} the threshold (${alarm.threshold}). Condition (${M} of ${N}) met.`;
    } else {
      nextState = 'OK';
      explanation = `Threshold Not Crossed: ${breachingCount} out of the last ${N} datapoints [${newBuffer.join(', ')}] met the alarm condition, which is less than the required ${M} datapoints. State is OK.`;
    }
  }

  const stateChanged = nextState !== alarm.state;
  const newHistory = stateChanged
    ? [
        {
          timestamp,
          fromState: alarm.state,
          toState: nextState,
          reason: explanation
        },
        ...alarm.history.slice(0, 19)
      ]
    : alarm.history;

  return {
    stateChanged,
    breachingCount,
    explanation,
    updatedAlarm: {
      ...alarm,
      state: nextState,
      stateReason: explanation,
      stateUpdatedTimestamp: stateChanged ? timestamp : alarm.stateUpdatedTimestamp,
      evaluationBuffer: newBuffer,
      history: newHistory
    }
  };
}
