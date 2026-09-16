'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface PaymentRecord {
  id: string;
  orderId: string;
  paymentId?: string;
  course: string;
  amount: number;
  baseAmount?: number;
  gst: number;
  method: string;
  date: string;
  status: 'success' | 'pending' | 'refunded';
  enrollmentNumber?: string;
  rollNumber?: string;
}

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalGST, setTotalGST] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentRecord | null>(null);
  const [studentName, setStudentName] = useState('Student');
  const [studentEmail, setStudentEmail] = useState('');

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        // Load User details
        try {
          const authRes = await fetch('/api/auth/me');
          const authData = await authRes.json();
          if (authData.success && authData.user) {
            if (authData.user.name) setStudentName(authData.user.name);
            if (authData.user.email) setStudentEmail(authData.user.email);
          }
        } catch (_) {}

        // Load Real Billing History
        const res = await fetch('/api/student/payments');
        const data = await res.json();
        if (data.success && Array.isArray(data.payments)) {
          setPayments(data.payments);
          setTotalSpent(data.totalSpent || 0);
          setTotalGST(data.totalGST || 0);
        }
      } catch (err) {
        console.error('Failed to load payments:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <StudentNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
              <i className="fa-solid fa-receipt"></i>
              <span>Billing &amp; Enrollment History</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">Payment History &amp; Invoices</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">View verified course purchases, download GST tax invoices, and check enrollment payment receipts.</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5">
            <i className="fa-solid fa-arrow-left text-[10px]"></i><span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invested</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">₹{totalSpent.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{payments.length} course enrollment{payments.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">GST Paid (18%)</p>
            <h3 className="text-2xl font-black text-slate-700 mt-1">₹{totalGST.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Tax deductible under IT-IIA</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Enrollments</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{payments.filter((p) => p.status === 'success').length}</h3>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">All verified &amp; active</p>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 overflow-x-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Verified Transaction Ledger</h2>
            <span className="text-xs text-slate-400 font-medium">{payments.length} Records</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <i className="fa-solid fa-spinner fa-spin text-xl text-indigo-500"></i>
              <div className="text-xs font-medium">Loading verified billing ledger...</div>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <i className="fa-regular fa-credit-card text-3xl text-slate-300"></i>
              <div className="text-xs font-bold text-slate-600">No payment transactions found.</div>
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Course Enrolled</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">GST (18%)</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">{p.id}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{p.course}</div>
                      <div className="text-[10px] text-indigo-600 font-mono font-bold">{p.enrollmentNumber || p.orderId}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">₹{p.amount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-slate-500 font-mono whitespace-nowrap">₹{p.gst.toLocaleString()}</td>
                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{p.method}</td>
                    <td className="py-4 px-4 text-slate-500 font-mono whitespace-nowrap">{p.date}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center">
                        ● {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedInvoice(p)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] transition border border-indigo-200 inline-flex items-center space-x-1 ml-auto whitespace-nowrap"
                      >
                        <i className="fa-solid fa-file-invoice text-xs"></i>
                        <span>Tax Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* PRINTABLE GST TAX INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 animate-fade-in text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                  EA
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Educationalgorithm Academy</h3>
                  <p className="text-[10px] text-slate-400 font-mono">GSTIN: 36AAECE1234F1Z5</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Billed To:</div>
                  <div className="font-extrabold text-slate-900 text-sm">{studentName}</div>
                  <div className="text-[11px] text-slate-500">{studentEmail}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Invoice Date</div>
                  <div className="font-mono font-bold text-slate-800">{selectedInvoice.date}</div>
                  <div className="text-[10px] font-mono text-indigo-600">{selectedInvoice.id}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{selectedInvoice.course}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Reg: {selectedInvoice.enrollmentNumber}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold">₹{(selectedInvoice.baseAmount || selectedInvoice.amount - selectedInvoice.gst).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-600">Integrated GST (IGST @ 18%)</td>
                      <td className="p-3 text-right font-mono text-slate-600">₹{selectedInvoice.gst.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-slate-50 font-black text-slate-900">
                      <td className="p-3">Total Paid (Inclusive of GST)</td>
                      <td className="p-3 text-right text-indigo-600 text-sm font-mono">₹{selectedInvoice.amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center space-x-2">
                <i className="fa-solid fa-shield-check text-emerald-600"></i>
                <span>Payment Confirmed via {selectedInvoice.method}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5"
              >
                <i className="fa-solid fa-print text-xs"></i>
                <span>Print / Save Tax PDF</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <StudentFooter />
    </div>
  );
}
