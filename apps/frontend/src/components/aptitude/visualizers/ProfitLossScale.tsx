'use client';

import React, { useState } from 'react';
import { sounds } from '../SoundManager';

export default function ProfitLossScale() {
  const [costPrice, setCostPrice] = useState<number>(1000);
  const [markupPercent, setMarkupPercent] = useState<number>(40); // 40% markup => MP = 1400
  const [discountPercent, setDiscountPercent] = useState<number>(20); // 20% discount on MP => SP = 1120

  const markedPrice = costPrice * (1 + markupPercent / 100);
  const sellingPrice = markedPrice * (1 - discountPercent / 100);
  const profitAmount = sellingPrice - costPrice;
  const profitPercentage = (profitAmount / costPrice) * 100;

  // Scale tilt angle (positive = SP heavier/profit, negative = CP heavier/loss)
  const tiltAngle = Math.max(-20, Math.min(20, (profitPercentage / 100) * 40));

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-base">
            <i className="fa-solid fa-scale-balanced"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Merchant Profit-Loss Balance Scale</h3>
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Markup & Discount Physics</span>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider border ${
          profitAmount >= 0
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {profitAmount >= 0 ? `+${profitPercentage.toFixed(1)}% Profit` : `${profitPercentage.toFixed(1)}% Loss`}
        </span>
      </div>

      {/* Animated Balance Scale Graphic */}
      <div className="relative w-full h-44 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center overflow-hidden">
        {/* Fulcrum Triangle */}
        <div className="absolute bottom-6 w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[36px] border-b-slate-400 z-10"></div>
        <div className="absolute bottom-4 w-16 h-3 bg-slate-300 rounded-full"></div>

        {/* Tipping Beam */}
        <div
          className="relative w-64 sm:w-80 h-3 bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-500 rounded-full shadow-md transition-transform duration-300 origin-center flex items-center justify-between px-2"
          style={{ transform: `rotate(${-tiltAngle}deg)` }}
        >
          {/* Left Pan: Cost Price */}
          <div className="relative -top-2 flex flex-col items-center animate-fade-in">
            <div className="w-0.5 h-10 bg-slate-400"></div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center shadow-md w-24">
              <div className="text-[9px] uppercase font-bold text-slate-500">Cost Price</div>
              <div className="font-mono font-black text-xs text-slate-900">₹{costPrice}</div>
            </div>
          </div>

          {/* Right Pan: Selling Price */}
          <div className="relative -top-2 flex flex-col items-center animate-fade-in">
            <div className="w-0.5 h-10 bg-slate-400"></div>
            <div className={`p-2.5 rounded-xl text-center shadow-md w-24 border ${
              profitAmount >= 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="text-[9px] uppercase font-bold opacity-80">Selling Price</div>
              <div className="font-mono font-black text-xs">₹{Math.round(sellingPrice)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        {/* Cost Price Slider */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Base CP:</span>
            <span className="text-slate-900 font-mono">₹{costPrice}</span>
          </div>
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={costPrice}
            onChange={(e) => setCostPrice(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Markup Slider */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Markup (%):</span>
            <span className="text-amber-700 font-mono">+{markupPercent}% (₹{Math.round(markedPrice)})</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={markupPercent}
            onChange={(e) => setMarkupPercent(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />
        </div>

        {/* Discount Slider */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Discount (%):</span>
            <span className="text-rose-600 font-mono">-{discountPercent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
          />
        </div>
      </div>

      {/* Net Outcome Summary */}
      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-600">
          <i className="fa-solid fa-calculator text-indigo-600"></i>
          <span>Successive Formula: <code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">Net = Markup - Disc - (Markup*Disc)/100</code></span>
        </div>
        <div className="font-mono font-bold text-slate-800">
          Net Profit/Loss: <span className={profitAmount >= 0 ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>₹{Math.round(profitAmount)} ({profitPercentage.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
}
