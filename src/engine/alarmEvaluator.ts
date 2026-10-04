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

export function getOperatorSymbol(operator: ComparisonOperator): string {
  switch (operator) {
    case 'GreaterThanOrEqualToThreshold':
      return '>=';
    case 'GreaterThanThreshold':
      return '>';
    case 'LessThanOrEqualToThreshold':
      return '<=';
    case 'LessThanThreshold':
      return '<';
  }
}

export function formatOperator(operator: ComparisonOperator): string {
  switch (operator) {
    case 'GreaterThanOrEqualToThreshold':
      return 'greater than or equal to (>=)';
    case 'GreaterThanThreshold':
      return 'greater than (>)';
    case 'LessThanOrEqualToThreshold':
      return 'less than or equal to (<=)';
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
  const M = alarm.datapointsToAlarm || N;
  const newBuffer = [...alarm.evaluationBuffer, Number(newDatapoint.toFixed(1))].slice(-N);

  let nextState: AlarmState = alarm.state;
  let explanation = '';
  let breachingCount = 0;

  if (newBuffer.length < N) {
    nextState = 'INSUFFICIENT_DATA';
    explanation = `Insufficient Datapoints: CloudWatch requires ${N} consecutive evaluation periods to reliably determine state, but currently only has ${newBuffer.length} datapoint(s) [${newBuffer.join(', ')}].`;
  } else {
    // Count breaching points in the sliding window
    breachingCount = newBuffer.filter((val) =>
      isDatapointBreaching(val, alarm.threshold, alarm.comparisonOperator)
    ).length;

    const opSymbol = getOperatorSymbol(alarm.comparisonOperator);

    if (breachingCount >= M) {
      nextState = 'ALARM';
      explanation = `Threshold Crossed: ${breachingCount} of the last ${N} consecutive datapoints [${newBuffer.join(', ')}] were ${opSymbol} threshold (${alarm.threshold}). Alarm condition met.`;
    } else {
      nextState = 'OK';
      explanation = `Threshold Not Crossed: ${breachingCount} of the last ${N} consecutive datapoints [${newBuffer.join(', ')}] breached threshold. Condition not met (requires ${M} of ${N}). State is OK.`;
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
        ...alarm.history.slice(0, 49) // Keep last 50 transitions for rich history
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
