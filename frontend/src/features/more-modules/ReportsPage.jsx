import { useEffect, useState } from 'react';

import { apiClient } from '../../services/apiClient.js';

const CATEGORY_BG = {
  Sales:     'bg-blue-100 text-blue-700',
  Finance:   'bg-green-100 text-green-700',
  Inventory: 'bg-yellow-100 text-yellow-700',
  HR:        'bg-purple-100 text-purple-700',
  Purchase:  'bg-cyan-100 text-cyan-700',
};

const TH = 'text-left text-xs font-semibold uppercase tracking-wide text-[#536173] px-5 py-3 border-b border-[#edf2f7]';
const TD = 'px-5 py-3.5 border-b border-[#f3f4f6] text-[13px]';

const EMPTY_SUMMARY = {
  stats: { total: 0, financial: 0, sales: 0, inventory: 0, hr: 0, purchase: 0 },
  categories: [],
  reports: [],
};

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const r = 60, cx = 80, cy = 80;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const slices = total > 0 ? data.map((d) => {
    const dash = (d.count / total) * circumference;
    const slice = { ...d, dash, offset };
    offset += dash;
    return slice;
  }) : [];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg height="160" viewBox="0 0 160 160" width="160">
          {total === 0 ? (
            <circle cx={cx} cy={cy} fill="none" r={r} stroke="#e5e7eb" strokeWidth="22" />
          ) : (
            slices.map((s, i) => (
              <circle key={i} cx={cx} cy={cy} fill="none" r={r}
                stroke={s.color} strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                strokeDashoffset={-s.offset + circumference / 4}
                strokeWidth="22" />
            ))
          )}
          <text dominantBaseline="middle" fill="#111827" fontSize="18" fontWeight="700" textAnchor="middle" x={cx} y={cy - 6}>
            {total}
          </text>
          <text dominantBaseline="middle" fill="#536173" fontSize="10" textAnchor="middle" x={cx} y={cy + 12}>
            Total
          </text>
        </svg>
      </div>
      {total === 0 ? (
        <p className="m-0 text-[12px] text-[#536173]">No report data yet.</p>
      ) : (
        <div className="w-full grid grid-cols-2 gap-x-4 gap-y-2">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm flex-none" style={{ background: d.color }} />
              <span className="text-[12px] text-[#536173]">{d.label}</span>
              <span className="text-[12px] font-semibold text-[#111827] ml-auto">({d.count})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReportsPage() {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  useEffect(() => {
    apiClient('/more-modules/reports-summary')
      .then((data) => setSummary({ ...EMPTY_SUMMARY, ...data }))
      .catch(() => {});
  }, []);

  const { stats, categories, reports } = summary;

  const STAT_CARDS = [
    { label: 'Total Reports',      value: String(stats.total),      sub: 'Available', color: '#2563eb', bg: '#eff6ff',
      icon: <svg fill="none" height="20" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg> },
    { label: 'Financial Reports',  value: String(stats.financial),  sub: 'Reports',   color: '#16a34a', bg: '#f0fdf4',
      icon: <svg fill="none" height="20" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24" width="20"><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
    { label: 'Sales Reports',      value: String(stats.sales),      sub: 'Reports',   color: '#d97706', bg: '#fffbeb',
      icon: <svg fill="none" height="20" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" width="20"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
    { label: 'Inventory Reports',  value: String(stats.inventory),  sub: 'Reports',   color: '#0891b2', bg: '#ecfeff',
      icon: <svg fill="none" height="20" stroke="#0891b2" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
    { label: 'HR Reports',         value: String(stats.hr),         sub: 'Reports',   color: '#7c3aed', bg: '#f5f3ff',
      icon: <svg fill="none" height="20" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  ];

  return (
    <div className="p-4 md:p-7">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-1">
        <div>
          <nav className="flex items-center gap-1 text-[13px] text-[#536173] mb-1">
            <a className="text-blue-600 no-underline hover:underline" href="#/dashboard">Home</a>
            <span>›</span><span>More Modules</span><span>›</span><span>Reports</span>
          </nav>
          <h1 className="m-0 text-[22px] font-bold">Reports</h1>
          <p className="m-0 text-[13px] text-[#536173] mt-0.5">View and download business reports</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700 border-0 font-[inherit]" type="button">
          <svg fill="none" height="14" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 my-5">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="bg-white border border-[#dfe7f1] rounded-xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-none" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="text-xs text-[#536173] mb-0.5">{s.label}</div>
              <div className="text-[17px] font-bold leading-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-0.5 text-[#536173]">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
        {/* Popular Reports Table */}
        <div className="bg-white border border-[#dfe7f1] rounded-xl">
          <div className="px-5 py-3.5 border-b border-[#edf2f7]">
            <span className="text-[14px] font-semibold text-[#111827]">Popular Reports</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={TH}>Report Name</th>
                  <th className={TH}>Category</th>
                  <th className={TH}>Description</th>
                  <th className={TH}>Last Generated</th>
                  <th className={TH}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td className={`${TD} text-center text-[#536173]`} colSpan={5}>No reports available yet.</td>
                  </tr>
                ) : (
                  reports.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className={`${TD} font-medium text-[#111827]`}>{row.name}</td>
                      <td className={TD}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${CATEGORY_BG[row.category] ?? 'bg-gray-100 text-gray-600'}`}>
                          {row.category}
                        </span>
                      </td>
                      <td className={`${TD} text-[#536173]`}>{row.description}</td>
                      <td className={`${TD} text-[#536173]`}>{row.lastGenerated ?? '—'}</td>
                      <td className={TD}>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-50 text-blue-500 bg-transparent border-0 cursor-pointer" title="Download" type="button">
                          <svg fill="none" height="13" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Categories Chart */}
        <div className="bg-white border border-[#dfe7f1] rounded-xl">
          <div className="px-5 py-3.5 border-b border-[#edf2f7]">
            <span className="text-[14px] font-semibold text-[#111827]">Report Categories</span>
          </div>
          <div className="p-5">
            <DonutChart data={categories} />
          </div>
        </div>
      </div>
    </div>
  );
}
