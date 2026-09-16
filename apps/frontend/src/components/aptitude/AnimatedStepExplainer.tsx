'use client';

import React, { useState } from 'react';
import { sounds } from './SoundManager';

interface StepItem {
  title: string;
  description: string;
  formula?: string;
}

interface AnimatedStepExplainerProps {
  steps: StepItem[];
  finalAnswer?: string;
  shortcutTrick?: string;
}

export default function AnimatedStepExplainer({
  steps,
  finalAnswer,
  shortcutTrick
}: AnimatedStepExplainerProps) {
  const [activeStep, setActiveStep] = useState<number>(0);

  if (!steps || steps.length === 0) return null;

  const currentStep = steps[activeStep] || steps[0];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
      {/* Step Indicator Navigation Pills */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-1.5">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setActiveStep(idx); sounds.playClick(); }}
              className={`h-7 px-3 rounded-lg text-xs font-black transition flex items-center space-x-1 ${
                activeStep === idx
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span>Step {idx + 1}</span>
            </button>
          ))}
        </div>

        <span className="text-[10px] uppercase font-bold text-slate-500">
          Step {activeStep + 1} of {steps.length}
        </span>
      </div>

      {/* Active Step Content Card */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs animate-fade-in">
        <div className="text-xs font-black text-indigo-700 flex items-center space-x-2">
          <i className="fa-solid fa-arrow-right text-amber-500 text-xs"></i>
          <span>{currentStep.title}</span>
        </div>

        {currentStep.formula && (
          <div className="p-2.5 bg-emerald-50/70 rounded-lg font-mono text-xs sm:text-sm font-bold text-emerald-800 border border-emerald-200">
            {currentStep.formula}
          </div>
        )}

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          {currentStep.description}
        </p>
      </div>

      {/* Step Navigation CTA Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => { setActiveStep(prev => Math.max(0, prev - 1)); sounds.playClick(); }}
          disabled={activeStep === 0}
          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 disabled:opacity-30 text-xs font-bold transition flex items-center space-x-1.5"
        >
          <i className="fa-solid fa-arrow-left text-[10px]"></i>
          <span>Prev Step</span>
        </button>

        <button
          onClick={() => { setActiveStep(prev => Math.min(steps.length - 1, prev + 1)); sounds.playClick(); }}
          disabled={activeStep === steps.length - 1}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-30 text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
        >
          <span>Next Step</span>
          <i className="fa-solid fa-arrow-right text-[10px]"></i>
        </button>
      </div>

      {/* Final Answer / Shortcut Callout */}
      {finalAnswer && activeStep === steps.length - 1 && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center font-bold text-xs text-emerald-800 animate-fade-in-up">
          🎯 Final Deducted Answer: <strong className="text-slate-900">{finalAnswer}</strong>
        </div>
      )}
    </div>
  );
}
