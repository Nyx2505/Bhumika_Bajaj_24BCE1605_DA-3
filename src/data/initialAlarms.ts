import { Alarm } from '../types/cloudwatch';

export const INITIAL_ALARMS: Alarm[] = [
  {
    id: 'alarm-ec2-01-cpu',
    name: 'EC2-Web-01-High-CPU-Utilization',
    description: 'Alerts when EC2-Web-01 CPU exceeds 80% for 3 consecutive evaluation periods.',
    resourceId: 'EC2-Web-01',
    metricName: 'CPUUtilization',
    statistic: 'Average',
    period: 60,
    evaluationPeriods: 3,
    datapointsToAlarm: 3,
    comparisonOperator: 'GreaterThanOrEqualToThreshold',
    threshold: 80,
    state: 'OK',
    stateReason: 'Threshold Not Crossed: 3 out of the last 3 datapoints [32.4%, 36.1%, 34.0%] were less than the threshold (80.0%).',
    stateUpdatedTimestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    evaluationBuffer: [32.4, 36.1, 34.0],
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
    id: 'alarm-ec2-02-memory',
    name: 'EC2-Web-02-High-Memory-Utilization',
    description: 'Alerts when EC2-Web-02 Memory exceeds 85% in at least 2 of 3 evaluation periods.',
    resourceId: 'EC2-Web-02',
    metricName: 'MemoryUtilization',
    statistic: 'Average',
    period: 60,
    evaluationPeriods: 3,
    datapointsToAlarm: 2,
    comparisonOperator: 'GreaterThanOrEqualToThreshold',
    threshold: 85,
    state: 'OK',
    stateReason: 'Threshold Not Crossed: 0 out of 3 datapoints [52.1%, 55.4%, 53.8%] breached threshold (85.0%).',
    stateUpdatedTimestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    evaluationBuffer: [52.1, 55.4, 53.8],
    history: [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        fromState: 'INSUFFICIENT_DATA',
        toState: 'OK',
        reason: 'Memory within safe limits.'
      }
    ],
    actions: {
      snsTopic: 'arn:aws:sns:us-east-1:123456789012:devops-alerts'
    }
  },
  {
    id: 'alarm-db-connections',
    name: 'Database-01-Connection-Pool-Saturation',
    description: 'Alerts if active database client connections exceed 80 in 2 of 3 periods.',
    resourceId: 'Database-01',
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
    id: 'alarm-app-errors',
    name: 'Application-Server-01-High-Error-Rate',
    description: 'Breaches if Application-Server-01 HTTP 5XX error rate reaches or exceeds 5.0% for 2 periods.',
    resourceId: 'Application-Server-01',
    metricName: 'ErrorRate',
    statistic: 'Average',
    period: 60,
    evaluationPeriods: 2,
    datapointsToAlarm: 2,
    comparisonOperator: 'GreaterThanOrEqualToThreshold',
    threshold: 5,
    state: 'OK',
    stateReason: 'Threshold Not Crossed: 0 out of 2 datapoints [0.4%, 0.6%] exceeded threshold (5.0%).',
    stateUpdatedTimestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    evaluationBuffer: [0.4, 0.6],
    history: [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        fromState: 'INSUFFICIENT_DATA',
        toState: 'OK',
        reason: 'Application error rate nominal.'
      }
    ],
    actions: {
      snsTopic: 'arn:aws:sns:us-east-1:123456789012:backend-dev-team'
    }
  },
  {
    id: 'alarm-app-latency',
    name: 'Application-Server-01-Response-Time-Degraded',
    description: 'Triggers when backend response time exceeds 400ms for 5 consecutive periods.',
    resourceId: 'Application-Server-01',
    metricName: 'ResponseTime',
    statistic: 'Average',
    period: 60,
    evaluationPeriods: 5,
    datapointsToAlarm: 5,
    comparisonOperator: 'GreaterThanThreshold',
    threshold: 400,
    state: 'INSUFFICIENT_DATA',
    stateReason: 'Insufficient Datapoints: Only 2 datapoints available [92ms, 105ms], but 5 evaluation periods required.',
    stateUpdatedTimestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    evaluationBuffer: [92, 105],
    history: [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        fromState: 'INSUFFICIENT_DATA',
        toState: 'INSUFFICIENT_DATA',
        reason: 'Waiting for 3 more datapoints before initial evaluation.'
      }
    ],
    actions: {
      autoScaling: 'arn:aws:autoscaling:us-east-1:123456789012:policy:scale-out-app'
    }
  }
];
