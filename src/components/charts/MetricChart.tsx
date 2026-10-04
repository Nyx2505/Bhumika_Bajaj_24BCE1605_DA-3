import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend
} from 'recharts';

interface ChartLineConfig {
  key: string;
  color: string;
  name?: string;
  strokeWidth?: number;
  dashed?: boolean;
}

interface MetricChartProps {
  data: Array<Record<string, any>>;
  lines: ChartLineConfig[];
  threshold?: number;
  thresholdLabel?: string;
  height?: number;
  yAxisUnit?: string;
  isDark?: boolean;
  timeKey?: string;
}

export const MetricChart: React.FC<MetricChartProps> = ({
  data,
  lines,
  threshold,
  thresholdLabel = 'Threshold',
  height = 250,
  yAxisUnit = '',
  isDark = true,
  timeKey = 'time'
}) => {
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const textFill = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#475569' : '#cbd5e1';

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
          <XAxis
            dataKey={timeKey}
            stroke={textFill}
            fontSize={10}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke={textFill}
            fontSize={10}
            tickLine={false}
            tickFormatter={(val) => `${val}${yAxisUnit === 'Percent' ? '%' : ''}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: '0.75rem',
              fontSize: '11px',
              color: isDark ? '#fff' : '#000',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend
            wrapperStyle={{
              fontSize: '11px',
              paddingTop: '8px'
            }}
          />
          {threshold !== undefined && (
            <ReferenceLine
              y={threshold}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `${thresholdLabel}: ${threshold}${yAxisUnit === 'Percent' ? '%' : ''}`,
                fill: '#f43f5e',
                fontSize: 10,
                position: 'insideTopRight'
              }}
            />
          )}
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name || line.key}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              strokeDasharray={line.dashed ? '4 4' : undefined}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
