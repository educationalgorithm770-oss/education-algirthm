'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface Submission {
  id: string;
  title: string;
  githubUrl: string;
  fileName?: string;
  status: string;
  score?: string;
  feedback: string;
  submittedAt: string;
}

export default function AssignmentsPage() {
  const [selectedCapstone, setSelectedCapstone] = useState('Capstone 2: RAG Pipeline with Gemini AI Embeddings');
  const [githubUrl, setGithubUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('student_assignments_history');
    if (saved) {
      try { setSubmissions(JSON.parse(saved)); } catch (e) {}
    } else {
      const initial: Submission[] = [
        {
          id: 'sub_1',
          title: 'Capstone 1: E-Commerce Microservices Architecture',
          githubUrl: 'https://github.com/student/ecommerce-microservices-java',
          fileName: 'ecommerce-services.zip',
          status: 'Graded',
          score: '95 / 100',
          feedback: 'Excellent separation of Spring Boot services, clean JWT filter chain implementation.',
          submittedAt: '2 days ago'
        }
      ];
      setSubmissions(initial);
      localStorage.setItem('student_assignments_history', JSON.stringify(initial));
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!githubUrl.trim() && !uploadedFile) {
      setError('Please provide either a GitHub Repository URL or upload a project file.');
      return;
    }

    if (githubUrl.trim() && !githubUrl.includes('github.com')) {
      setError('Please enter a valid GitHub repository URL (e.g. https://github.com/username/repo).');
      return;
    }

    const newSub: Submission = {
      id: 'sub_' + Date.now(),
      title: selectedCapstone,
      githubUrl: githubUrl || 'https://github.com/student/uploaded-project',
      fileName: uploadedFile ? uploadedFile.name : undefined,
      status: 'Under Review',
      score: 'Pending Grade',
      feedback: 'Submission received. Automated code linting & faculty peer evaluation in progress.',
      submittedAt: 'Just now'
    };

    setSubmissions(prev => {
      const updated = [newSub, ...prev];
      localStorage.setItem('student_assignments_history', JSON.stringify(updated));
      return updated;
    });

    setGithubUrl('');
    setNotes('');
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <StudentNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-extrabold uppercase">
              Project Evaluation Desk
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Assignments & Capstones</h1>
            <p className="text-slate-600 text-sm md:text-base">Submit your live project code repositories for instructor grading and code review.</p>
          </div>

          <Link href="/dashboard" className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-xl transition">
            &larr; Back to Student Hub
          </Link>
        </div>

        {/* Submission Form */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <i className="fa-brands fa-github text-indigo-600 text-2xl me-3"></i>
            Submit Capstone Project
          </h2>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmitAssignment} className="space-y-4 text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Capstone Assignment</label>
              <select
                value={selectedCapstone}
                onChange={(e) => setSelectedCapstone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:border-indigo-600"
              >
                <option value="Capstone 1: E-Commerce Microservices Architecture">Capstone 1: E-Commerce Microservices Architecture</option>
                <option value="Capstone 2: RAG Pipeline with Gemini AI Embeddings">Capstone 2: RAG Pipeline with Gemini AI Embeddings</option>
                <option value="Capstone 3: Distributed Kafka Event-Driven System">Capstone 3: Distributed Kafka Event-Driven System</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">GitHub Repository Link</label>
              <input
                type="url"
                placeholder="https://github.com/yourusername/capstone-project"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Or Upload Code Archive (.zip / .pdf)</label>
              <div className="border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 rounded-2xl text-center space-y-2 relative cursor-pointer hover:border-indigo-500 transition">
                <input
                  type="file"
                  accept=".zip,.rar,.pdf,.tar.gz"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <i className="fa-solid fa-cloud-arrow-up text-3xl text-indigo-600"></i>
                <div className="text-sm font-bold text-slate-800">
                  {uploadedFile ? `Selected: ${uploadedFile.name}` : 'Click or Drag & Drop Project Archive (.zip, .pdf)'}
                </div>
                <div className="text-xs text-slate-400">Maximum file size: 25 MB</div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Architecture Notes & Instructions (Optional)</label>
              <textarea
                rows={3}
                placeholder="Include setup instructions, database migrations, or credentials info..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
              ></textarea>
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center space-x-2"
            >
              <i className="fa-solid fa-paper-plane"></i>
              <span>Submit Project for Code Review &rarr;</span>
            </button>
          </form>
        </div>

        {/* Submissions History */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Submission History ({submissions.length})</h2>
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{sub.title}</h3>
                    <div className="text-xs text-slate-400 font-medium">Submitted {sub.submittedAt}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      sub.status === 'Graded' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {sub.status} {sub.score ? `(${sub.score})` : ''}
                    </span>
                  </div>
                </div>

                {sub.githubUrl && (
                  <div className="text-xs text-indigo-600 font-mono flex items-center space-x-2">
                    <i className="fa-brands fa-github"></i>
                    <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="hover:underline">{sub.githubUrl}</a>
                  </div>
                )}

                {sub.fileName && (
                  <div className="text-xs text-slate-600 font-mono flex items-center space-x-2">
                    <i className="fa-solid fa-file-zipper text-amber-500"></i>
                    <span>{sub.fileName}</span>
                  </div>
                )}

                <p className="text-xs md:text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800">Faculty Review: </span> {sub.feedback}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
}
