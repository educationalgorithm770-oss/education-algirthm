'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';

export default function AdminQuestionBankPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  // Active Modals State
  const [activeModal, setActiveModal] = useState<'none' | 'add_question' | 'add_notes' | 'smart_ingest' | 'bulk_ingest' | 'view_details'>('none');
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  // Form State for Single Question
  const [qForm, setQForm] = useState({
    title: '',
    category: 'Core Java & JVM Internals',
    difficulty: 'MEDIUM',
    companyTags: 'Google, Amazon',
    keywords: 'java, spring boot, microservices',
    problemStatement: '',
    canonicalSolution: '',
    codeJava: '',
    codePython: '',
    executionMode: 'batch' as 'batch' | 'interactive',
    tips: 'Ensure O(1) time complexity and handle thread safety.',
  });

  // Form State for Lecture Notes
  const [noteForm, setNoteForm] = useState({
    title: '',
    category: 'Cohort Lecture Notes',
    pageNumber: 1,
    content: '',
    keywords: 'lecture notes, architecture',
  });

  // Form State for AI Smart Ingest
  const [rawText, setRawText] = useState('');
  const [smartCategory, setSmartCategory] = useState('Java Full Stack & Cloud Engineering');
  const [smartResult, setSmartResult] = useState<any>(null);
  const [smartError, setSmartError] = useState<string | null>(null);
  const [aiStructuring, setAiStructuring] = useState(false);

  // Form State for Bulk Ingest
  const [bulkJSON, setBulkJSON] = useState('');

  // Fetch all documents from API
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rag/manage');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch RAG documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // 1. Submit Single Question
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/rag/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_question',
          item: {
            title: qForm.title,
            category: qForm.category,
            difficulty: qForm.difficulty,
            companyTags: qForm.companyTags.split(',').map((s) => s.trim()).filter(Boolean),
            keywords: qForm.keywords.split(',').map((s) => s.trim()).filter(Boolean),
            problemStatement: qForm.problemStatement,
            canonicalSolution: qForm.canonicalSolution,
            codeJava: qForm.codeJava,
            codePython: qForm.codePython,
            executionMode: qForm.executionMode || 'batch',
            systemDesignTips: qForm.tips.split('\n').filter(Boolean),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ "${qForm.title}" published to RAG Knowledge Store!`);
        setActiveModal('none');
        setQForm({
          title: '',
          category: 'Core Java & JVM Internals',
          difficulty: 'MEDIUM',
          companyTags: 'Google, Amazon',
          keywords: '',
          problemStatement: '',
          canonicalSolution: '',
          codeJava: '',
          codePython: '',
          executionMode: 'batch',
          tips: '',
        });
        fetchDocuments();
      }
    } catch (err) {
      console.error('Add question error:', err);
    }
  };

  // 2. Submit Lecture Notes
  const handleAddNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/rag/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_notes',
          item: {
            title: noteForm.title,
            category: noteForm.category,
            pageNumber: Number(noteForm.pageNumber) || 1,
            canonicalSolution: noteForm.content,
            keywords: noteForm.keywords.split(',').map((s) => s.trim()).filter(Boolean),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Lecture Notes "${noteForm.title}" ingested into RAG pool!`);
        setActiveModal('none');
        setNoteForm({ title: '', category: 'Cohort Lecture Notes', pageNumber: 1, content: '', keywords: '' });
        fetchDocuments();
      }
    } catch (err) {
      console.error('Add notes error:', err);
    }
  };

  // 3. AI Smart Ingest: Transform Raw Text into FAANG Q&A
  const handleRunSmartStructuring = async () => {
    if (!rawText.trim()) return;
    setAiStructuring(true);
    setSmartResult(null);
    setSmartError(null);
    try {
      const res = await fetch('/api/admin/rag/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'smart_structure',
          rawText,
          category: smartCategory,
        }),
      });
      const data = await res.json();
      if (data.success && data.structuredItem) {
        setSmartResult(data.structuredItem);
      } else {
        setSmartError(data.message || 'AI structuring failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Smart structuring error:', err);
      setSmartError(err?.message || 'Network error while contacting AI service.');
    } finally {
      setAiStructuring(false);
    }
  };

  // Save AI Smart Structuring Result
  const handleSaveSmartResult = async () => {
    if (!smartResult) return;
    try {
      const res = await fetch('/api/admin/rag/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_question',
          item: smartResult,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ AI-Structured question "${smartResult.title}" published!`);
        setActiveModal('none');
        setRawText('');
        setSmartResult(null);
        fetchDocuments();
      }
    } catch (err) {
      console.error('Save smart result error:', err);
    }
  };

  // 4. Bulk JSON Ingestion
  const handleBulkIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(bulkJSON);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const res = await fetch('/api/admin/rag/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_ingest',
          items,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ ${items.length} items bulk-ingested into RAG Knowledge Store!`);
        setActiveModal('none');
        setBulkJSON('');
        fetchDocuments();
      }
    } catch (err) {
      alert('Invalid JSON format. Please ensure valid JSON array.');
    }
  };

  // 5. Delete Document
  const handleDeleteDoc = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from the RAG Knowledge Store?`)) return;
    try {
      const res = await fetch(`/api/admin/rag/manage?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`🗑️ Document "${title}" deleted.`);
        fetchDocuments();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Filtered List
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.problemStatement && doc.problemStatement.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.canonicalSolution && doc.canonicalSolution.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.companyTags && doc.companyTags.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'ALL' || (doc.difficulty || 'MEDIUM') === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categories = [
    'ALL',
    'Java Full Stack & Cloud Engineering',
    'Data Science, Machine Learning & GenAI',
    'DevOps & Multi-Cloud Architecture',
    'Core Java & JVM Internals',
    'Spring Boot 3 & Security',
    'System Design & Microservices',
    'Data Structures & Algorithms',
    'Cohort Lecture Notes',
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <AdminNavbar />

      <main className="py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-6 flex-1">
        
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-black uppercase">
                🧠 Dynamic RAG Knowledge Base
              </span>
              <span className="text-xs font-bold text-slate-500">
                {documents.length} Managed Items
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              RAG Knowledge &amp; Question Ingestion Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Add technical questions, classroom notes, and PDF cheat sheets. All student AI tools query this live data dynamically.
            </p>
          </div>

          {/* 4 Action Ingestion Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveModal('add_question')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add Question</span>
            </button>
            <button
              onClick={() => setActiveModal('add_notes')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-book-open"></i>
              <span>Ingest Notes</span>
            </button>
            <button
              onClick={() => setActiveModal('smart_ingest')}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>✨ AI Smart Ingest</span>
            </button>
            <button
              onClick={() => setActiveModal('bulk_ingest')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-file-import"></i>
              <span>Bulk JSON</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3.5 bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-md flex items-center space-x-2 animate-fade-in">
            <i className="fa-solid fa-circle-check"></i>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Search & Topic Filters */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across titles, problem statements, canonical solutions, or company tags..."
                className="w-full ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">🟢 Easy</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HARD">🔴 Hard</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Managed Knowledge Items Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Live RAG Knowledge Index ({filteredDocs.length} of {documents.length})
            </h3>
            <button
              onClick={fetchDocuments}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center space-x-1"
            >
              <i className="fa-solid fa-rotate-right text-[10px]"></i>
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-500">
              <i className="fa-solid fa-spinner fa-spin text-lg text-indigo-600 mb-2 block"></i>
              <span>Loading RAG Knowledge Store...</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <i className="fa-solid fa-folder-open text-3xl text-slate-300"></i>
              <p className="text-sm font-bold text-slate-700">No knowledge items match your filter.</p>
              <p className="text-xs text-slate-400">Click &quot;Add Question&quot; or &quot;✨ AI Smart Ingest&quot; above to add content.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Title &amp; Concept</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-3">Difficulty</th>
                    <th className="py-3 px-4">Companies</th>
                    <th className="py-3 px-3">Page / ID</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{doc.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md">
                          {doc.problemStatement || doc.canonicalSolution || doc.content}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[11px] font-bold">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            doc.difficulty === 'HARD'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : doc.difficulty === 'EASY'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {doc.difficulty || 'MEDIUM'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(doc.companyTags || ['General']).map((c: string) => (
                            <span key={c} className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-bold text-[10px]">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                        P.{doc.pageNumber || 1}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setViewingDoc(doc);
                            setActiveModal('view_details');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.title)}
                          className="px-2 py-1 text-red-500 hover:text-red-700 font-bold text-xs"
                          title="Delete from RAG Knowledge Base"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* ========================================================= */}
      {/* MODAL 1: ADD SINGLE QUESTION                              */}
      {/* ========================================================= */}
      {activeModal === 'add_question' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Add Technical Question &amp; Canonical Rubric</h3>
              <button onClick={() => setActiveModal('none')} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Question Title</label>
                <input
                  type="text"
                  required
                  value={qForm.title}
                  onChange={(e) => setQForm({ ...qForm, title: e.target.value })}
                  placeholder="e.g. Distributed Rate Limiter with Sliding Window & Redis"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Course / Category</label>
                  <select
                    value={qForm.category}
                    onChange={(e) => setQForm({ ...qForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs"
                  >
                    <optgroup label="🎓 Flagship Courses">
                      <option value="Java Full Stack & Cloud Engineering">☕ Java Full Stack &amp; Cloud Engineering</option>
                      <option value="Data Science, Machine Learning & GenAI">🤖 Data Science, Machine Learning &amp; GenAI</option>
                      <option value="DevOps & Multi-Cloud Architecture">☁️ DevOps &amp; Multi-Cloud Architecture</option>
                    </optgroup>
                    <optgroup label="🏷️ Technical Domain Modules & Topics">
                      <option value="Core Java & JVM Internals">☕ Core Java &amp; JVM Internals</option>
                      <option value="Spring Boot 3 & Security">🍃 Spring Boot 3 &amp; Security</option>
                      <option value="System Design & Microservices">🏛️ System Design &amp; Microservices</option>
                      <option value="Data Structures & Algorithms">🧮 Data Structures &amp; Algorithms</option>
                      <option value="Databases & SQL Optimization">💾 Databases &amp; SQL Optimization</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={qForm.difficulty}
                    onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value="EASY">🟢 Easy</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="HARD">🔴 Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Execution Mode</label>
                  <select
                    value={qForm.executionMode}
                    onChange={(e) => setQForm({ ...qForm, executionMode: e.target.value as 'batch' | 'interactive' })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs"
                  >
                    <option value="batch">🧩 Standard Input (Batch)</option>
                    <option value="interactive">🖥️ Interactive Program</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company Tags (comma separated)</label>
                  <input
                    type="text"
                    value={qForm.companyTags}
                    onChange={(e) => setQForm({ ...qForm, companyTags: e.target.value })}
                    placeholder="Google, Amazon, Meta, Stripe"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Problem / Concept Statement</label>
                <textarea
                  rows={3}
                  required
                  value={qForm.problemStatement}
                  onChange={(e) => setQForm({ ...qForm, problemStatement: e.target.value })}
                  placeholder="Describe the exact question or architectural scenario..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 leading-relaxed"
                ></textarea>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Canonical Technical Solution (for RAG &amp; Mock Arena)</label>
                <textarea
                  rows={4}
                  required
                  value={qForm.canonicalSolution}
                  onChange={(e) => setQForm({ ...qForm, canonicalSolution: e.target.value })}
                  placeholder="Detailed Staff Engineer level solution..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 leading-relaxed font-mono text-[11px]"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Java 21 Solution Code</label>
                  <textarea
                    rows={4}
                    value={qForm.codeJava}
                    onChange={(e) => setQForm({ ...qForm, codeJava: e.target.value })}
                    placeholder="// Java 21 implementation code..."
                    className="w-full p-2 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px]"
                  ></textarea>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Python 3.12 Solution Code</label>
                  <textarea
                    rows={4}
                    value={qForm.codePython}
                    onChange={(e) => setQForm({ ...qForm, codePython: e.target.value })}
                    placeholder="# Python solution code..."
                    className="w-full p-2 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px]"
                  ></textarea>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow"
                >
                  Publish to RAG Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: INGEST LECTURE NOTES / PDF MARKDOWN              */}
      {/* ========================================================= */}
      {activeModal === 'add_notes' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Ingest Lecture Notes &amp; PDF Chapters</h3>
              <button onClick={() => setActiveModal('none')} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddNotes} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Document / Chapter Title</label>
                <input
                  type="text"
                  required
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="e.g. Chapter 4: Kafka Event Streaming & Consumer Groups"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Course / Category</label>
                  <select
                    value={noteForm.category}
                    onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs"
                  >
                    <optgroup label="🎓 Flagship Courses">
                      <option value="Java Full Stack & Cloud Engineering">☕ Java Full Stack &amp; Cloud Engineering</option>
                      <option value="Data Science, Machine Learning & GenAI">🤖 Data Science, Machine Learning &amp; GenAI</option>
                      <option value="DevOps & Multi-Cloud Architecture">☁️ DevOps &amp; Multi-Cloud Architecture</option>
                    </optgroup>
                    <optgroup label="🏷️ Technical Domain Modules & Topics">
                      <option value="Cohort Lecture Notes">📚 Cohort Lecture Notes</option>
                      <option value="Core Java & JVM Internals">☕ Core Java &amp; JVM Internals</option>
                      <option value="Spring Boot 3 & Security">🍃 Spring Boot 3 &amp; Security</option>
                      <option value="System Design & Microservices">🏛️ System Design &amp; Microservices</option>
                      <option value="Data Structures & Algorithms">🧮 Data Structures &amp; Algorithms</option>
                      <option value="Databases & SQL Optimization">💾 Databases &amp; SQL Optimization</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Page / Chapter #</label>
                  <input
                    type="number"
                    value={noteForm.pageNumber}
                    onChange={(e) => setNoteForm({ ...noteForm, pageNumber: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Notes Content (Markdown or Raw Text)</label>
                <textarea
                  rows={8}
                  required
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  placeholder="Paste lecture notes, explanations, code blocks, or cheat sheets here..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 leading-relaxed font-mono text-[11px]"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow"
                >
                  Publish Lecture Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: AI SMART INGEST (DROP RAW TEXT -> GET FAANG Q&A)   */}
      {/* ========================================================= */}
      {activeModal === 'smart_ingest' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-slate-900">✨ AI Smart-Structuring Co-Pilot</h3>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded">
                    Gemini 3.5 Flash
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  Paste messy notes, unstructured paragraphs, or raw PDF text. Gemini will structure it into a complete FAANG Q&amp;A pair.
                </p>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Course / Category</label>
                <select
                  value={smartCategory}
                  onChange={(e) => setSmartCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs"
                >
                  <optgroup label="🎓 Flagship Courses">
                    <option value="Java Full Stack & Cloud Engineering">☕ Java Full Stack &amp; Cloud Engineering</option>
                    <option value="Data Science, Machine Learning & GenAI">🤖 Data Science, Machine Learning &amp; GenAI</option>
                    <option value="DevOps & Multi-Cloud Architecture">☁️ DevOps &amp; Multi-Cloud Architecture</option>
                  </optgroup>
                  <optgroup label="🏷️ Technical Domain Modules & Topics">
                    <option value="Core Java & JVM Internals">☕ Core Java &amp; JVM Internals</option>
                    <option value="Spring Boot 3 & Security">🍃 Spring Boot 3 &amp; Security</option>
                    <option value="System Design & Microservices">🏛️ System Design &amp; Microservices</option>
                    <option value="Data Structures & Algorithms">🧮 Data Structures &amp; Algorithms</option>
                    <option value="Databases & SQL Optimization">💾 Databases &amp; SQL Optimization</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Raw Unstructured Text</label>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste any raw notes, classroom explanations, or technical bullet points..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 leading-relaxed font-mono text-[11px]"
                ></textarea>
              </div>

              <button
                onClick={handleRunSmartStructuring}
                disabled={aiStructuring || !rawText.trim()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2"
              >
                {aiStructuring ? (
                  <span><i className="fa-solid fa-spinner fa-spin me-2"></i>Analyzing &amp; Structuring Q&amp;A...</span>
                ) : (
                  <span><i className="fa-solid fa-wand-magic-sparkles me-2"></i>Run AI Smart Structuring</span>
                )}
              </button>

              {smartError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold text-xs flex items-center space-x-2 animate-fade-in">
                  <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                  <span>{smartError}</span>
                </div>
              )}

              {/* AI Structuring Result Preview */}
              {smartResult && (
                <div className="p-4 bg-slate-50 border border-purple-200 rounded-2xl space-y-3 animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                    <span className="font-black text-purple-900 text-sm">{smartResult.title}</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded text-[10px]">
                      {smartResult.difficulty}
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium">{smartResult.problemStatement}</p>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">Canonical Solution:</span>
                    <p className="text-slate-700 text-[11px] leading-relaxed">{smartResult.canonicalSolution}</p>
                  </div>

                  {smartResult.codeJava && (
                    <div className="bg-slate-900 p-3 rounded-xl text-slate-100 font-mono text-[10px] overflow-x-auto">
                      <pre>{smartResult.codeJava}</pre>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={handleSaveSmartResult}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow transition"
                    >
                      Publish to Live RAG Store
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: BULK JSON INGESTION                              */}
      {/* ========================================================= */}
      {activeModal === 'bulk_ingest' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Bulk Ingest Questions / Notes (JSON Array)</h3>
              <button onClick={() => setActiveModal('none')} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleBulkIngest} className="space-y-3 text-xs">
              <p className="text-slate-500">
                Paste a JSON array of technical items to ingest 10, 50, or 100+ questions simultaneously:
              </p>
              <textarea
                rows={10}
                required
                value={bulkJSON}
                onChange={(e) => setBulkJSON(e.target.value)}
                placeholder='[
  {
    "title": "Kafka Consumer Group Rebalance",
    "category": "System Design",
    "difficulty": "HARD",
    "problemStatement": "How does Kafka handle partition reassignment during consumer failure?",
    "canonicalSolution": "Kafka uses the Group Coordinator broker..."
  }
]'
                className="w-full p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed"
              ></textarea>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow"
                >
                  Execute Bulk Ingest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: VIEW DETAILS MODAL                               */}
      {/* ========================================================= */}
      {activeModal === 'view_details' && viewingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">ID: {viewingDoc.id}</span>
                <h3 className="text-base font-black text-slate-900">{viewingDoc.title}</h3>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-bold">
                  {viewingDoc.category}
                </span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold">
                  {viewingDoc.difficulty}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-bold">
                  Page {viewingDoc.pageNumber || 1}
                </span>
              </div>

              {viewingDoc.problemStatement && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 uppercase text-[10px]">Problem Statement</span>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-800 leading-relaxed font-medium">
                    {viewingDoc.problemStatement}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase text-[10px]">Canonical RAG Solution</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-800 leading-relaxed font-mono text-[11px]">
                  {viewingDoc.canonicalSolution || viewingDoc.content}
                </p>
              </div>

              {viewingDoc.codeJava && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 uppercase text-[10px]">Java 21 Solution Code</span>
                  <div className="p-3 bg-slate-900 rounded-xl text-slate-100 font-mono text-[10px] overflow-x-auto">
                    <pre>{viewingDoc.codeJava}</pre>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModal('none')}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
