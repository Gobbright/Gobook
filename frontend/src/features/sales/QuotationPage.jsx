import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar, Download, Eye, IndianRupee,
  MoreVertical, Pencil, Plus, Search, TrendingUp, FileText,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { api } from '../../services/api.js';
import { DateRangeFilter } from '../../components/forms/DateRangeFilter.jsx';
import { ExportButtons } from '../../components/forms/ExportButtons.jsx';
import { isWithinDateRange } from '../../utils/dateRange.js';

// ── Sub-components ─────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatCard({ label, amount, countLabel, accentColor, icon, format = 'currency' }) {
  const display = format === 'number' ? Number(amount).toLocaleString('en-IN') : formatCurrency(amount);
  return (
    <div className="bg-white border border-[#dfe7f1] rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#536173]">{label}</span>
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-none"
          style={{ backgroundColor: accentColor + '1a' }}
        >
          {icon}
        </span>
      </div>
      <div>
        <div className="text-[22px] font-bold text-[#111827] leading-none">{display}</div>
        {countLabel && (
          <div className="text-xs text-[#536173] mt-1.5">{countLabel}</div>
        )}
      </div>
    </div>
  );
}

// ── Row action menu ────────────────────────────────────────────

const ROW_ACTIONS = [
  { id: 'view',      icon: Eye,         label: 'View Quotation' },
  { id: 'edit',      icon: Pencil,      label: 'Edit' },
  { id: 'pdf',       icon: Download,    label: 'Download PDF' },
];

function ActionMenu({ quotationId, openMenu, setOpenMenu }) {
  const isOpen = openMenu === quotationId;
  const btnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 'auto', bottom: 'auto', right: 0 });

  function handleToggle() {
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const right = window.innerWidth - rect.right;
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 260) {
        setMenuPos({ top: 'auto', bottom: window.innerHeight - rect.top + 4, right });
      } else {
        setMenuPos({ top: rect.bottom + 4, bottom: 'auto', right });
      }
    }
    setOpenMenu(isOpen ? null : quotationId);
  }

  function handleAction(id) {
    setOpenMenu(null);
    if (id === 'view') {
      window.location.assign(`#/billing/quotation/${quotationId}/view`);
    } else if (id === 'edit') {
      window.location.assign(`#/billing/quotation/${quotationId}/edit`);
    }
  }

  return (
    <div
      tabIndex={-1}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpenMenu(null); }}
    >
      <button
        ref={btnRef}
        type="button"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#edf2f7] text-[#94a3b8] hover:text-[#374151] transition-colors"
        onClick={handleToggle}
      >
        <MoreVertical size={15} />
      </button>

      {isOpen && (
        <div
          className="fixed z-50 bg-white border border-[#dde6f2] rounded-lg shadow-lg py-1"
          style={{ top: menuPos.top, right: menuPos.right, minWidth: 180 }}
        >
          {ROW_ACTIONS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left border-0 bg-transparent font-[inherit] cursor-pointer transition-colors text-[#374151] hover:bg-gray-50"
              onClick={() => handleAction(id)}
            >
              <Icon size={13} className="text-[#94a3b8]" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Normalize API data ─────────────────────────────────────────

function normalizeQuotation(inv) {
  let taxable = 0;
  let gst = 0;
  if (Array.isArray(inv.items)) {
    inv.items.forEach((item) => {
      const base = (item.qty ?? 1) * (item.rate ?? 0) - (item.discount ?? 0);
      taxable += base;
      gst += base * ((item.gstRate ?? 0) / 100);
    });
  }
  if (Array.isArray(inv.charges)) {
    inv.charges.forEach((c) => {
      const amt = Number(c.amount) || 0;
      taxable += amt;
      gst += amt * ((c.gstRate ?? 0) / 100);
    });
  }

  return {
    ...inv,
    id: inv._id,
    date: inv.meta?.date || '',
    validTill: inv.extra?.validTill || '',
    taxable: Math.round(taxable * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    total: Math.round((taxable + gst) * 100) / 100,
  };
}

// ── Main page ──────────────────────────────────────────────────

export function QuotationPage() {
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadQuotations() {
      setLoading(true);
      setError('');
      try {
        const response = await api.listInvoices({ documentType: 'quotation', limit: 100 });
        const data = Array.isArray(response.data) ? response.data.map(normalizeQuotation) : [];
        setQuotations(data);
      } catch (err) {
        setError(err.message || 'Unable to load quotations');
        setQuotations([]);
      } finally {
        setLoading(false);
      }
    }
    loadQuotations();
  }, []);

  const stats = useMemo(() => {
    const total = quotations.length;
    const totalValue = quotations.reduce((s, q) => s + q.total, 0);
    const now = new Date();
    const createdThisMonth = quotations.filter((q) => {
      const d = new Date(q.createdAt || q.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    const avgValue = total > 0 ? totalValue / total : 0;
    return { total, totalValue, createdThisMonth, avgValue };
  }, [quotations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotations.filter((qt) => {
      if (q && !qt.number?.toLowerCase().includes(q) && !qt.customer?.name?.toLowerCase().includes(q)) return false;
      if (!isWithinDateRange(qt.date || qt.createdAt, dateFrom, dateTo)) return false;
      return true;
    });
  }, [dateFrom, dateTo, search, quotations]);
  const exportColumns = [
    { label: 'Quote No.', value: (row) => row.number },
    { label: 'Customer', value: (row) => row.customer?.name || '' },
    { label: 'Phone', value: (row) => row.customer?.phone || '' },
    { label: 'Quote Date', value: (row) => fmtDate(row.date) },
    { label: 'Valid Till', value: (row) => fmtDate(row.validTill) },
    { label: 'Taxable Amt', value: (row) => formatCurrency(row.taxable) },
    { label: 'GST', value: (row) => formatCurrency(row.gst) },
    { label: 'Total', value: (row) => formatCurrency(row.total) },
  ];

  return (
    <div className="p-4 md:p-7">

      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div>
          <nav className="flex items-center gap-1 text-[13px] text-[#536173] mb-1">
            <a className="text-blue-600 no-underline hover:underline" href="#/dashboard">Home</a>
            <span>›</span>
            <span>Sales</span>
            <span>›</span>
            <span className="text-[#111827]">Quotations</span>
          </nav>
          <h1 className="m-0 text-[22px] font-bold text-[#111827]">Quotations</h1>
        </div>
        <a
          href="#/billing/quotation/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 no-underline transition-colors"
        >
          <Plus size={15} />
          Create Quotation
        </a>
      </div>

      {/* ── Error / Loading ── */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">{error}</div>
      )}
      {loading && (
        <div className="rounded-lg border border-[#dfe7f1] bg-white p-6 text-sm text-[#374151] mb-6">Loading quotations…</div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Documents"
          amount={stats.total}
          format="number"
          accentColor="#2563eb"
          icon={<FileText size={16} color="#2563eb" />}
        />
        <StatCard
          label="Total Value"
          amount={stats.totalValue}
          accentColor="#16a34a"
          icon={<IndianRupee size={16} color="#16a34a" />}
        />
        <StatCard
          label="Created This Month"
          amount={stats.createdThisMonth}
          format="number"
          accentColor="#d97706"
          icon={<Calendar size={16} color="#d97706" />}
        />
        <StatCard
          label="Average Value"
          amount={stats.avgValue}
          accentColor="#7c3aed"
          icon={<TrendingUp size={16} color="#7c3aed" />}
        />
      </div>

      {/* ── Filters + Table card ── */}
      <div className="bg-white border border-[#dfe7f1] rounded-lg overflow-hidden">

        {/* Search row */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-[#edf2f7] px-4 py-2.5">
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onClear={() => { setDateFrom(''); setDateTo(''); }}
          />
          <ExportButtons title="Quotations" filename="quotations" rows={filtered} columns={exportColumns} />
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            <input
              className="pl-8 pr-3 py-2 border border-[#dbe4ef] rounded-md text-[13px] outline-none focus:border-blue-500 w-60 font-[inherit]"
              placeholder="Search quotation or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 980 }}>
            <thead>
              <tr className="bg-[#f8fafc]">
                {[
                  { label: 'Quote No.',    align: 'left'  },
                  { label: 'Customer',     align: 'left'  },
                  { label: 'Phone',        align: 'left'  },
                  { label: 'Quote Date',   align: 'left'  },
                  { label: 'Valid Till',   align: 'left'  },
                  { label: 'Taxable Amt',  align: 'right' },
                  { label: 'GST',          align: 'right' },
                  { label: 'Total',        align: 'right' },
                  { label: '',             align: 'right' },
                ].map((col, i) => (
                  <th
                    key={i}
                    className={`text-xs font-semibold uppercase tracking-wide text-[#536173] px-4 py-3 ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-[#536173] text-[13px]">
                    No quotations match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((qt) => {
                  return (
                    <tr
                      key={qt.id}
                      className="border-t border-[#edf2f7] hover:bg-[#fafbfe] transition-colors"
                    >
                      {/* Quote number */}
                      <td className="px-4 py-3.5">
                        <a
                          href={`#/billing/quotation/${qt.id}/view`}
                          className="text-[13px] font-semibold text-blue-600 no-underline hover:underline"
                        >
                          {qt.number}
                        </a>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="text-[13px] font-medium text-[#111827] leading-snug">
                          {qt.customer?.name}
                        </div>
                        <div className="text-xs text-[#94a3b8] mt-0.5">
                          {qt.customer?.city}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 text-[13px] text-[#374151] whitespace-nowrap">
                        {qt.customer?.phone || <span className="text-[#b0bec5]">—</span>}
                      </td>

                      {/* Quote date */}
                      <td className="px-4 py-3.5 text-[13px] text-[#374151] whitespace-nowrap">
                        {fmtDate(qt.date)}
                      </td>

                      {/* Valid till */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[13px] text-[#374151]">
                          {fmtDate(qt.validTill)}
                        </span>
                      </td>

                      {/* Taxable */}
                      <td className="px-4 py-3.5 text-right text-[13px] text-[#374151]">
                        {formatCurrency(qt.taxable)}
                      </td>

                      {/* GST */}
                      <td className="px-4 py-3.5 text-right text-[13px] text-[#536173]">
                        {formatCurrency(qt.gst)}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-[13px] font-bold text-[#111827]">
                          {formatCurrency(qt.total)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <ActionMenu
                          quotationId={qt.id}
                          openMenu={openMenu}
                          setOpenMenu={setOpenMenu}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#edf2f7] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] text-[#536173]">
            Showing <span className="font-medium text-[#374151]">{filtered.length}</span> of{' '}
            <span className="font-medium text-[#374151]">{quotations.length}</span> quotations
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="px-3 py-1.5 border border-[#dbe4ef] rounded text-[13px] text-[#374151] bg-white hover:bg-gray-50 cursor-pointer font-[inherit]"
            >
              ← Prev
            </button>
            <button
              type="button"
              className="px-3 py-1.5 border border-blue-600 rounded text-[13px] font-semibold text-white bg-blue-600 cursor-pointer font-[inherit]"
            >
              1
            </button>
            <button
              type="button"
              className="px-3 py-1.5 border border-[#dbe4ef] rounded text-[13px] text-[#374151] bg-white hover:bg-gray-50 cursor-pointer font-[inherit]"
            >
              Next →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
