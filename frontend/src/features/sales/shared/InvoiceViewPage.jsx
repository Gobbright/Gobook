import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Send } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import { api, SERVER_ORIGIN } from '../../../services/api.js';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function calcTotals(items = [], charges = [], additionalDiscount, tds, tcs, advanceReceived) {
  let subtotal = 0;
  let totalGst = 0;

  const rows = items.map((item) => {
    const gross      = (item.qty ?? 1) * (item.rate ?? 0);
    const discAmt    = gross * ((item.discount ?? 0) / 100);
    const base       = gross - discAmt;
    const gstAmt     = base * ((item.gstRate ?? 0) / 100);
    subtotal += base;
    totalGst += gstAmt;
    return { ...item, base, gstAmt };
  });

  const chargeRows = charges.map((c) => {
    const amt = Number(c.amount) || 0;
    const gstAmt = amt * ((c.gstRate ?? 0) / 100);
    subtotal += amt;
    totalGst += gstAmt;
    return { ...c, amt, gstAmt };
  });

  let discountAmt = 0;
  if (additionalDiscount?.value) {
    discountAmt = additionalDiscount.type === 'percent'
      ? subtotal * (Number(additionalDiscount.value) / 100)
      : Number(additionalDiscount.value);
  }

  const taxable = subtotal - discountAmt;
  const tdsAmt = tds?.enabled ? taxable * ((tds.rate ?? 0) / 100) : 0;
  const tcsAmt = tcs?.enabled ? taxable * ((tcs.rate ?? 0) / 100) : 0;
  const grandTotal = taxable + totalGst - tdsAmt + tcsAmt;
  const balanceDue = grandTotal - (Number(advanceReceived) || 0);

  return { rows, chargeRows, subtotal, totalGst, discountAmt, taxable, tdsAmt, tcsAmt, grandTotal, balanceDue };
}

export function InvoiceViewPage({ invoiceId, documentType = 'invoice' }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [bizSettings, setBizSettings] = useState({});

  const isQuotation  = documentType === 'quotation';
  const isPO         = documentType === 'purchase-order';
  const isCreditNote = documentType === 'credit-note';
  const isDebitNote  = documentType === 'debit-note';

  const LIST_ROUTES = {
    invoice:          '#/billing/invoice',
    quotation:        '#/billing/quotation',
    'purchase-order': '#/billing/purchase-order',
    'credit-note':    '#/billing/credit-note',
    'debit-note':     '#/billing/debit-note',
    proforma:         '#/billing/proforma',
    'delivery-challan': '#/billing/delivery-challan',
    'e-invoice':      '#/billing/e-invoice',
    'e-way-bill':     '#/billing/e-way-bill',
  };
  const listRoute = LIST_ROUTES[documentType] ?? '#/billing/invoice';

  useEffect(() => {
    api.getSettings().then(setBizSettings).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = documentType === 'credit-note'
          ? await api.getCreditNote(invoiceId)
          : await api.getInvoice(invoiceId);
        setInvoice(data);
      } catch (err) {
        setError(err.message || 'Unable to load document');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [invoiceId, documentType]);

  if (loading) {
    return (
      <div className="p-4 md:p-7">
        <div className="bg-white border border-[#dfe7f1] rounded-lg p-8 text-sm text-[#374151]">Loading…</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-4 md:p-7">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-sm text-red-700">{error || 'Document not found'}</div>
      </div>
    );
  }

  const totals = calcTotals(
    invoice.items,
    invoice.charges,
    invoice.additionalDiscount,
    invoice.tds,
    invoice.tcs,
    invoice.advanceReceived,
  );

  const DOC_META = {
    invoice:          { label: 'Invoice',          dateLabel: 'Invoice Date',     secondLabel: 'Due Date',           secondDate: () => invoice.meta?.dueDate },
    quotation:        { label: 'Quotation',         dateLabel: 'Quote Date',       secondLabel: 'Valid Till',         secondDate: () => invoice.extra?.validTill },
    'purchase-order': { label: 'Purchase Order',    dateLabel: 'PO Date',          secondLabel: 'Expected Delivery',  secondDate: () => invoice.extra?.expectedDelivery },
    'credit-note':    { label: 'Credit Note',       dateLabel: 'Credit Note Date', secondLabel: 'Original Invoice',   secondDate: () => invoice.extra?.originalInvoiceNo },
    'debit-note':     { label: 'Debit Note',        dateLabel: 'Debit Note Date',  secondLabel: 'Original Invoice',   secondDate: () => invoice.extra?.originalInvoiceNo },
    proforma:         { label: 'Proforma Invoice',  dateLabel: 'Invoice Date',     secondLabel: 'Due Date',           secondDate: () => invoice.meta?.dueDate },
    'delivery-challan': { label: 'Delivery Challan', dateLabel: 'Challan Date',    secondLabel: null,                 secondDate: () => null },
  };
  const meta           = DOC_META[documentType] ?? DOC_META.invoice;
  const docLabel        = meta.label;
  const dateLabel       = meta.dateLabel;
  const secondDateLabel = meta.secondLabel;
  const secondDate      = meta.secondDate();

  return (
    <div className="p-4 md:p-7 max-w-4xl mx-auto">

      {/* ── Top action bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => { window.location.assign(listRoute); }}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#536173] hover:text-[#111827] bg-transparent border-0 cursor-pointer font-[inherit] transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <span className="text-[#dfe7f1]">|</span>
          <h1 className="m-0 text-[18px] font-bold text-[#111827]">
            {invoice.number}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#dbe4ef] rounded-md text-[13px] text-[#374151] bg-white hover:bg-gray-50 transition-colors"
          >
            <Send size={13} className="text-[#94a3b8]" />
            Send
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#dbe4ef] rounded-md text-[13px] text-[#374151] bg-white hover:bg-gray-50 transition-colors"
          >
            <Download size={13} className="text-[#94a3b8]" />
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Invoice document ── */}
      <div className="bg-white border border-[#dfe7f1] rounded-lg overflow-hidden">

        {/* ── Document header band ── */}
        <div className="bg-[#1e40af] px-4 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            {bizSettings.logoUrl && (
              <img src={`${SERVER_ORIGIN}${bizSettings.logoUrl}`} alt="logo" className="w-14 h-14 rounded-lg object-contain bg-white p-1 flex-none" />
            )}
            <div>
              <div className="text-white font-bold text-xl mb-0.5">{bizSettings.businessName || 'GoBook Enterprises'}</div>
              {bizSettings.gstin && <div className="text-blue-200 text-[13px]">GSTIN: {bizSettings.gstin}</div>}
              {bizSettings.address && <div className="text-blue-200 text-[13px]">{bizSettings.address}</div>}
              {(bizSettings.businessEmail || bizSettings.phone) && (
                <div className="text-blue-200 text-[13px]">{[bizSettings.businessEmail, bizSettings.phone].filter(Boolean).join(' · ')}</div>
              )}
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-1">{docLabel}</div>
            <div className="text-white font-bold text-2xl">{invoice.number}</div>
          </div>
        </div>

        {/* ── From / To / Meta ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-4 sm:px-8 py-6 border-b border-[#edf2f7]">

          {/* Bill To */}
          <div className="sm:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-2">
              {isQuotation ? 'Quote To' : isPO ? 'Vendor' : isCreditNote || isDebitNote ? 'Credit To' : 'Bill To'}
            </div>
            <div className="text-[15px] font-bold text-[#111827] mb-1">{invoice.customer?.name || '—'}</div>
            {invoice.customer?.gstin && (
              <div className="text-[12px] text-[#536173] font-mono mb-0.5">GSTIN: {invoice.customer.gstin}</div>
            )}
            {invoice.customer?.address && (
              <div className="text-[13px] text-[#374151]">{invoice.customer.address}</div>
            )}
            <div className="text-[13px] text-[#374151]">
              {[invoice.customer?.city, invoice.customer?.state, invoice.customer?.pincode].filter(Boolean).join(', ')}
            </div>
            {invoice.customer?.phone && (
              <div className="text-[13px] text-[#536173] mt-1">{invoice.customer.phone}</div>
            )}
            {invoice.customer?.email && (
              <div className="text-[13px] text-[#536173]">{invoice.customer.email}</div>
            )}
          </div>

          {/* Dates */}
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-0.5">{dateLabel}</div>
              <div className="text-[13px] font-medium text-[#111827]">{fmtDate(invoice.meta?.date)}</div>
            </div>
            {secondDate && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-0.5">{secondDateLabel}</div>
                <div className="text-[13px] font-medium text-[#111827]">{fmtDate(secondDate)}</div>
              </div>
            )}
            {invoice.meta?.placeOfSupply && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-0.5">Place of Supply</div>
                <div className="text-[13px] font-medium text-[#111827]">{invoice.meta.placeOfSupply}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Line items table ── */}
        <div className="px-4 sm:px-8 py-6 border-b border-[#edf2f7]">
          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-[#edf2f7]">
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">#</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">Description</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">HSN</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">Qty</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">Rate</th>
                {!isQuotation && (
                  <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">GST%</th>
                )}
                <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {totals.rows.map((item, i) => (
                <tr key={i} className="border-b border-[#f8fafc]">
                  <td className="py-3 pr-4 text-[13px] text-[#94a3b8]">{i + 1}</td>
                  <td className="py-3 pr-4">
                    <div className="text-[13px] font-medium text-[#111827]">{item.description || '—'}</div>
                    {item.unit && <div className="text-[11px] text-[#94a3b8]">{item.unit}</div>}
                  </td>
                  <td className="py-3 pr-4 text-right text-[12px] text-[#536173] font-mono">{item.hsn || '—'}</td>
                  <td className="py-3 pr-4 text-right text-[13px] text-[#374151]">{item.qty ?? 1}</td>
                  <td className="py-3 pr-4 text-right text-[13px] text-[#374151]">{formatCurrency(item.rate ?? 0)}</td>
                  {!isQuotation && (
                    <td className="py-3 pr-4 text-right text-[13px] text-[#536173]">{item.gstRate ?? 0}%</td>
                  )}
                  <td className="py-3 text-right text-[13px] font-medium text-[#111827]">{formatCurrency(item.base)}</td>
                </tr>
              ))}

              {/* Additional charges */}
              {totals.chargeRows.map((c, i) => (
                <tr key={`charge-${i}`} className="border-b border-[#f8fafc]">
                  <td className="py-2 pr-4 text-[13px] text-[#94a3b8]">—</td>
                  <td className="py-2 pr-4 text-[13px] text-[#536173] italic">{c.label}</td>
                  <td className="py-2 pr-4" />
                  <td className="py-2 pr-4" />
                  <td className="py-2 pr-4" />
                  {!isQuotation && <td className="py-2 pr-4 text-right text-[13px] text-[#536173]">{c.gstRate ?? 0}%</td>}
                  <td className="py-2 text-right text-[13px] text-[#374151]">{formatCurrency(c.amt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* ── Totals ── */}
        <div className="flex justify-end px-4 sm:px-8 py-6 border-b border-[#edf2f7]">
          <div className="w-full sm:w-72 flex flex-col gap-2">
            <div className="flex justify-between text-[13px] text-[#536173]">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>

            {totals.discountAmt > 0 && (
              <div className="flex justify-between text-[13px] text-red-600">
                <span>Discount</span>
                <span>− {formatCurrency(totals.discountAmt)}</span>
              </div>
            )}

            {!isQuotation && totals.totalGst > 0 && (
              <div className="flex justify-between text-[13px] text-[#536173]">
                <span>GST</span>
                <span>{formatCurrency(totals.totalGst)}</span>
              </div>
            )}

            {totals.tdsAmt > 0 && (
              <div className="flex justify-between text-[13px] text-orange-600">
                <span>TDS ({invoice.tds?.rate}%)</span>
                <span>− {formatCurrency(totals.tdsAmt)}</span>
              </div>
            )}

            {totals.tcsAmt > 0 && (
              <div className="flex justify-between text-[13px] text-[#536173]">
                <span>TCS ({invoice.tcs?.rate}%)</span>
                <span>{formatCurrency(totals.tcsAmt)}</span>
              </div>
            )}

            <div className="border-t border-[#edf2f7] my-1" />

            <div className="flex justify-between text-[15px] font-bold text-[#111827]">
              <span>Total</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>

            {(invoice.advanceReceived > 0) && (
              <>
                <div className="flex justify-between text-[13px] text-green-700">
                  <span>Advance Received</span>
                  <span>− {formatCurrency(invoice.advanceReceived)}</span>
                </div>
                <div className="flex justify-between text-[14px] font-bold text-blue-700">
                  <span>Balance Due</span>
                  <span>{formatCurrency(totals.balanceDue)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Bank Details ── */}
        {(bizSettings.bankName || bizSettings.accountNumber || bizSettings.ifscCode) && (
          <div className="px-4 sm:px-8 py-6 border-b border-[#edf2f7]">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-3">Bank Details</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-1.5">
              {[
                { label: 'Bank Name',           value: bizSettings.bankName },
                { label: 'Account Holder Name', value: bizSettings.accountHolderName },
                { label: 'Account Number',      value: bizSettings.accountNumber },
                { label: 'IFSC Code',           value: bizSettings.ifscCode },
                { label: 'Branch',              value: bizSettings.bankBranch },
                { label: 'Account Type',        value: bizSettings.accountType },
              ].filter(({ value }) => value).map(({ label, value }) => (
                <div key={label} className="flex flex-col sm:flex-row gap-0.5 sm:gap-2">
                  <span className="text-[12px] text-[#94a3b8] sm:w-36 sm:flex-none">{label}:</span>
                  <span className="text-[12px] font-medium text-[#111827] wrap-break-word">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Notes / Terms ── */}
        {(invoice.notes || invoice.terms) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 sm:px-8 py-6">
            {invoice.notes && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-2">Notes</div>
                <p className="text-[13px] text-[#374151] m-0 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-2">Terms & Conditions</div>
                <p className="text-[13px] text-[#374151] m-0 whitespace-pre-wrap">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="px-4 sm:px-8 py-4 bg-[#f8fafc] border-t border-[#edf2f7] flex items-center justify-between flex-wrap gap-2">
          <span className="text-[12px] text-[#94a3b8]">Generated by GoBook · {fmtDate(invoice.meta?.date)}</span>
          {invoice.supplyType && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              invoice.supplyType === 'intrastate' ? 'bg-purple-50 text-purple-700' : 'bg-cyan-50 text-cyan-700'
            }`}>
              {invoice.supplyType === 'intrastate' ? 'Intrastate' : 'Interstate'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
