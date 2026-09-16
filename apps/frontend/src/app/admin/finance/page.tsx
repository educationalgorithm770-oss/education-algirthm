'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import CustomDropdown from '@/components/ui/CustomDropdown';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
}

interface Transaction {
  id: string;
  student: string;
  course: string;
  amount: string;
  gst: string;
  date: string;
  status: string;
  method: string;
}

interface FinanceMetrics {
  grossRevenue: number;
  netRevenue: number;
  gstCollected: number;
  totalTransactions: number;
}

export default function AdminFinancePage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<FinanceMetrics>({
    grossRevenue: 0,
    netRevenue: 0,
    gstCollected: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  // Coupon form state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'flat'>('percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponMaxUses, setCouponMaxUses] = useState('100');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [couponError, setCouponError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/finance');
      const json = await res.json();
      if (json.success && json.data) {
        setCoupons(json.data.coupons || []);
        setTransactions(json.data.transactions || []);
        setMetrics(json.data.metrics || { grossRevenue: 0, netRevenue: 0, gstCollected: 0, totalTransactions: 0 });
      }
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.toUpperCase().trim();
    if (code.length < 3) { setCouponError('Coupon code must be at least 3 characters.'); return; }
    const val = parseFloat(couponValue);
    if (isNaN(val) || val <= 0) { setCouponError('Discount value must be a positive number.'); return; }
    if (couponType === 'percentage' && val > 100) { setCouponError('Percentage discount cannot exceed 100%.'); return; }

    try {
      setSubmitting(true);
      setCouponError('');
      const res = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          type: couponType,
          value: val,
          maxUses: parseInt(couponMaxUses) || 100,
          expiresAt: couponExpiry || null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowCouponModal(false);
        setCouponCode(''); setCouponValue(''); setCouponExpiry(''); setCouponError('');
        setSuccessBanner(`Coupon "${code}" saved and activated in database!`);
        setTimeout(() => setSuccessBanner(''), 5000);
        await fetchFinanceData();
      } else {
        setCouponError(data.error || 'Failed to create coupon.');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCoupon = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c));
      }
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
    }
  };

  const exportTransactionsToCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Transaction ID', 'Student', 'Course', 'Amount', 'GST (18%)', 'Date', 'Status', 'Payment Method'];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.student.replace(/"/g, '""')}"`,
      `"${t.course.replace(/"/g, '""')}"`,
      `"${t.amount}"`,
      `"${t.gst}"`,
      t.date,
      t.status,
      t.method,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-purple-600 uppercase tracking-wider">
              <i className="fa-solid fa-wallet"></i>
              <span>Financial Operations (Live MySQL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">Revenue, Coupons & Razorpay Hub</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Manage gross sales, GST compliance, coupon discount codes, and live MySQL transaction reconciliation.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={exportTransactionsToCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shadow-sm flex items-center space-x-2"
            >
              <i className="fa-solid fa-file-csv"></i>
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => { setShowCouponModal(true); setCouponError(''); }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/30 flex items-center justify-center space-x-2"
            >
              <i className="fa-solid fa-tag"></i>
              <span>Create Coupon Code</span>
            </button>
          </div>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successBanner}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Gross Sales (Total)</span>
              <i className="fa-solid fa-indian-rupee-sign text-purple-600"></i>
            </div>
            <div className="text-3xl font-black text-slate-900">
              {loading ? '...' : `₹${metrics.grossRevenue.toLocaleString('en-IN')}`}
            </div>
            <p className="text-xs text-emerald-600 font-bold flex items-center">
              <i className="fa-solid fa-database me-1"></i> Live MySQL Database Sync
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>GST Compliance (18%)</span>
              <i className="fa-solid fa-receipt text-blue-600"></i>
            </div>
            <div className="text-3xl font-black text-slate-900">
              {loading ? '...' : `₹${metrics.gstCollected.toLocaleString('en-IN')}`}
            </div>
            <p className="text-xs text-slate-400 font-medium">Automatic 18% HSN 9992 Tax Calculation</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Active Coupon Campaigns</span>
              <i className="fa-solid fa-tags text-amber-500"></i>
            </div>
            <div className="text-3xl font-black text-slate-900">
              {loading ? '...' : coupons.filter((c) => c.isActive).length} Active
            </div>
            <p className="text-xs text-slate-400 font-medium">{coupons.length} total codes configured</p>
          </div>
        </div>

        {/* Coupon Manager Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <i className="fa-solid fa-tags text-purple-600"></i>
              <span>Active Promotional Discount Codes</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading coupons from database...</div>
          ) : coupons.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No coupons found. Click "Create Coupon Code" above to add one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] whitespace-nowrap">
                    <th className="pb-3 px-3">Code</th>
                    <th className="pb-3 px-3">Discount</th>
                    <th className="pb-3 px-3">Usage</th>
                    <th className="pb-3 px-3">Expires</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 inline-block">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value.toLocaleString('en-IN')} FLAT`}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{c.usedCount}</span>
                        <span className="text-slate-400"> / {c.maxUses} uses</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">{c.expiresAt}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center ${
                          c.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {c.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => toggleCoupon(c.id, c.isActive)}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition inline-flex items-center ${
                            c.isActive ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Transactions Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <i className="fa-solid fa-receipt text-purple-600"></i>
              <span>Live Database Transactions</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No transactions recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] whitespace-nowrap">
                    <th className="pb-3 px-3">Txn Ref</th>
                    <th className="pb-3 px-3">Student</th>
                    <th className="pb-3 px-3">Course</th>
                    <th className="pb-3 px-3">Amount</th>
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Gateway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-500 whitespace-nowrap">{t.id}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">{t.student}</td>
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">{t.course}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">{t.amount}</td>
                      <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">{t.date}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center ${
                          t.status === 'Captured' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">{t.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Modal for Creating Coupon */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Create New Coupon</h3>
              <button onClick={() => setShowCouponModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {couponError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold">
                {couponError}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. FESTIVE30"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
                  <CustomDropdown
                    value={couponType}
                    onChange={(val) => setCouponType(val as any)}
                    options={[
                      { value: 'percentage', label: 'Percentage (%)', icon: '🏷️' },
                      { value: 'flat', label: 'Flat Amount (₹)', icon: '💵' }
                    ]}
                    variant="indigo"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Value</label>
                  <input
                    type="number"
                    placeholder={couponType === 'percentage' ? '25' : '2000'}
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Uses</label>
                  <input
                    type="number"
                    value={couponMaxUses}
                    onChange={(e) => setCouponMaxUses(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={couponExpiry}
                    onChange={(e) => setCouponExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30"
                >
                  {submitting ? 'Saving to Database...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudentFooter />
    </div>
  );
}
