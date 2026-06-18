import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar, Download, Eye, FileText, IndianRupee,
  MoreVertical, Pencil, Plus, Search, TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { api } from '../../services/api.js';
import { DateRangeFilter } from '../../components/forms/DateRangeFilter.jsx';
import { ExportButtons } from '../../components/forms/ExportButtons.jsx';
import { isWithinDateRange } from '../../utils/dateRange.js';

// ── Config ─────────────────────────────────────────────────────

const PAGE_SIZE = 5;
const INVOICE_NUMBER_COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

// ── Sub-components ─────────────────────────────────────────────

function fmtDate(iso) {
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
  { id: 'view',    icon: Eye,          label: 'View Invoice' },
  { id: 'edit',    icon: Pencil,       label: 'Edit' },
  { id: 'pdf',     icon: Download,     label: 'Download PDF' },
];

function ActionMenu({ invoiceId, openMenu, setOpenMenu }) {
  const isOpen = openMenu === invoiceId;
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
    setOpenMenu(isOpen ? null : invoiceId);
  }

  function handleAction(id) {
    setOpenMenu(null);
    if (id === 'view') {
      window.location.assign(`#/billing/invoice/${invoiceId}/view`);
    } else if (id === 'edit') {
      window.location.assign(`#/billing/invoice/${invoiceId}/edit`);
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
          style={{ top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right, minWidth: 176 }}
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

// ── Helper: Normalize invoice data from API ────────────────────

function normalizeInvoice(inv) {
  const customer = {
    name: '',
    gstin: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    ...(inv.customer ?? {}),
  };

  // Calculate totals from items
  let taxable = 0;
  let gst = 0;
  if (Array.isArray(inv.items)) {
    inv.items.forEach((item) => {
      const itemTotal = (item.qty ?? 1) * (item.rate ?? 0) - (item.discount ?? 0);
      taxable += itemTotal;
      const itemGst = itemTotal * ((item.gstRate ?? 0) / 100);
      gst += itemGst;
    });
  }
  // Add charges
  if (Array.isArray(inv.charges)) {
    inv.charges.forEach((c) => {
      const chargeAmt = Number(c.amount) || 0;
      taxable += chargeAmt;
      const chargeGst = chargeAmt * ((c.gstRate ?? 0) / 100);
      gst += chargeGst;
    });
  }
  const total = taxable + gst;

  return {
    ...inv,
    id: inv._id ?? inv.id,
    number: inv.number || 'Untitled invoice',
    customer,
    date: inv.meta?.date || '',
    dueDate: inv.meta?.dueDate || '',
    supplyType: inv.supplyType || 'intrastate',
    taxable: Math.round(taxable * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

function compareInvoicesByNumber(a, b) {
  const byNumber = INVOICE_NUMBER_COLLATOR.compare(a.number || '', b.number || '');
  if (byNumber !== 0) return byNumber;
  return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
}

// ── Main page ──────────────────────────────────────────────────

export function InvoicePage() {
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInvoices() {
      setLoading(true);
      setError('');
      try {
        const response = await api.listInvoices({ documentType: 'invoice', limit: 100 });
        const data = Array.isArray(response.data) ? response.data.map(normalizeInvoice) : [];
        setInvoices(data);
      } catch (err) {
        console.error('Error loading invoices:', err);
        setError(err.message || 'Unable to load invoices');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, []);

  const stats = useMemo(() => {
    const total = invoices.length;
    const totalValue = invoices.reduce((s, i) => s + i.total, 0);
    const now = new Date();
    const createdThisMonth = invoices.filter((i) => {
      const d = new Date(i.createdAt || i.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    const avgValue = total > 0 ? totalValue / total : 0;
    return { total, totalValue, createdThisMonth, avgValue };
  }, [invoices]);

  const orderedInvoices = useMemo(
    () => [...invoices].sort(compareInvoicesByNumber),
    [invoices],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orderedInvoices.filter((inv) => {
      const number = inv.number?.toLowerCase() ?? '';
      const customerName = inv.customer?.name?.toLowerCase() ?? '';
      if (q && !number.includes(q) && !customerName.includes(q)) return false;
      if (!isWithinDateRange(inv.date || inv.createdAt, dateFrom, dateTo)) return false;
      return true;
    });
  }, [dateFrom, dateTo, search, orderedInvoices]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const exportColumns = [
    { label: 'Invoice No.', value: (row) => row.number },
    { label: 'Customer', value: (row) => row.customer?.name || 'Walk-in customer' },
    { label: 'Phone', value: (row) => row.customer?.phone || '' },
    { label: 'Invoice Date', value: (row) => fmtDate(row.date) },
    { label: 'Due Date', value: (row) => fmtDate(row.dueDate) },
    { label: 'Taxable Amt', value: (row) => formatCurrency(row.taxable) },
    { label: 'GST', value: (row) => formatCurrency(row.gst) },
    { label: 'Total', value: (row) => formatCurrency(row.total) },
    { label: 'Supply', value: (row) => row.supplyType === 'intrastate' ? 'Intra' : 'Inter' },
  ];
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const paginatedInvoices = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : pageStart + 1;
  const showingTo = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

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
            <span className="text-[#111827]">GST Invoices</span>
          </nav>
          <h1 className="m-0 text-[22px] font-bold text-[#111827]">GST Invoices</h1>
        </div>
        <a
          href="#/billing/invoice/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 no-underline transition-colors"
        >
          <Plus size={15} />
          Create GST Invoice
        </a>
      </div>

      {/* ── Stats ── */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">{error}</div>
      )}
      {loading ? (
        <div className="rounded-lg border border-[#dfe7f1] bg-white p-6 text-sm text-[#374151] mb-6">Loading invoices…</div>
      ) : null}
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
          <ExportButtons title="GST Invoices" filename="gst-invoices" rows={filtered} columns={exportColumns} />
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            <input
              className="pl-8 pr-3 py-2 border border-[#dbe4ef] rounded-md text-[13px] outline-none focus:border-blue-500 w-60 font-[inherit]"
              placeholder="Search invoice or customer…"
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
                  { label: 'Invoice No.',    align: 'left'  },
                  { label: 'Customer',       align: 'left'  },
                  { label: 'Phone',          align: 'left'  },
                  { label: 'Invoice Date',   align: 'left'  },
                  { label: 'Due Date',       align: 'left'  },
                  { label: 'Taxable Amt',    align: 'right' },
                  { label: 'GST',            align: 'right' },
                  { label: 'Total',          align: 'right' },
                  { label: 'Supply',         align: 'left'  },
                  { label: '',               align: 'right' },
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
                  <td colSpan={10} className="text-center py-16 text-[#536173] text-[13px]">
                    No invoices match your search.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => {
                  return (
                    <tr
                      key={inv.id}
                      className="border-t border-[#edf2f7] hover:bg-[#fafbfe] transition-colors"
                    >
                      {/* Invoice number */}
                      <td className="px-4 py-3.5">
                        <a
                          href={`#/billing/invoice/${inv.id}/view`}
                          className="text-[13px] font-semibold text-blue-600 no-underline hover:underline"
                        >
                          {inv.number}
                        </a>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="text-[13px] font-medium text-[#111827] leading-snug">
                          {inv.customer.name || 'Walk-in customer'}
                        </div>
                        <div className="text-xs text-[#94a3b8] mt-0.5 font-mono tracking-tight">
                          {inv.customer.gstin}
                          <span className="font-sans tracking-normal text-[#b0bec5]"> · </span>
                          {inv.customer.city}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 text-[13px] text-[#374151] whitespace-nowrap">
                        {inv.customer.phone || <span className="text-[#b0bec5]">—</span>}
                      </td>

                      {/* Invoice date */}
                      <td className="px-4 py-3.5 text-[13px] text-[#374151] whitespace-nowrap">
                        {fmtDate(inv.date)}
                      </td>

                      {/* Due date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[13px] text-[#374151]">
                          {fmtDate(inv.dueDate)}
                        </span>
                      </td>

                      {/* Taxable */}
                      <td className="px-4 py-3.5 text-right text-[13px] text-[#374151]">
                        {formatCurrency(inv.taxable)}
                      </td>

                      {/* GST */}
                      <td className="px-4 py-3.5 text-right text-[13px] text-[#536173]">
                        {formatCurrency(inv.gst)}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-[13px] font-bold text-[#111827]">
                          {formatCurrency(inv.total)}
                        </span>
                      </td>

                      {/* Supply type */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            inv.supplyType === 'intrastate'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-cyan-50 text-cyan-700'
                          }`}
                        >
                          {inv.supplyType === 'intrastate' ? 'Intra' : 'Inter'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <ActionMenu
                          invoiceId={inv.id}
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

        {/* Pagination footer */}
        <div className="px-4 py-3 border-t border-[#edf2f7] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] text-[#536173]">
            Showing <span className="font-medium text-[#374151]">{showingFrom}-{showingTo}</span> of{' '}
            <span className="font-medium text-[#374151]">{filtered.length}</span> invoices
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="px-3 py-1.5 border border-[#dbe4ef] rounded text-[13px] text-[#374151] bg-white hover:bg-gray-50 cursor-pointer font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              ← Prev
            </button>
            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`min-w-8 px-3 py-1.5 border rounded text-[13px] font-semibold cursor-pointer font-[inherit] ${
                  safePage === page
                    ? 'border-blue-600 text-white bg-blue-600'
                    : 'border-[#dbe4ef] text-[#374151] bg-white hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className="px-3 py-1.5 border border-[#dbe4ef] rounded text-[13px] text-[#374151] bg-white hover:bg-gray-50 cursor-pointer font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Next →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
