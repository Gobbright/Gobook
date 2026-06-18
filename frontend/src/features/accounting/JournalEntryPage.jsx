import { useEffect, useState } from 'react';

import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
  updateJournalEntry,
} from '../../services/accountingService.js';
import { ExportButtons } from '../../components/forms/ExportButtons.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { isWithinDateRange } from '../../utils/dateRange.js';

const EMPTY_ENTRY = { date: '', entryNo: '', particulars: '', debit: 0, credit: 0, status: 'Posted' };

const TH = 'text-left text-xs font-semibold uppercase tracking-wide text-[#536173] px-5 py-3 border-b border-[#edf2f7]';
const TD = 'px-5 py-3.5 border-b border-[#f3f4f6] text-[13px]';

export function JournalEntryPage() {
  const [showForm, setShowForm] = useState(false);
  const [dateFrom, setDateFrom] = useState('2026-05-01');
  const [dateTo, setDateTo]   = useState('2026-05-31');
  const [filterStatus, setFilterStatus] = useState('All');
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ENTRY);

  function loadJournalEntries() {
    return getJournalEntries()
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]));
  }

  useEffect(() => {
    let isMounted = true;

    getJournalEntries()
      .then((data) => {
        if (isMounted) setEntries(data.entries ?? []);
      })
      .catch(() => {
        if (isMounted) setEntries([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalDebit  = entries.reduce((a, r) => a + r.debit, 0);
  const totalCredit = entries.reduce((a, r) => a + r.credit, 0);
  const diff = totalDebit - totalCredit;

  const filtered = entries.filter((r) => {
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    return isWithinDateRange(r.date, dateFrom, dateTo);
  });
  const exportColumns = [
    { label: 'Date', value: (row) => row.date },
    { label: 'Entry No.', value: (row) => row.entryNo },
    { label: 'Particulars', value: (row) => row.particulars },
    { label: 'Debit', value: (row) => formatCurrency(row.debit) },
    { label: 'Credit', value: (row) => formatCurrency(row.credit) },
    { label: 'Status', value: (row) => row.status },
  ];
  function updateForm(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function resetForm() {
    setForm(EMPTY_ENTRY);
    setEditingId(null);
    setShowForm(false);
  }
  async function handleSubmit(event) {
    event.preventDefault();
    const payload = { ...form, debit: Number(form.debit), credit: Number(form.credit) };

    if (editingId) await updateJournalEntry(editingId, payload);
    else await createJournalEntry(payload);
    await loadJournalEntries();
    resetForm();
  }
  function handleEdit(row) {
    setForm({
      date: row.date,
      entryNo: row.entryNo,
      particulars: row.particulars,
      debit: row.debit,
      credit: row.credit,
      status: row.status,
    });
    setEditingId(row._id);
    setShowForm(true);
  }
  async function handleDelete(id) {
    await deleteJournalEntry(id);
    await loadJournalEntries();
  }

  return (
    <div className="p-4 md:p-7">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-1">
        <div>
          <nav className="flex items-center gap-1 text-[13px] text-[#536173] mb-1">
            <a className="text-blue-600 no-underline hover:underline" href="#/dashboard">Home</a>
            <span>›</span><span>Accounting</span><span>›</span><span>Journal Entry</span>
          </nav>
          <h1 className="m-0 text-[22px] font-bold">Journal Entry</h1>
          <p className="m-0 text-[13px] text-[#536173] mt-0.5">Create and manage journal entries</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 border border-[#dbe4ef] rounded-md px-3 py-2 bg-white text-[13px]">
            <svg fill="none" height="13" stroke="#536173" strokeWidth="2" viewBox="0 0 24 24" width="13"><rect height="18" rx="2" ry="2" width="18" x="3" y="4" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
            <input className="outline-none font-[inherit] text-[13px] w-28 border-0" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span className="text-[#536173]">–</span>
            <input className="outline-none font-[inherit] text-[13px] w-28 border-0" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <select className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] bg-white font-[inherit] outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option>All</option><option>Posted</option><option>Draft</option>
          </select>
          <ExportButtons title="Journal Entries" filename="journal-entries" rows={filtered} columns={exportColumns} />
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700 border-0 font-[inherit]"
            type="button"
            onClick={() => setShowForm(true)}
          >
            <svg fill="none" height="14" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="14"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
            New Journal Entry
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-5">
        {[
          { label: 'Total Entries', value: String(entries.length), sub: 'This period', icon: '📝', bg: '#eff6ff', color: '#2563eb' },
          { label: 'Total Debit', value: formatCurrency(totalDebit), sub: 'Sum of debits', icon: '🔴', bg: '#fef2f2', color: '#dc2626' },
          { label: 'Total Credit', value: formatCurrency(totalCredit), sub: 'Sum of credits', icon: '🟢', bg: '#f0fdf4', color: '#16a34a' },
          { label: 'Difference', value: formatCurrency(Math.abs(diff)), sub: diff === 0 ? 'Balanced ✓' : 'Unbalanced', icon: diff === 0 ? '⚖️' : '⚠️', bg: diff === 0 ? '#f0fdf4' : '#fffbeb', color: diff === 0 ? '#16a34a' : '#d97706' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#dfe7f1] rounded-xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-none" style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div>
              <div className="text-xs text-[#536173] mb-0.5">{s.label}</div>
              <div className="text-[17px] font-bold leading-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: s.color }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── New Entry Form ── */}
      {showForm && (
        <form className="bg-white border border-[#dfe7f1] rounded-xl p-5 mb-5" onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="m-0 text-[15px] font-semibold">{editingId ? 'Edit Journal Entry' : 'New Journal Entry'}</h3>
            <button className="text-[#536173] hover:text-[#111827] bg-transparent border-0 cursor-pointer text-xl font-[inherit]" type="button" onClick={resetForm}>x</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#536173] font-medium">Entry No.</label>
              <input className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] outline-none focus:border-blue-500 font-[inherit]" placeholder="JE/26-27/001" required value={form.entryNo} onChange={(e) => updateForm('entryNo', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#536173] font-medium">Date</label>
              <input className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] outline-none focus:border-blue-500 font-[inherit]" required type="date" value={form.date} onChange={(e) => updateForm('date', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#536173] font-medium">Status</label>
              <select className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] outline-none focus:border-blue-500 font-[inherit] bg-white" value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                <option>Posted</option>
                <option>Draft</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#536173] font-medium">Particulars</label>
              <input className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] outline-none focus:border-blue-500 font-[inherit]" placeholder="To Cash A/c" required value={form.particulars} onChange={(e) => updateForm('particulars', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#536173] font-medium">Debit</label>
              <input className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] text-right outline-none focus:border-blue-500 font-[inherit]" min="0" type="number" value={form.debit} onChange={(e) => updateForm('debit', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#536173] font-medium">Credit</label>
              <input className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] text-right outline-none focus:border-blue-500 font-[inherit]" min="0" type="number" value={form.credit} onChange={(e) => updateForm('credit', e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <span className="text-[13px] text-[#536173]">Debit and credit should match before posting.</span>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-white border border-[#dbe4ef] rounded-md cursor-pointer hover:bg-gray-50 font-[inherit]" type="button" onClick={resetForm}>Cancel</button>
              <button className="px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700 border-0 font-[inherit]" type="submit">{editingId ? 'Update Entry' : 'Post Entry'}</button>
            </div>
          </div>
        </form>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-[#dfe7f1] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={TH}>Date</th>
                <th className={TH}>Entry No.</th>
                <th className={TH}>Particulars</th>
                <th className={`${TH} text-right`}>Debit (₹)</th>
                <th className={`${TH} text-right`}>Credit (₹)</th>
                <th className={TH}>Status</th>
                <th className={TH}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className={`${TD} text-[#536173]`}>{row.date}</td>
                  <td className={`${TD} font-mono font-semibold text-[#111827]`}>{row.entryNo}</td>
                  <td className={`${TD} font-medium text-[#374151]`}>{row.particulars}</td>
                  <td className={`${TD} text-right text-[#dc2626] font-medium`}>{formatCurrency(row.debit)}</td>
                  <td className={`${TD} text-right text-[#16a34a] font-medium`}>{formatCurrency(row.credit)}</td>
                  <td className={TD}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${row.status === 'Posted' ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-50'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className={TD}>
                    <div className="flex gap-1">
                      <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-50 text-blue-500 bg-transparent border-0 cursor-pointer" type="button" title="Edit" onClick={() => handleEdit(row)}>
                        <svg fill="none" height="13" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-red-400 bg-transparent border-0 cursor-pointer" type="button" title="Delete" onClick={() => handleDelete(row._id)}>
                        <svg fill="none" height="13" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-[#edf2f7] flex flex-wrap justify-between gap-2 text-[13px] text-[#536173]">
          <span>Showing {filtered.length} entries</span>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded border border-[#dbe4ef] hover:bg-gray-50 text-[12px] bg-white font-[inherit] cursor-pointer" type="button">←</button>
            <span className="px-2.5 py-1 rounded bg-blue-600 text-white text-[12px]">1</span>
            <button className="px-2.5 py-1 rounded border border-[#dbe4ef] hover:bg-gray-50 text-[12px] bg-white font-[inherit] cursor-pointer" type="button">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
