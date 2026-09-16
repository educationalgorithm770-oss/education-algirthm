'use client';

import React, { useState } from 'react';
import { sounds } from './SoundManager';

interface OnScreenCalculatorProps {
  onClose: () => void;
}

export default function OnScreenCalculator({ onClose }: OnScreenCalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<number | null>(null);

  const handleBtn = (val: string) => {
    sounds.playClick();
    if (val === 'C') {
      setDisplay('0');
      return;
    }
    if (val === 'CE') {
      setDisplay('0');
      return;
    }
    if (val === 'BACK') {
      setDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }
    if (val === '=') {
      try {
        // Safe evaluation of standard math expression
        const cleanExpr = display.replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '/100');
        // Sanitize: allow only numbers and basic operators
        if (/^[0-9+\-*/.() ]+$/.test(cleanExpr)) {
          // eslint-disable-next-line no-eval
          const res = Function(`'use strict'; return (${cleanExpr})`)();
          setDisplay(String(Math.round(res * 100000) / 100000));
        } else {
          setDisplay('Error');
        }
      } catch (e) {
        setDisplay('Error');
      }
      return;
    }
    if (val === 'sqrt') {
      try {
        const num = parseFloat(display);
        if (num >= 0) {
          setDisplay(String(Math.round(Math.sqrt(num) * 100000) / 100000));
        } else {
          setDisplay('Error');
        }
      } catch (e) {
        setDisplay('Error');
      }
      return;
    }
    if (val === '1/x') {
      try {
        const num = parseFloat(display);
        if (num !== 0) {
          setDisplay(String(Math.round((1 / num) * 100000) / 100000));
        } else {
          setDisplay('Error');
        }
      } catch (e) {
        setDisplay('Error');
      }
      return;
    }
    if (val === '+/-') {
      if (display !== '0') {
        setDisplay(prev => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
      }
      return;
    }

    setDisplay(prev => {
      if (prev === '0' || prev === 'Error') {
        return val;
      }
      return prev + val;
    });
  };

  const buttons = [
    ['C', 'CE', 'BACK', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['+/-', '0', '.', '='],
    ['sqrt', '1/x', '(', ')']
  ];

  return (
    <div className="fixed inset-x-3 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 w-auto sm:w-80 max-w-sm mx-auto bg-white/95 border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl p-3.5 sm:p-4 backdrop-blur-md animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-calculator text-indigo-600 text-sm"></i>
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Exam Scientific Calc</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs transition"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      {/* Screen */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-right mb-3 shadow-inner">
        <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-700 truncate">
          {display}
        </div>
      </div>

      {/* Button Keypad */}
      <div className="grid grid-cols-4 gap-1.5">
        {buttons.flat().map(b => {
          const isOp = ['÷', '×', '-', '+', '='].includes(b);
          const isSpecial = ['C', 'CE', 'BACK', 'sqrt', '1/x', '(', ')', '+/-'].includes(b);
          return (
            <button
              key={b}
              onClick={() => handleBtn(b)}
              className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 ${
                b === '='
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm'
                  : isOp
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : isSpecial
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold border border-slate-200'
              }`}
            >
              {b}
            </button>
          );
        })}
      </div>
    </div>
  );
}
