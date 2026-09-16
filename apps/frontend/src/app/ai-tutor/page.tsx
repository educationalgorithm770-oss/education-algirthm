'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('student_ai_tutor_messages');
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch (e) {}
    } else {
      const initial: Message[] = [
        {
          id: 'msg_init',
          sender: 'ai',
          text: 'Hello! I am your **Education Algorithm AI Engineering Tutor**.\n\nAsk me anything about **Java 21**, **Spring Boot**, **Distributed Systems**, **Microservices Architecture**, **Data Structures & Algorithms**, or **GenAI Systems**!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(initial);
      localStorage.setItem('student_ai_tutor_messages', JSON.stringify(initial));
    }
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea height when typing
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${Math.max(newHeight, 46)}px`;
    }
  }, [inputPrompt]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || loading) return;

    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: inputPrompt.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => {
      const updated = [...prev, userMsg];
      localStorage.setItem('student_ai_tutor_messages', JSON.stringify(updated));
      return updated;
    });

    const currentPrompt = inputPrompt.trim();
    setInputPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '46px';
    }
    setLoading(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt }),
      });

      const data = await res.json();
      const aiReply = data.success ? data.reply : 'I encountered an error processing your query. Please try again.';

      const aiMsg: Message = {
        id: 'msg_ai_' + Date.now(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => {
        const updated = [...prev, aiMsg];
        localStorage.setItem('student_ai_tutor_messages', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      const errorMsg: Message = {
        id: 'msg_err_' + Date.now(),
        sender: 'ai',
        text: '⚠️ Connection error while communicating with Gemini API. Please check your network and retry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    const resetMsg: Message[] = [
      {
        id: 'msg_init',
        sender: 'ai',
        text: 'Chat history cleared. How can I assist your engineering study today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(resetMsg);
    localStorage.setItem('student_ai_tutor_messages', JSON.stringify(resetMsg));
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper function to format inline bold, code, and italic tokens + HTML tags
  const formatInlineTokens = (text: string): React.ReactNode => {
    // Clean any HTML formatting tags like <b>, </b>, <i>, </i>, <code>, </code>, <br>
    let sanitized = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?b>/gi, '**')
      .replace(/<\/?strong>/gi, '**')
      .replace(/<\/?i>/gi, '*')
      .replace(/<\/?em>/gi, '*')
      .replace(/<\/?code>/gi, '`');

    const parts: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(sanitized)) !== null) {
      if (match.index > lastIndex) {
        parts.push(sanitized.substring(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={match.index} className="px-1.5 py-0.5 bg-slate-100 text-indigo-700 font-mono text-[11px] sm:text-xs rounded-md border border-slate-200/80 font-bold mx-0.5">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-extrabold text-slate-900">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={match.index} className="italic text-slate-700">
            {token.slice(1, -1)}
          </em>
        );
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < sanitized.length) {
      parts.push(sanitized.substring(lastIndex));
    }

    return parts.length > 0 ? parts : sanitized;
  };

  // Rich Markdown & HTML Details Accordion Renderer for AI responses
  const renderMarkdownContent = (rawText: string) => {
    // Pre-process <details><summary> tags into structured blocks if present
    let processedText = rawText;
    const lines = processedText.split('\n');
    const elements: React.ReactNode[] = [];
    let inCode = false;
    let codeLang = '';
    let codeBuffer: string[] = [];
    let inDetails = false;
    let detailsSummary = 'Click to view details';
    let detailsBuffer: string[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // Fenced Code Block
      if (trimmed.startsWith('```')) {
        if (!inCode) {
          inCode = true;
          codeLang = trimmed.replace('```', '').trim() || 'Code';
          codeBuffer = [];
        } else {
          inCode = false;
          const codeString = codeBuffer.join('\n');
          const codeBlockId = `code_${key++}`;
          elements.push(
            <div key={codeBlockId} className="my-3.5 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
                <span className="uppercase font-bold text-indigo-400 tracking-wider text-[11px]">{codeLang}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeString, codeBlockId)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1.5 text-[11px] font-bold"
                >
                  <i className={`fa-solid ${copiedId === codeBlockId ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                  <span>{copiedId === codeBlockId ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                <code>{codeString}</code>
              </pre>
            </div>
          );
        }
        continue;
      }

      if (inCode) {
        codeBuffer.push(rawLine);
        continue;
      }

      // Check for <details> tag start
      if (trimmed.toLowerCase().includes('<details>')) {
        inDetails = true;
        detailsBuffer = [];
        continue;
      }

      // Check for <summary> inside <details>
      if (inDetails && trimmed.toLowerCase().includes('<summary>')) {
        const summaryText = trimmed.replace(/<\/?summary>/gi, '').replace(/<\/?b>/gi, '').replace(/<\/?strong>/gi, '');
        detailsSummary = summaryText.trim() || 'Click to view Solution & Answer';
        continue;
      }

      // Check for </details> tag end
      if (inDetails && trimmed.toLowerCase().includes('</details>')) {
        inDetails = false;
        const detailsBody = detailsBuffer.join('\n');
        elements.push(
          <details key={`det_${key++}`} className="my-3.5 p-4 bg-purple-50/80 border border-purple-200/90 rounded-2xl group cursor-pointer transition-all">
            <summary className="font-extrabold text-purple-950 text-xs sm:text-sm flex items-center space-x-2 select-none hover:text-purple-700">
              <i className="fa-solid fa-chevron-right text-[10px] text-purple-600 transition-transform group-open:rotate-90"></i>
              <span>💡 {detailsSummary}</span>
            </summary>
            <div className="mt-3 pt-3 border-t border-purple-200/70 text-slate-800 text-xs sm:text-sm leading-relaxed space-y-2 cursor-auto">
              {renderMarkdownContent(detailsBody)}
            </div>
          </details>
        );
        continue;
      }

      if (inDetails) {
        detailsBuffer.push(rawLine.replace(/<\/?p>/gi, ''));
        continue;
      }

      // Clean standalone <br>, <p>, </p> tags
      if (trimmed.toLowerCase() === '<br>' || trimmed.toLowerCase() === '<br/>' || trimmed.toLowerCase() === '<p>' || trimmed.toLowerCase() === '</p>') {
        continue;
      }

      // Horizontal Divider
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        elements.push(<hr key={`hr_${key++}`} className="my-4 border-t border-slate-200" />);
        continue;
      }

      // Heading 1
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1_${key++}`} className="text-xl font-black text-slate-900 mt-5 mb-2 tracking-tight">
            {formatInlineTokens(trimmed.replace('# ', ''))}
          </h1>
        );
        continue;
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2_${key++}`} className="text-lg font-black text-slate-900 mt-4 mb-2 tracking-tight">
            {formatInlineTokens(trimmed.replace('## ', ''))}
          </h2>
        );
        continue;
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3_${key++}`} className="text-base font-extrabold text-slate-900 mt-3.5 mb-1.5 flex items-center space-x-1.5 border-b border-slate-100 pb-1">
            <span>{formatInlineTokens(trimmed.replace('### ', ''))}</span>
          </h3>
        );
        continue;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        elements.push(
          <div key={`bq_${key++}`} className="border-l-4 border-purple-500 bg-purple-50/60 p-3.5 rounded-r-2xl my-2.5 text-xs sm:text-sm text-slate-700 italic font-medium">
            {formatInlineTokens(trimmed.replace('> ', ''))}
          </div>
        );
        continue;
      }

      // Bullet Point (* item or - item)
      const bulletMatch = rawLine.match(/^(\s*)([*-])\s+(.*)/);
      if (bulletMatch) {
        const indent = bulletMatch[1].length;
        const itemText = bulletMatch[3];
        elements.push(
          <div key={`li_${key++}`} className={`flex items-start space-x-2.5 my-1.5 ${indent > 0 ? 'ml-5' : 'ml-0.5'}`}>
            <span className="text-purple-600 font-black text-xs shrink-0 mt-1">●</span>
            <div className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed flex-1">
              {formatInlineTokens(itemText)}
            </div>
          </div>
        );
        continue;
      }

      // Numbered List
      const numMatch = rawLine.match(/^(\s*)(\d+)\.\s+(.*)/);
      if (numMatch) {
        const num = numMatch[2];
        const itemText = numMatch[3];
        elements.push(
          <div key={`num_${key++}`} className="flex items-start space-x-2.5 my-1.5 ml-0.5">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
              {num}
            </span>
            <div className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed flex-1">
              {formatInlineTokens(itemText)}
            </div>
          </div>
        );
        continue;
      }

      // Empty line spacing
      if (!trimmed) {
        elements.push(<div key={`sp_${key++}`} className="h-2" />);
        continue;
      }

      // Regular Paragraph
      elements.push(
        <p key={`p_${key++}`} className="text-slate-800 text-xs sm:text-sm leading-relaxed font-medium my-1">
          {formatInlineTokens(rawLine)}
        </p>
      );
    }

    return elements;
  };

  const quickPrompts = [
    'Explain Java 21 Virtual Threads vs Platform Threads',
    'How do I implement JWT Auth Filter in Spring Boot?',
    'What is a RAG pipeline and Vector Database embedding?',
    'Optimize O(N^2) double loop to O(N) HashMap lookup'
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <StudentNavbar />

      {/* Header Banner */}
      <section className="bg-white text-slate-900 py-6 sm:py-8 px-4 sm:px-6 border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-extrabold uppercase tracking-wider">
                Powered by Google Gemini
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                Live Engineering Assistant
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Gemini AI Tutor Assistant
            </h1>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleClearHistory}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition"
            >
              Clear History
            </button>
            <Link href="/dashboard" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition">
              &larr; Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Main AI Chat Workspace */}
      <main className="flex-1 py-8 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-6">
        
        {/* Quick Prompts Bar */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Study Prompts</div>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => setInputPrompt(qp)}
                className="px-3.5 py-2 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 text-xs font-semibold rounded-xl transition shadow-xs"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Box */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[640px]">
          {/* Message List */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-3xl text-sm leading-relaxed transition-all ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 sm:p-5 rounded-br-none shadow-md'
                      : 'bg-slate-50/80 text-slate-900 border border-slate-200/90 p-5 sm:p-6 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] opacity-75 mb-2 pb-1 border-b border-slate-200/60">
                    <span className="font-extrabold uppercase tracking-wide flex items-center space-x-1.5">
                      <i className={`fa-solid ${msg.sender === 'user' ? 'fa-user' : 'fa-robot text-purple-600'}`}></i>
                      <span>{msg.sender === 'user' ? 'You' : 'Gemini AI Tutor'}</span>
                    </span>
                    <span className="font-mono text-[10px]">{msg.timestamp}</span>
                  </div>

                  {msg.sender === 'user' ? (
                    <div className="whitespace-pre-wrap font-medium text-sm leading-relaxed">{msg.text}</div>
                  ) : (
                    <div className="ai-markdown-response font-sans">
                      {renderMarkdownContent(msg.text)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-3xl rounded-bl-none text-slate-700 text-xs font-semibold flex items-center space-x-3 shadow-sm animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  </div>
                  <span>Synthesizing engineering concept with Gemini...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Dynamic Auto-Growing Textarea Form */}
          <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-200 flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask a technical question (Enter to send, Shift + Enter for new line)..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-600 font-medium shadow-inner placeholder-slate-400 resize-none transition-all max-h-[180px] overflow-y-auto leading-relaxed"
                style={{ minHeight: '46px' }}
              />
              {inputPrompt.length > 40 && (
                <div className="absolute right-3.5 bottom-2.5 text-[10px] text-slate-400 font-mono pointer-events-none">
                  Shift+Enter for newline
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="h-[46px] px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition shadow-md shadow-purple-600/20 whitespace-nowrap disabled:opacity-50 flex items-center space-x-2 shrink-0"
            >
              <span>Ask AI</span>
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </form>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
}
