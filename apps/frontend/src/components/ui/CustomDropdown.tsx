'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
  badge?: string;
}

interface CustomDropdownProps {
  value: string | number;
  onChange: (value: string) => void;
  options: (DropdownOption | string | { id?: string | number; value?: string | number; label?: string; title?: string; name?: string })[];
  placeholder?: string;
  labelPrefix?: string;
  icon?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  variant?: 'emerald' | 'indigo' | 'dark' | 'light' | string;
  theme?: 'light' | 'dark' | 'auto' | 'emerald' | 'indigo' | string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
}

export default function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  labelPrefix,
  icon,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  variant,
  theme,
  size = 'md',
  fullWidth,
  disabled = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const effectiveVariant = variant || (theme === 'dark' ? 'dark' : theme === 'indigo' ? 'indigo' : theme === 'emerald' ? 'emerald' : 'emerald');
  const isFullWidth = fullWidth !== undefined ? fullWidth : (size !== 'sm');

  const stringValue = String(value ?? '');

  // Normalize options to uniform { value: string, label: string }
  const normalizedOptions: DropdownOption[] = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    const val = String((opt as any).value ?? (opt as any).id ?? '');
    const lbl = String((opt as any).label ?? (opt as any).title ?? (opt as any).name ?? val);
    return {
      value: val,
      label: lbl,
      icon: (opt as any).icon,
      badge: (opt as any).badge,
    };
  });

  const selectedOption = normalizedOptions.find(o => o.value === stringValue) || normalizedOptions[0];

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-3.5 py-2.5 text-xs sm:text-sm rounded-xl',
    lg: 'px-4 py-3 text-sm sm:text-base rounded-2xl',
  };

  const isDark = effectiveVariant === 'dark';

  const getBorderColor = () => {
    if (effectiveVariant === 'emerald') return 'hover:border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20';
    if (effectiveVariant === 'indigo') return 'hover:border-indigo-500 focus:border-indigo-500 focus:ring-indigo-500/20';
    return 'hover:border-slate-400 focus:border-slate-500 focus:ring-slate-500/20';
  };

  const getSelectedBg = () => {
    if (effectiveVariant === 'emerald') return 'bg-emerald-600 text-white';
    if (effectiveVariant === 'indigo') return 'bg-indigo-600 text-white';
    if (effectiveVariant === 'dark') return 'bg-slate-800 text-emerald-400';
    return 'bg-slate-900 text-white';
  };

  const getActiveIconColor = () => {
    if (effectiveVariant === 'emerald') return 'text-emerald-600';
    if (effectiveVariant === 'indigo') return 'text-indigo-600';
    return 'text-slate-700';
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative select-none text-left ${isFullWidth ? 'w-full block' : 'inline-block'} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 font-bold transition-all duration-150 border cursor-pointer ${sizeClasses[size]} ${
          isDark
            ? 'bg-slate-900 text-white border-slate-700 hover:bg-slate-850'
            : 'bg-white text-slate-900 border-slate-300 shadow-xs hover:bg-slate-50'
        } ${getBorderColor()} ${
          isOpen ? 'ring-2 ring-opacity-30 border-opacity-100 shadow-md' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2 truncate">
          {labelPrefix && (
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {labelPrefix}
            </span>
          )}
          {icon && <i className={`${icon} ${getActiveIconColor()} text-xs`}></i>}
          {selectedOption?.icon && (
            <span className="text-xs">{selectedOption.icon}</span>
          )}
          <span className="truncate text-slate-900 font-bold">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Animated Chevron */}
        <i
          className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 shrink-0 text-slate-400 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        ></i>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 z-50 mt-1.5 ${
            fullWidth ? 'w-full min-w-full' : 'min-w-[200px] w-max max-w-[340px]'
          } rounded-2xl shadow-2xl border p-1.5 animate-in fade-in-0 zoom-in-95 duration-100 origin-top-left ${
            isDark
              ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/80'
              : 'bg-white border-slate-200 text-slate-900 shadow-xl shadow-slate-200/50 ring-1 ring-black/5'
          } ${menuClassName}`}
          role="listbox"
        >
          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
            {normalizedOptions.map(option => {
              const isSelected = option.value === stringValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all duration-100 cursor-pointer ${
                    isSelected
                      ? `${getSelectedBg()} shadow-xs font-black`
                      : isDark
                      ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center space-x-2 truncate pr-2">
                    {option.icon && <span className="text-xs">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    {option.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : isDark
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {option.badge}
                      </span>
                    )}
                    {isSelected && (
                      <i className="fa-solid fa-check text-[10px] ml-1"></i>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
