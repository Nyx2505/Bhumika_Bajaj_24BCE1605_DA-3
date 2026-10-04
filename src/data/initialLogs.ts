import { LogGroup, LogEvent } from '../types/cloudwatch';

export const INITIAL_LOG_GROUPS: LogGroup[] = [
  {
    name: '/aws/ec2/web-server-prod',
    resourceId: 'i-0a812fec99',
    storedBytes: 15482000,
    retentionInDays: 30
  },
  {
    name: '/aws/rds/db-orders-postgres',
    resourceId: 'db-orders-postgres',
    storedBytes: 42100000,
    retentionInDays: 60
  },
  {
    name: '/aws/lambda/order-processing-fn',
    resourceId: 'order-processing-fn',
    storedBytes: 8900000,
    retentionInDays: 14
  },
  {
    name: '/aws/alb/public-ingress',
    resourceId: 'alb-public-ingress',
    storedBytes: 65400000,
    retentionInDays: 30
  }
];

export const INITIAL_LOG_EVENTS: LogEvent[] = [
  {
    id: 'log-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/ec2/web-server-prod',
    resourceId: 'i-0a812fec99',
    message: '[systemd] Started NGINX HTTP and reverse proxy server. Worker threads spawned: 8.'
  },
  {
    id: 'log-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/ec2/web-server-prod',
    resourceId: 'i-0a812fec99',
    message: '172.31.10.4 - GET /api/v1/catalog HTTP/1.1 200 4.12ms "Mozilla/5.0"'
  },
  {
    id: 'log-103',
    timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    level: 'WARN',
    logGroupName: '/aws/ec2/web-server-prod',
    resourceId: 'i-0a812fec99',
    message: '[nginx] upstream response time degraded: /api/v1/checkout took 820ms from upstream pool 172.31.42.15:8080'
  },
  {
    id: 'log-104',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/rds/db-orders-postgres',
    resourceId: 'db-orders-postgres',
    message: 'LOG: checkpoint starting: time'
  },
  {
    id: 'log-105',
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/rds/db-orders-postgres',
    resourceId: 'db-orders-postgres',
    message: 'LOG: checkpoint complete: wrote 412 buffers (0.8%); 0 WAL file(s) added, 0 removed, 1 recycled; duration 4.12s'
  },
  {
    id: 'log-106',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/lambda/order-processing-fn',
    resourceId: 'order-processing-fn',
    message: 'START RequestId: 4f9810ab-c340-4963-8a39-38914c67ef01 Version: $LATEST'
  },
  {
    id: 'log-107',
    timestamp: new Date(Date.now() - 1000 * 60 * 5 + 120).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/lambda/order-processing-fn',
    resourceId: 'order-processing-fn',
    message: '2026-10-04T15:10:02.120Z 4f9810ab-c340-4963-8a39-38914c67ef01 INFO Order validated successfully. OrderId: #ORD-9821, CustomerId: #CUST-4102'
  },
  {
    id: 'log-108',
    timestamp: new Date(Date.now() - 1000 * 60 * 5 + 340).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/lambda/order-processing-fn',
    resourceId: 'order-processing-fn',
    message: 'END RequestId: 4f9810ab-c340-4963-8a39-38914c67ef01'
  },
  {
    id: 'log-109',
    timestamp: new Date(Date.now() - 1000 * 60 * 5 + 345).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/lambda/order-processing-fn',
    resourceId: 'order-processing-fn',
    message: 'REPORT RequestId: 4f9810ab-c340-4963-8a39-38914c67ef01 Duration: 224.12 ms Billed Duration: 225 ms Memory Size: 512 MB Max Memory Used: 92 MB'
  },
  {
    id: 'log-110',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    level: 'INFO',
    logGroupName: '/aws/alb/public-ingress',
    resourceId: 'alb-public-ingress',
    message: 'http 2026-10-04T15:12:44.182049Z app/cloudstore-alb/9184 198.51.100.12:49821 172.31.42.10:80 0.001 0.038 0.000 200 200 682 4812 "GET https://store.example.com:443/products HTTP/1.1"'
  }
];
