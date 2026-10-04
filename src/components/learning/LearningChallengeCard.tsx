import React from 'react';
import { Award, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface ChallengeCardData {
  id: string;
  title: string;
  description: string;
  hint: string;
  testValues: number[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Architect';
}

interface LearningChallengeCardProps {
  challenge: ChallengeCardData;
  isCompleted: boolean;
  onTestChallenge: () => void;
}

export const LearningChallengeCard: React.FC<LearningChallengeCardProps> = ({
  challenge,
  isCompleted,
  onTestChallenge
}) => {
  return (
    <div
      className={`p-4 rounded-xl border transition flex flex-col justify-between ${
        isCompleted
          ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
          : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800'
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase font-bold text-amber-500 tracking-wider">
            {challenge.difficulty || 'Challenge'}
          </span>
          {isCompleted ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              SOLVED
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              PENDING
            </span>
          )}
        </div>

        <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">
          {challenge.title}
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
          {challenge.description}
        </p>

        {/* Hint Box */}
        <div className="mt-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-start space-x-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>
            <strong>Hint:</strong> {challenge.hint}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400">
          Test: [{challenge.testValues.join(', ')}]
        </span>
        <button
          onClick={onTestChallenge}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
            isCompleted
              ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs'
          }`}
        >
          {isCompleted ? 'Re-Test' : 'Test Alarm Config'}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
