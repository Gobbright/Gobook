import { useEffect, useState } from 'react';

import {
  createLedgerAccount,
  deleteLedgerAccount,
  getLedgerAccounts,
  updateLedgerAccount,
} from '../../services/accountingService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

const GROUPS = ['All Groups', 'Cash-In-Hand', 'Bank Accounts', 'Sundry Debtors', 'Sundry Creditors', 'Direct Expenses', 'Direct Incomes', 'Fixed Assets', 'Capital Account'];
const EMPTY_ACCOUNT = { name: '', group: 'Bank Accounts', opening: 0, debit: 0, credit: 0, color: '#2563eb' };

const TH = 'text-left text-xs font-semibold uppercase tracking-wide text-[#536173] px-5 py-3 border-b border-[#edf2f7]';
const TD = 'px-5 py-3.5 border-b border-[#f3f4f6] text-[13px]';

export function LedgerPage() {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('All Groups');
  const [ledgerData, setLedgerData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ACCOUNT);

  function loadLedgerAccounts() {
    return getLedgerAccounts()
      .then((data) => setLedgerData(data.accounts ?? []))
      .catch(() => setLedgerData([]));
  }

  useEffect(() => {
    let isMounted = true;

    getLedgerAccounts()
      .then((data) => {
        if (isMounted) setLedgerData(data.accounts ?? []);
      })
      .catch(() => {
        if (isMounted) setLedgerData([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = ledgerData.filter((r) => {
    if (group !== 'All Groups' && r.group !== group) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: ledgerData.length,
    totalDebit: ledgerData.reduce((a, r) => a + r.debit, 0),
    totalCredit: ledgerData.reduce((a, r) => a + r.credit, 0),
  };
  const closing = stats.totalDebit - stats.totalCredit + ledgerData.reduce((a, r) => a + r.opening, 0);

  function getClosing(r) { return r.opening + r.debit - r.credit; }
  function updateForm(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function resetForm() {
    setForm(EMPTY_ACCOUNT);
    setEditingId(null);
    setShowForm(false);
  }
  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      ...form,
      opening: Number(form.opening),
      debit: Number(form.debit),
      credit: Number(form.credit),
    };

    if (editingId) await updateLedgerAccount(editingId, payload);
    else await createLedgerAccount(payload);
    await loadLedgerAccounts();
    resetForm();
  }
  function handleEdit(row) {
    setForm({
      name: row.name,
      group: row.group,
      opening: row.opening,
      debit: row.debit,
      credit: row.credit,
      color: row.color,
    });
    setEditingId(row._id);
    setShowForm(true);
  }
  async function handleDelete(id) {
    await deleteLedgerAccount(id);
    await loadLedgerAccounts();
  }

  return (
    <div className="p-4 md:p-7">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-1">
        <div>
          <nav className="flex items-center gap-1 text-[13px] text-[#536173] mb-1">
            <a className="text-blue-600 no-underline hover:underline" href="#/dashboard">Home</a>
            <span>›</span><span>Accounting</span><span>›</span><span>Ledger</span>
          </nav>
          <h1 className="m-0 text-[22px] font-bold">Ledger</h1>
          <p className="m-0 text-[13px] text-[#536173] mt-0.5">View all ledger accounts and their balances</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700 border-0 font-[inherit]" type="button" onClick={() => setShowForm(true)}>
          <svg fill="none" height="14" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="14"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
          New Ledger
        </button>
      </div>

      {showForm && (
        <form className="bg-white border border-[#dfe7f1] rounded-xl p-5 mt-5" onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="m-0 text-[15px] font-semibold">{editingId ? 'Edit Ledger' : 'New Ledger'}</h3>
            <button className="text-[#536173] hover:text-[#111827] bg-transparent border-0 cursor-pointer text-xl font-[inherit]" type="button" onClick={resetForm}>×</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <input className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] outline-none focus:border-blue-500 font-[inherit] sm:col-span-2" placeholder="Account name" required value={form.name} onChange={(e) => updateForm('name', e.target.value)} />
            <select className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] bg-white font-[inherit] outline-none" value={form.group} onChange={(e) => updateForm('group', e.target.value)}>
              {GROUPS.filter((item) => item !== 'All Groups').map((item) => <option key={item}>{item}</option>)}
            </select>
            <input className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] text-right outline-none focus:border-blue-500 font-[inherit]" min="0" placeholder="Opening" type="number" value={form.opening} onChange={(e) => updateForm('opening', e.target.value)} />
            <input className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] text-right outline-none focus:border-blue-500 font-[inherit]" min="0" placeholder="Debit" type="number" value={form.debit} onChange={(e) => updateForm('debit', e.target.value)} />
            <input className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] text-right outline-none focus:border-blue-500 font-[inherit]" min="0" placeholder="Credit" type="number" value={form.credit} onChange={(e) => updateForm('credit', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-white border border-[#dbe4ef] rounded-md cursor-pointer hover:bg-gray-50 font-[inherit]" type="button" onClick={resetForm}>Cancel</button>
            <button className="px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700 border-0 font-[inherit]" type="submit">{editingId ? 'Update Ledger' : 'Save Ledger'}</button>
          </div>
        </form>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-5">
        {[
          { label: 'Total Accounts', value: String(stats.total), sub: '+2 this month', icon: '📋', bg: '#eff6ff', color: '#2563eb' },
          { label: 'Total Debit Balance', value: formatCurrency(stats.totalDebit), sub: 'All accounts', icon: '📈', bg: '#fef2f2', color: '#dc2626' },
          { label: 'Total Credit Balance', value: formatCurrency(stats.totalCredit), sub: 'All accounts', icon: '📉', bg: '#f0fdf4', color: '#16a34a' },
          { label: 'Closing Balance', value: formatCurrency(Math.abs(closing)), sub: closing >= 0 ? 'Debit' : 'Credit', icon: '💰', bg: '#fffbeb', color: '#d97706' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#dfe7f1] rounded-xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-none" style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div>
              <div className="text-xs text-[#536173] mb-0.5">{s.label}</div>
              <div className="text-[17px] font-bold leading-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#536173] mt-0.5">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-[#dfe7f1] rounded-xl">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-[#edf2f7]">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#536173]" fill="none" height="13" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13">
              <circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
            <input className="border border-[#dbe4ef] rounded-md pl-8 pr-3 py-2 text-[13px] w-full outline-none focus:border-blue-500 font-[inherit]" placeholder="Search ledger accounts..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] bg-white font-[inherit] outline-none" value={group} onChange={(e) => setGroup(e.target.value)}>
            {GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>
          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-gray-700 bg-white border border-[#dbe4ef] rounded-md cursor-pointer hover:bg-gray-50 font-[inherit]" type="button">
            <svg fill="none" height="13" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-200">
            <thead>
              <tr>
                <th className={TH}>Account Name</th>
                <th className={TH}>Group</th>
                <th className={`${TH} text-right`}>Opening Balance</th>
                <th className={`${TH} text-right`}>Debit (₹)</th>
                <th className={`${TH} text-right`}>Credit (₹)</th>
                <th className={`${TH} text-right`}>Closing Balance</th>
                <th className={TH}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const cl = getClosing(row);
                const isCr = cl < 0;
                return (
                  <tr key={row._id} className="hover:bg-gray-50">
                    <td className={TD}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-none" style={{ background: row.color }}>
                          {row.name?.[0] ?? '?'}
                        </div>
                        <span className="font-medium text-[#111827]">{row.name}</span>
                      </div>
                    </td>
                    <td className={`${TD} text-[#536173]`}>{row.group}</td>
                    <td className={`${TD} text-right`}>{formatCurrency(row.opening)}</td>
                    <td className={`${TD} text-right`}>{row.debit > 0 ? formatCurrency(row.debit) : <span className="text-[#cbd5e1]">—</span>}</td>
                    <td className={`${TD} text-right`}>{row.credit > 0 ? formatCurrency(row.credit) : <span className="text-[#cbd5e1]">—</span>}</td>
                    <td className={`${TD} text-right font-semibold ${isCr ? 'text-green-700' : 'text-[#111827]'}`}>
                      {formatCurrency(Math.abs(cl))}{isCr && <span className="ml-1 text-xs font-normal text-green-600">CR</span>}
                    </td>
                    <td className={TD}>
                      <div className="flex items-center gap-1">
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-50 text-blue-500 bg-transparent border-0 cursor-pointer" type="button" title="Edit" onClick={() => handleEdit(row)}>
                          <svg fill="none" height="13" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-red-400 bg-transparent border-0 cursor-pointer" type="button" title="Delete" onClick={() => handleDelete(row._id)}>
                          <svg fill="none" height="13" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-[#edf2f7] flex flex-wrap justify-between gap-2 text-[13px] text-[#536173]">
          <span>Showing {filtered.length} of {ledgerData.length} accounts</span>
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
