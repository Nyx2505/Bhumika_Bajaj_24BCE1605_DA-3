import React from 'react';
import { PeriodEvaluationStep } from '../../engine/learningEngine';
import { ComparisonOperator } from '../../types/cloudwatch';
import { getOperatorSymbol } from '../../engine/alarmEvaluator';
import { CheckCircle2, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';

interface AlarmEvaluationTimelineProps {
  steps: PeriodEvaluationStep[];
  threshold: number;
  evaluationPeriods: number;
  operator: ComparisonOperator;
}

export const AlarmEvaluationTimeline: React.FC<AlarmEvaluationTimelineProps> = ({
  steps,
  threshold,
  evaluationPeriods,
  operator
}) => {
  const operatorSymbol = getOperatorSymbol(operator);

  return (
    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2" />
            Visual Alarm Evaluation Timeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            CloudWatch sliding window evaluation across consecutive periods ({evaluationPeriods} required)
          </p>
        </div>
        <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
          Rule: Value {operatorSymbol} {threshold}
        </span>
      </div>

      {/* Step Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {steps.map((step) => {
          let badgeBg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
          let borderClass = 'border-slate-200 dark:border-slate-800';

          if (step.stateAtStep === 'ALARM') {
            badgeBg = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse';
            borderClass = 'border-rose-400 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/10';
          } else if (step.stateAtStep === 'OK') {
            badgeBg = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
            borderClass = 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10';
          }

          return (
            <div
              key={step.period}
              className={`p-3.5 rounded-xl border ${borderClass} flex flex-col justify-between transition`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500">
                  <span>Period {step.period}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${badgeBg}`}>
                    {step.stateAtStep}
                  </span>
                </div>

                <div className="my-2">
                  <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    {step.value}
                  </span>
                  <span
                    className={`text-[10px] ml-1.5 font-bold ${
                      step.isBreaching ? 'text-rose-500' : 'text-emerald-500'
                    }`}
                  >
                    ({step.isBreaching ? 'BREACH' : 'OK'})
                  </span>
                </div>

                {/* Sliding window preview */}
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                  Window: [{step.activeWindow.join(', ')}]
                </div>
              </div>

              {/* Status Explanation */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                {step.breachingCountInWindow}/{step.requiredBreaches} breaches in window
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
