import { useEffect, useRef, useState } from 'react';
import {
  Building2,
  CalendarDays,
  FileText,
  Globe2,
  Mail,
  MapPin,
  NotebookText,
  Phone,
  ReceiptText,
  Settings,
  UserRound,
  X,
} from 'lucide-react';

import { formatCurrency } from '../../../utils/formatCurrency.js';
import { numberToWords } from '../../../utils/numberToWords.js';
import { SERVER_ORIGIN } from '../../../services/api.js';

const btnOutline = 'inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-gray-700 bg-white border border-[#dbe4ef] rounded-md cursor-pointer hover:bg-gray-50 font-[inherit]';

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function lineCalc(item) {
  const gross = (Number(item.qty) || 0) * (Number(item.rate) || 0);
  const discountAmt = gross * ((Number(item.discount) || 0) / 100);
  const taxable = gross - discountAmt;
  const gstAmt = taxable * ((Number(item.gstRate) || 0) / 100);
  return { gross, discountAmt, taxable, gstAmt, total: taxable + gstAmt };
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="grid grid-cols-[18px_112px_10px_1fr] print:grid-cols-[14px_86px_8px_1fr] items-center gap-2 print:gap-1.5 text-[13px] print:text-[8.7px] text-[#102044]">
      <Icon size={15} className="text-[#36527a] print:w-3 print:h-3" strokeWidth={1.8} />
      <span className="font-medium">{label}</span>
      <span className="font-semibold">:</span>
      <span className="font-bold wrap-break-word">{value || '-'}</span>
    </div>
  );
}

function BusinessLine({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <div className="flex items-center gap-3 print:gap-2 text-[15px] print:text-[9.2px] text-[#102044] leading-snug">
      <Icon size={16} className="text-[#36527a] flex-none print:w-3 print:h-3" strokeWidth={1.8} />
      <span className="wrap-break-word">{children}</span>
    </div>
  );
}

function AddressBlock({ title, data }) {
  return (
    <div className="border border-[#d7e1ee] rounded-[4px] min-h-[10.5rem] print:min-h-[30mm] bg-white shadow-[0_10px_24px_rgba(8,37,90,0.04)]">
      <div className="px-5 py-4 print:px-3 print:py-2.5 text-[#102044]">
        <div className="flex items-center gap-3 print:gap-2 mb-5 print:mb-2.5">
          <div className="h-9 w-9 print:h-6 print:w-6 rounded-full bg-[#1464e9] text-white flex items-center justify-center flex-none">
            <UserRound size={19} className="print:w-3.5 print:h-3.5" />
          </div>
          <div className="text-[15px] print:text-[9.5px] font-extrabold uppercase tracking-wide text-[#102044] border-b-2 border-[#1464e9] pb-1">
            {title}
          </div>
        </div>
        <div className="text-[15px] print:text-[9.3px] leading-7 print:leading-[1.55]">
          <div className="text-[17px] print:text-[10px] font-extrabold text-[#0b1633] mb-1">{data?.name || '-'}</div>
          {data?.gstin && <div className="font-mono text-[13px] print:text-[8.6px]">GSTIN: {data.gstin}</div>}
          {data?.address && <div>{data.address}</div>}
          {(data?.city || data?.state || data?.pincode) && (
            <div>{[data.city, data.state, data.pincode].filter(Boolean).join(', ')}</div>
          )}
          {data?.phone && <div>Phone: {data.phone}</div>}
          {data?.email && <div>Email: {data.email}</div>}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-[14px] print:text-[9.5px] font-extrabold uppercase text-[#08255a]">
      {Icon && (
        <span className="h-6 w-6 print:h-4 print:w-4 rounded-full border border-[#b9c9df] flex items-center justify-center">
          <Icon size={14} className="print:w-2.5 print:h-2.5" />
        </span>
      )}
      <span>{children}</span>
    </div>
  );
}

export function DocumentPreviewModal({
  config, customer, docMeta, docExtra, items, charges, totals,
  notes, terms, supplyType, bizSettings, shipping, sameShipping,
  tds, tcs, advanceAmt, addDiscount, autoPrint = false, embedded = false, onClose,
  downloadAsPdf = false, invoiceNumber = '',
}) {
  const didAutoPrint = useRef(false);
  const didDownload = useRef(false);
  const [downloading, setDownloading] = useState(false);
  const showGst = Boolean(config.showGst);
  const visibleItems = items.filter((item) => item.description || Number(item.rate) > 0);
  const hasDiscount = visibleItems.some((item) => Number(item.discount) > 0);
  const hasCharges = charges.length > 0;
  const hasBankDetails = Boolean(bizSettings.bankName || bizSettings.accountNumber || bizSettings.ifscCode);
  const hasTaxSummary = showGst && Object.values(totals.gstByRate || {}).some((val) => val.taxable > 0);
  const isIntrastate = supplyType === 'intrastate';

  const secondDate = config.showDueDate
    ? { label: 'Due Date', value: fmtDate(docMeta.dueDate) }
    : config.showValidTill
      ? { label: 'Valid Till', value: fmtDate(docExtra.validTill) }
      : config.showExpectedDelivery
        ? { label: 'Expected Delivery', value: fmtDate(docExtra.expectedDelivery) }
        : null;

  const shippingData = !sameShipping && (shipping?.address || shipping?.city || shipping?.state || shipping?.pincode)
    ? { name: customer.name, ...shipping }
    : customer;

  const extraDetails = [
    { show: docMeta.poRef, label: 'PO Ref', value: docMeta.poRef },
    { show: config.showOriginalRef && docExtra.originalInvoiceNo, label: 'Original Inv No', value: docExtra.originalInvoiceNo },
    { show: config.showOriginalRef && docExtra.originalInvoiceDate, label: 'Original Inv Date', value: fmtDate(docExtra.originalInvoiceDate) },
    { show: config.reasonLabel && docExtra.reason, label: config.reasonLabel, value: docExtra.reason },
    { show: config.showDeliveryAddress && docExtra.deliveryAddress, label: 'Delivery Address', value: docExtra.deliveryAddress },
    { show: config.showTransport && docExtra.vehicleNumber, label: 'Vehicle No', value: docExtra.vehicleNumber },
    { show: config.showTransport && docExtra.transporter, label: 'Transporter', value: docExtra.transporter },
    { show: config.showIRN && docExtra.irnNumber, label: 'IRN', value: docExtra.irnNumber },
    { show: config.showIRN && docExtra.ackNumber, label: 'Ack No', value: docExtra.ackNumber },
  ].filter((d) => d.show);

  const itemColSpan = 7 + (hasDiscount ? 1 : 0) + (showGst ? (isIntrastate ? 4 : 2) : 0);

  useEffect(() => {
    if (!autoPrint) {
      didAutoPrint.current = false;
      return;
    }
    if (didAutoPrint.current) return;
    didAutoPrint.current = true;
    const timer = window.setTimeout(() => {
      window.focus();
      window.print();
    }, 600);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  useEffect(() => {
    if (!downloadAsPdf || didDownload.current) return;
    didDownload.current = true;
    const el = document.getElementById('document-preview-print');
    if (!el) return;
    setDownloading(true);
    import('html2pdf.js').then(({ default: html2pdf }) => {
      html2pdf()
        .set({
          margin: [8, 8, 8, 8],
          filename: invoiceNumber ? `Invoice-${invoiceNumber}.pdf` : 'Invoice.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(el)
        .save()
        .then(() => {
          setDownloading(false);
          if (onClose) onClose();
        });
    });
  }, [downloadAsPdf]);

  return (
    <div className={embedded ? '' : 'fixed inset-0 z-50 bg-black/50 overflow-y-auto py-8 px-4 print:bg-white print:py-0 print:px-0 print:overflow-visible print:h-auto print:bottom-auto'}>
      {downloading && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center print:hidden">
          <div className="bg-white rounded-xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl">
            <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            <span className="text-[15px] font-medium text-gray-700">Preparing PDF…</span>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto flex flex-col gap-3 print:max-w-none print:overflow-visible">
        {!embedded && (
        <div className="flex items-center justify-end gap-2 print:hidden">
          <button type="button" className={btnOutline} onClick={onClose}>
            <X size={14} /> Close
          </button>
        </div>
        )}

        <div id="document-preview-print" className="bg-white border border-[#d7e1ee] rounded-lg overflow-hidden print:overflow-visible print:border-0 print:rounded-none text-[#102044]">
          <div className="px-12 pt-12 pb-7 print:px-5 print:pt-5 print:pb-3">
            <div className="grid grid-cols-[1fr_330px] gap-10 print:grid-cols-[1fr_250px] print:gap-5 items-start">
              <div className="flex items-start gap-7 print:gap-4">
                {bizSettings.logoUrl && (
                  <img src={`${SERVER_ORIGIN}${bizSettings.logoUrl}`} alt="logo" className="w-28 h-28 print:w-16 print:h-16 object-contain flex-none" />
                )}
                <div className="pt-2 print:pt-0">
                  <div className="text-[29px] print:text-[17px] font-extrabold text-[#08255a] leading-tight mb-6 print:mb-3">{bizSettings.businessName || 'Your Business'}</div>
                  <div className="flex flex-col gap-4 print:gap-2">
                    <BusinessLine icon={Building2}>{bizSettings.gstin ? `GSTIN: ${bizSettings.gstin}` : ''}</BusinessLine>
                    <BusinessLine icon={MapPin}>{bizSettings.address}</BusinessLine>
                    <BusinessLine icon={Mail}>{bizSettings.businessEmail}</BusinessLine>
                    <BusinessLine icon={Phone}>{bizSettings.phone}</BusinessLine>
                  </div>
                </div>
              </div>

              <div className="self-start">
                <div className="text-right text-[43px] print:text-[24px] font-extrabold tracking-wide uppercase text-[#08255a] leading-none">
                  {showGst ? 'Tax Invoice' : config.title}
                </div>
                <div className="text-right text-[15px] print:text-[9.5px] font-bold uppercase tracking-wide text-[#1464e9] mt-3 print:mt-1.5 pb-5 print:pb-3 border-b border-[#d7e1ee]">
                  Original for Recipient
                </div>
                <div className="flex flex-col gap-4 print:gap-2 mt-5 print:mt-3">
                  <InfoLine icon={FileText} label="Invoice No" value={docMeta.number} />
                  <InfoLine icon={CalendarDays} label={config.dateLabel} value={fmtDate(docMeta.date)} />
                  {secondDate && <InfoLine icon={CalendarDays} label={secondDate.label} value={secondDate.value} />}
                  {showGst && <InfoLine icon={Settings} label="Supply Type" value={isIntrastate ? 'Intrastate' : 'Interstate'} />}
                  {showGst && <InfoLine icon={Globe2} label="Place Supply" value={docMeta.placeOfSupply} />}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-12 print:mx-5 border-t-2 border-[#1464e9]" />

          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-7 print:gap-3 px-12 py-7 print:px-5 print:py-3">
            <AddressBlock title={config.partyToLabel} data={customer} />
            <AddressBlock title="Ship To" data={shippingData} />
          </div>

          {extraDetails.length > 0 && (
            <div className="px-6 pb-4 print:px-3 print:pb-2">
              <div className="border border-[#cbd5e1] grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3">
                {extraDetails.map(({ label, value }) => (
                  <div key={label} className="border-b sm:border-r print:border-r border-[#e5e7eb] px-3 py-2 min-h-12">
                    <div className="text-[10px] uppercase tracking-wide font-semibold text-[#64748b]">{label}</div>
                    <div className="text-[12px] font-medium text-[#111827] wrap-break-word">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-12 pb-5 print:px-5 print:pb-2.5">
            <table className="w-full border-collapse border border-[#cfdbea] text-[12px] print:text-[8.4px]">
              <thead>
                <tr className="bg-[#08255a] text-white">
                  <th rowSpan={2} className="border border-[#cfdbea] px-1.5 py-3 print:py-2 text-center font-bold w-8">#</th>
                  <th rowSpan={2} className="border border-[#cfdbea] px-2 py-3 print:py-2 text-left font-bold">Description of Goods / Services</th>
                  {showGst && <th rowSpan={2} className="border border-[#cfdbea] px-1.5 py-3 print:py-2 text-center font-bold w-18">HSN/SAC</th>}
                  <th rowSpan={2} className="border border-[#cfdbea] px-1.5 py-3 print:py-2 text-right font-bold w-12">Qty</th>
                  <th rowSpan={2} className="border border-[#cfdbea] px-1.5 py-3 print:py-2 text-center font-bold w-12">Unit</th>
                  <th rowSpan={2} className="border border-[#cfdbea] px-1.5 py-3 print:py-2 text-right font-bold w-20">Rate</th>
                  {hasDiscount && <th rowSpan={2} className="border border-[#cfdbea] px-1.5 py-3 print:py-2 text-right font-bold w-14">Disc%</th>}
                  <th rowSpan={2} className="border border-[#cfdbea] px-1.5 py-3 print:py-2 text-right font-bold w-22">Taxable Value</th>
                  {showGst && isIntrastate && <th colSpan={2} className="border border-[#cfdbea] px-1.5 py-1 text-center font-bold">CGST</th>}
                  {showGst && isIntrastate && <th colSpan={2} className="border border-[#cfdbea] px-1.5 py-1 text-center font-bold">SGST</th>}
                  {showGst && !isIntrastate && <th colSpan={2} className="border border-[#cfdbea] px-1.5 py-1 text-center font-bold">IGST</th>}
                  <th rowSpan={2} className="border border-[#cfdbea] px-1.5 py-3 print:py-2 text-right font-bold w-24">Total</th>
                </tr>
                {showGst && (
                  <tr className="bg-[#08255a] text-white">
                    {isIntrastate ? (
                      <>
                        <th className="border border-[#cfdbea] px-1 py-1 text-right font-semibold w-12">Rate</th>
                        <th className="border border-[#cfdbea] px-1 py-1 text-right font-semibold w-18">Amt</th>
                        <th className="border border-[#cfdbea] px-1 py-1 text-right font-semibold w-12">Rate</th>
                        <th className="border border-[#cfdbea] px-1 py-1 text-right font-semibold w-18">Amt</th>
                      </>
                    ) : (
                      <>
                        <th className="border border-[#cfdbea] px-1 py-1 text-right font-semibold w-12">Rate</th>
                        <th className="border border-[#cfdbea] px-1 py-1 text-right font-semibold w-20">Amt</th>
                      </>
                    )}
                  </tr>
                )}
              </thead>
              <tbody>
                {visibleItems.map((item, i) => {
                  const line = lineCalc(item);
                  const gstRate = Number(item.gstRate) || 0;
                  return (
                    <tr key={item.id ?? i}>
                      <td className="border border-[#0f172a] px-1.5 py-2 text-center align-top">{i + 1}</td>
                      <td className="border border-[#0f172a] px-2 py-2 align-top font-medium">{item.description || '-'}</td>
                      {showGst && <td className="border border-[#0f172a] px-1.5 py-2 text-center align-top font-mono">{item.hsn || '-'}</td>}
                      <td className="border border-[#0f172a] px-1.5 py-2 text-right align-top">{Number(item.qty) || 0}</td>
                      <td className="border border-[#0f172a] px-1.5 py-2 text-center align-top">{item.unit || '-'}</td>
                      <td className="border border-[#0f172a] px-1.5 py-2 text-right align-top">{formatCurrency(Number(item.rate) || 0)}</td>
                      {hasDiscount && <td className="border border-[#0f172a] px-1.5 py-2 text-right align-top">{Number(item.discount) ? `${item.discount}%` : '-'}</td>}
                      <td className="border border-[#0f172a] px-1.5 py-2 text-right align-top">{formatCurrency(line.taxable)}</td>
                      {showGst && isIntrastate && (
                        <>
                          <td className="border border-[#0f172a] px-1 py-2 text-right align-top">{gstRate / 2}%</td>
                          <td className="border border-[#0f172a] px-1 py-2 text-right align-top">{formatCurrency(line.gstAmt / 2)}</td>
                          <td className="border border-[#0f172a] px-1 py-2 text-right align-top">{gstRate / 2}%</td>
                          <td className="border border-[#0f172a] px-1 py-2 text-right align-top">{formatCurrency(line.gstAmt / 2)}</td>
                        </>
                      )}
                      {showGst && !isIntrastate && (
                        <>
                          <td className="border border-[#0f172a] px-1 py-2 text-right align-top">{gstRate}%</td>
                          <td className="border border-[#0f172a] px-1 py-2 text-right align-top">{formatCurrency(line.gstAmt)}</td>
                        </>
                      )}
                      <td className="border border-[#0f172a] px-1.5 py-2 text-right align-top font-bold">{formatCurrency(showGst ? line.total : line.taxable)}</td>
                    </tr>
                  );
                })}

                {hasCharges && charges.map((charge, i) => {
                  const amount = Number(charge.amount) || 0;
                  const gstRate = Number(charge.gstRate) || 0;
                  const gst = amount * (gstRate / 100);
                  return (
                    <tr key={charge.id ?? `charge-${i}`}>
                      <td className="border border-[#0f172a] px-1.5 py-2 text-center align-top">-</td>
                      <td className="border border-[#0f172a] px-2 py-2 align-top italic">{charge.label || 'Additional Charge'}</td>
                      {showGst && <td className="border border-[#0f172a] px-1.5 py-2 text-center">-</td>}
                      <td className="border border-[#0f172a] px-1.5 py-2" />
                      <td className="border border-[#0f172a] px-1.5 py-2" />
                      <td className="border border-[#0f172a] px-1.5 py-2" />
                      {hasDiscount && <td className="border border-[#0f172a] px-1.5 py-2" />}
                      <td className="border border-[#0f172a] px-1.5 py-2 text-right">{formatCurrency(amount)}</td>
                      {showGst && isIntrastate && (
                        <>
                          <td className="border border-[#0f172a] px-1 py-2 text-right">{gstRate / 2}%</td>
                          <td className="border border-[#0f172a] px-1 py-2 text-right">{formatCurrency(gst / 2)}</td>
                          <td className="border border-[#0f172a] px-1 py-2 text-right">{gstRate / 2}%</td>
                          <td className="border border-[#0f172a] px-1 py-2 text-right">{formatCurrency(gst / 2)}</td>
                        </>
                      )}
                      {showGst && !isIntrastate && (
                        <>
                          <td className="border border-[#0f172a] px-1 py-2 text-right">{gstRate}%</td>
                          <td className="border border-[#0f172a] px-1 py-2 text-right">{formatCurrency(gst)}</td>
                        </>
                      )}
                      <td className="border border-[#0f172a] px-1.5 py-2 text-right font-bold">{formatCurrency(amount + (showGst ? gst : 0))}</td>
                    </tr>
                  );
                })}

                {visibleItems.length === 0 && !hasCharges && (
                  <tr>
                    <td className="border border-[#0f172a] px-2 py-5 text-center text-[#64748b]" colSpan={itemColSpan}>No items added</td>
                  </tr>
                )}
                {visibleItems.length > 0 && Array.from({ length: Math.max(0, 6 - visibleItems.length - charges.length) }).map((_, rowIndex) => (
                  <tr key={`print-filler-${rowIndex}`} className="text-[#cfdbea]" style={{ height: '13mm' }}>
                    {Array.from({ length: itemColSpan }).map((__, colIndex) => (
                      <td key={colIndex} className="border border-[#0f172a] px-1 py-1">&nbsp;</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] print:grid-cols-[1fr_290px] gap-5 print:gap-3 px-12 pb-5 print:px-5 print:pb-2.5">
            <div className="flex flex-col gap-4 print:gap-2">
              {hasTaxSummary && (
                <div>
                  <div className="text-[17px] print:text-[10px] font-extrabold uppercase tracking-wide text-[#1464e9] mb-2">Tax Summary</div>
                  <table className="w-full border-collapse border border-[#cfdbea] text-[12px] print:text-[8.5px]">
                    <thead>
                      <tr className="bg-[#f8fafc]">
                        <th className="border border-[#cfdbea] px-3 py-2 print:px-2 print:py-1.5 text-left">GST Rate</th>
                        <th className="border border-[#cfdbea] px-3 py-2 print:px-2 print:py-1.5 text-right">Taxable</th>
                        {supplyType === 'intrastate' ? (
                          <>
                            <th className="border border-[#cfdbea] px-3 py-2 print:px-2 print:py-1.5 text-right">CGST</th>
                            <th className="border border-[#cfdbea] px-3 py-2 print:px-2 print:py-1.5 text-right">SGST</th>
                          </>
                        ) : (
                          <th className="border border-[#cfdbea] px-3 py-2 print:px-2 print:py-1.5 text-right">IGST</th>
                        )}
                        <th className="border border-[#cfdbea] px-3 py-2 print:px-2 print:py-1.5 text-right">Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(totals.gstByRate).filter(([, val]) => val.taxable > 0).map(([rate, val]) => (
                        <tr key={rate}>
                          <td className="border border-[#cfdbea] px-3 py-2 print:px-2 print:py-1.5">{rate}%</td>
                          <td className="border border-[#cfdbea] px-3 py-2 print:px-2 print:py-1.5 text-right">{formatCurrency(val.taxable)}</td>
                          {supplyType === 'intrastate' ? (
                            <>
                              <td className="border border-[#cfdbea] px-3 py-2 print:px-2 print:py-1.5 text-right">{formatCurrency(val.gst / 2)}</td>
                              <td className="border border-[#cfdbea] px-3 py-2 print:px-2 print:py-1.5 text-right">{formatCurrency(val.gst / 2)}</td>
                            </>
                          ) : (
                            <td className="border border-[#cfdbea] px-3 py-2 print:px-2 print:py-1.5 text-right">{formatCurrency(val.gst)}</td>
                          )}
                          <td className="border border-[#cfdbea] px-3 py-2 print:px-2 print:py-1.5 text-right font-bold">{formatCurrency(val.gst)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border border-[#cfdbea] rounded-[4px] overflow-hidden">
                <div className="bg-[#f8fafc] border-b border-[#cfdbea] px-4 py-2.5 print:px-2 print:py-1.5 text-[17px] print:text-[9.5px] font-extrabold uppercase tracking-wide text-[#1464e9]">
                  Amount in Words
                </div>
                <div className="px-4 py-3 print:px-2 print:py-1.5 text-[14px] print:text-[8.8px] font-bold text-[#102044] italic">
                  {numberToWords(totals.finalTotal)}
                </div>
              </div>
            </div>

            <table className="w-full border-collapse border border-[#cfdbea] text-[14px] print:text-[9px] self-start rounded-[4px] overflow-hidden">
              <tbody>
                <tr>
                  <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 font-semibold">Subtotal</td>
                  <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 text-right">{formatCurrency(totals.subtotal)}</td>
                </tr>
                {totals.discount > 0 && (
                  <tr>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 font-semibold">Item Discount</td>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 text-right">- {formatCurrency(totals.discount)}</td>
                  </tr>
                )}
                {totals.chargesSubtotal > 0 && (
                  <tr>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 font-semibold">Additional Charges</td>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 text-right">{formatCurrency(totals.chargesSubtotal)}</td>
                  </tr>
                )}
                {showGst && (totals.totalGst + totals.chargesGst) > 0 && (
                  <tr>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 font-semibold">GST</td>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 text-right">{formatCurrency(totals.totalGst + totals.chargesGst)}</td>
                  </tr>
                )}
                {totals.addDiscAmt > 0 && (
                  <tr>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 font-semibold">Discount{addDiscount?.type === 'percent' && addDiscount.value ? ` (${addDiscount.value}%)` : ''}</td>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 text-right">- {formatCurrency(totals.addDiscAmt)}</td>
                  </tr>
                )}
                {tds?.enabled && totals.tdsAmt > 0 && (
                  <tr>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 font-semibold">TDS ({tds.rate}%)</td>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 text-right">- {formatCurrency(totals.tdsAmt)}</td>
                  </tr>
                )}
                {tcs?.enabled && totals.tcsAmt > 0 && (
                  <tr>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 font-semibold">TCS ({tcs.rate}%)</td>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 text-right">+ {formatCurrency(totals.tcsAmt)}</td>
                  </tr>
                )}
                {Math.abs(totals.roundOff) >= 0.01 && (
                  <tr>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 font-semibold">Round Off</td>
                    <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 text-right">{totals.roundOff > 0 ? '+' : ''}{formatCurrency(totals.roundOff)}</td>
                  </tr>
                )}
                <tr className="bg-[#08255a] text-white">
                  <td className="border border-[#08255a] px-4 py-4 print:px-2 print:py-2 text-[19px] print:text-[11px] uppercase tracking-wide font-extrabold">Grand Total</td>
                  <td className="border border-[#08255a] px-4 py-4 print:px-2 print:py-2 text-right text-[25px] print:text-[14px] font-extrabold">{formatCurrency(totals.finalTotal)}</td>
                </tr>
                {Number(advanceAmt) > 0 && (
                  <>
                    <tr>
                      <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 font-semibold">Advance Received</td>
                      <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 text-right">- {formatCurrency(Number(advanceAmt))}</td>
                    </tr>
                    <tr>
                      <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 font-bold">Balance Due</td>
                      <td className="border border-[#cfdbea] px-4 py-3 print:px-2 print:py-1.5 text-right font-bold">{formatCurrency(totals.balanceDue < 0 ? 0 : totals.balanceDue)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-12 pb-5 print:px-5 print:pb-2.5">
            {(notes || terms) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-5 print:gap-3">
                <div className="border border-[#d7e1ee] rounded-[4px] px-4 py-4 print:px-2.5 print:py-2 min-h-36 print:min-h-[25mm]">
                  <SectionLabel icon={NotebookText}>Notes</SectionLabel>
                  <div className="mt-4 print:mt-2 text-[13px] print:text-[8.4px] whitespace-pre-wrap text-[#102044] leading-6 print:leading-[1.55]">
                    {notes || '-'}
                  </div>
                </div>
                <div className="border border-[#d7e1ee] rounded-[4px] px-4 py-4 print:px-2.5 print:py-2 min-h-36 print:min-h-[25mm]">
                  <SectionLabel icon={ReceiptText}>Terms & Conditions</SectionLabel>
                  <div className="mt-4 print:mt-2 text-[12px] print:text-[8px] whitespace-pre-wrap text-[#102044] leading-6 print:leading-[1.5]">
                    {terms || '-'}
                  </div>
                </div>
                <div className="border border-[#d7e1ee] rounded-[4px] min-h-36 print:min-h-[25mm] flex flex-col justify-end text-center px-6 py-5 print:px-3 print:py-2.5">
                  <div className="text-[13px] print:text-[8.5px] text-[#36527a] mb-14 print:mb-8">For {bizSettings.businessName || 'Your Business'}</div>
                  <div className="border-t-2 border-[#102044] pt-3 print:pt-1.5 text-[13px] print:text-[8.5px] font-extrabold text-[#0b1633]">Authorised Signatory</div>
                </div>
              </div>
            )}
          </div>

          {hasBankDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] print:grid-cols-[1fr_230px] gap-4 print:gap-3 px-12 pb-5 print:px-5 print:pb-2">
            <div className="flex flex-col gap-4">
                <div className="border border-[#cbd5e1]">
                  <div className="bg-[#f8fafc] border-b border-[#cbd5e1] px-3 py-2 print:px-2 print:py-1 text-[12px] print:text-[9px] font-bold uppercase tracking-wide text-[#0f172a]">
                    Bank Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 text-[12px] print:text-[8.5px]">
                    {[
                      ['Bank Name', bizSettings.bankName],
                      ['Account Holder', bizSettings.accountHolderName],
                      ['Account No', bizSettings.accountNumber],
                      ['IFSC Code', bizSettings.ifscCode],
                      ['Branch', bizSettings.bankBranch],
                      ['Account Type', bizSettings.accountType],
                    ].filter(([, value]) => value).map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[105px_1fr] border-b border-r border-[#e5e7eb]">
                        <span className="bg-[#f8fafc] px-2 py-1.5 print:px-1 print:py-1 text-[#64748b]">{label}</span>
                        <span className="px-2 py-1.5 print:px-1 print:py-1 font-medium wrap-break-word">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
            </div>

            <div />
          </div>
          )}

          <div className="mx-12 print:mx-5 border-t-2 border-[#1464e9]" />
          <div className="px-12 py-4 print:px-5 print:py-2 flex items-center justify-between gap-3 text-[13px] print:text-[8.3px] text-[#6b83a7]">
            <span className="inline-flex items-center gap-2"><Globe2 size={16} className="print:w-3 print:h-3" /> Generated by GoBook</span>
            {showGst && docMeta.rcm && <span className="font-semibold text-[#92400e]">Reverse Charge Applicable</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
