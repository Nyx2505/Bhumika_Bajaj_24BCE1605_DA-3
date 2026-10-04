import { LearningChallenge } from '../types/cloudwatch';

export const LEARNING_CHALLENGES: LearningChallenge[] = [
  {
    id: 'challenge-flapping',
    title: 'Challenge 1: Stop the Pager Storm (Eliminate Alarm Flapping)',
    difficulty: 'Beginner',
    scenario: 'Your production web server runs periodic background cache refreshes that spike CPU to 85% for 30 seconds before dropping back down to 30%. The current alarm fires and clears repeatedly, causing alert fatigue for the DevOps team.',
    architectureContext: 'AWS Well-Architected Operational Excellence Pillar recommends calibrating alarm evaluation windows to distinguish between transient load spikes and sustained outages.',
    objective: 'Reconfigure the alarm evaluation periods so that 1 or 2 brief spikes do NOT trigger the alarm, but sustained load does. Require at least 3 evaluation periods (N ≥ 3) and M ≥ 3 datapoints to alarm.',
    resourceId: 'EC2-Web-01',
    metricName: 'CPUUtilization',
    initialConfig: {
      threshold: 80,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: 'GreaterThanOrEqualToThreshold'
    },
    sampleDatapoints: [32, 86, 34, 31, 88, 30],
    targetOutcome: {
      expectedState: 'OK',
      minEvaluationPeriods: 3,
      minThreshold: 80,
      maxThreshold: 90,
      requiredComparisonOperator: 'GreaterThanOrEqualToThreshold'
    },
    architectExplanation: 'By requiring 3 out of 3 consecutive evaluation periods above 80%, isolated 1-minute cron spikes (86% and 88%) are safely filtered out, preventing costly pager storm interruptions while keeping sustained incident detection intact.'
  },
  {
    id: 'challenge-leak',
    title: 'Challenge 2: Catch the Database Connection Pool Leak',
    difficulty: 'Intermediate',
    scenario: 'A newly deployed microservice has a bug where PostgreSQL database connections are not being closed. Connections are linearly climbing from 25 to over 90. We need to catch this breach before RDS reaches its hard maximum connection limit (100).',
    architectureContext: 'In AWS RDS monitoring, database connection saturation leads to dropped queries and cascading 504 Gateway Timeouts across the Application Load Balancer.',
    objective: 'Set a threshold between 70 and 80 connections, with 2 out of 3 evaluation periods (M=2, N=3) using GreaterThanThreshold. The alarm must transition to ALARM on sustained connection growth.',
    resourceId: 'Database-01',
    metricName: 'DatabaseConnections',
    initialConfig: {
      threshold: 95,
      evaluationPeriods: 5,
      datapointsToAlarm: 5,
      comparisonOperator: 'GreaterThanThreshold'
    },
    sampleDatapoints: [30, 48, 62, 78, 86, 92],
    targetOutcome: {
      expectedState: 'ALARM',
      minThreshold: 70,
      maxThreshold: 80,
      minEvaluationPeriods: 2,
      maxEvaluationPeriods: 4,
      requiredComparisonOperator: 'GreaterThanThreshold'
    },
    architectExplanation: 'Setting the threshold at 75 with 2 out of 3 periods allows early warning before RDS hard crashes, giving auto-remediation scripts or on-call DBAs sufficient runway to drain stale pools.'
  },
  {
    id: 'challenge-scale-in',
    title: 'Challenge 3: Safe EC2 Auto Scaling Scale-In Policy',
    difficulty: 'Architect',
    scenario: 'You want to reduce AWS bill costs by terminating idle EC2 worker instances when queue traffic diminishes. However, scaling in prematurely causes instance thrashing (rapidly killing and rebooting instances), increasing cold-start latency.',
    architectureContext: 'AWS Auto Scaling best practices advise applying a conservative evaluation period (e.g. 5 consecutive periods) for scale-in alarms to verify workload depletion before terminating compute resources.',
    objective: 'Configure a scale-in alarm for CPU Utilization below 15% using LessThanThreshold. Require 5 evaluation periods (N=5) and 5 datapoints to alarm (M=5).',
    resourceId: 'EC2-Web-02',
    metricName: 'CPUUtilization',
    initialConfig: {
      threshold: 50,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: 'GreaterThanThreshold'
    },
    sampleDatapoints: [12, 14, 11, 13, 9, 8],
    targetOutcome: {
      expectedState: 'ALARM',
      maxThreshold: 15,
      minEvaluationPeriods: 5,
      requiredComparisonOperator: 'LessThanThreshold'
    },
    architectExplanation: 'A strict 5-period consecutive window below 15% guarantees the cluster is genuinely idle, protecting the application from prematurely terminating servers during small queue pauses.'
  }
];
