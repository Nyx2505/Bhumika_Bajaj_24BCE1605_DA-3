import { METRIC_DEFINITIONS } from '../data/initialResources';
import { ChaosScenario, MetricDatapoint } from '../types/cloudwatch';

// Generate a random float between min and max with smooth variation
export function generateRandomValue(min: number, max: number, previous?: number): number {
  if (previous !== undefined) {
    // Random walk with mean reversion
    const mean = (min + max) / 2;
    const delta = (Math.random() - 0.5) * ((max - min) * 0.2);
    const reversion = (mean - previous) * 0.08;
    let next = previous + delta + reversion;
    if (next < min) next = min + Math.random() * ((max - min) * 0.05);
    if (next > max) next = max - Math.random() * ((max - min) * 0.05);
    return Math.round(next * 10) / 10;
  }
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

// Generate initial history for a resource metric (60 datapoints = 60 minutes for "Last hour")
export function generateInitialHistory(
  resourceId: string,
  metricName: string,
  count: number = 60,
  intervalSeconds: number = 60
): MetricDatapoint[] {
  const def = METRIC_DEFINITIONS[metricName];
  if (!def) return [];

  const points: MetricDatapoint[] = [];
  const now = Date.now();
  let prevVal = (def.normalMin + def.normalMax) / 2;

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now - i * intervalSeconds * 1000).toISOString();
    prevVal = generateRandomValue(def.normalMin, def.normalMax, prevVal);
    points.push({
      timestamp: time,
      value: prevVal,
      unit: def.unit
    });
  }

  return points;
}

// Generate next datapoint considering any active chaos scenarios
export function generateNextDatapoint(
  resourceId: string,
  metricName: string,
  previousValue: number | undefined,
  activeChaos: ChaosScenario[]
): MetricDatapoint {
  const def = METRIC_DEFINITIONS[metricName];
  const unit = def ? def.unit : '';
  const nowIso = new Date().toISOString();

  if (!def) {
    return {
      timestamp: nowIso,
      value: 0,
      unit
    };
  }

  // Check if chaos scenario is active for this resource and metric
  const chaos = activeChaos.find(
    (c) => c.resourceId === resourceId && c.metricTarget === metricName
  );

  let nextVal: number;

  if (chaos) {
    // Generate elevated metric that crosses threshold
    const elevatedMin = def.defaultThreshold * 0.98;
    const elevatedMax = def.defaultThreshold * 1.25;
    nextVal = generateRandomValue(elevatedMin, elevatedMax, previousValue);
  } else {
    nextVal = generateRandomValue(def.normalMin, def.normalMax, previousValue);
  }

  if (unit === 'Count' || unit === 'IOPS') {
    nextVal = Math.round(nextVal);
  }

  return {
    timestamp: nowIso,
    value: Number(nextVal.toFixed(1)),
    unit
  };
}

export const PRESET_CHAOS_SCENARIOS: ChaosScenario[] = [
  {
    id: 'chaos-ec2-cpu-spike',
    name: 'Flash Crowd Traffic Surge (EC2-Web-01)',
    description: 'Surges incoming HTTP requests to EC2-Web-01, driving CPUUtilization past 88% and testing multi-period alarms.',
    resourceId: 'EC2-Web-01',
    metricTarget: 'CPUUtilization',
    multiplier: 2.5,
    durationSeconds: 60
  },
  {
    id: 'chaos-db-leak',
    name: 'DB Connection Pool Exhaustion (Database-01)',
    description: 'Simulates unclosed client connection leaks on Database-01, pushing connections above 85.',
    resourceId: 'Database-01',
    metricTarget: 'DatabaseConnections',
    multiplier: 2.8,
    durationSeconds: 60
  },
  {
    id: 'chaos-app-error-spike',
    name: 'Backend 5XX Error Rate Surge (Application-Server-01)',
    description: 'Simulates microservice failure cascades on Application-Server-01, driving ErrorRate past 6.5%.',
    resourceId: 'Application-Server-01',
    metricTarget: 'ErrorRate',
    multiplier: 5.0,
    durationSeconds: 60
  },
  {
    id: 'chaos-ec2-net-surge',
    name: 'Network Bandwidth Saturation (EC2-Web-02)',
    description: 'Forces high bandwidth media streaming on EC2-Web-02, pushing NetworkIn past 180 MB.',
    resourceId: 'EC2-Web-02',
    metricTarget: 'NetworkIn',
    multiplier: 3.2,
    durationSeconds: 60
  }
];
