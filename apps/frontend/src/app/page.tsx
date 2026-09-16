import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import HeaderNavbar from '@/components/layout/HeaderNavbar';
import Footer from '@/components/layout/Footer';
import LandingHeroPillars from '@/components/marketing/LandingHeroPillars';
import EnterpriseProjectsShowcase from '@/components/marketing/EnterpriseProjectsShowcase';
import PublicJobsRadar from '@/components/marketing/PublicJobsRadar';
import FresherRealityCheckPopup from '@/components/marketing/FresherRealityCheckPopup';
import LmsFeatureShowcase from '@/components/marketing/LmsFeatureShowcase';
import WhyChooseUsGrid from '@/components/marketing/WhyChooseUsGrid';
import { Accordion } from '@/components/ui/Accordion';
import { SITE_DATA } from '@/config/site-data';

export const metadata: Metadata = {
  title: 'Education Algorithm — Build Your Skills. Build Your Career. Get Ready for the Job.',
  description: 'Master Java 21 Virtual Threads, Spring Boot Microservices, System Design, and Placement Aptitude with interactive code sandboxes, RAG AI mock interviews, and 1-on-1 mentorship.',
  openGraph: {
    title: 'Education Algorithm — Build Your Skills. Build Your Career. Get Ready for the Job.',
    description: 'Master Java 21, Microservices, LeetCode DSA, and Generative AI Agentic Systems.',
    type: 'website',
  },
};

export default function HomePage() {
  const faqItems = SITE_DATA.faqs.map((faq, idx) => ({
    id: `faq_${idx}`,
    title: faq.question,
    content: <p className="text-slate-600 text-sm leading-relaxed font-normal">{faq.answer}</p>,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': 'https://educationalgorithm.com/#organization',
        name: 'Education Algorithm',
        url: 'https://educationalgorithm.com',
        description: 'Engineering accelerator teaching Java 21, Microservices, System Design, and Generative AI systems with transparent fixed pricing and Docker-based code evaluation.',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Chennai',
          addressRegion: 'Tamil Nadu',
          addressCountry: 'India',
        },
      },
      {
        '@type': 'Course',
        '@id': 'https://educationalgorithm.com/courses#java-fullstack',
        name: 'Java Full Stack & Distributed Systems Accelerator',
        description: '16-week production engineering cohort covering Java 21 Virtual Threads, Spring Boot 3, Redis, Kafka, and Docker sandboxing.',
        provider: { '@id': 'https://educationalgorithm.com/#organization' },
        offers: {
          '@type': 'Offer',
          price: '15000',
          priceCurrency: 'INR',
          category: 'All-Inclusive Tuition',
        },
        educationalCredentialAwarded: 'Verified Enterprise Engineering Certificate',
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 scroll-smooth">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HeaderNavbar />

      {/* Hero & 3-Pillar Visual Transformation Section */}
      <LandingHeroPillars />

      {/* Hiring Partners Ticker */}
      <section className="py-8 sm:py-10 px-3 sm:px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5 text-center">
          <div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Engineers Trained At Education Algorithm Work At Top Tech Leaders
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-12 opacity-80">
            {SITE_DATA.hiringPartners.map((partner, idx) => (
              <div key={idx} className="flex items-center space-x-1.5 sm:space-x-2 text-slate-800 font-extrabold text-sm sm:text-lg">
                <i className={`${partner.logo} text-base sm:text-xl text-indigo-600`}></i>
                <span>{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ultra-Advanced Enterprise Projects & System Architecture Topology */}
      <EnterpriseProjectsShowcase />

      {/* Live Tech Talent Network & Public Career Radar */}
      <PublicJobsRadar />

      {/* Interactive Student LMS Feature Tour */}
      <LmsFeatureShowcase />

      {/* Why Choose Education Algorithm Bento Grid */}
      <WhyChooseUsGrid />

      {/* Comparison Table Section */}
      <section className="py-14 sm:py-20 px-3 sm:px-6 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          <div className="text-center space-y-2 px-2">
            <span className="text-indigo-600 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">The Difference</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">Why Education Algorithm Stands Out</h2>
            <p className="text-slate-500 text-xs sm:text-sm font-normal">Comparing pedagogical depth, tool access, and transparent pricing.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm min-w-[540px]">
              <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">Feature</th>
                  <th className="py-4 px-6 text-indigo-600 font-black">Education Algorithm</th>
                  <th className="py-4 px-6 text-slate-400">Generic Bootcamps</th>
                  <th className="py-4 px-6 text-slate-400">Self-Study Tutorials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900">Curriculum Depth</td>
                  <td className="py-4 px-6 font-bold text-indigo-600">Java 21 LTS, Spring Boot 3, Microservices &amp; GenAI</td>
                  <td className="py-4 px-6 text-slate-500">Basic Java 8 CRUD Syntax</td>
                  <td className="py-4 px-6 text-slate-500">Outdated Videos</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900">Interactive Student LMS</td>
                  <td className="py-4 px-6 font-bold text-indigo-600">50,000 Qs AI Interview Arena &amp; Cloud Sandbox</td>
                  <td className="py-4 px-6 text-slate-500">Static Text Assignments</td>
                  <td className="py-4 px-6 text-slate-500">None</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900">Doubt Support</td>
                  <td className="py-4 px-6 font-bold text-indigo-600">Private Doubt Desk (24-Hour SLA Guaranteed)</td>
                  <td className="py-4 px-6 text-slate-500">Crowded Discord / Chat Only</td>
                  <td className="py-4 px-6 text-slate-500">No Support</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900">Mentorship Model</td>
                  <td className="py-4 px-6 font-bold text-indigo-600">1-on-1 Senior SDE Code Reviews &amp; Mocks</td>
                  <td className="py-4 px-6 text-slate-500">Group Q&amp;A Only</td>
                  <td className="py-4 px-6 text-slate-500">No Mentorship</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900">Tuition Model</td>
                  <td className="py-4 px-6 font-bold text-emerald-600">Direct Transparent Access (Zero Salary Deductions)</td>
                  <td className="py-4 px-6 text-slate-500">Expensive 17% Salary ISAs (Up to ₹3 Lakhs)</td>
                  <td className="py-4 px-6 text-slate-500">Free to ₹5,000 (No Mentorship)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">Got Questions?</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Frequently Asked Questions</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Clear, honest answers about our cohort curriculum, LMS tools, and admissions.</p>
        </div>
        <Accordion items={faqItems} />
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 px-6 bg-white border-t border-slate-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/60 via-purple-50/60 to-indigo-50/60 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Ready to Upgrade Your Engineering Career?</h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Enroll in our Java Full Stack &amp; GenAI Masterclass cohort. Seats are limited for each batch.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/courses"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/20 transition flex items-center justify-center space-x-2"
            >
              <span>Explore Cohort Programs</span>
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-sm border border-slate-200 transition flex items-center justify-center space-x-2"
            >
              <i className="fa-solid fa-headset text-indigo-600 text-sm"></i>
              <span>Talk to Admissions Counselor</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 1-Minute Auto-Rotating Sarcastic Reality Check Popup */}
      <FresherRealityCheckPopup />

      <Footer />
    </div>
  );
}
