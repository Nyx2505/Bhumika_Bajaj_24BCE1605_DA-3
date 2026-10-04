import { LogGroup, LogEvent } from '../types/cloudwatch';

export const INITIAL_LOG_GROUPS: LogGroup[] = [
  {
    name: '/application/web',
    resourceId: 'EC2-Web-01',
    storedBytes: 15482000,
    retentionInDays: 30
  },
  {
    name: '/application/api',
    resourceId: 'Application-Server-01',
    storedBytes: 28900000,
    retentionInDays: 14
  },
  {
    name: '/database/main',
    resourceId: 'Database-01',
    storedBytes: 42100000,
    retentionInDays: 60
  },
  {
    name: '/system/ec2-web-01',
    resourceId: 'EC2-Web-01',
    storedBytes: 12400000,
    retentionInDays: 30
  },
  {
    name: '/system/ec2-web-02',
    resourceId: 'EC2-Web-02',
    storedBytes: 11800000,
    retentionInDays: 30
  }
];

export const INITIAL_LOG_EVENTS: LogEvent[] = [
  {
    id: 'log-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    resourceId: 'EC2-Web-01',
    level: 'INFO',
    logGroupName: '/system/ec2-web-01',
    message: 'Systemd daemon initialized. Web tier nginx worker threads spawned successfully.'
  },
  {
    id: 'log-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    resourceId: 'EC2-Web-01',
    level: 'INFO',
    logGroupName: '/application/web',
    message: 'Request received: GET /catalog HTTP/1.1 from 198.51.100.24 - 200 OK (latency: 3.2ms)'
  },
  {
    id: 'log-103',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    resourceId: 'EC2-Web-01',
    level: 'WARNING',
    logGroupName: '/system/ec2-web-01',
    message: 'CPU utilization approaching threshold (74.8% measured across cores)'
  },
  {
    id: 'log-104',
    timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    resourceId: 'EC2-Web-01',
    level: 'ERROR',
    logGroupName: '/application/web',
    message: 'Request timeout: Upstream socket timed out after 5000ms on /api/v1/checkout'
  },
  {
    id: 'log-105',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    resourceId: 'Database-01',
    level: 'INFO',
    logGroupName: '/database/main',
    message: 'Checkpoint starting: time-based schedule checkpoint running'
  },
  {
    id: 'log-106',
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    resourceId: 'Database-01',
    level: 'WARNING',
    logGroupName: '/database/main',
    message: 'Connection pool saturation: 68 of 80 pool connections currently leased'
  },
  {
    id: 'log-107',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    resourceId: 'Application-Server-01',
    level: 'INFO',
    logGroupName: '/application/api',
    message: 'POST /api/v1/orders - Order #ORD-9842 verified and pushed to fulfillment queue'
  },
  {
    id: 'log-108',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    resourceId: 'Application-Server-01',
    level: 'WARNING',
    logGroupName: '/application/api',
    message: 'Response time degradation: 99th percentile response time reached 340ms'
  },
  {
    id: 'log-109',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    resourceId: 'Application-Server-01',
    level: 'ERROR',
    logGroupName: '/application/api',
    message: 'Unhandled Exception: DatabaseQueryTimeoutException while fetching customer profile #9218'
  },
  {
    id: 'log-110',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    resourceId: 'EC2-Web-02',
    level: 'INFO',
    logGroupName: '/system/ec2-web-02',
    message: 'Healthcheck ping passed: 200 OK received from Application Load Balancer target group'
  },
  {
    id: 'log-111',
    timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    resourceId: 'EC2-Web-01',
    level: 'INFO',
    logGroupName: '/application/web',
    message: 'Request received: POST /auth/login HTTP/1.1 200 8.4ms'
  }
];
