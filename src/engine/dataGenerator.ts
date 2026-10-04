import { METRIC_DEFINITIONS } from '../data/initialResources';
import { ChaosScenario, MetricDataPoint, SimulatorIncidentType } from '../types/cloudwatch';
import { globalPRNG } from '../utils/prng';

/**
 * Deterministic Data Generation Engine
 * 
 * Generates reproducible, consistent time-series telemetry values using Mulberry32 PRNG.
 * Ensures that simulation runs behave predictably (e.g. 32% -> 45% -> 61% -> 74% -> 83% -> 91%).
 */

// Generate a deterministic float between min and max with smooth random walk
export function generateDeterministicValue(min: number, max: number, previous?: number): number {
  if (previous !== undefined) {
    const mean = (min + max) / 2;
    const delta = (globalPRNG.next() - 0.5) * ((max - min) * 0.18);
    const reversion = (mean - previous) * 0.08;
    let next = previous + delta + reversion;
    if (next < min) next = min + globalPRNG.next() * ((max - min) * 0.05);
    if (next > max) next = max - globalPRNG.next() * ((max - min) * 0.05);
    return Math.round(next * 10) / 10;
  }
  return Math.round((min + globalPRNG.next() * (max - min)) * 10) / 10;
}

// Generate initial history for a resource metric (60 datapoints = 60 minutes for "Last hour")
export function generateInitialHistory(
  resourceId: string,
  metricName: string,
  count: number = 60,
  intervalSeconds: number = 60
): MetricDataPoint[] {
  const def = METRIC_DEFINITIONS[metricName];
  if (!def) return [];

  const points: MetricDataPoint[] = [];
  const now = Date.now();
  let prevVal = (def.normalMin + def.normalMax) / 2;

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now - i * intervalSeconds * 1000).toISOString();
    prevVal = generateDeterministicValue(def.normalMin, def.normalMax, prevVal);
    points.push({
      timestamp: time,
      value: prevVal,
      unit: def.unit
    });
  }

  return points;
}

// Deterministic physical step size for gradual transitions
export function getStepSize(metricName: string, defNormalMax: number): number {
  if (metricName === 'CPUUtilization') return 13 + globalPRNG.next() * 3.5;
  if (metricName === 'DatabaseConnections') return 12 + globalPRNG.next() * 4.0;
  if (metricName === 'RequestCount') return 70 + globalPRNG.next() * 20.0;
  if (metricName === 'Latency') return 15 + globalPRNG.next() * 5.0;
  if (metricName === 'NetworkIn' || metricName === 'NetworkOut') return 28 + globalPRNG.next() * 8.0;
  if (metricName === 'ErrorRate') return 2.0 + globalPRNG.next() * 0.6;
  if (metricName === 'ErrorCount') return 10 + globalPRNG.next() * 3.0;
  return Math.max(1, defNormalMax * 0.2);
}

// Generate next datapoint with gradual, realistic transitions
export function generateNextDatapoint(
  resourceId: string,
  metricName: string,
  previousValue: number | undefined,
  activeChaos: ChaosScenario[]
): MetricDataPoint {
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
    // Target elevated range (breaching or near threshold)
    const elevatedMin = def.defaultThreshold * 1.04;
    const elevatedMax = def.defaultThreshold * 1.22;
    const targetVal = elevatedMin + (elevatedMax - elevatedMin) * 0.6;

    if (previousValue !== undefined && previousValue < elevatedMin) {
      // Step upward gradually (e.g. 32% -> 45% -> 61% -> 74% -> 83% -> 91%)
      const step = getStepSize(metricName, def.normalMax);
      const stepped = previousValue + step;
      nextVal = Math.min(targetVal, stepped);
    } else {
      // Already elevated: smooth deterministic walk in elevated range
      nextVal = generateDeterministicValue(elevatedMin, elevatedMax, previousValue);
    }
  } else {
    // Normal operation / recovery target range
    if (previousValue !== undefined && previousValue > def.normalMax) {
      // Step downward gradually towards normal range (e.g. 91% -> 76% -> 61% -> 46% -> 32%)
      const step = getStepSize(metricName, def.normalMax);
      const targetBaseline = (def.normalMin + def.normalMax) / 2;
      const stepped = previousValue - step;
      nextVal = Math.max(targetBaseline, stepped);
    } else {
      // Steady state normal operation
      nextVal = generateDeterministicValue(def.normalMin, def.normalMax, previousValue);
    }
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

// Preset Chaos Scenarios
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

// Incident to Chaos Scenario Mapping
export function getScenarioForIncident(incident: SimulatorIncidentType): ChaosScenario[] {
  switch (incident) {
    case 'CPU_SPIKE':
      return [
        {
          id: 'incident-cpu-spike',
          name: 'CPU Spike (EC2-Web-01)',
          description: 'Sustained compute spike on EC2-Web-01 driving CPU past 90%.',
          resourceId: 'EC2-Web-01',
          metricTarget: 'CPUUtilization',
          multiplier: 2.5,
          durationSeconds: 120
        }
      ];
    case 'TRAFFIC_SPIKE':
      return [
        {
          id: 'incident-traffic-req-ec2',
          name: 'Traffic Surge - Request Count (EC2-Web-01)',
          description: 'Surge in HTTP requests driving request arrival rates.',
          resourceId: 'EC2-Web-01',
          metricTarget: 'RequestCount',
          multiplier: 3.6,
          durationSeconds: 120
        },
        {
          id: 'incident-traffic-netin-ec2',
          name: 'Traffic Surge - Network In (EC2-Web-01)',
          description: 'Inbound network throughput spike.',
          resourceId: 'EC2-Web-01',
          metricTarget: 'NetworkIn',
          multiplier: 3.2,
          durationSeconds: 120
        },
        {
          id: 'incident-traffic-netout-ec2',
          name: 'Traffic Surge - Network Out (EC2-Web-01)',
          description: 'Outbound response payload bandwidth.',
          resourceId: 'EC2-Web-01',
          metricTarget: 'NetworkOut',
          multiplier: 3.0,
          durationSeconds: 120
        },
        {
          id: 'incident-traffic-cpu-ec2',
          name: 'Traffic Surge - CPU (EC2-Web-01)',
          description: 'Worker process CPU load handling requests.',
          resourceId: 'EC2-Web-01',
          metricTarget: 'CPUUtilization',
          multiplier: 2.2,
          durationSeconds: 120
        },
        {
          id: 'incident-traffic-req-app',
          name: 'Traffic Surge - API Server (Application-Server-01)',
          description: 'API request count surge.',
          resourceId: 'Application-Server-01',
          metricTarget: 'RequestCount',
          multiplier: 3.0,
          durationSeconds: 120
        }
      ];
    case 'ERROR_SPIKE':
      return [
        {
          id: 'incident-error-rate-app',
          name: 'Error Spike - Error Rate (Application-Server-01)',
          description: 'Burst in 5xx error responses exceeding 8%.',
          resourceId: 'Application-Server-01',
          metricTarget: 'ErrorRate',
          multiplier: 5.2,
          durationSeconds: 120
        },
        {
          id: 'incident-error-count-app',
          name: 'Error Spike - Error Count (Application-Server-01)',
          description: 'Spike in total unhandled error count.',
          resourceId: 'Application-Server-01',
          metricTarget: 'ErrorCount',
          multiplier: 9.0,
          durationSeconds: 120
        }
      ];
    case 'DATABASE_LOAD':
      return [
        {
          id: 'incident-db-cpu',
          name: 'Database Load - CPU (Database-01)',
          description: 'Complex SQL joins driving Database CPU above 82%.',
          resourceId: 'Database-01',
          metricTarget: 'CPUUtilization',
          multiplier: 2.4,
          durationSeconds: 120
        },
        {
          id: 'incident-db-conns',
          name: 'Database Load - Connections (Database-01)',
          description: 'Connection pool saturation exceeding 85 concurrent leases.',
          resourceId: 'Database-01',
          metricTarget: 'DatabaseConnections',
          multiplier: 2.6,
          durationSeconds: 120
        },
        {
          id: 'incident-db-lat',
          name: 'Database Load - Latency (Database-01)',
          description: 'Transaction lock waits driving latency past 70ms.',
          resourceId: 'Database-01',
          metricTarget: 'Latency',
          multiplier: 4.8,
          durationSeconds: 120
        }
      ];
    case 'NORMAL':
    case 'RECOVERY':
    default:
      return [];
  }
}
