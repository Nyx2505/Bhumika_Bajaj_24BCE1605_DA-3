import React, { useState, useMemo } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
import { ComparisonOperator } from '../../types/cloudwatch';
import {
  LearningEngine,
  SimulatedPeriodValue,
  LearningAlarmConfig
} from '../../engine/learningEngine';
import { AlarmBuilder } from './AlarmBuilder';
import { MetricSimulator } from './MetricSimulator';
import { AlarmEvaluationTimeline } from './AlarmEvaluationTimeline';
import { LearningChallengeCard } from './LearningChallengeCard';
import {
  GraduationCap,
  Sparkles,
  Info,
  CheckCircle2,
  Award,
  RotateCcw,
  Sliders,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const LearningLab: React.FC = () => {
  const { resources, learningProgress, completeChallenge, resetLearningProgress } = useCloudWatch();

  // Active Alarm Builder Configuration state
  const [alarmConfig, setAlarmConfig] = useState<LearningAlarmConfig>({
    resourceId: resources[0]?.id || 'EC2-Web-01',
    metricName: 'CPUUtilization',
    statistic: 'Average',
    operator: 'GreaterThanThreshold',
    threshold: 80,
    evaluationPeriods: 3,
    datapointsToAlarm: 3
  });

  const activeMetricDef = METRIC_DEFINITIONS[alarmConfig.metricName];

  // 5 Period Simulated Metric Values state
  const [simulatedValues, setSimulatedValues] = useState<SimulatedPeriodValue[]>(() =>
    LearningEngine.getDefaultPeriods()
  );

  // Challenge test feedback message
  const [challengeFeedback, setChallengeFeedback] = useState<{
    id: string;
    passed: boolean;
    message: string;
  } | null>(null);

  // Threshold What-If Experimenter state
  const [experimentThreshold, setExperimentThreshold] = useState<number>(alarmConfig.threshold);

  // Preset Handlers
  const handleSimulateNormal = () => {
    setSimulatedValues(LearningEngine.generateNormalPeriods(activeMetricDef));
  };

  const handleSimulateSpike = () => {
    setSimulatedValues(LearningEngine.generateSpikePeriods(alarmConfig.threshold));
  };

  const handleResetValues = () => {
    setSimulatedValues(LearningEngine.getDefaultPeriods());
  };

  // Evaluate sliding window across the 5 periods using LearningEngine
  const evaluationSteps = useMemo(() => {
    return LearningEngine.evaluateSlidingWindow(simulatedValues, alarmConfig);
  }, [simulatedValues, alarmConfig]);

  // Overall final state after all 5 periods
  const finalStep = evaluationSteps[evaluationSteps.length - 1];
  const finalState = finalStep ? finalStep.stateAtStep : 'INSUFFICIENT_DATA';

  // Architectural explanation text
  const transitionExplanation = useMemo(() => {
    const rawValues = simulatedValues.map((v) => v.value);
    return LearningEngine.generateExplanation(
      'OK',
      finalState,
      alarmConfig,
      rawValues.slice(-alarmConfig.evaluationPeriods)
    );
  }, [finalState, alarmConfig, simulatedValues]);

  // What-If Evaluation with experiment threshold
  const experimentSteps = useMemo(() => {
    return LearningEngine.evaluateSlidingWindow(simulatedValues, {
      ...alarmConfig,
      threshold: experimentThreshold
    });
  }, [simulatedValues, alarmConfig, experimentThreshold]);

  const experimentFinalState = experimentSteps[experimentSteps.length - 1]?.stateAtStep || 'INSUFFICIENT_DATA';

  // Available learning challenges
  const challenges = [
    {
      id: 'ch-1',
      title: 'Challenge 1: High CPU Utilization Alarm',
      description: 'Configure an alarm on EC2-Web-01 that alerts when CPUUtilization exceeds 80% for 3 consecutive periods.',
      testValues: [70, 75, 84, 86, 89],
      hint: 'Target EC2-Web-01, Metric = CPUUtilization, Operator = > or >=, Threshold = 80, Evaluation Periods = 3.',
      difficulty: 'Beginner' as const
    },
    {
      id: 'ch-2',
      title: 'Challenge 2: Low Available Capacity Detection',
      description: 'Create an alarm that detects low disk capacity or connection drop below 20%.',
      testValues: [35, 28, 18, 16, 14],
      hint: 'Set Comparison = < or <=, Threshold = 20, with appropriate evaluation periods.',
      difficulty: 'Intermediate' as const
    },
    {
      id: 'ch-3',
      title: 'Challenge 3: Filter Out Transient Spikes (Alarm Flapping)',
      description: 'Create an alarm that does NOT trigger when CPU briefly reaches 85% for only 1 or 2 periods.',
      testValues: [35, 85, 85, 40, 38],
      hint: 'Require at least 3 or more consecutive evaluation periods (N >= 3) with threshold >= 80.',
      difficulty: 'Intermediate' as const
    },
    {
      id: 'ch-4',
      title: 'Challenge 4: Database Connection Saturation Alert',
      description: 'Create an alarm for Database-01 when active connections exceed 80.',
      testValues: [25, 45, 82, 85, 89],
      hint: 'Target Database-01, Metric = DatabaseConnections, Operator = >, Threshold = 80.',
      difficulty: 'Architect' as const
    }
  ];

  const handleTestChallenge = (ch: (typeof challenges)[0]) => {
    const passed = LearningEngine.validateChallenge(ch.id, alarmConfig);

    if (passed) {
      completeChallenge(ch.id);
      setChallengeFeedback({
        id: ch.id,
        passed: true,
        message: `Success! Your alarm configuration on ${alarmConfig.metricName} correctly satisfies the architecture requirements.`
      });
    } else {
      setChallengeFeedback({
        id: ch.id,
        passed: false,
        message: `Not quite. Check the hint and reconfigure the resource, metric, threshold, or evaluation window.`
      });
    }
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
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight flex items-center">
          <GraduationCap className="w-7 h-7 mr-2 text-amber-500" />
          CloudWatch Learning Lab
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Experiment with metrics, thresholds and alarm evaluation.
        </p>
      </div>

      {/* SECTION 1 — BUILD AN ALARM */}
      <section className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <span>Module 1</span>
          <span>•</span>
          <span>Alarm Configuration</span>
        </div>
        <AlarmBuilder
          resources={resources}
          initialResourceId={alarmConfig.resourceId}
          initialMetricName={alarmConfig.metricName}
          initialThreshold={alarmConfig.threshold}
          initialEvaluationPeriods={alarmConfig.evaluationPeriods}
          initialOperator={alarmConfig.operator}
          onAlarmChange={setAlarmConfig}
        />
      </section>

      {/* SECTION 2 — SIMULATE METRIC VALUES */}
      <section className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <span>Module 2</span>
          <span>•</span>
          <span>Time-Series Telemetry Feeder</span>
        </div>
        <MetricSimulator
          values={simulatedValues}
          onChangeValues={setSimulatedValues}
          threshold={alarmConfig.threshold}
          unit={activeMetricDef?.unit === 'Percent' ? '%' : ' ' + (activeMetricDef?.unit || '')}
          onSimulateNormal={handleSimulateNormal}
          onSimulateSpike={handleSimulateSpike}
          onReset={handleResetValues}
        />
      </section>

      {/* SECTION 3 — VISUAL ALARM EVALUATION */}
      <section className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <span>Module 3</span>
          <span>•</span>
          <span>Sliding Window Progression</span>
        </div>
        <AlarmEvaluationTimeline
          steps={evaluationSteps}
          threshold={alarmConfig.threshold}
          evaluationPeriods={alarmConfig.evaluationPeriods}
          operator={alarmConfig.operator}
        />
      </section>

      {/* SECTION 4 — EXPLAINABILITY ENGINE ("Why did this happen?") */}
      <section className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Info className="w-5 h-5 text-purple-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              CloudWatch Explainability Engine
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Plain-English mathematical breakdown of why the alarm state transitioned
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 leading-relaxed text-xs">
          <div className="font-bold mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Evaluation Outcome Explanation:
          </div>
          {transitionExplanation}
        </div>
      </section>

      {/* SECTION 5 — WHAT-IF THRESHOLD EXPERIMENTER */}
      <section className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                "What-If" Threshold Sensitivity Experimenter
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjust threshold dynamically across current datapoints and observe state change sensitivity
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold">
            Simulated Threshold: {experimentThreshold}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-500 font-mono">0</span>
            <input
              type="range"
              min={10}
              max={110}
              value={experimentThreshold}
              onChange={(e) => setExperimentThreshold(Number(e.target.value))}
              className="flex-1 accent-amber-500 cursor-pointer"
            />
            <span className="text-xs text-slate-500 font-mono">110</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">
              Resulting State under Threshold <strong>{experimentThreshold}</strong>:
            </span>
            <span
              className={`px-2.5 py-1 rounded font-bold uppercase text-[11px] ${
                experimentFinalState === 'ALARM'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}
            >
              {experimentFinalState}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 6 — GUIDED CLOUDWATCH CHALLENGES */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Award className="w-5 h-5 mr-2 text-amber-500" />
              Guided Architectural Challenges
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Solve hands-on monitoring challenges to master alarm tuning and avoid alert fatigue
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              Solved: {learningProgress.length} / {challenges.length}
            </span>
            {learningProgress.length > 0 && (
              <button
                onClick={resetLearningProgress}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold cursor-pointer"
              >
                Reset Progress
              </button>
            )}
          </div>
        </div>

        {/* Challenge Test Feedback Alert */}
        {challengeFeedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
              challengeFeedback.passed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
            }`}
          >
            <span>{challengeFeedback.message}</span>
            <button
              onClick={() => setChallengeFeedback(null)}
              className="text-[11px] underline font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((ch) => (
            <LearningChallengeCard
              key={ch.id}
              challenge={ch}
              isCompleted={learningProgress.includes(ch.id)}
              onTestChallenge={() => handleTestChallenge(ch)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
