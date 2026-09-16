'use client';

import React, { useState } from 'react';

export default function CodeSandboxWidget() {
  const [activeLang, setActiveLang] = useState<'python' | 'java' | 'cpp'>('python');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testOutput, setTestOutput] = useState({
    status: 'Passed 15 Test Cases',
    ms: 24,
    passed: true,
  });

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setTestOutput({
        status: 'Passed 15 Test Cases',
        ms: Math.floor(Math.random() * 15) + 15,
        passed: true,
      });
      setIsRunning(false);
    }, 700);
  };

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 hover:border-indigo-500/40 transition-all duration-300">
      {/* Sandbox Header */}
      <div className="bg-slate-950 px-4 sm:px-5 py-3.5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="ml-2 sm:ml-3 text-xs sm:text-sm font-mono text-slate-400 truncate max-w-[240px] sm:max-w-none">sandbox_runner.py — Docker Execution Engine</span>
        </div>

        {/* Language Tabs & Action Button */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={() => setActiveLang('python')}
              className={`px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-mono rounded font-semibold transition ${activeLang === 'python' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Python 3
            </button>
            <button
              onClick={() => setActiveLang('java')}
              className={`px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-mono rounded font-semibold transition ${activeLang === 'java' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Java 21
            </button>
            <button
              onClick={() => setActiveLang('cpp')}
              className={`px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-mono rounded font-semibold transition ${activeLang === 'cpp' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              C++ 17
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs sm:text-sm font-mono font-semibold transition border border-slate-700"
            >
              {copied ? (
                <span className="text-emerald-400"><i className="fa-solid fa-check me-1"></i> Copied</span>
              ) : (
                <span><i className="fa-regular fa-copy me-1"></i> Copy</span>
              )}
            </button>
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-bold transition shadow-md shadow-emerald-600/30 transform active:scale-95 whitespace-nowrap"
            >
              {isRunning ? (
                <span><i className="fa-solid fa-spinner fa-spin me-1.5"></i> Running...</span>
              ) : (
                <span><i className="fa-solid fa-play me-1.5 text-xs"></i> Run Code</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Left: Problem Statement */}
        <div className="p-5 sm:p-6 bg-slate-900 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-white">Problem #42: LRU Cache Design</h3>
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded">Medium</span>
          </div>
          <p className="text-slate-300 text-base leading-relaxed">
            Design a data structure that follows the constraints of a Least Recently Used (LRU) Cache with O(1) average time complexity for both `get` and `put` operations.
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs sm:text-sm text-slate-300 space-y-1.5 overflow-x-auto">
            <div className="text-slate-500"># Sample Input</div>
            <div>cache = LRUCache(capacity=2)</div>
            <div>cache.put(1, 1); cache.put(2, 2)</div>
            <div>cache.get(1) <span className="text-emerald-400"># returns 1</span></div>
          </div>
        </div>

        {/* Right: Monaco Code Editor */}
        <div className="p-5 sm:p-6 bg-slate-950 font-mono text-xs sm:text-sm text-slate-200 space-y-2 relative overflow-x-auto">
          {activeLang === 'python' && (
            <>
              <div><span className="text-purple-400">class</span> <span className="text-blue-400">LRUCache</span>:</div>
              <div className="pl-4"><span className="text-purple-400">def</span> <span className="text-blue-400">__init__</span>(self, capacity: <span className="text-cyan-400">int</span>):</div>
              <div className="pl-8">self.cap = capacity</div>
              <div className="pl-8">self.cache = {}</div>
              <div className="pl-4"><span className="text-purple-400">def</span> <span className="text-blue-400">get</span>(self, key: <span className="text-cyan-400">int</span>) -&gt; <span className="text-cyan-400">int</span>:</div>
              <div className="pl-8"><span className="text-purple-400">return</span> self.cache.get(key, -1)</div>
            </>
          )}

          {activeLang === 'java' && (
            <>
              <div><span className="text-purple-400">class</span> <span className="text-blue-400">LRUCache</span> &#123;</div>
              <div className="pl-4"><span className="text-purple-400">private</span> Map&lt;Integer, Integer&gt; map;</div>
              <div className="pl-4"><span className="text-purple-400">public</span> <span className="text-blue-400">LRUCache</span>(<span className="text-cyan-400">int</span> capacity) &#123;</div>
              <div className="pl-8">this.map = <span className="text-purple-400">new</span> LinkedHashMap&lt;&gt;(capacity, 0.75f, <span className="text-purple-400">true</span>);</div>
              <div className="pl-4">&#125;</div>
              <div className="pl-4"><span className="text-purple-400">public int</span> <span className="text-blue-400">get</span>(<span className="text-cyan-400">int</span> key) &#123; <span className="text-purple-400">return</span> map.getOrDefault(key, -1); &#125;</div>
              <div>&#125;</div>
            </>
          )}

          {activeLang === 'cpp' && (
            <>
              <div><span className="text-purple-400">class</span> <span className="text-blue-400">LRUCache</span> &#123;</div>
              <div className="pl-4"><span className="text-purple-400">int</span> capacity;</div>
              <div className="pl-4"><span className="text-purple-400">unordered_map</span>&lt;<span className="text-cyan-400">int</span>, <span className="text-cyan-400">int</span>&gt; cache;</div>
              <div className="pl-4"><span className="text-purple-400">public:</span></div>
              <div className="pl-8"><span className="text-blue-400">LRUCache</span>(<span className="text-cyan-400">int</span> cap) : capacity(cap) &#123;&#125;</div>
              <div>&#125;;</div>
            </>
          )}

          {/* Terminal Output Bar */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm font-sans gap-2">
            {isRunning ? (
              <span className="text-amber-400 font-bold flex items-center">
                <i className="fa-solid fa-gear fa-spin me-1.5"></i> Executing in Docker Container...
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center">
                <i className="fa-solid fa-circle-check me-1.5 animate-bounce"></i> {testOutput.status}
              </span>
            )}
            <span className="text-slate-400 font-mono">Docker Sandbox: {testOutput.ms}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
