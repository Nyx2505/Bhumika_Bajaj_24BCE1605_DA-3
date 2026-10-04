import { AWSResource, MetricDefinition } from '../types/cloudwatch';

export const AWS_RESOURCES: AWSResource[] = [
  {
    id: 'i-0a812fec99',
    name: 'web-server-prod-01',
    type: 'EC2',
    region: 'us-east-1',
    status: 'running',
    ipOrEndpoint: '172.31.42.10',
    tags: { Environment: 'Production', Tier: 'Frontend', Project: 'CloudStore' },
    supportedMetrics: ['CPUUtilization', 'NetworkIn', 'NetworkOut', 'StatusCheckFailed']
  },
  {
    id: 'i-09bc83a152',
    name: 'worker-batch-node',
    type: 'EC2',
    region: 'us-east-1',
    status: 'running',
    ipOrEndpoint: '172.31.42.15',
    tags: { Environment: 'Production', Tier: 'BackgroundWorker', Project: 'CloudStore' },
    supportedMetrics: ['CPUUtilization', 'NetworkIn', 'NetworkOut']
  },
  {
    id: 'db-orders-postgres',
    name: 'orders-primary-db',
    type: 'RDS',
    region: 'us-east-1',
    status: 'running',
    ipOrEndpoint: 'orders-prod.c91a0.us-east-1.rds.amazonaws.com:5432',
    tags: { Engine: 'PostgreSQL-15', HighAvailability: 'Multi-AZ', Tier: 'Database' },
    supportedMetrics: ['CPUUtilization', 'DatabaseConnections', 'FreeableMemory', 'ReadIOPS']
  },
  {
    id: 'order-processing-fn',
    name: 'process-order-checkout',
    type: 'Lambda',
    region: 'us-east-1',
    status: 'running',
    ipOrEndpoint: 'arn:aws:lambda:us-east-1:123456789012:function:process-order-checkout',
    tags: { Runtime: 'Nodejs20.x', Memory: '512MB', Tier: 'Serverless' },
    supportedMetrics: ['Invocations', 'Duration', 'Errors', 'Throttles']
  },
  {
    id: 'alb-public-ingress',
    name: 'cloudstore-public-alb',
    type: 'ALB',
    region: 'us-east-1',
    status: 'running',
    ipOrEndpoint: 'cloudstore-alb-19401.us-east-1.elb.amazonaws.com',
    tags: { Scheme: 'internet-facing', Tier: 'Networking' },
    supportedMetrics: ['RequestCount', 'TargetResponseTime', 'HTTPCode_Target_5XX_Count']
  }
];

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  CPUUtilization: {
    name: 'CPUUtilization',
    displayName: 'CPU Utilization',
    unit: 'Percent',
    description: 'Percentage of allocated compute units currently in use.',
    resourceType: 'EC2',
    defaultThreshold: 80,
    normalMin: 20,
    normalMax: 45
  },
  NetworkIn: {
    name: 'NetworkIn',
    displayName: 'Network In',
    unit: 'Megabytes',
    description: 'The number of bytes received across all network interfaces.',
    resourceType: 'EC2',
    defaultThreshold: 150,
    normalMin: 15,
    normalMax: 60
  },
  NetworkOut: {
    name: 'NetworkOut',
    displayName: 'Network Out',
    unit: 'Megabytes',
    description: 'The number of bytes sent out on all network interfaces.',
    resourceType: 'EC2',
    defaultThreshold: 120,
    normalMin: 10,
    normalMax: 50
  },
  StatusCheckFailed: {
    name: 'StatusCheckFailed',
    displayName: 'Status Check Failed',
    unit: 'Count',
    description: 'Reports whether the instance has passed both instance and system status checks.',
    resourceType: 'EC2',
    defaultThreshold: 1,
    normalMin: 0,
    normalMax: 0
  },
  DatabaseConnections: {
    name: 'DatabaseConnections',
    displayName: 'Active DB Connections',
    unit: 'Count',
    description: 'The number of client database sessions currently connected.',
    resourceType: 'RDS',
    defaultThreshold: 85,
    normalMin: 15,
    normalMax: 40
  },
  FreeableMemory: {
    name: 'FreeableMemory',
    displayName: 'Freeable Memory',
    unit: 'Megabytes',
    description: 'Amount of available RAM on the database instance.',
    resourceType: 'RDS',
    defaultThreshold: 256,
    normalMin: 1024,
    normalMax: 4096
  },
  ReadIOPS: {
    name: 'ReadIOPS',
    displayName: 'Read IOPS',
    unit: 'Count/Second',
    description: 'Average number of disk read I/O operations per second.',
    resourceType: 'RDS',
    defaultThreshold: 500,
    normalMin: 40,
    normalMax: 120
  },
  Invocations: {
    name: 'Invocations',
    displayName: 'Lambda Invocations',
    unit: 'Count',
    description: 'The number of times the function is invoked in response to events.',
    resourceType: 'Lambda',
    defaultThreshold: 300,
    normalMin: 20,
    normalMax: 100
  },
  Duration: {
    name: 'Duration',
    displayName: 'Execution Duration',
    unit: 'Milliseconds',
    description: 'Elapsed run time of the function execution.',
    resourceType: 'Lambda',
    defaultThreshold: 1200,
    normalMin: 120,
    normalMax: 450
  },
  Errors: {
    name: 'Errors',
    displayName: 'Execution Errors',
    unit: 'Count',
    description: 'The number of invocations that resulted in a function error.',
    resourceType: 'Lambda',
    defaultThreshold: 5,
    normalMin: 0,
    normalMax: 1
  },
  Throttles: {
    name: 'Throttles',
    displayName: 'Invocation Throttles',
    unit: 'Count',
    description: 'Number of invocation requests that were throttled due to concurrency limits.',
    resourceType: 'Lambda',
    defaultThreshold: 1,
    normalMin: 0,
    normalMax: 0
  },
  RequestCount: {
    name: 'RequestCount',
    displayName: 'ALB Request Count',
    unit: 'Count',
    description: 'Number of requests processed by the load balancer.',
    resourceType: 'ALB',
    defaultThreshold: 800,
    normalMin: 100,
    normalMax: 350
  },
  TargetResponseTime: {
    name: 'TargetResponseTime',
    displayName: 'Target Response Time',
    unit: 'Seconds',
    description: 'Time elapsed in seconds after request leaves load balancer until response is received.',
    resourceType: 'ALB',
    defaultThreshold: 1.5,
    normalMin: 0.08,
    normalMax: 0.35
  },
  HTTPCode_Target_5XX_Count: {
    name: 'HTTPCode_Target_5XX_Count',
    displayName: 'Target 5XX Error Count',
    unit: 'Count',
    description: 'Number of 5XX server error HTTP response codes generated by backend targets.',
    resourceType: 'ALB',
    defaultThreshold: 10,
    normalMin: 0,
    normalMax: 2
  }
};
