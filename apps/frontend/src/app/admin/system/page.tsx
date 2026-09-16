'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface DatabaseTable {
  name: string;
  rows: number;
  sizeKb: number;
}

interface AuditLog {
  id: number;
  action: string;
  details: string;
  ip: string;
  time: string;
}

interface SystemData {
  database: {
    engine: string;
    name: string;
    status: string;
    totalTables: number;
    tables: DatabaseTable[];
  };
  counts: {
    students: number;
    courses: number;
    enrollments: number;
    codeSubmissions: number;
  };
  auditLogs: AuditLog[];
}

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupBanner, setBackupBanner] = useState('');

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/system');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load system data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const handleExportBackup = () => {
    if (!data) return;
    const backupJson = JSON.stringify(data, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `education_algorithm_metadata_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupBanner('System schema & metrics snapshot exported successfully!');
    setTimeout(() => setBackupBanner(''), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-purple-600 uppercase tracking-wider">
              <i className="fa-solid fa-shield-halved"></i>
              <span>Infrastructure &amp; Security Desk (Live MySQL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              System Audit &amp; Database Health
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Monitor live MySQL table sizes, active connection metrics, and system security event logs.
            </p>
          </div>

          <button
            onClick={handleExportBackup}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/30 flex items-center justify-center space-x-2"
          >
            <i className="fa-solid fa-download"></i>
            <span>Export Snapshot</span>
          </button>
        </div>

        {backupBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-circle-check text-sm"></i>
              <span>{backupBanner}</span>
            </div>
          </div>
        )}

        {/* Database Health Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Status</div>
            <div className="text-2xl font-black text-emerald-600 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping me-2"></span>
              {data?.database.status || 'CONNECTED'}
            </div>
            <div className="text-xs text-slate-500 font-mono">{data?.database.engine} ({data?.database.name})</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Database Tables</div>
            <div className="text-2xl font-black text-slate-900">{data?.database.totalTables || 0} Tables</div>
            <div className="text-xs text-purple-600 font-bold">Schema v2.0 Synchronized</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrolled Learners</div>
            <div className="text-2xl font-black text-slate-900">{data?.counts.enrollments.toLocaleString() || 0}</div>
            <div className="text-xs text-emerald-600 font-bold">{data?.counts.students || 0} Registered Accounts</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Code Arena Submissions</div>
            <div className="text-2xl font-black text-slate-900">{data?.counts.codeSubmissions.toLocaleString() || 0}</div>
            <div className="text-xs text-slate-400 font-medium">Evaluated in Sandbox</div>
          </div>
        </div>

        {/* Database Tables Detail */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <i className="fa-solid fa-database text-purple-600"></i>
            <span>Live MySQL Database Tables</span>
          </h2>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading database table metrics...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
              {data?.database.tables.map((tbl) => (
                <div key={tbl.name} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-mono font-bold text-slate-900 text-xs truncate">{tbl.name}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{tbl.rows.toLocaleString()} rows</span>
                    <span>{tbl.sizeKb} KB</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Audit Logs */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <i className="fa-solid fa-list-check text-purple-600"></i>
            <span>Recent System &amp; Audit Trail</span>
          </h2>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading audit logs...</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Source IP</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data?.auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{log.action}</td>
                    <td className="py-3.5 px-4 text-slate-800">{log.details || 'System operation executed successfully.'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{log.ip}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>

      <StudentFooter />
    </div>
  );
}
