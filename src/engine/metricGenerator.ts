import { METRIC_DEFINITIONS } from '../data/initialResources';
import { ChaosScenario, MetricDatapoint } from '../types/cloudwatch';

// Generate a random float between min and max with smooth variation
export function generateRandomValue(min: number, max: number, previous?: number): number {
  if (previous !== undefined) {
    // Random walk with mean reversion
    const mean = (min + max) / 2;
    const delta = (Math.random() - 0.5) * ((max - min) * 0.25);
    const reversion = (mean - previous) * 0.1;
    let next = previous + delta + reversion;
    if (next < min) next = min + Math.random() * ((max - min) * 0.1);
    if (next > max) next = max - Math.random() * ((max - min) * 0.1);
    return Math.round(next * 10) / 10;
  }
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

// Generate initial history for a resource metric
export function generateInitialHistory(
  resourceId: string,
  metricName: string,
  count: number = 20,
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
    // Generate elevated or failing metric
    const elevatedMin = def.defaultThreshold * 0.95;
    const elevatedMax = def.defaultThreshold * 1.25;
    nextVal = generateRandomValue(elevatedMin, elevatedMax, previousValue);
  } else {
    nextVal = generateRandomValue(def.normalMin, def.normalMax, previousValue);
  }

  // Certain metrics like StatusCheckFailed are 0 or 1 integers
  if (metricName === 'StatusCheckFailed') {
    nextVal = chaos ? 1 : 0;
  } else if (unit === 'Count') {
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
    name: 'Flash Crowd (EC2 CPU Spike)',
    description: 'Surges incoming traffic to web-server-prod-01, driving CPUUtilization past 90% and triggering alarm evaluation.',
    resourceId: 'i-0a812fec99',
    metricTarget: 'CPUUtilization',
    multiplier: 2.8,
    durationSeconds: 45
  },
  {
    id: 'chaos-rds-leak',
    name: 'DB Connection Exhaustion (RDS)',
    description: 'Simulates unclosed connection pools on orders-primary-db, pushing active connections above 88.',
    resourceId: 'db-orders-postgres',
    metricTarget: 'DatabaseConnections',
    multiplier: 3.0,
    durationSeconds: 45
  },
  {
    id: 'chaos-lambda-crash',
    name: 'Lambda Out of Memory / 5XX Spikes',
    description: 'Forces checkout Lambda function to error out repeatedly, driving execution errors above threshold.',
    resourceId: 'order-processing-fn',
    metricTarget: 'Errors',
    multiplier: 10,
    durationSeconds: 45
  }
];
