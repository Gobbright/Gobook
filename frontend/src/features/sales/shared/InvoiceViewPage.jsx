import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Printer, Send } from 'lucide-react';
import { api } from '../../../services/api.js';
import { documentConfigs } from '../documentConfigs.js';
import { DocumentPreviewModal } from './DocumentPreviewModal.jsx';

function calcTotals(items = [], charges = [], additionalDiscount, tds, tcs, advanceReceived, showGst = true) {
  const acc = { subtotal: 0, discount: 0, taxable: 0, totalGst: 0, grandTotal: 0, gstByRate: {} };

  items.forEach((item) => {
    const gross = (Number(item.qty) || 0) * (Number(item.rate) || 0);
    const discountAmt = gross * ((Number(item.discount) || 0) / 100);
    const taxable = gross - discountAmt;
    const gstAmt = showGst ? taxable * ((Number(item.gstRate) || 0) / 100) : 0;
    const rate = Number(item.gstRate) || 0;

    acc.subtotal += gross;
    acc.discount += discountAmt;
    acc.taxable += taxable;
    acc.totalGst += gstAmt;
    acc.grandTotal += taxable + gstAmt;
    if (!acc.gstByRate[rate]) acc.gstByRate[rate] = { taxable: 0, gst: 0 };
    acc.gstByRate[rate].taxable += taxable;
    acc.gstByRate[rate].gst += gstAmt;
  });

  const chargesSubtotal = charges.reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0);
  const chargesGst = showGst
    ? charges.reduce((sum, charge) => sum + (Number(charge.amount) || 0) * ((Number(charge.gstRate) || 0) / 100), 0)
    : 0;

  const preDisc = showGst
    ? acc.grandTotal + chargesSubtotal + chargesGst
    : acc.taxable + chargesSubtotal;
  const addDiscAmt = additionalDiscount?.value
    ? (additionalDiscount.type === 'percent'
      ? preDisc * (Number(additionalDiscount.value) / 100)
      : Math.min(Number(additionalDiscount.value), preDisc))
    : 0;
  const invoiceTotal = preDisc - addDiscAmt;
  const tdsAmt = tds?.enabled ? acc.taxable * ((Number(tds.rate) || 0) / 100) : 0;
  const tcsAmt = tcs?.enabled ? invoiceTotal * ((Number(tcs.rate) || 0) / 100) : 0;
  const netPayable = invoiceTotal - tdsAmt + tcsAmt;
  const roundOff = Math.round(netPayable) - netPayable;
  const finalTotal = Math.round(netPayable);
  const balanceDue = finalTotal - (Number(advanceReceived) || 0);

  return { ...acc, chargesSubtotal, chargesGst, preDisc, addDiscAmt, invoiceTotal, tdsAmt, tcsAmt, netPayable, roundOff, finalTotal, balanceDue };
}

export function InvoiceViewPage({ invoiceId, documentType = 'invoice' }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bizSettings, setBizSettings] = useState({});

  const config = documentConfigs[documentType] ?? documentConfigs.invoice;
  const listRoute = ({
    invoice: '#/billing/invoice',
    quotation: '#/billing/quotation',
    'purchase-order': '#/billing/purchase-order',
    'credit-note': '#/billing/credit-note',
    'debit-note': '#/billing/debit-note',
    proforma: '#/billing/proforma',
    'delivery-challan': '#/billing/delivery-challan',
    'e-invoice': '#/billing/e-invoice',
    'e-way-bill': '#/billing/e-way-bill',
  })[documentType] ?? '#/billing/invoice';

  useEffect(() => {
    api.getSettings().then(setBizSettings).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = documentType === 'credit-note'
          ? await api.getCreditNote(invoiceId)
          : await api.getInvoice(invoiceId);
        if (active) setInvoice(data);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load document');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [invoiceId, documentType]);

  const totals = useMemo(() => {
    if (!invoice) return null;
    return calcTotals(
      invoice.items || [],
      invoice.charges || [],
      invoice.additionalDiscount,
      invoice.tds,
      invoice.tcs,
      invoice.advanceReceived,
      config.showGst,
    );
  }, [invoice, config.showGst]);

  if (loading) {
    return (
      <div className="p-4 md:p-7">
        <div className="bg-white border border-[#dfe7f1] rounded-lg p-8 text-sm text-[#374151]">Loading...</div>
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

  const docMeta = {
    ...invoice.meta,
    number: invoice.number,
    date: invoice.meta?.date || invoice.date || invoice.createdAt,
  };

  return (
    <div className="p-4 md:p-7 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
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
          <h1 className="m-0 text-[18px] font-bold text-[#111827]">{invoice.number}</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#dbe4ef] rounded-md text-[13px] text-[#374151] bg-white hover:bg-gray-50 transition-colors">
            <Send size={13} className="text-[#94a3b8]" />
            Send
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#dbe4ef] rounded-md text-[13px] text-[#374151] bg-white hover:bg-gray-50 transition-colors">
            <Printer size={13} className="text-[#94a3b8]" />
            Print
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#dbe4ef] rounded-md text-[13px] text-[#374151] bg-white hover:bg-gray-50 transition-colors">
            <Download size={13} className="text-[#94a3b8]" />
            Download PDF
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        embedded
        config={config}
        customer={invoice.customer || {}}
        docMeta={docMeta}
        docExtra={invoice.extra || {}}
        items={invoice.items || []}
        charges={invoice.charges || []}
        totals={totals}
        notes={invoice.notes || ''}
        terms={invoice.terms || ''}
        supplyType={invoice.supplyType || 'intrastate'}
        bizSettings={bizSettings}
        shipping={invoice.shipping || {}}
        sameShipping={invoice.shipping?.sameAsBilling ?? true}
        tds={invoice.tds}
        tcs={invoice.tcs}
        advanceAmt={invoice.advanceReceived || 0}
        addDiscount={invoice.additionalDiscount}
      />
    </div>
  );
}
