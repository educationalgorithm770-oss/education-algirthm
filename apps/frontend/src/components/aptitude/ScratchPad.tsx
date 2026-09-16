'use client';

import React, { useRef, useState, useEffect } from 'react';

interface ScratchPadProps {
  onClose: () => void;
}

export default function ScratchPad({ onClose }: ScratchPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#2563EB');
  const [penSize, setPenSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 500;
    canvas.height = 360;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = isEraser ? '#FFFFFF' : penColor;
    ctx.lineWidth = isEraser ? 24 : penSize;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const colors = ['#2563EB', '#D97706', '#059669', '#DB2777', '#0F172A'];

  return (
    <div className="fixed inset-x-3 bottom-4 sm:inset-x-auto sm:left-6 sm:bottom-6 z-50 w-auto sm:w-96 max-w-sm sm:max-w-md mx-auto bg-white/95 border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl p-3.5 sm:p-4 backdrop-blur-md animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-pen-ruler text-indigo-600 text-sm"></i>
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Rough Scratchpad</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearCanvas}
            className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition"
            title="Clear canvas"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      {/* Drawing Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-1.5">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => { setPenColor(c); setIsEraser(false); }}
              className={`w-5 h-5 rounded-full border transition ${
                !isEraser && penColor === c ? 'scale-125 border-white ring-2 ring-indigo-500' : 'border-slate-300 opacity-80'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEraser(false)}
            className={`p-1.5 rounded-lg text-xs transition ${
              !isEraser ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Pen"
          >
            <i className="fa-solid fa-pen"></i>
          </button>
          <button
            onClick={() => setIsEraser(true)}
            className={`p-1.5 rounded-lg text-xs transition ${
              isEraser ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Eraser"
          >
            <i className="fa-solid fa-eraser"></i>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="w-full h-64 bg-white rounded-2xl border border-slate-200 overflow-hidden relative cursor-crosshair shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
