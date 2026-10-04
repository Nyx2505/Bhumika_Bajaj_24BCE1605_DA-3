import { Alarm } from '../types/cloudwatch';

export const INITIAL_ALARMS: Alarm[] = [
  {
    id: 'alarm-ec2-cpu-high',
    name: 'EC2-High-CPU-Utilization-WebProd',
    description: 'Triggers when EC2 web server CPU exceeds 80% for 3 consecutive evaluation periods.',
    resourceId: 'i-0a812fec99',
    metricName: 'CPUUtilization',
    statistic: 'Average',
    period: 60,
    evaluationPeriods: 3,
    datapointsToAlarm: 3,
    comparisonOperator: 'GreaterThanOrEqualToThreshold',
    threshold: 80,
    state: 'OK',
    stateReason: 'Threshold Not Crossed: 3 out of the last 3 datapoints [32.1%, 38.5%, 34.2%] were less than the threshold (80.0%).',
    stateUpdatedTimestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    evaluationBuffer: [32.1, 38.5, 34.2],
    history: [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        fromState: 'INSUFFICIENT_DATA',
        toState: 'OK',
        reason: 'Received initial 3 datapoints below threshold (80.0%).'
      }
    ],
    actions: {
      snsTopic: 'arn:aws:sns:us-east-1:123456789012:ops-critical-alerts',
      autoScaling: 'arn:aws:autoscaling:us-east-1:123456789012:policy:scale-out-web'
    }
  },
  {
    id: 'alarm-rds-connections',
    name: 'RDS-Database-Connections-Saturated',
    description: 'Alerts if active client database connections exceed 80 in at least 2 of 3 evaluation periods.',
    resourceId: 'db-orders-postgres',
    metricName: 'DatabaseConnections',
    statistic: 'Maximum',
    period: 60,
    evaluationPeriods: 3,
    datapointsToAlarm: 2,
    comparisonOperator: 'GreaterThanThreshold',
    threshold: 80,
    state: 'OK',
    stateReason: 'Threshold Not Crossed: 0 out of 3 datapoints [24, 28, 26] exceeded threshold (80).',
    stateUpdatedTimestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    evaluationBuffer: [24, 28, 26],
    history: [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        fromState: 'INSUFFICIENT_DATA',
        toState: 'OK',
        reason: 'Sufficient metrics gathered within safe parameters.'
      }
    ],
    actions: {
      snsTopic: 'arn:aws:sns:us-east-1:123456789012:dba-oncall-team'
    }
  },
  {
    id: 'alarm-lambda-errors',
    name: 'Lambda-OrderCheckout-Errors-High',
    description: 'Breaches if order processing function generates 5 or more errors in 2 consecutive periods.',
    resourceId: 'order-processing-fn',
    metricName: 'Errors',
    statistic: 'Sum',
    period: 60,
    evaluationPeriods: 2,
    datapointsToAlarm: 2,
    comparisonOperator: 'GreaterThanOrEqualToThreshold',
    threshold: 5,
    state: 'OK',
    stateReason: 'Threshold Not Crossed: 0 out of 2 datapoints [0, 0] were greater than or equal to threshold (5).',
    stateUpdatedTimestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    evaluationBuffer: [0, 0],
    history: [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        fromState: 'INSUFFICIENT_DATA',
        toState: 'OK',
        reason: 'Zero error count across monitoring intervals.'
      }
    ],
    actions: {
      snsTopic: 'arn:aws:sns:us-east-1:123456789012:ecommerce-dev-team'
    }
  },
  {
    id: 'alarm-worker-idle',
    name: 'Worker-Batch-Idle-ScaleIn-Candidate',
    description: 'Evaluates if batch processing worker has CPU < 10% for 5 periods to trigger downscaling.',
    resourceId: 'i-09bc83a152',
    metricName: 'CPUUtilization',
    statistic: 'Average',
    period: 60,
    evaluationPeriods: 5,
    datapointsToAlarm: 5,
    comparisonOperator: 'LessThanThreshold',
    threshold: 10,
    state: 'INSUFFICIENT_DATA',
    stateReason: 'Insufficient Datapoints: Only 2 datapoints available [22.4%, 25.1%], but 5 evaluation periods required.',
    stateUpdatedTimestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    evaluationBuffer: [22.4, 25.1],
    history: [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        fromState: 'INSUFFICIENT_DATA',
        toState: 'INSUFFICIENT_DATA',
        reason: 'Waiting for 3 more datapoints before initial evaluation.'
      }
    ],
    actions: {
      autoScaling: 'arn:aws:autoscaling:us-east-1:123456789012:policy:scale-in-worker'
    }
  }
];
