import { LogGroup, LogEvent } from '../types/cloudwatch';

export const INITIAL_LOG_GROUPS: LogGroup[] = [
  {
    name: '/aws/ec2/EC2-Web-01',
    resourceId: 'EC2-Web-01',
    storedBytes: 15482000,
    retentionInDays: 30
  },
  {
    name: '/aws/ec2/EC2-Web-02',
    resourceId: 'EC2-Web-02',
    storedBytes: 14120000,
    retentionInDays: 30
  },
  {
    name: '/aws/rds/Database-01',
    resourceId: 'Database-01',
    storedBytes: 42100000,
    retentionInDays: 60
  },
  {
    name: '/aws/apps/Application-Server-01',
    resourceId: 'Application-Server-01',
    storedBytes: 28900000,
    retentionInDays: 14
  }
];

export const INITIAL_LOG_EVENTS: LogEvent[] = [
  {
    id: 'log-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/ec2/EC2-Web-01',
    resourceId: 'EC2-Web-01',
    message: '[systemd] Started NGINX HTTP and reverse proxy server. Worker threads spawned: 8.'
  },
  {
    id: 'log-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/ec2/EC2-Web-01',
    resourceId: 'EC2-Web-01',
    message: '172.31.16.42 - GET /api/v1/health HTTP/1.1 200 1.82ms "ELB-HealthChecker/2.0"'
  },
  {
    id: 'log-103',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/ec2/EC2-Web-02',
    resourceId: 'EC2-Web-02',
    message: '172.31.28.105 - GET /api/v1/catalog HTTP/1.1 200 4.12ms "Mozilla/5.0"'
  },
  {
    id: 'log-104',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/rds/Database-01',
    resourceId: 'Database-01',
    message: 'LOG: checkpoint starting: time'
  },
  {
    id: 'log-105',
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/rds/Database-01',
    resourceId: 'Database-01',
    message: 'LOG: checkpoint complete: wrote 412 buffers (0.8%); 0 WAL file(s) added, 0 removed, 1 recycled; duration 4.12s'
  },
  {
    id: 'log-106',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/apps/Application-Server-01',
    resourceId: 'Application-Server-01',
    message: '[express] Handled POST /api/v1/orders - Order #ORD-8491 created successfully (latency: 78ms)'
  },
  {
    id: 'log-107',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    level: 'WARN',
    logGroupName: '/aws/apps/Application-Server-01',
    resourceId: 'Application-Server-01',
    message: '[express] Upstream database query pool latency exceeded 120ms on read query for customer #CUST-9128'
  },
  {
    id: 'log-108',
    timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/ec2/EC2-Web-01',
    resourceId: 'EC2-Web-01',
    message: '172.31.16.42 - POST /api/v1/auth/token HTTP/1.1 200 12.4ms'
  }
];
