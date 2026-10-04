import React, { useState, useMemo, useEffect } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
import {
  AlarmState,
  ComparisonOperator,
  MetricStatistic
} from '../../types/cloudwatch';
import {
  isDatapointBreaching,
  getOperatorSymbol
} from '../../engine/alarmEvaluator';
import {
  GraduationCap,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';

interface SimulatedPeriod {
  id: number;
  value: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  testValues: number[];
  validate: (config: {
    resourceId: string;
    metricName: string;
    operator: ComparisonOperator;
    threshold: number;
    evaluationPeriods: number;
  }) => boolean;
  hint: string;
}

export const LearningLab: React.FC = () => {
  const { resources, theme } = useCloudWatch();

  // ================= SECTION 1: BUILD AN ALARM STATE =================
  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    resources[0]?.id || 'EC2-Web-01'
  );
  const selectedResource = resources.find((r) => r.id === selectedResourceId) || resources[0];

  const [selectedMetric, setSelectedMetric] = useState<string>(
    selectedResource.supportedMetrics[0] || 'CPUUtilization'
  );
  const metricDef = METRIC_DEFINITIONS[selectedMetric];

  const [statistic, setStatistic] = useState<MetricStatistic>('Average');
  const [operator, setOperator] = useState<ComparisonOperator>('GreaterThanThreshold');
  const [threshold, setThreshold] = useState<number>(metricDef?.defaultThreshold || 80);
  const [evaluationPeriods, setEvaluationPeriods] = useState<number>(3);
  const [alarmName, setAlarmName] = useState<string>('High-CPU-Utilization-Alarm');

  // Preview state of the created alarm
  const [activeAlarmPreview, setActiveAlarmPreview] = useState<{
    name: string;
    resource: string;
    metric: string;
    metricDisplay: string;
    unit: string;
    statistic: MetricStatistic;
    operator: ComparisonOperator;
    threshold: number;
    evaluationPeriods: number;
  }>({
    name: 'High-CPU-Utilization-Alarm',
    resource: 'EC2-Web-01',
    metric: 'CPUUtilization',
    metricDisplay: 'CPU Utilization',
    unit: 'Percent',
    statistic: 'Average',
    operator: 'GreaterThanThreshold',
    threshold: 80,
    evaluationPeriods: 3
  });

  const handleCreateAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveAlarmPreview({
      name: alarmName,
      resource: selectedResourceId,
      metric: selectedMetric,
      metricDisplay: metricDef?.displayName || selectedMetric,
      unit: metricDef?.unit || '',
      statistic,
      operator,
      threshold,
      evaluationPeriods
    });
  };

  // Sync metric list when resource changes
  const handleResourceChange = (resId: string) => {
    setSelectedResourceId(resId);
    const res = resources.find((r) => r.id === resId);
    if (res && !res.supportedMetrics.includes(selectedMetric)) {
      const nextMetric = res.supportedMetrics[0];
      setSelectedMetric(nextMetric);
      const def = METRIC_DEFINITIONS[nextMetric];
      if (def) setThreshold(def.defaultThreshold);
    }
  };

  const handleMetricChange = (metric: string) => {
    setSelectedMetric(metric);
    const def = METRIC_DEFINITIONS[metric];
    if (def) setThreshold(def.defaultThreshold);
  };

  // ================= SECTION 2: SIMULATE METRIC VALUES =================
  const initialPeriods: SimulatedPeriod[] = [
    { id: 1, value: 72 },
    { id: 2, value: 76 },
    { id: 3, value: 84 },
    { id: 4, value: 88 },
    { id: 5, value: 91 }
  ];

  const [simulatedValues, setSimulatedValues] = useState<SimulatedPeriod[]>(initialPeriods);

  const handleGenerateNormalTraffic = () => {
    const min = metricDef ? metricDef.normalMin : 20;
    const max = metricDef ? metricDef.normalMax : 50;
    setSimulatedValues(
      [1, 2, 3, 4, 5].map((id) => ({
        id,
        value: Math.round(min + Math.random() * (max - min))
      }))
    );
  };

  const handleSimulateSpike = () => {
    const thresh = activeAlarmPreview.threshold;
    setSimulatedValues([
      { id: 1, value: Math.max(1, Math.round(thresh - 15)) },
      { id: 2, value: Math.max(1, Math.round(thresh - 8)) },
      { id: 3, value: Math.round(thresh + 4) },
      { id: 4, value: Math.round(thresh + 9) },
      { id: 5, value: Math.round(thresh + 14) }
    ]);
  };

  const handleResetValues = () => {
    setSimulatedValues(initialPeriods);
  };

  const handleUpdatePeriodValue = (id: number, val: number) => {
    setSimulatedValues((prev) =>
      prev.map((p) => (p.id === id ? { ...p, value: val } : p))
    );
  };

  // ================= SECTION 3 & 4: ALARM EVALUATION & EXPLANATION =================
  const evaluationResult = useMemo(() => {
    const { operator: op, threshold: t, evaluationPeriods: reqN, metricDisplay } = activeAlarmPreview;

    const evaluatedPeriods = simulatedValues.map((p) => {
      const isBreaching = isDatapointBreaching(p.value, t, op);
      return {
        ...p,
        isBreaching
      };
    });

    // Count maximum consecutive breaching periods ending at or within the sequence
    let currentConsecutiveBreaches = 0;
    let maxConsecutiveBreaches = 0;

    for (const p of evaluatedPeriods) {
      if (p.isBreaching) {
        currentConsecutiveBreaches++;
        if (currentConsecutiveBreaches > maxConsecutiveBreaches) {
          maxConsecutiveBreaches = currentConsecutiveBreaches;
        }
      } else {
        currentConsecutiveBreaches = 0;
      }
    }

    const hasAnyBreach = evaluatedPeriods.some((p) => p.isBreaching);
    let state: AlarmState = 'OK';
    let explanation = '';

    if (evaluatedPeriods.length < reqN) {
      state = 'INSUFFICIENT_DATA';
      explanation = `Fewer datapoints (${evaluatedPeriods.length}) than required evaluation periods (${reqN}) were simulated. The alarm evaluated to INSUFFICIENT_DATA.`;
    } else if (maxConsecutiveBreaches >= reqN) {
      state = 'ALARM';
      explanation = `${metricDisplay} exceeded the threshold of ${t}${
        activeAlarmPreview.unit === 'Percent' ? '%' : ''
      } for ${maxConsecutiveBreaches} consecutive evaluation periods. The alarm changed from OK to ALARM.`;
    } else if (hasAnyBreach) {
      state = 'OK';
      explanation = `The threshold was breached by individual periods, but the required number of consecutive evaluation periods (${reqN}) was not reached. The alarm remains OK.`;
    } else {
      state = 'OK';
      explanation = `All evaluated metric values remained within safe limits. The alarm evaluated to OK.`;
    }

    return {
      evaluatedPeriods,
      maxConsecutiveBreaches,
      state,
      explanation
    };
  }, [simulatedValues, activeAlarmPreview]);

  // ================= SECTION 5: EXPERIMENT (DYNAMIC THRESHOLD) =================
  const handleExperimentThresholdChange = (newVal: number) => {
    setThreshold(newVal);
    setActiveAlarmPreview((prev) => ({
      ...prev,
      threshold: newVal
    }));
  };

  // ================= SECTION 6: LEARNING CHALLENGES =================
  const challenges: Challenge[] = [
    {
      id: 'ch-1',
      title: 'Challenge 1: High CPU Outage Detection',
      description: 'Create an alarm that triggers when CPU remains above 80% for 3 consecutive periods.',
      testValues: [70, 75, 84, 86, 89],
      hint: 'Set Resource = EC2-Web-01, Metric = CPUUtilization, Comparison = > or >=, Threshold = 80, Evaluation Periods = 3.',
      validate: (cfg) =>
        (cfg.metricName === 'CPUUtilization') &&
        (cfg.operator === 'GreaterThanThreshold' || cfg.operator === 'GreaterThanOrEqualToThreshold') &&
        cfg.threshold === 80 &&
        cfg.evaluationPeriods === 3
    },
    {
      id: 'ch-2',
      title: 'Challenge 2: Low Available Capacity Detection',
      description: 'Create an alarm that detects low disk capacity or connection drop below 20%.',
      testValues: [35, 28, 18, 16, 14],
      hint: 'Set Comparison = < or <=, Threshold = 20, with appropriate evaluation periods.',
      validate: (cfg) =>
        (cfg.operator === 'LessThanThreshold' || cfg.operator === 'LessThanOrEqualToThreshold') &&
        cfg.threshold <= 20
    },
    {
      id: 'ch-3',
      title: 'Challenge 3: Filter Out Transient Spikes (Alarm Flapping)',
      description: 'Create an alarm that does NOT trigger when CPU briefly reaches 85% for only 1 or 2 periods.',
      testValues: [35, 85, 85, 40, 38],
      hint: 'Require at least 3 or more consecutive evaluation periods (N >= 3) with threshold >= 80.',
      validate: (cfg) =>
        cfg.metricName === 'CPUUtilization' &&
        cfg.evaluationPeriods >= 3 &&
        cfg.threshold <= 85
    },
    {
      id: 'ch-4',
      title: 'Challenge 4: Database Connection Saturation Alert',
      description: 'Create an alarm for Database-01 when active connections exceed 80.',
      testValues: [25, 45, 82, 85, 89],
      hint: 'Target Database-01, Metric = DatabaseConnections, Operator = >, Threshold = 80.',
      validate: (cfg) =>
        cfg.resourceId === 'Database-01' &&
        cfg.metricName === 'DatabaseConnections' &&
        (cfg.operator === 'GreaterThanThreshold' || cfg.operator === 'GreaterThanOrEqualToThreshold') &&
        cfg.threshold === 80
    }
  ];

  // Local storage persistence for completed challenges
  const [completedChallenges, setCompletedChallenges] = useState<string[]>(() => {
    const saved = localStorage.getItem('cw_learning_challenges');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cw_learning_challenges', JSON.stringify(completedChallenges));
  }, [completedChallenges]);

  const handleTestChallenge = (ch: Challenge) => {
    const passed = ch.validate({
      resourceId: activeAlarmPreview.resource,
      metricName: activeAlarmPreview.metric,
      operator: activeAlarmPreview.operator,
      threshold: activeAlarmPreview.threshold,
      evaluationPeriods: activeAlarmPreview.evaluationPeriods
    });

    if (passed) {
      if (!completedChallenges.includes(ch.id)) {
        setCompletedChallenges((prev) => [...prev, ch.id]);
      }
    }
  };

  const handleResetChallengeProgress = () => {
    setCompletedChallenges([]);
    localStorage.removeItem('cw_learning_challenges');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Title & Subtitle Banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <span className="bg-amber-500 text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
            Educational Enhancement
          </span>
          <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
            Interactive AWS Observation Laboratory
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">
          CloudWatch Learning Lab
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Experiment with metrics, thresholds and alarm evaluation.
        </p>
      </div>

      {/* ================= SECTION 1 — BUILD AN ALARM ================= */}
      <section className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              SECTION 1 — BUILD AN ALARM
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure resource, metric, threshold and evaluation parameters
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateAlarm} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Resource */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Resource:
              </label>
              <select
                value={selectedResourceId}
                onChange={(e) => handleResourceChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Metric */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Metric:
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => handleMetricChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
              >
                {selectedResource.supportedMetrics.map((m) => (
                  <option key={m} value={m}>
                    {METRIC_DEFINITIONS[m]?.displayName || m} ({METRIC_DEFINITIONS[m]?.unit || ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Statistic */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Statistic:
              </label>
              <select
                value={statistic}
                onChange={(e) => setStatistic(e.target.value as MetricStatistic)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
              >
                <option value="Average">Average</option>
                <option value="Maximum">Maximum</option>
                <option value="Minimum">Minimum</option>
              </select>
            </div>

            {/* Comparison */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Comparison:
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as ComparisonOperator)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono font-bold"
              >
                <option value="GreaterThanThreshold">&gt; (Greater Than)</option>
                <option value="GreaterThanOrEqualToThreshold">&gt;= (Greater Than or Equal)</option>
                <option value="LessThanThreshold">&lt; (Less Than)</option>
                <option value="LessThanOrEqualToThreshold">&lt;= (Less Than or Equal)</option>
              </select>
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Threshold:
              </label>
              <input
                type="number"
                required
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            {/* Evaluation Periods */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Evaluation Periods:
              </label>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={evaluationPeriods}
                onChange={(e) => setEvaluationPeriods(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>
          </div>

          {/* Alarm Name Input & Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="w-full sm:w-2/3">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Alarm Name:
              </label>
              <input
                type="text"
                required
                value={alarmName}
                onChange={(e) => setAlarmName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl shadow-xs transition self-end flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Alarm
            </button>
          </div>
        </form>

        {/* Alarm Configuration Preview Panel */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Resulting Alarm Configuration Preview:
          </h3>
          <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">ALARM NAME</span>
              <span className="font-bold text-slate-900 dark:text-white truncate block">
                {activeAlarmPreview.name}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">RESOURCE & METRIC</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                {activeAlarmPreview.resource} : {activeAlarmPreview.metricDisplay}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">CRITERIA</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {activeAlarmPreview.statistic} {getOperatorSymbol(activeAlarmPreview.operator)}{' '}
                {activeAlarmPreview.threshold}
                {activeAlarmPreview.unit === 'Percent' ? '%' : ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">EVALUATION WINDOW</span>
              <span className="font-bold text-sky-600 dark:text-sky-400">
                {activeAlarmPreview.evaluationPeriods} consecutive periods
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 2 — SIMULATE METRIC VALUES ================= */}
      <section className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                SECTION 2 — SIMULATE METRIC VALUES
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current metric:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {activeAlarmPreview.metricDisplay}
                </strong>
              </p>
            </div>
          </div>

          {/* Generator Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleGenerateNormalTraffic}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
            >
              Generate Normal Traffic
            </button>
            <button
              onClick={handleSimulateSpike}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-semibold text-xs transition"
            >
              Simulate Spike
            </button>
            <button
              onClick={handleResetValues}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs transition flex items-center"
              title="Reset to default sequence"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset Values
            </button>
          </div>
        </div>

        {/* Sequence of simulated values cards / inputs */}
        <div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
            Sequence of simulated values across evaluation intervals (modify values inline):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
            {simulatedValues.map((p) => (
              <div
                key={p.id}
                className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1"
              >
                <span className="text-[11px] font-sans font-bold text-slate-500 dark:text-slate-400 block">
                  Period {p.id}:
                </span>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={p.value}
                    onChange={(e) => handleUpdatePeriodValue(p.id, Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-slate-900 dark:text-white font-bold text-sm text-center"
                  />
                  <span className="text-xs text-slate-400 font-sans">
                    {activeAlarmPreview.unit === 'Percent' ? '%' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION 3 — ALARM EVALUATION ================= */}
      <section className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                SECTION 3 — ALARM EVALUATION
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation against Threshold ={' '}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {getOperatorSymbol(activeAlarmPreview.operator)} {activeAlarmPreview.threshold}
                  {activeAlarmPreview.unit === 'Percent' ? '%' : ''}
                </strong>
              </p>
            </div>
          </div>

          {/* Alarm State Badge */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 uppercase font-semibold">Alarm State:</span>
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center ${
                evaluationResult.state === 'ALARM'
                  ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                  : evaluationResult.state === 'OK'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-amber-500 text-black shadow-xs'
              }`}
            >
              <span className="mr-1.5">
                {evaluationResult.state === 'ALARM'
                  ? '🔴'
                  : evaluationResult.state === 'OK'
                  ? '🟢'
                  : '🟡'}
              </span>
              {evaluationResult.state}
            </span>
          </div>
        </div>

        {/* Visual Evaluation Table: Period / Value / Status Checkmark */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-2">Evaluation Period</th>
                <th className="pb-2">Simulated Metric Value</th>
                <th className="pb-2">Threshold Condition</th>
                <th className="pb-2">Period Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {evaluationResult.evaluatedPeriods.map((p) => {
                const opSym = getOperatorSymbol(activeAlarmPreview.operator);
                return (
                  <tr
                    key={p.id}
                    className={`transition ${
                      p.isBreaching
                        ? 'bg-rose-50/50 dark:bg-rose-950/20'
                        : 'bg-emerald-50/30 dark:bg-emerald-950/10'
                    }`}
                  >
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                      Period {p.id}
                    </td>
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                      {p.value}
                      {activeAlarmPreview.unit === 'Percent' ? '%' : ''}
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">
                      {opSym} {activeAlarmPreview.threshold}
                    </td>
                    <td className="py-2.5">
                      {p.isBreaching ? (
                        <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-bold font-sans">
                          <XCircle className="w-4 h-4 mr-1 text-rose-500" />
                          ✕ Breaching
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold font-sans">
                          <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
                          ✓ Normal (OK)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Consecutive Periods Metrics Summary */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 font-sans block">
              REQUIRED CONSECUTIVE PERIODS
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {activeAlarmPreview.evaluationPeriods} consecutive periods
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-sans block">
              CURRENT CONSECUTIVE BREACHING PERIODS
            </span>
            <span
              className={`text-base font-bold ${
                evaluationResult.maxConsecutiveBreaches >= activeAlarmPreview.evaluationPeriods
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {evaluationResult.maxConsecutiveBreaches} consecutive periods
            </span>
          </div>
        </div>
      </section>

      {/* ================= SECTION 4 — EXPLANATION ================= */}
      <section className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              SECTION 4 — EXPLANATION
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Plain-English pedagogical breakdown of why the alarm evaluated to {evaluationResult.state}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-slate-900 border border-amber-300 dark:border-amber-900/60">
          <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
            "{evaluationResult.explanation}"
          </p>
          <div className="mt-3 text-[11px] text-amber-700 dark:text-amber-400/90 font-sans flex items-center">
            <Info className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            This explanation is generated dynamically as part of our interactive CloudWatch learning interface.
          </div>
        </div>
      </section>

      {/* ================= SECTION 5 — EXPERIMENT ================= */}
      <section className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              SECTION 5 — EXPERIMENT
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Change the threshold and see what happens immediately.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Current Threshold:
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {activeAlarmPreview.threshold}
                {activeAlarmPreview.unit === 'Percent' ? '%' : ''}
              </span>
            </div>

            {/* Quick Experiment Chips */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">Change to:</span>
              {[70, 75, 80, 85, 90, 95].map((val) => (
                <button
                  key={val}
                  onClick={() => handleExperimentThresholdChange(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                    activeAlarmPreview.threshold === val
                      ? 'bg-amber-500 text-black border-transparent shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            💡 <strong>Observation:</strong> Notice how raising the threshold to <strong>90%</strong> immediately
            clears periods that breached at 80%, reverting the alarm state back from <strong>ALARM</strong> to <strong>OK</strong> without needing any server restart!
          </div>
        </div>
      </section>

      {/* ================= SECTION 6 — LEARNING CHALLENGES ================= */}
      <section className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                SECTION 6 — LEARNING CHALLENGES
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete interactive exercises to validate CloudWatch monitoring concepts
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-slate-900 px-3 py-1 rounded-lg border border-amber-200 dark:border-slate-800">
              Progress: {completedChallenges.length} / {challenges.length} Solved
            </span>
            {completedChallenges.length > 0 && (
              <button
                onClick={handleResetChallengeProgress}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center"
                title="Reset challenge progress"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Reset
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((ch) => {
            const isCompleted = completedChallenges.includes(ch.id);

            return (
              <div
                key={ch.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      {ch.title}
                    </h3>
                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white uppercase flex items-center">
                        <Check className="w-3 h-3 mr-1" /> Completed!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {ch.description}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 font-mono bg-white dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    💡 Hint: {ch.hint}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Uses current Section 1 alarm config
                  </span>
                  <button
                    onClick={() => handleTestChallenge(ch)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-black font-bold text-xs transition shadow-xs hover:opacity-90 flex items-center"
                  >
                    Verify Alarm Configuration
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
