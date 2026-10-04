export type AWSResourceType = 'EC2' | 'Database' | 'Application' | 'RDS' | 'Lambda' | 'ALB';

// Core Resource Interface
export interface Resource {
  id: string;
  name: string;
  type: AWSResourceType;
  region: string;
  status: 'running' | 'stopped' | 'degraded';
  ipOrEndpoint?: string;
  tags: Record<string, string>;
  supportedMetrics: string[];
}

// Backward compatibility alias
export type AWSResource = Resource;

export type ComparisonOperator = 
  | 'GreaterThanOrEqualToThreshold'
  | 'GreaterThanThreshold'
  | 'LessThanOrEqualToThreshold'
  | 'LessThanThreshold';

// Alarm State
export type AlarmState = 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';

export type MetricStatistic = 'Average' | 'Maximum' | 'Minimum' | 'SampleCount' | 'Sum';

// Metric DataPoint
export interface MetricDataPoint {
  timestamp: string; // ISO string
  value: number;
  unit: string;
}

// Backward compatibility alias
export type MetricDatapoint = MetricDataPoint;

// Metric Definition
export interface Metric {
  name: string;
  displayName: string;
  unit: string;
  description: string;
  resourceType: AWSResourceType;
  defaultThreshold: number;
  normalMin: number;
  normalMax: number;
}

// Backward compatibility alias
export type MetricDefinition = Metric;

// Alarm Interface
export interface Alarm {
  id: string;
  name: string;
  description: string;
  resourceId: string;
  metricName: string;
  statistic: MetricStatistic;
  period: number; // in seconds (e.g., 60 = 1 minute)
  evaluationPeriods: number; // N
  datapointsToAlarm: number; // M
  comparisonOperator: ComparisonOperator;
  threshold: number;
  state: AlarmState;
  stateReason: string;
  stateUpdatedTimestamp: string;
  evaluationBuffer: number[]; // Most recent N evaluated datapoints
  history: {
    timestamp: string;
    fromState: AlarmState;
    toState: AlarmState;
    reason: string;
  }[];
  actions: {
    snsTopic?: string;
    autoScaling?: string;
  };
}

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR';

// Log Event
export interface LogEvent {
  id: string;
  timestamp: string;
  message: string;
  level: LogLevel;
  logGroupName: string;
  resourceId: string;
}

export interface LogGroup {
  name: string;
  resourceId: string;
  storedBytes: number;
  retentionInDays: number;
}

export interface ChaosScenario {
  id: string;
  name: string;
  description: string;
  resourceId: string;
  metricTarget: string;
  multiplier: number;
  durationSeconds: number;
}

export type SimulatorIncidentType =
  | 'NORMAL'
  | 'CPU_SPIKE'
  | 'TRAFFIC_SPIKE'
  | 'ERROR_SPIKE'
  | 'DATABASE_LOAD'
  | 'RECOVERY';

// Simulation Event (Timeline)
export interface SimulationEvent {
  id: string;
  time: string; // e.g. "10:40"
  timestamp: string; // ISO string
  title: string; // e.g. "Normal operation", "CPU Spike triggered", "CPU threshold breached", "High CPU alarm → ALARM", "Recovery triggered", "High CPU alarm → OK"
  type: 'NORMAL' | 'INCIDENT_TRIGGERED' | 'THRESHOLD_BREACHED' | 'ALARM_TRANSITION' | 'RECOVERY_TRIGGERED' | 'RESET';
  severity: 'info' | 'warn' | 'alarm' | 'ok';
  description?: string;
  resourceId?: string;
}

// Backward compatibility alias
export type SimulatorTimelineEvent = SimulationEvent;

// Learning Challenge
export interface LearningChallenge {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Architect';
  scenario: string;
  architectureContext: string;
  objective: string;
  resourceId: string;
  metricName: string;
  initialConfig: {
    threshold: number;
    evaluationPeriods: number;
    datapointsToAlarm: number;
    comparisonOperator: ComparisonOperator;
  };
  sampleDatapoints: number[];
  targetOutcome: {
    expectedState: AlarmState;
    minEvaluationPeriods?: number;
    maxEvaluationPeriods?: number;
    minThreshold?: number;
    maxThreshold?: number;
    requiredComparisonOperator?: ComparisonOperator;
  };
  architectExplanation: string;
}

// Persistent User Preferences
export interface UserPreferences {
  theme: 'dark' | 'light';
  simSpeed: number;
  environment: string;
  defaultTimeRange: '10m' | '30m' | '1h';
}
