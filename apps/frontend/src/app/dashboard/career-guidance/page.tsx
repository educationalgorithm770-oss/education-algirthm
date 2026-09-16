'use client';

import React, { useState } from 'react';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import Link from 'next/link';

export default function CareerGuidancePage() {
  const [selectedPersona, setSelectedPersona] = useState<'service_dev' | 'fresher' | 'sde1'>('service_dev');

  const roadmaps = {
    service_dev: {
      title: 'Service Company Developer ➔ Tier-1 Product SDE 2',
      duration: '16 Weeks',
      salaryTarget: '₹18 LPA - ₹38 LPA',
      phases: [
        {
          step: 'Phase 01',
          name: 'Core Fundamentals & Concurrency Mastery',
          details: 'Switch from basic Java 8 syntax to Java 21 LTS, Virtual Threads (Project Loom), Garbage Collection tuning, and LeetCode Hard DSA.'
        },
        {
          step: 'Phase 02',
          name: 'Production Microservices & Distributed Caching',
          details: 'Build Spring Boot REST microservices, implement OAuth2 security, Redis multi-level caching, and MySQL database sharding.'
        },
        {
          step: 'Phase 03',
          name: 'System Design & High-Throughput Pipelines',
          details: 'Design Token Bucket rate limiters, Kafka event streaming pipelines, and master P99 latency SLA optimizations.'
        },
        {
          step: 'Phase 04',
          name: 'Resume Re-Engineering & FAANG Referral Network',
          details: 'Optimize resume ATS score to 95%+, conduct 1-on-1 mock interviews with senior SDEs, and leverage internal referral channels.'
        }
      ]
    },
    fresher: {
      title: 'College Graduate / Fresher ➔ Product SDE 1',
      duration: '12 Weeks',
      salaryTarget: '₹12 LPA - ₹24 LPA',
      phases: [
        {
          step: 'Phase 01',
          name: 'Data Structures & Algorithmic Problem Solving',
          details: 'Master Arrays, Linked Lists, Trees, Graphs, Dynamic Programming, and 150+ top interview patterns.'
        },
        {
          step: 'Phase 02',
          name: 'Full Stack Java & Spring Boot Web Architecture',
          details: 'Build real-world RESTful backend services with Hibernate ORM, PostgreSQL database, and clean modular code.'
        },
        {
          step: 'Phase 03',
          name: 'Production Capstone & Docker Sandbox',
          details: 'Deploy full-stack payment processing engine or AI code review auditor with automated unit test suites.'
        }
      ]
    },
    sde1: {
      title: 'SDE 1 ➔ Senior SDE 2 / Staff AI Architect',
      duration: '16 Weeks',
      salaryTarget: '₹35 LPA - ₹65 LPA',
      phases: [
        {
          step: 'Phase 01',
          name: 'Generative AI & Agentic RAG Systems',
          details: 'Python, Google Gemini API, Qdrant Vector Embeddings, LangChain orchestration, and AI model evaluation.'
        },
        {
          step: 'Phase 02',
          name: 'High-Scale Distributed System Design',
          details: 'Eventual consistency vs strong consistency, Raft consensus algorithms, multi-region database replication, and load balancing.'
        }
      ]
    }
  };

  const activeRoadmap = roadmaps[selectedPersona];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <StudentNavbar />

      <section className="bg-white py-12 px-6 border-b border-slate-200">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="text-xs font-bold text-indigo-600 hover:underline">
              &larr; Back to Dashboard
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-extrabold uppercase tracking-wider">
                🎯 Pillar 10: Career Guidance &amp; Transition Roadmap
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">Personalized SDE Career Transition Blueprint</h1>
              <p className="text-slate-600 text-sm max-w-2xl mt-1">
                Select your starting background to generate a step-by-step career acceleration roadmap with target compensation metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 py-12 px-6 max-w-5xl mx-auto w-full space-y-8">
        {/* Persona Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setSelectedPersona('service_dev')}
            className={`p-5 rounded-3xl border text-left transition ${
              selectedPersona === 'service_dev'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-extrabold'
                : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 font-bold'
            }`}
          >
            <div className="text-xs uppercase opacity-80 mb-1">Target Role: SDE 2</div>
            <div className="text-base font-black">Service Dev ➔ Product SDE 2</div>
            <div className="text-xs mt-2 opacity-90 font-normal">Switch from TCS/Infosys/Wipro to Tier-1 Product Companies</div>
          </button>

          <button
            onClick={() => setSelectedPersona('fresher')}
            className={`p-5 rounded-3xl border text-left transition ${
              selectedPersona === 'fresher'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-extrabold'
                : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 font-bold'
            }`}
          >
            <div className="text-xs uppercase opacity-80 mb-1">Target Role: SDE 1</div>
            <div className="text-base font-black">Fresher / Grad ➔ SDE 1</div>
            <div className="text-xs mt-2 opacity-90 font-normal">Land high-paying campus/off-campus product roles</div>
          </button>

          <button
            onClick={() => setSelectedPersona('sde1')}
            className={`p-5 rounded-3xl border text-left transition ${
              selectedPersona === 'sde1'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-extrabold'
                : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 font-bold'
            }`}
          >
            <div className="text-xs uppercase opacity-80 mb-1">Target Role: Staff / AI Architect</div>
            <div className="text-base font-black">SDE 1 ➔ Senior / AI Architect</div>
            <div className="text-xs mt-2 opacity-90 font-normal">Master System Design &amp; GenAI RAG for 35LPA+ roles</div>
          </button>
        </div>

        {/* Dynamic Roadmap Content */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
            <div>
              <div className="text-xs font-black text-indigo-600 uppercase">Selected Blueprint</div>
              <h2 className="text-2xl font-black text-slate-900 mt-0.5">{activeRoadmap.title}</h2>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black">
                Target: {activeRoadmap.salaryTarget}
              </span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full text-xs font-black">
                Duration: {activeRoadmap.duration}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {activeRoadmap.phases.map((phase, idx) => (
              <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start space-x-4">
                <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-mono font-black text-xs shrink-0">
                  {phase.step}
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{phase.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{phase.details}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Link href="/courses" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-2">
              <span>Enroll in Full-Stack Cohort &amp; Start Blueprint</span>
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </Link>
          </div>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
}
