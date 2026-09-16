'use client';

import React, { useState } from 'react';
import { sounds } from './SoundManager';
import ConfettiBurst from './ConfettiBurst';

interface DailySpinWheelProps {
  canSpinToday: boolean;
  onSpinSuccess: (reward: { label: string; xp: number; gems: number }) => void;
  onClose: () => void;
}

const WHEEL_SLICES = [
  { label: '+50 XP', color: '#4F46E5', textColor: '#FFFFFF', icon: 'fa-bolt' },
  { label: '+10 Gems', color: '#EC4899', textColor: '#FFFFFF', icon: 'fa-gem' },
  { label: '+100 XP', color: '#10B981', textColor: '#FFFFFF', icon: 'fa-bolt' },
  { label: '+25 Gems', color: '#8B5CF6', textColor: '#FFFFFF', icon: 'fa-gem' },
  { label: '+150 XP', color: '#F59E0B', textColor: '#FFFFFF', icon: 'fa-fire' },
  { label: '50 💎 Jackpot', color: '#06B6D4', textColor: '#FFFFFF', icon: 'fa-crown' },
];

export default function DailySpinWheel({ canSpinToday, onSpinSuccess, onClose }: DailySpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [rewardWon, setRewardWon] = useState<{ label: string; xp: number; gems: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSpin = async () => {
    if (spinning || !canSpinToday || rewardWon) return;

    setSpinning(true);
    sounds.playClick();

    try {
      const res = await fetch('/api/aptitude/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DAILY_SPIN' })
      });
      const data = await res.json();

      if (data.success && data.reward) {
        const sliceIdx = data.reward.index ?? Math.floor(Math.random() * 6);
        const sliceAngle = 360 / WHEEL_SLICES.length;
        // Total rotations: 5 full 360s + target slice offset
        const targetRotation = rotation + 1800 + (360 - (sliceIdx * sliceAngle + sliceAngle / 2));

        setRotation(targetRotation);

        // Play ticking sound periodically during spin
        const interval = setInterval(() => {
          sounds.playSpinTick();
        }, 180);

        setTimeout(() => {
          clearInterval(interval);
          setSpinning(false);
          setRewardWon(data.reward);
          setShowConfetti(true);
          sounds.playLevelUp();
          onSpinSuccess(data.reward);
        }, 4000);
      } else {
        setSpinning(false);
        alert(data.message || 'Could not spin wheel');
      }
    } catch (e) {
      setSpinning(false);
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <ConfettiBurst active={showConfetti} />

      <div className="relative w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 text-center shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center transition"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Title */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black uppercase tracking-wider mb-2">
          <i className="fa-solid fa-sparkles text-amber-600"></i>
          <span>Daily Lucky Spin</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900">Daily Brain Rewards</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Spin the wheel every 24 hours to claim free Brain Gems and XP boosts!
        </p>

        {/* Wheel Container */}
        <div className="relative w-64 h-64 mx-auto my-2 flex items-center justify-center">
          {/* Wheel Pointer Triangle */}
          <div className="absolute -top-3 z-30 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-500 drop-shadow-md"></div>

          {/* Wheel Graphic */}
          <div
            className="w-full h-full rounded-full border-4 border-amber-400 shadow-xl relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {WHEEL_SLICES.map((slice, i) => {
                const angle = 360 / WHEEL_SLICES.length;
                const startAngle = i * angle;
                const endAngle = startAngle + angle;
                const radStart = (startAngle * Math.PI) / 180;
                const radEnd = (endAngle * Math.PI) / 180;

                const x1 = 100 + 100 * Math.cos(radStart);
                const y1 = 100 + 100 * Math.sin(radStart);
                const x2 = 100 + 100 * Math.cos(radEnd);
                const y2 = 100 + 100 * Math.sin(radEnd);

                const textAngle = startAngle + angle / 2;
                const radText = (textAngle * Math.PI) / 180;
                const tx = 100 + 60 * Math.cos(radText);
                const ty = 100 + 60 * Math.sin(radText);

                return (
                  <g key={i}>
                    <path
                      d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                      fill={slice.color}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      x={tx}
                      y={ty}
                      fill={slice.textColor}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${tx}, ${ty})`}
                    >
                      {slice.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Hub Button */}
          <button
            onClick={handleSpin}
            disabled={spinning || !canSpinToday || Boolean(rewardWon)}
            className={`absolute z-20 w-16 h-16 rounded-full font-black text-xs uppercase tracking-wider flex items-center justify-center shadow-xl transition border-2 ${
              canSpinToday && !rewardWon
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 border-white hover:scale-110 active:scale-95 animate-pulse'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            {spinning ? '...' : rewardWon ? 'Claimed' : canSpinToday ? 'SPIN' : 'Done'}
          </button>
        </div>

        {/* Reward Reveal Box */}
        {rewardWon && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-fade-in-up">
            <div className="text-sm font-extrabold text-emerald-800">
              🎉 Congratulations! You won:
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {rewardWon.label}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              XP & Brain Gems added to your profile!
            </p>
          </div>
        )}

        {!canSpinToday && !rewardWon && (
          <div className="mt-4 text-xs text-slate-500">
            ⏰ Next spin available tomorrow at 00:00 AM!
          </div>
        )}
      </div>
    </div>
  );
}
