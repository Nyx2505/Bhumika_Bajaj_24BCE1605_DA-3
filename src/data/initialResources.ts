import { AWSResource, MetricDefinition } from '../types/cloudwatch';

export const AWS_RESOURCES: AWSResource[] = [
  {
    id: 'EC2-Web-01',
    name: 'EC2-Web-01',
    type: 'EC2',
    region: 'us-east-1a',
    status: 'running',
    ipOrEndpoint: '172.31.16.42',
    tags: { Environment: 'Production', Role: 'Web Server', Cluster: 'Frontend-Fleet' },
    supportedMetrics: [
      'CPUUtilization',
      'MemoryUtilization',
      'NetworkIn',
      'NetworkOut',
      'RequestCount'
    ]
  },
  {
    id: 'EC2-Web-02',
    name: 'EC2-Web-02',
    type: 'EC2',
    region: 'us-east-1b',
    status: 'running',
    ipOrEndpoint: '172.31.28.105',
    tags: { Environment: 'Production', Role: 'Web Server', Cluster: 'Frontend-Fleet' },
    supportedMetrics: [
      'CPUUtilization',
      'MemoryUtilization',
      'NetworkIn',
      'NetworkOut',
      'RequestCount'
    ]
  },
  {
    id: 'Database-01',
    name: 'Database-01',
    type: 'Database',
    region: 'us-east-1a',
    status: 'running',
    ipOrEndpoint: 'db-primary.rds.us-east-1.amazonaws.com:5432',
    tags: { Engine: 'PostgreSQL-15', Tier: 'Primary Database', MultiAZ: 'Enabled' },
    supportedMetrics: [
      'CPUUtilization',
      'DatabaseConnections',
      'ReadOperations',
      'WriteOperations',
      'Latency'
    ]
  },
  {
    id: 'Application-Server-01',
    name: 'Application-Server-01',
    type: 'Application',
    region: 'us-east-1c',
    status: 'running',
    ipOrEndpoint: 'app-service.internal:8080',
    tags: { Framework: 'NodeJS Express', Tier: 'Backend API', AutoScaling: 'Active' },
    supportedMetrics: [
      'RequestCount',
      'ErrorCount',
      'ErrorRate',
      'ResponseTime'
    ]
  }
];

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  // EC2 Metrics
  CPUUtilization: {
    name: 'CPUUtilization',
    displayName: 'CPU Utilization',
    unit: 'Percent',
    description: 'Percentage of allocated compute units currently consumed across cores.',
    resourceType: 'EC2',
    defaultThreshold: 80,
    normalMin: 22,
    normalMax: 48
  },
  MemoryUtilization: {
    name: 'MemoryUtilization',
    displayName: 'Memory Utilization',
    unit: 'Percent',
    description: 'Percentage of system physical memory currently allocated.',
    resourceType: 'EC2',
    defaultThreshold: 85,
    normalMin: 40,
    normalMax: 68
  },
  NetworkIn: {
    name: 'NetworkIn',
    displayName: 'Network In',
    unit: 'Megabytes',
    description: 'Incoming network traffic bytes received across network interfaces.',
    resourceType: 'EC2',
    defaultThreshold: 150,
    normalMin: 18,
    normalMax: 65
  },
  NetworkOut: {
    name: 'NetworkOut',
    displayName: 'Network Out',
    unit: 'Megabytes',
    description: 'Outgoing network traffic bytes transmitted across network interfaces.',
    resourceType: 'EC2',
    defaultThreshold: 120,
    normalMin: 12,
    normalMax: 50
  },
  RequestCount: {
    name: 'RequestCount',
    displayName: 'Request Count',
    unit: 'Count',
    description: 'Number of HTTP/HTTPS requests processed per minute interval.',
    resourceType: 'EC2',
    defaultThreshold: 1000,
    normalMin: 180,
    normalMax: 420
  },

  // Application Server Metrics
  ErrorCount: {
    name: 'ErrorCount',
    displayName: 'Error Count',
    unit: 'Count',
    description: 'Total number of 5XX and unhandled application server errors.',
    resourceType: 'Application',
    defaultThreshold: 15,
    normalMin: 0,
    normalMax: 2
  },
  ErrorRate: {
    name: 'ErrorRate',
    displayName: 'Error Rate',
    unit: 'Percent',
    description: 'Percentage of requests resulting in HTTP 5XX failure responses.',
    resourceType: 'Application',
    defaultThreshold: 5,
    normalMin: 0.1,
    normalMax: 1.4
  },
  ResponseTime: {
    name: 'ResponseTime',
    displayName: 'Response Time',
    unit: 'Milliseconds',
    description: 'Elapsed application server request-to-response duration in ms.',
    resourceType: 'Application',
    defaultThreshold: 400,
    normalMin: 45,
    normalMax: 140
  },

  // Database Metrics
  DatabaseConnections: {
    name: 'DatabaseConnections',
    displayName: 'Database Connections',
    unit: 'Count',
    description: 'Active client and connection pool sessions open to Database-01.',
    resourceType: 'Database',
    defaultThreshold: 80,
    normalMin: 16,
    normalMax: 42
  },
  ReadOperations: {
    name: 'ReadOperations',
    displayName: 'Read Operations',
    unit: 'IOPS',
    description: 'Average number of disk read I/O operations per second on the database volume.',
    resourceType: 'Database',
    defaultThreshold: 600,
    normalMin: 80,
    normalMax: 220
  },
  WriteOperations: {
    name: 'WriteOperations',
    displayName: 'Write Operations',
    unit: 'IOPS',
    description: 'Average number of disk write I/O operations per second on the database volume.',
    resourceType: 'Database',
    defaultThreshold: 400,
    normalMin: 40,
    normalMax: 130
  },
  Latency: {
    name: 'Latency',
    displayName: 'Database Latency',
    unit: 'Milliseconds',
    description: 'Average query execution and disk I/O response latency in milliseconds.',
    resourceType: 'Database',
    defaultThreshold: 20,
    normalMin: 1.8,
    normalMax: 6.5
  }
};
