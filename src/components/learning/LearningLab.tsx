import React, { useState } from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { METRIC_DEFINITIONS } from '../../data/initialResources';
import { LEARNING_CHALLENGES } from '../../data/challenges';
import {
  AlarmState,
  ComparisonOperator
} from '../../types/cloudwatch';
import {
  isDatapointBreaching,
  formatOperator
} from '../../engine/alarmEvaluator';
import {
  GraduationCap,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const LearningLab: React.FC = () => {
  const { resources } = useCloudWatch();

  // Mode: Sandbox Lab vs Architectural Challenges
  const [labMode, setLabMode] = useState<'SANDBOX' | 'CHALLENGES'>('SANDBOX');

  // --- SANDBOX STATE ---
  const [selectedResId, setSelectedResId] = useState<string>(resources[0]?.id || 'i-0a812fec99');
  const selectedResource = resources.find((r) => r.id === selectedResId) || resources[0];

  const [selectedMetric, setSelectedMetric] = useState<string>(
    selectedResource.supportedMetrics[0] || 'CPUUtilization'
  );

  const metricDef = METRIC_DEFINITIONS[selectedMetric];

  // Configurable Alarm Parameters
  const [operator, setOperator] = useState<ComparisonOperator>('GreaterThanOrEqualToThreshold');
  const [threshold, setThreshold] = useState<number>(metricDef?.defaultThreshold || 80);
  const [evaluationPeriods, setEvaluationPeriods] = useState<number>(3); // N
  const [datapointsToAlarm, setDatapointsToAlarm] = useState<number>(3); // M

  // Interactive Datapoint Buffer
  const [datapointBuffer, setDatapointBuffer] = useState<number[]>([35.2, 42.1]);
  const [manualInputVal, setManualInputVal] = useState<number>(85);

  // Compute Alarm State dynamically in Sandbox
  const N = evaluationPeriods;
  const M = datapointsToAlarm;
  const activeWindow = datapointBuffer.slice(-N);

  let sandboxState: AlarmState = 'INSUFFICIENT_DATA';
  let breachingCount = 0;
  let explanationReason = '';

  if (activeWindow.length < N) {
    sandboxState = 'INSUFFICIENT_DATA';
    explanationReason = `Insufficient Datapoints: CloudWatch requires ${N} evaluation periods before evaluating state. Currently only ${activeWindow.length} datapoints [${activeWindow.join(', ')}] exist in the window.`;
  } else {
    breachingCount = activeWindow.filter((val) =>
      isDatapointBreaching(val, threshold, operator)
    ).length;

    const opText = formatOperator(operator);

    if (breachingCount >= M) {
      sandboxState = 'ALARM';
      explanationReason = `Condition Met (ALARM): ${breachingCount} out of the last ${N} datapoints [${activeWindow.join(', ')}] were ${opText} the threshold (${threshold}). Required threshold breaches (M=${M}) was satisfied!`;
    } else {
      sandboxState = 'OK';
      explanationReason = `Condition Not Met (OK): Only ${breachingCount} out of the last ${N} datapoints [${activeWindow.join(', ')}] breached the threshold. Since ${breachingCount} is less than ${M}, CloudWatch evaluates the alarm to OK.`;
    }
  }

  const handleFeedDatapoint = (val: number) => {
    setDatapointBuffer((prev) => [...prev, Number(val.toFixed(1))]);
  };

  const handleInjectSequence = (seq: number[]) => {
    setDatapointBuffer(seq);
  };

  const handleResetBuffer = () => {
    setDatapointBuffer([]);
  };

  // --- CHALLENGES STATE ---
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number>(0);
  const challenge = LEARNING_CHALLENGES[activeChallengeIdx];

  const [challengeThreshold, setChallengeThreshold] = useState<number>(
    challenge.initialConfig.threshold
  );
  const [challengeN, setChallengeN] = useState<number>(
    challenge.initialConfig.evaluationPeriods
  );
  const [challengeM, setChallengeM] = useState<number>(
    challenge.initialConfig.datapointsToAlarm
  );
  const [challengeOperator, setChallengeOperator] = useState<ComparisonOperator>(
    challenge.initialConfig.comparisonOperator
  );

  const [challengeResult, setChallengeResult] = useState<{
    tested: boolean;
    passed: boolean;
    finalState: AlarmState;
    message: string;
  } | null>(null);

  const handleSelectChallenge = (idx: number) => {
    setActiveChallengeIdx(idx);
    const c = LEARNING_CHALLENGES[idx];
    setChallengeThreshold(c.initialConfig.threshold);
    setChallengeN(c.initialConfig.evaluationPeriods);
    setChallengeM(c.initialConfig.datapointsToAlarm);
    setChallengeOperator(c.initialConfig.comparisonOperator);
    setChallengeResult(null);
  };

  const handleRunChallengeEvaluation = () => {
    const c = challenge;
    const window = c.sampleDatapoints.slice(-challengeN);

    let state: AlarmState = 'INSUFFICIENT_DATA';
    if (window.length >= challengeN) {
      const breaches = window.filter((val) =>
        isDatapointBreaching(val, challengeThreshold, challengeOperator)
      ).length;
      state = breaches >= challengeM ? 'ALARM' : 'OK';
    }

    let passed = true;
    let message = '';

    if (state !== c.targetOutcome.expectedState) {
      passed = false;
      message = `Alarm evaluated to ${state}, but the scenario required it to evaluate to ${c.targetOutcome.expectedState}.`;
    } else if (
      c.targetOutcome.minEvaluationPeriods &&
      challengeN < c.targetOutcome.minEvaluationPeriods
    ) {
      passed = false;
      message = `Evaluation periods N=${challengeN} is too low. AWS Well-Architected recommendation requires N ≥ ${c.targetOutcome.minEvaluationPeriods} to prevent flapping.`;
    } else if (
      c.targetOutcome.requiredComparisonOperator &&
      challengeOperator !== c.targetOutcome.requiredComparisonOperator
    ) {
      passed = false;
      message = `Incorrect comparison operator. Expected ${c.targetOutcome.requiredComparisonOperator}.`;
    } else {
      passed = true;
      message = `Challenge Passed! ${c.architectExplanation}`;
    }

    setChallengeResult({
      tested: true,
      passed,
      finalState: state,
      message
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-600/20 dark:via-slate-900 dark:to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500 text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Unique Enhancement
              </span>
              <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
                Educational CloudWatch Laboratory
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Interactive CloudWatch Learning Lab
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Experiment with sliding-window multi-period alarm evaluations ($M$ of $N$), test
              state machine transitions, and understand the architectural reasoning behind
              every CloudWatch state change.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setLabMode('SANDBOX')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                labMode === 'SANDBOX'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5" />
              Alarm Sandbox Lab
            </button>
            <button
              onClick={() => setLabMode('CHALLENGES')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                labMode === 'CHALLENGES'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 mr-1.5" />
              Guided Challenges ({LEARNING_CHALLENGES.length})
            </button>
          </div>
        </div>
      </div>

      {labMode === 'SANDBOX' ? (
        /* ======================== MODE A: SANDBOX LAB ======================== */
        <div className="space-y-6">
          {/* Top Configuration Controls */}
          <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <Sliders className="w-4 h-4 mr-2 text-amber-500" />
                1. Configure Simulated CloudWatch Alarm Parameters
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Adjust sliders to see live state changes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Resource */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Resource
                </label>
                <select
                  value={selectedResId}
                  onChange={(e) => {
                    setSelectedResId(e.target.value);
                    const res = resources.find((r) => r.id === e.target.value);
                    if (res) setSelectedMetric(res.supportedMetrics[0]);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.type}] {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metric */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Metric
                </label>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                >
                  {selectedResource.supportedMetrics.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comparison Operator */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Comparison Operator
                </label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as ComparisonOperator)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                >
                  <option value="GreaterThanOrEqualToThreshold">Greater Than or Equal (≥)</option>
                  <option value="GreaterThanThreshold">Greater Than (&gt;)</option>
                  <option value="LessThanOrEqualToThreshold">Less Than or Equal (≤)</option>
                  <option value="LessThanThreshold">Less Than (&lt;)</option>
                </select>
              </div>

              {/* Threshold */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Threshold ({metricDef?.unit || 'Unit'}):{' '}
                  <strong className="text-amber-600 dark:text-amber-400 font-mono">{threshold}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={metricDef ? metricDef.defaultThreshold * 2 : 100}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-amber-500 mt-2"
                />
              </div>
            </div>

            {/* M of N Evaluation Periods Selector */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Evaluation Periods (N):
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                    {evaluationPeriods} periods
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={evaluationPeriods}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setEvaluationPeriods(n);
                    if (datapointsToAlarm > n) setDatapointsToAlarm(n);
                  }}
                  className="w-full accent-sky-500"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  CloudWatch will observe the latest {evaluationPeriods} consecutive evaluation periods.
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Datapoints to Alarm (M):
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                    {datapointsToAlarm} of {evaluationPeriods}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={evaluationPeriods}
                  value={datapointsToAlarm}
                  onChange={(e) => setDatapointsToAlarm(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Alarm fires if at least {datapointsToAlarm} of the last {evaluationPeriods} datapoints breach threshold.
                </span>
              </div>
            </div>
          </div>

          {/* Interactive State Machine Diagram & Live State */}
          <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 text-sky-500" />
                2. Live CloudWatch State Machine & Sliding Window Buffer
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Current Evaluated State:</span>
                <span
                  className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                    sandboxState === 'ALARM'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                      : sandboxState === 'OK'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {sandboxState}
                </span>
              </div>
            </div>

            {/* CloudWatch State Machine Visual Flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Node 1: INSUFFICIENT_DATA */}
              <div
                className={`p-4 rounded-xl border text-center transition ${
                  sandboxState === 'INSUFFICIENT_DATA'
                    ? 'bg-amber-500/10 border-amber-500 shadow-xs scale-105 ring-1 ring-amber-500'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mx-auto mb-2 animate-ping"></div>
                <div className="font-bold text-xs text-amber-700 dark:text-amber-300 uppercase">
                  INSUFFICIENT_DATA
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Datapoints &lt; {N} evaluation periods
                </div>
              </div>

              {/* Node 2: OK */}
              <div
                className={`p-4 rounded-xl border text-center transition ${
                  sandboxState === 'OK'
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-xs scale-105 ring-1 ring-emerald-500'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mx-auto mb-2"></div>
                <div className="font-bold text-xs text-emerald-700 dark:text-emerald-300 uppercase">
                  OK
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Breaching points &lt; {M} of {N}
                </div>
              </div>

              {/* Node 3: ALARM */}
              <div
                className={`p-4 rounded-xl border text-center transition ${
                  sandboxState === 'ALARM'
                    ? 'bg-rose-500/10 border-rose-500 shadow-xs scale-105 ring-1 ring-rose-500'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mx-auto mb-2 animate-bounce"></div>
                <div className="font-bold text-xs text-rose-700 dark:text-rose-400 uppercase">
                  ALARM
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Breaching points ≥ {M} of {N}
                </div>
              </div>
            </div>

            {/* Sliding Evaluation Window Buffer Visualization */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Active Sliding Evaluation Window (Last {N} Datapoints)
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  Breaching:{' '}
                  <strong className="text-amber-600 dark:text-amber-400">{breachingCount}</strong> /{' '}
                  {M} required
                </span>
              </div>

              {activeWindow.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs italic">
                  Evaluation buffer empty. Feed datapoints below to begin evaluation.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2">
                  {activeWindow.map((val, idx) => {
                    const isBreach = isDatapointBreaching(val, threshold, operator);
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-center font-mono transition ${
                          isBreach
                            ? 'bg-rose-500/15 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold'
                            : 'bg-emerald-500/15 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        <div className="text-[9px] text-slate-400">Point #{idx + 1}</div>
                        <div className="text-sm">{val}</div>
                        <div className="text-[9px] uppercase mt-0.5">
                          {isBreach ? 'BREACH' : 'SAFE'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Explainability Engine */}
            <div className="bg-amber-50/50 dark:bg-slate-900/60 p-4 rounded-xl border border-amber-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Explainability Engine: "Why did the alarm enter this state?"</span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono bg-white dark:bg-black/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                {explanationReason}
              </p>
            </div>
          </div>

          {/* Interactive Datapoint Feeder Section */}
          <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <Play className="w-4 h-4 mr-2 text-emerald-500" />
                3. Interactive Datapoint Feeder (Experiment with Values)
              </h2>
              <button
                onClick={handleResetBuffer}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Clear Buffer
              </button>
            </div>

            {/* Manual Single Value Injection */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs text-slate-600 dark:text-slate-400">Value to feed:</span>
                <input
                  type="number"
                  value={manualInputVal}
                  onChange={(e) => setManualInputVal(Number(e.target.value))}
                  className="w-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => handleFeedDatapoint(manualInputVal)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg transition shadow-xs"
                >
                  Feed Datapoint
                </button>
                <button
                  onClick={() => handleFeedDatapoint(threshold + 10)}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-lg transition"
                >
                  + Feed Breaching ({threshold + 10})
                </button>
                <button
                  onClick={() => handleFeedDatapoint(threshold - 15)}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-lg transition"
                >
                  + Feed Safe ({threshold - 15})
                </button>
              </div>
            </div>

            {/* Preset Diagnostic Sequences */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Simulate Incident Sequences:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <button
                  onClick={() => handleInjectSequence([35, 40, 89, 38, 42])}
                  className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-left text-xs transition group"
                >
                  <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500">
                    1. Transient Spike (Cron Job)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    [35, 40, 89, 38, 42]
                  </div>
                </button>

                <button
                  onClick={() => handleInjectSequence([45, 88, 92, 95, 99])}
                  className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-left text-xs transition group"
                >
                  <div className="font-bold text-slate-900 dark:text-white group-hover:text-rose-500">
                    2. Sustained Outage Breach
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    [45, 88, 92, 95, 99]
                  </div>
                </button>

                <button
                  onClick={() => handleInjectSequence([95, 90, 42, 38, 30])}
                  className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-left text-xs transition group"
                >
                  <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-500">
                    3. Auto-Healing Recovery
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    [95, 90, 42, 38, 30]
                  </div>
                </button>

                <button
                  onClick={() => handleInjectSequence([30, 85, 32, 88, 31, 89])}
                  className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-left text-xs transition group"
                >
                  <div className="font-bold text-slate-900 dark:text-white group-hover:text-purple-500">
                    4. Flapping Noise Wave
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    [30, 85, 32, 88, 31, 89]
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================== MODE B: GUIDED CHALLENGES ======================== */
        <div className="space-y-6">
          {/* Challenge Selector Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {LEARNING_CHALLENGES.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => handleSelectChallenge(idx)}
                className={`p-4 rounded-xl border text-left transition ${
                  activeChallengeIdx === idx
                    ? 'bg-amber-50 dark:bg-slate-800 border-amber-500 shadow-xs ring-1 ring-amber-500'
                    : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ch.difficulty === 'Beginner'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : ch.difficulty === 'Intermediate'
                        ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                        : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {ch.difficulty}
                  </span>
                  <span className="text-xs text-slate-400">#{idx + 1}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2 truncate">
                  {ch.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {ch.scenario}
                </p>
              </button>
            ))}
          </div>

          {/* Active Challenge Card */}
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Award className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {challenge.title}
                </h2>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                {challenge.scenario}
              </p>
            </div>

            {/* Architectural Context & Objective */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block text-[10px]">
                  AWS Architecture Context:
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {challenge.architectureContext}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider block text-[10px]">
                  Challenge Objective:
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {challenge.objective}
                </p>
              </div>
            </div>

            {/* Test Sample Stream */}
            <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Test Datapoint Stream that will be fed into your alarm:
              </div>
              <div className="flex items-center space-x-2 overflow-x-auto font-mono text-xs">
                {challenge.sampleDatapoints.map((pt, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 rounded-md border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    {pt}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Solution Form */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Your Proposed CloudWatch Alarm Configuration:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Operator
                  </label>
                  <select
                    value={challengeOperator}
                    onChange={(e) => setChallengeOperator(e.target.value as ComparisonOperator)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="GreaterThanOrEqualToThreshold">Greater Than or Equal (≥)</option>
                    <option value="GreaterThanThreshold">Greater Than (&gt;)</option>
                    <option value="LessThanOrEqualToThreshold">Less Than or Equal (≤)</option>
                    <option value="LessThanThreshold">Less Than (&lt;)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Threshold
                  </label>
                  <input
                    type="number"
                    value={challengeThreshold}
                    onChange={(e) => setChallengeThreshold(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Evaluation Periods (N)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={challengeN}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setChallengeN(n);
                      if (challengeM > n) setChallengeM(n);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Datapoints to Alarm (M)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={challengeN}
                    value={challengeM}
                    onChange={(e) => setChallengeM(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to test your alarm against the incident workload?
                </span>
                <button
                  onClick={handleRunChallengeEvaluation}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold text-xs rounded-xl shadow-md transition flex items-center"
                >
                  <Play className="w-4 h-4 mr-1.5" />
                  Evaluate Configuration
                </button>
              </div>
            </div>

            {/* Evaluation Result Feedback */}
            {challengeResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 animate-fadeIn ${
                  challengeResult.passed
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm">
                  {challengeResult.passed ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Challenge Solved!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span>Evaluation Criteria Not Satisfied</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed">{challengeResult.message}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
