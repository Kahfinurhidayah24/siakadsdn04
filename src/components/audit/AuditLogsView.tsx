import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ShieldCheck, Search, Clock, User, Filter, Trash2 } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { activityLogs, currentUser } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = activityLogs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif-luxury flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-amber-700" />
            Audit Trail & Log Aktivitas Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rekaman jejak digital otomatis setiap perubahan data siswa, penilaian rapor, jadwal, dan proses import massal.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari aktivitas atau operator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-amber-500/20 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 w-40">Waktu</th>
              <th className="py-3 px-4 w-48">Operator</th>
              <th className="py-3 px-4 w-48">Aksi</th>
              <th className="py-3 px-4">Rincian Perubahan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-100/50 transition">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{log.user}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 border border-amber-500/30 uppercase font-semibold">
                      {log.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-amber-700 font-mono text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 leading-relaxed text-[11px]">
                    {log.details}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                  Tidak ada catatan aktivitas yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
