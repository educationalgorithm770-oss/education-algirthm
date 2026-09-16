'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NormalizedExecutionResult } from '@/lib/sandbox/dockerRunner';

export interface TerminalEntry {
  id: string;
  type: 'stdout' | 'stdin' | 'stderr' | 'system' | 'prompt';
  text: string;
}

interface InteractiveTerminalProps {
  logs: TerminalEntry[];
  isRunning: boolean;
  executionMode?: 'interactive' | 'batch';
  activePrompt?: string;
  currentLanguage: string;
  executionResult?: NormalizedExecutionResult | null;
  onSendInput?: (inputLine: string) => void;
  onStopExecution: () => void;
  onClearTerminal: () => void;
  onExplainError?: (errorText: string) => void;
  fontSize?: 'sm' | 'base' | 'lg';
  theme?: 'dark' | 'matrix' | 'monokai' | 'cyberpunk';
  activeTab?: 'terminal' | 'testcases';
  onTabChange?: (tab: 'terminal' | 'testcases') => void;
}

export default function InteractiveTerminal({
  logs,
  isRunning,
  executionMode = 'interactive',
  activePrompt,
  currentLanguage,
  executionResult,
  onSendInput,
  onStopExecution,
  onClearTerminal,
  onExplainError,
  fontSize = 'base',
  theme = 'dark',
  activeTab = 'terminal',
  onTabChange,
}: InteractiveTerminalProps) {
  const [currentInput, setCurrentInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  // Auto-scroll to bottom whenever logs or input changes
  const scrollToBottom = useCallback(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, isRunning, currentInput, activePrompt, scrollToBottom]);

  // Focus the input when terminal is clicked or when running in interactive mode
  const focusInput = () => {
    if (isRunning && executionMode === 'interactive') {
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    if (isRunning && executionMode === 'interactive') {
      inputRef.current?.focus();
    }
  }, [isRunning, executionMode]);

  // Handle keyboard events for in-terminal entry
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      // Ignore key repeats (e.g. held down Enter) and IME composition
      if (e.repeat || e.nativeEvent.isComposing || (e as any).keyCode === 229) {
        return;
      }

      // Guard against double submit within a short window
      if (isSendingRef.current) {
        return;
      }

      const val = currentInput;
      // Immediately reset input field state synchronously
      setCurrentInput('');
      setHistoryIndex(-1);

      if (val.trim() && (history.length === 0 || history[history.length - 1] !== val)) {
        setHistory((prev) => [...prev, val]);
      }

      isSendingRef.current = true;
      setTimeout(() => {
        isSendingRef.current = false;
      }, 60);

      if (onSendInput) {
        onSendInput(val);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(history[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(history[newIndex] || '');
        }
      }
    } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      if (isRunning) {
        e.preventDefault();
        e.stopPropagation();
        onStopExecution();
      }
    } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      onClearTerminal();
    }
  };

  const handleCopy = async () => {
    const fullText = logs.map((l) => l.text).join('');
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const hasError =
    executionResult &&
    (executionResult.status === 'Compilation Error' ||
      executionResult.status === 'Runtime Error' ||
      executionResult.status === 'Security Error' ||
      Boolean(executionResult.compileError) ||
      Boolean(executionResult.runtimeError));

  const errorText = executionResult?.compileError || executionResult?.runtimeError || executionResult?.stderr || '';

  const themeStyles = {
    dark: {
      bg: 'bg-slate-950',
      header: 'bg-slate-900 border-slate-800',
      text: 'text-slate-100',
      stdout: 'text-slate-100',
      stdin: 'text-emerald-400 font-bold',
      stderr: 'text-rose-400 font-mono',
      system: 'text-cyan-400/90 font-mono',
      prompt: 'text-amber-300 font-bold',
      cursor: 'bg-emerald-400',
      selection: 'selection:bg-indigo-600 selection:text-white',
    },
    matrix: {
      bg: 'bg-black',
      header: 'bg-emerald-950/40 border-emerald-900/50',
      text: 'text-emerald-300',
      stdout: 'text-emerald-400',
      stdin: 'text-green-300 font-bold underline',
      stderr: 'text-red-400 font-mono',
      system: 'text-emerald-500 font-mono',
      prompt: 'text-emerald-200 font-bold',
      cursor: 'bg-green-400',
      selection: 'selection:bg-emerald-700 selection:text-black',
    },
    monokai: {
      bg: 'bg-[#1e1f1c]',
      header: 'bg-[#272822] border-[#3e3d32]',
      text: 'text-[#f8f8f2]',
      stdout: 'text-[#f8f8f2]',
      stdin: 'text-[#a6e22e] font-bold',
      stderr: 'text-[#f92672] font-mono',
      system: 'text-[#66d9ef] font-mono',
      prompt: 'text-[#fd971f] font-bold',
      cursor: 'bg-[#a6e22e]',
      selection: 'selection:bg-[#49483e] selection:text-white',
    },
    cyberpunk: {
      bg: 'bg-[#0b0c16]',
      header: 'bg-[#151329] border-purple-800/40',
      text: 'text-cyan-200',
      stdout: 'text-cyan-100',
      stdin: 'text-yellow-300 font-bold',
      stderr: 'text-pink-500 font-mono',
      system: 'text-purple-400 font-mono',
      prompt: 'text-fuchsia-300 font-bold',
      cursor: 'bg-cyan-400',
      selection: 'selection:bg-pink-600 selection:text-white',
    },
  }[theme];

  const fontSizeClass = {
    sm: 'text-[11px] leading-snug',
    base: 'text-xs sm:text-[13px] leading-relaxed',
    lg: 'text-sm sm:text-[15px] leading-loose',
  }[fontSize];

  return (
    <div
      ref={containerRef}
      onClick={focusInput}
      className={`h-full flex flex-col ${themeStyles.bg} ${themeStyles.selection} font-mono select-text transition-colors duration-200`}
    >
      {/* ── Terminal Header Bar ───────────────────────────────────────────── */}
      <div className={`px-3 py-2 ${themeStyles.header} border-b flex items-center justify-between shrink-0 select-none`}>
        <div className="flex items-center space-x-2.5">
          {/* Tabs: Terminal vs Test Cases */}
          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onTabChange?.('terminal')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'terminal' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-terminal text-[10px]"></i>
              <span>Console Output</span>
            </button>

            {executionResult?.testCaseResults && executionResult.testCaseResults.length > 0 && (
              <button
                onClick={() => onTabChange?.('testcases')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'testcases' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <i className="fa-solid fa-list-check text-[10px]"></i>
                <span>Test Cases ({executionResult.passedTests}/{executionResult.totalTests})</span>
              </button>
            )}
          </div>

          {/* Friendly Status Tag */}
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-400 border-l border-slate-700/60 pl-2.5">
            {executionMode === 'interactive' ? (
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <i className="fa-solid fa-terminal text-[10px]"></i>
                <span>Interactive Program</span>
              </span>
            ) : (
              <span className="text-indigo-400 font-semibold flex items-center space-x-1">
                <i className="fa-solid fa-keyboard text-[10px]"></i>
                <span>Standard Input</span>
              </span>
            )}
          </div>

          {/* Execution Status Badge */}
          {executionResult && (
            <div className="hidden sm:flex items-center space-x-2 text-[10px] font-mono text-slate-400 border-l border-slate-700/60 pl-2.5">
              <span
                className={`px-1.5 py-0.5 rounded font-black ${
                  executionResult.status === 'Accepted'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : executionResult.status === 'Compilation Error'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {executionResult.status}
              </span>
              <span>{executionResult.executionTimeMs}ms</span>
              {executionResult.memoryKb && <span>{Math.round(executionResult.memoryKb / 1024 * 10) / 10} MB</span>}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          {isRunning ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStopExecution();
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition flex items-center space-x-1 shadow-sm"
              title="Stop process (Ctrl+C)"
            >
              <i className="fa-solid fa-stop text-[10px]"></i>
              <span>Stop</span>
            </button>
          ) : null}

          {hasError && onExplainError && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExplainError(errorText);
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-[11px] font-bold transition flex items-center space-x-1.5 animate-pulse"
              title="AI Explain this error"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-purple-300 text-[10px]"></i>
              <span>AI Explain Error</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition"
            title="Copy output"
          >
            <i className={`fa-solid ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearTerminal();
            }}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition"
            title="Clear console (Ctrl+L)"
          >
            <i className="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>

      {/* ── Tab 1: Terminal Content Stream ─────────────────────────────────── */}
      {activeTab === 'terminal' ? (
        <div className={`flex-1 p-3.5 sm:p-4 overflow-y-auto cursor-text ${fontSizeClass} space-y-0.5`}>
          {logs.length === 0 && !isRunning && (
            <div className="text-slate-500 space-y-1 select-none">
              <p className="text-slate-400 font-bold">Education Algorithm Code Arena</p>
              {executionMode === 'interactive' ? (
                <p className="text-slate-400">
                  Click <span className="text-emerald-400 font-bold">▶ Run (F9)</span> to start the interactive program. You can type responses directly in this console when prompted.
                </p>
              ) : (
                <p className="text-slate-400">
                  Click <span className="text-emerald-400 font-bold">▶ Run (F9)</span> to execute your program with custom standard input.
                </p>
              )}
              <p className="text-slate-600 text-[11px] pt-1">
                Shortcuts: <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400">F9</kbd> Run, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400">Ctrl+Enter</kbd> Submit, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400">Ctrl+C</kbd> Stop, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400">Ctrl+L</kbd> Clear
              </p>
            </div>
          )}

          {logs.map((log) => {
            if (log.type === 'stdin') {
              return (
                <div key={log.id} className={`${themeStyles.stdin} whitespace-pre-wrap break-all`}>
                  {log.text}
                </div>
              );
            }
            if (log.type === 'stderr') {
              return (
                <div key={log.id} className={`${themeStyles.stderr} whitespace-pre-wrap break-all py-0.5`}>
                  {log.text}
                </div>
              );
            }
            if (log.type === 'system') {
              return (
                <div key={log.id} className={`${themeStyles.system} whitespace-pre-wrap break-all py-0.5 opacity-90`}>
                  {log.text}
                </div>
              );
            }
            if (log.type === 'prompt') {
              return (
                <div key={log.id} className={`${themeStyles.prompt} whitespace-pre-wrap break-all`}>
                  {log.text}
                </div>
              );
            }
            return (
              <span key={log.id} className={`${themeStyles.stdout} whitespace-pre-wrap break-all leading-relaxed`}>
                {log.text}
              </span>
            );
          })}

          {/* Active In-Terminal Prompt (when running in interactive mode) */}
          {isRunning && executionMode === 'interactive' && (
            <div className="flex items-center space-x-1 pt-1 font-mono text-slate-100">
              <span className="text-emerald-400 font-bold select-none whitespace-pre-wrap">
                {activePrompt ? activePrompt : '› '}
              </span>
              <div className="relative inline-flex items-center flex-1">
                <span className="text-emerald-300 font-bold whitespace-pre">{currentInput}</span>
                <span className={`inline-block w-2.5 h-4 ${themeStyles.cursor} animate-pulse ml-0.5 align-middle`}></span>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="absolute inset-0 opacity-0 cursor-text w-full"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {/* Standard running indicator */}
          {isRunning && executionMode === 'batch' && (
            <div className="text-indigo-400 animate-pulse flex items-center space-x-2 pt-1">
              <i className="fa-solid fa-spinner fa-spin text-xs"></i>
              <span className="text-xs font-sans">Compiling &amp; Executing...</span>
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>
      ) : (
        /* ── Tab 2: Test Cases Matrix View ─────────────────────────────────── */
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Test Suite Evaluation</h3>
            <span
              className={`px-2 py-0.5 rounded text-xs font-black ${
                executionResult?.status === 'Accepted'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {executionResult?.status} ({executionResult?.passedTests} / {executionResult?.totalTests} Passed)
            </span>
          </div>

          <div className="space-y-2">
            {executionResult?.testCaseResults?.map((tc, idx) => (
              <div
                key={tc.id || idx}
                className={`p-3 rounded-xl border transition ${
                  tc.passed ? 'bg-slate-900/80 border-emerald-500/30' : 'bg-slate-900/80 border-rose-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        tc.passed ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {tc.passed ? '✓' : '✗'}
                    </span>
                    <span className="text-xs font-bold text-white">
                      Test Case {idx + 1} {tc.isHidden && <span className="text-slate-500 text-[10px]">(Hidden)</span>}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{tc.executionTimeMs}ms</span>
                </div>

                {!tc.isHidden && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase mb-0.5">Input:</span>
                      <pre className="text-slate-300 whitespace-pre-wrap">{tc.input || '[Empty]'}</pre>
                    </div>
                    <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase mb-0.5">Expected Output:</span>
                      <pre className="text-emerald-400 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                    </div>
                    <div className="sm:col-span-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase mb-0.5">Your Actual Output:</span>
                      <pre
                        className={`whitespace-pre-wrap ${
                          tc.passed ? 'text-emerald-300' : 'text-rose-400'
                        }`}
                      >
                        {tc.actualOutput || '[No output]'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
