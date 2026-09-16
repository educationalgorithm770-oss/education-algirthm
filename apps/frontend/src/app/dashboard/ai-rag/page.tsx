'use client';

import React, { useState, useEffect } from 'react';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import Link from 'next/link';

interface RAGChunk {
  id: string;
  docTitle: string;
  category: string;
  chunkText: string;
  pageNumber: number;
  similarity: number;
}

interface RAGResponse {
  success: boolean;
  prompt: string;
  searchLatencyMs: number;
  retrievedChunks: RAGChunk[];
  citedAnswer: string;
}

interface DocMeta {
  id: string;
  title: string;
  category: string;
  chunkCount: number;
  lastIndexed: string;
}

export default function AIRAGPage() {
  const [prompt, setPrompt] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [customNote, setCustomNote] = useState('');
  const [showCustomBox, setShowCustomBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGResponse | null>(null);
  const [docList, setDocList] = useState<DocMeta[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/ai/rag/documents');
      const data = await res.json();
      if (data.success) {
        setDocList(data.documents);
      }
    } catch (e) {
      console.error('Failed to load RAG document metadata');
    }
  };

  const handleRAGSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          categoryFilter,
          customNote: showCustomBox ? customNote : ''
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      }
    } catch (err) {
      console.error('RAG Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'How do Virtual Threads unmount carrier threads during blocking I/O in Java 21?',
    'What chunk size, overlap, and similarity metrics are used in RAG architecture?',
    'Explain how Doubly LinkedList + HashMap achieves O(1) LRU Cache operations.',
    'How do I configure OncePerRequestFilter for stateless JWT auth in Spring Boot 3?'
  ];

  const formatInlineTokens = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
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

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const renderMarkdownContent = (rawText: string) => {
    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];
    let inCode = false;
    let codeLang = '';
    let codeBuffer: string[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (trimmed.startsWith('```')) {
        if (!inCode) {
          inCode = true;
          codeLang = trimmed.replace('```', '').trim() || 'Code';
          codeBuffer = [];
        } else {
          inCode = false;
          const codeString = codeBuffer.join('\n');
          elements.push(
            <div key={`code_${key++}`} className="my-3.5 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
              <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                <span className="uppercase font-bold text-indigo-400">{codeLang}</span>
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

      if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={`hr_${key++}`} className="my-4 border-t border-slate-200" />);
        continue;
      }

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1_${key++}`} className="text-xl font-black text-slate-900 mt-4 mb-2">
            {formatInlineTokens(trimmed.replace('# ', ''))}
          </h1>
        );
        continue;
      }

      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2_${key++}`} className="text-lg font-black text-slate-900 mt-3.5 mb-2">
            {formatInlineTokens(trimmed.replace('## ', ''))}
          </h2>
        );
        continue;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3_${key++}`} className="text-base font-extrabold text-slate-900 mt-3 mb-1.5 border-b border-slate-100 pb-1">
            {formatInlineTokens(trimmed.replace('### ', ''))}
          </h3>
        );
        continue;
      }

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

      if (!trimmed) {
        elements.push(<div key={`sp_${key++}`} className="h-2" />);
        continue;
      }

      elements.push(
        <p key={`p_${key++}`} className="text-slate-800 text-xs sm:text-sm leading-relaxed font-medium my-1">
          {formatInlineTokens(rawLine)}
        </p>
      );
    }

    return elements;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <StudentNavbar />

      {/* Header Banner */}
      <section className="bg-white py-8 px-6 border-b border-slate-200">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="text-xs font-bold text-indigo-600 hover:underline">
              &larr; Back to Student Hub
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-xs font-extrabold uppercase tracking-wider">
                🧠 Pillar 6: Vector RAG Knowledge Search
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
                EA RAG AI Document Search Engine
              </h1>
              <p className="text-slate-600 text-sm max-w-2xl mt-1">
                Query audited course textbooks, Java 21 specs, and architecture documentation. Vector embeddings retrieve Top-K grounded citations to prevent LLM hallucinations.
              </p>
            </div>

            <button
              onClick={() => setShowCustomBox(!showCustomBox)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md whitespace-nowrap self-start sm:self-auto"
            >
              <i className="fa-solid fa-file-circle-plus me-1.5"></i>
              {showCustomBox ? 'Hide Custom Indexer' : 'Index Custom Notes'}
            </button>
          </div>
        </div>
      </section>

      <main className="flex-1 py-8 px-6 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Custom Document Indexing Drawer */}
        {showCustomBox && (
          <div className="bg-white p-6 rounded-3xl border border-purple-200 shadow-md space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <i className="fa-solid fa-database text-purple-600"></i>
                <span>Dynamic Vector Document Indexer</span>
              </h3>
              <span className="text-[11px] font-mono text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                1,536-dim Float32 Vector Target
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Paste your custom code snippets or study notes below. The RAG engine will chunk and index them on-the-fly for vector search similarity matching.
            </p>
            <textarea
              rows={4}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Paste custom technical note (e.g., 'Kafka consumer group partition rebalance algorithm notes...')"
              className="w-full p-4 border border-slate-300 rounded-2xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-purple-600 bg-slate-50"
            ></textarea>
          </div>
        )}

        {/* Quick Sample Prompts & Category Filter */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Knowledge Base</div>
            
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Knowledge Bases' },
                { id: 'Java 21 Systems', label: 'Java 21 & Spring' },
                { id: 'GenAI & RAG', label: 'GenAI & RAG Specs' },
                { id: 'Data Structures & Algorithms', label: 'DSA Reference' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    categoryFilter === f.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(sp)}
                className="px-3 py-1.5 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 text-xs font-semibold rounded-xl transition text-left"
              >
                <i className="fa-solid fa-magnifying-glass text-[10px] me-1.5 text-purple-600"></i>
                <span>{sp}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleRAGSearch} className="bg-white p-2 rounded-3xl border border-slate-200 shadow-lg flex items-center space-x-3">
          <div className="pl-4 text-purple-600 text-lg">
            <i className="fa-solid fa-brain"></i>
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask a technical question against indexed course docs (e.g. Virtual Threads, JWT, LRU Cache, RAG chunking)..."
            className="flex-1 bg-transparent py-4 text-sm text-slate-900 font-medium focus:outline-none placeholder-slate-400"
            required
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition disabled:opacity-50 flex items-center space-x-2 whitespace-nowrap"
          >
            {loading ? (
              <span><i className="fa-solid fa-spinner fa-spin me-1.5"></i> Searching Vector Index...</span>
            ) : (
              <>
                <span>Perform Vector RAG Search</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </>
            )}
          </button>
        </form>

        {/* Search Results Area */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Latency & Audit Metadata */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-slate-800">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-mono text-[11px] font-bold">
                  VERIFIED GROUNDED
                </span>
                <span>Query: <strong>&quot;{result.prompt}&quot;</strong></span>
              </div>
              <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-400">
                <span>Latency: <strong className="text-emerald-400">{result.searchLatencyMs}ms</strong></span>
                <span>Retrieved: <strong className="text-indigo-400">{result.retrievedChunks.length} Chunks</strong></span>
              </div>
            </div>

            {/* Top-K Retrieved Document Chunks */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Top-K Retrieved Document Chunks (Cosine Similarity Vector Ranking)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.retrievedChunks.map((chunk, idx) => (
                  <div key={chunk.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          Source #{idx + 1}
                        </span>
                        <span className="font-mono font-bold text-slate-500">Page {chunk.pageNumber}</span>
                      </div>

                      <div className="font-black text-xs text-slate-900 leading-tight">
                        {chunk.docTitle}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-mono line-clamp-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {chunk.chunkText}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                        <span>Vector Similarity Match</span>
                        <span className="text-emerald-600">{(chunk.similarity * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${chunk.similarity * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Synthesized Cited AI Answer Panel */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-xs font-black uppercase">
                    Cited Gemini AI Synthesis
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">Zero Hallucination Guarantee</span>
              </div>

              <div className="text-sm text-slate-800 leading-relaxed font-sans">
                {renderMarkdownContent(result.citedAnswer)}
              </div>
            </div>

          </div>
        )}

        {/* Knowledge Base Document Directory */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Active Indexed Document Knowledge Base</h3>
            <span className="text-xs font-mono font-bold text-slate-500">1,536-dim Float32 Index</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {docList.map(doc => (
              <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-extrabold text-slate-900">{doc.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{doc.category} &bull; {doc.chunkCount} Chunks Indexed</div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                  SYNCED
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>

      <StudentFooter />
    </div>
  );
}
