'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const SUGGESTIONS = [
  '🌟 Which course should I choose?',
  '☕ Java Full Stack Syllabus',
  '🤖 GenAI & Agents Track',
  '📅 Upcoming Webinars',
  '💼 Placement Statistics',
];

export default function FloatingAIChatbot() {
  const pathname = usePathname();

  // Hide inside native app, admin, instructor, student LMS dashboard, login/register, AI tutor, and Code Arena
  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
  const isHiddenRoute =
    isNative ||
    !pathname ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname === '/ai-tutor' ||
    pathname === '/code-arena';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize messages from sessionStorage or default welcome
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem('ea_public_ai_chat');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {}
    } else {
      const initial: ChatMessage[] = [
        {
          id: 'msg_welcome',
          sender: 'bot',
          text: `👋 **Hi there! I am your AI Course Counselor.**\n\nI can help you explore our **engineering cohorts**, **syllabus topics**, **fees & scholarships**, or **live FAANG masterclasses**.\n\nHow can I help you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      setMessages(initial);
      sessionStorage.setItem('ea_public_ai_chat', JSON.stringify(initial));
    }

    // Show initial greeting tooltip after 3 seconds if not open
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem('ea_ai_tooltip_seen')) {
        setShowTooltip(true);
        sessionStorage.setItem('ea_ai_tooltip_seen', 'true');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || loading) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    sessionStorage.setItem('ea_public_ai_chat', JSON.stringify(newMessages));
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/public-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          history: messages.slice(-6),
          leadData: leadEmail ? { email: leadEmail } : null,
        }),
      });

      const data = await res.json();
      const botReply = data.success ? data.reply : 'I am currently processing high traffic. Please explore our /courses catalog or try again shortly!';

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
      sessionStorage.setItem('ea_public_ai_chat', JSON.stringify(finalMessages));
    } catch (err) {
      console.error('AI chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: 'bot_err_' + Date.now(),
        sender: 'bot',
        text: 'Sorry, I had trouble connecting. Please check out our [Course Catalog](/courses) or [Live Masterclasses](/webinars)!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    const initial: ChatMessage[] = [
      {
        id: 'msg_welcome_' + Date.now(),
        sender: 'bot',
        text: `👋 **Chat Cleared!** Ask me anything about our cohorts, topics, live webinars, or placement statistics.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(initial);
    sessionStorage.setItem('ea_public_ai_chat', JSON.stringify(initial));
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail.trim()) return;

    try {
      await fetch('/api/ai/public-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'User requested 1-on-1 academic counseling',
          leadData: { email: leadEmail.trim() },
        }),
      });
      setLeadSaved(true);
      setTimeout(() => setShowLeadForm(false), 2000);
    } catch (err) {
      console.error('Lead save error:', err);
    }
  };

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const sanitizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed)) {
      return trimmed.replace(/"/g, '%22').replace(/'/g, '%27');
    }
    return '#';
  };

  // Render markdown helper (safe link & bold parser with XSS mitigation)
  const formatMessage = (text: string) => {
    const parts = text.split('\n');
    return parts.map((rawLine, idx) => {
      const isBullet = rawLine.startsWith('- ') || rawLine.startsWith('• ');
      const isHeading = rawLine.startsWith('### ');
      let content = isBullet ? rawLine.replace(/^[-•]\s*/, '') : isHeading ? rawLine.replace(/^###\s*/, '') : rawLine;

      // 1. Escape raw HTML entities first
      let safe = escapeHtml(content);

      // 2. Parse markdown links [Label](url) safely
      safe = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
        const safeHref = sanitizeUrl(url);
        return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 font-bold underline hover:text-indigo-800">${label}</a>`;
      });

      // 3. Parse bold **text**
      safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700" dangerouslySetInnerHTML={{ __html: safe }} />
        );
      }

      if (isHeading) {
        return (
          <h4 key={idx} className="font-extrabold text-slate-900 text-xs mt-2 mb-1" dangerouslySetInnerHTML={{ __html: safe }} />
        );
      }

      return (
        <p key={idx} className="mb-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: safe }} />
      );
    });
  };

  if (isHiddenRoute) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none print:hidden">
      
      {/* ── GREETING TOOLTIP (When Closed) ── */}
      {!isOpen && showTooltip && (
        <div className="absolute bottom-16 right-0 w-72 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-800 animate-fade-in-up mb-2 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-indigo-400 flex items-center space-x-1.5">
              <i className="fa-solid fa-sparkles text-amber-400"></i>
              <span>AI Course Advisor</span>
            </span>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-white text-[11px]"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Have questions about <strong className="text-white font-semibold">Java</strong>, <strong className="text-white font-semibold">GenAI</strong>, <strong className="text-white font-semibold">Syllabus</strong>, or <strong className="text-white font-semibold">Webinars</strong>? Ask me anything!
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg transition"
          >
            Start Chat &rarr;
          </button>
        </div>
      )}

      {/* ── EXPANDED CHAT WINDOW ── */}
      {isOpen && (
        <div className="w-[92vw] sm:w-96 h-[540px] max-h-[85vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-fade-in-up ring-1 ring-slate-900/5 mb-3">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-indigo-900/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs shadow-md shadow-indigo-600/30">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div>
                <div className="font-black text-xs text-white flex items-center space-x-1.5">
                  <span>Education Algorithm AI</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="text-[10px] text-indigo-300 font-medium">Student Advisor &amp; Counselor</div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearChat}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center text-xs transition"
                title="Clear Chat History"
              >
                <i className="fa-solid fa-rotate-right"></i>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center text-xs transition"
                title="Close Chat"
              >
                <i className="fa-solid fa-chevron-down"></i>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                  }`}
                >
                  <div className="space-y-1">{formatMessage(m.text)}</div>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-start space-x-2">
                <div className="bg-white text-slate-600 border border-slate-200 p-3 rounded-2xl rounded-tl-xs shadow-xs flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-[11px] text-slate-400 font-medium ms-1">Consulting knowledge base...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                disabled={loading}
                className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-[10px] font-bold whitespace-nowrap border border-slate-200 transition shrink-0"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Optional 1-on-1 Counseling Call Request Form */}
          {showLeadForm ? (
            <form onSubmit={handleSaveLead} className="p-3 bg-indigo-50 border-t border-indigo-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-indigo-900 text-[11px]">Request 1-on-1 Mentor Counseling</span>
                <button type="button" onClick={() => setShowLeadForm(false)} className="text-slate-400 text-xs">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              {leadSaved ? (
                <div className="text-emerald-700 font-bold text-[11px] py-1">
                  ✓ Counselor scheduled! Our team will contact you shortly.
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter email for callback..."
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition"
                  >
                    Submit
                  </button>
                </div>
              )}
            </form>
          ) : (
            <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>Need human mentor advice?</span>
              <button
                onClick={() => setShowLeadForm(true)}
                className="text-indigo-600 font-extrabold hover:underline"
              >
                Request Callback ↗
              </button>
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about courses, topics, fees, webinars..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || loading}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center text-xs transition shadow-md shadow-indigo-600/20 shrink-0"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>

        </div>
      )}

      {/* ── FLOATING TRIGGER BUTTON ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/40 hover:scale-105 transition-all duration-200 border-2 border-white focus:outline-none"
        aria-label="Open AI Course Advisor"
      >
        {isOpen ? (
          <i className="fa-solid fa-xmark text-lg"></i>
        ) : (
          <>
            <i className="fa-solid fa-robot text-xl group-hover:rotate-12 transition-transform"></i>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </>
        )}
      </button>

    </div>
  );
}
