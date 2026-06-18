import { Printer, X } from 'lucide-react';

import { formatCurrency } from '../../../utils/formatCurrency.js';
import { numberToWords } from '../../../utils/numberToWords.js';
import { SERVER_ORIGIN } from '../../../services/api.js';

const btnOutline = 'inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-gray-700 bg-white border border-[#dbe4ef] rounded-md cursor-pointer hover:bg-gray-50 font-[inherit]';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white bg-blue-600 border border-blue-600 rounded-md cursor-pointer hover:bg-blue-700 font-[inherit]';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function lineCalc(item) {
  const gross       = (item.qty ?? 0) * (item.rate ?? 0);
  const discountAmt = gross * ((item.discount ?? 0) / 100);
  const taxable     = gross - discountAmt;
  const gstAmt      = taxable * ((item.gstRate ?? 0) / 100);
  return { gross, discountAmt, taxable, gstAmt, total: taxable + gstAmt };
}

export function DocumentPreviewModal({
  config, customer, docMeta, docExtra, items, charges, totals,
  notes, terms, supplyType, bizSettings, shipping, sameShipping,
  tds, tcs, advanceAmt, addDiscount, onClose,
}) {
  const showGst = Boolean(config.showGst);

  const secondDate = config.showDueDate
    ? { label: 'Due Date', value: fmtDate(docMeta.dueDate) }
    : config.showValidTill
      ? { label: 'Valid Till', value: fmtDate(docExtra.validTill) }
      : config.showExpectedDelivery
        ? { label: 'Expected Delivery', value: fmtDate(docExtra.expectedDelivery) }
        : null;

  const extraDetails = [
    { show: docMeta.poRef, label: 'PO Reference', value: docMeta.poRef },
    { show: config.showOriginalRef && docExtra.originalInvoiceNo, label: 'Original Invoice No.', value: docExtra.originalInvoiceNo },
    { show: config.showOriginalRef && docExtra.originalInvoiceDate, label: 'Original Invoice Date', value: fmtDate(docExtra.originalInvoiceDate) },
    { show: config.reasonLabel && docExtra.reason, label: config.reasonLabel, value: docExtra.reason },
    { show: config.showDeliveryAddress && docExtra.deliveryAddress, label: 'Delivery Address', value: docExtra.deliveryAddress },
    { show: config.showTransport && docExtra.vehicleNumber, label: 'Vehicle Number', value: docExtra.vehicleNumber },
    { show: config.showTransport && docExtra.transporter, label: 'Transporter', value: docExtra.transporter },
    { show: config.showIRN && docExtra.irnNumber, label: 'IRN', value: docExtra.irnNumber },
    { show: config.showIRN && docExtra.ackNumber, label: 'Ack No.', value: docExtra.ackNumber },
  ].filter((d) => d.show);

  const hasDiscount = items.some((item) => Number(item.discount) > 0);
  const colCount = 4 + (showGst ? 2 : 0) + (hasDiscount ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto py-8 px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-4xl mx-auto flex flex-col gap-3 print:max-w-none">

        {/* Action bar */}
        <div className="flex items-center justify-end gap-2 print:hidden">
          <button type="button" className={btnOutline} onClick={onClose}>
            <X size={14} /> Close
          </button>
          <button type="button" className={btnPrimary} onClick={() => window.print()}>
            <Printer size={14} /> Print / Save as PDF
          </button>
        </div>

        {/* Document */}
        <div id="document-preview-print" className="bg-white border border-[#dfe7f1] rounded-lg overflow-hidden print:border-0 print:rounded-none">

          {/* Header band */}
          <div className="bg-[#1e40af] px-4 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 print:flex-row print:items-start print:justify-between print:px-8">
            <div className="flex items-start gap-4">
              {bizSettings.logoUrl && (
                <img src={`${SERVER_ORIGIN}${bizSettings.logoUrl}`} alt="logo" className="w-14 h-14 rounded-lg object-contain bg-white p-1 flex-none" />
              )}
              <div>
                <div className="text-white font-bold text-xl mb-0.5">{bizSettings.businessName || 'Your Business'}</div>
                {bizSettings.gstin && <div className="text-blue-200 text-[13px]">GSTIN: {bizSettings.gstin}</div>}
                {bizSettings.address && <div className="text-blue-200 text-[13px]">{bizSettings.address}</div>}
                {(bizSettings.businessEmail || bizSettings.phone) && (
                  <div className="text-blue-200 text-[13px]">{[bizSettings.businessEmail, bizSettings.phone].filter(Boolean).join(' · ')}</div>
                )}
              </div>
            </div>
            <div className="sm:text-right print:text-right">
              <div className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-1">{config.title}</div>
              <div className="text-white font-bold text-2xl">{docMeta.number}</div>
            </div>
          </div>

          {/* Bill To / Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-4 sm:px-8 py-6 border-b border-[#edf2f7] print:grid-cols-3 print:px-8">
            <div className="sm:col-span-2 print:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-2">{config.partyToLabel}</div>
              <div className="text-[15px] font-bold text-[#111827] mb-1">{customer.name || '—'}</div>
              {customer.gstin && <div className="text-[12px] text-[#536173] font-mono mb-0.5">GSTIN: {customer.gstin}</div>}
              {customer.address && <div className="text-[13px] text-[#374151]">{customer.address}</div>}
              {(customer.city || customer.state || customer.pincode) && (
                <div className="text-[13px] text-[#374151]">{[customer.city, customer.state, customer.pincode].filter(Boolean).join(', ')}</div>
              )}
              {customer.phone && <div className="text-[13px] text-[#536173] mt-1">{customer.phone}</div>}
              {customer.email && <div className="text-[13px] text-[#536173]">{customer.email}</div>}

              {!sameShipping && (shipping?.address || shipping?.city) && (
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-1">Ship To</div>
                  {shipping.address && <div className="text-[13px] text-[#374151]">{shipping.address}</div>}
                  <div className="text-[13px] text-[#374151]">{[shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(', ')}</div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-0.5">{config.dateLabel}</div>
                <div className="text-[13px] font-medium text-[#111827]">{fmtDate(docMeta.date)}</div>
              </div>
              {secondDate && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-0.5">{secondDate.label}</div>
                  <div className="text-[13px] font-medium text-[#111827]">{secondDate.value}</div>
                </div>
              )}
              {showGst && docMeta.placeOfSupply && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-0.5">Place of Supply</div>
                  <div className="text-[13px] font-medium text-[#111827]">{docMeta.placeOfSupply}</div>
                </div>
              )}
              {showGst && docMeta.rcm && (
                <span className="inline-flex items-center self-start px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700">
                  Reverse Charge Applicable
                </span>
              )}
            </div>
          </div>

          {/* Additional details */}
          {extraDetails.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2 px-4 sm:px-8 py-4 border-b border-[#edf2f7] print:grid-cols-3 print:px-8">
              {extraDetails.map(({ label, value }) => (
                <div key={label} className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 print:flex-row print:gap-2">
                  <span className="text-[12px] text-[#94a3b8] sm:flex-none print:flex-none">{label}:</span>
                  <span className="text-[12px] font-medium text-[#111827] wrap-break-word">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Items table */}
          <div className="px-4 sm:px-8 py-6 border-b border-[#edf2f7] print:px-8">
            <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[#edf2f7]">
                  <th className="text-left text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">#</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">Description</th>
                  {showGst && <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">HSN</th>}
                  <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">Qty</th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">Rate</th>
                  {hasDiscount && <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">Disc%</th>}
                  {showGst && <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">GST%</th>}
                  <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.filter((item) => item.description || Number(item.rate) > 0).map((item, i) => {
                  const line = lineCalc(item);
                  return (
                    <tr key={item.id ?? i} className="border-b border-[#f8fafc]">
                      <td className="py-3 pr-4 text-[13px] text-[#94a3b8]">{i + 1}</td>
                      <td className="py-3 pr-4">
                        <div className="text-[13px] font-medium text-[#111827]">{item.description || '—'}</div>
                        {item.unit && <div className="text-[11px] text-[#94a3b8]">{item.unit}</div>}
                      </td>
                      {showGst && <td className="py-3 pr-4 text-right text-[12px] text-[#536173] font-mono">{item.hsn || '—'}</td>}
                      <td className="py-3 pr-4 text-right text-[13px] text-[#374151]">{item.qty ?? 0}</td>
                      <td className="py-3 pr-4 text-right text-[13px] text-[#374151]">{formatCurrency(item.rate ?? 0)}</td>
                      {hasDiscount && <td className="py-3 pr-4 text-right text-[13px] text-[#536173]">{item.discount ? `${item.discount}%` : '—'}</td>}
                      {showGst && <td className="py-3 pr-4 text-right text-[13px] text-[#536173]">{item.gstRate ?? 0}%</td>}
                      <td className="py-3 text-right text-[13px] font-medium text-[#111827]">{formatCurrency(line.taxable)}</td>
                    </tr>
                  );
                })}

                {charges.map((c, i) => (
                  <tr key={c.id ?? `charge-${i}`} className="border-b border-[#f8fafc]">
                    <td className="py-2 pr-4 text-[13px] text-[#94a3b8]">—</td>
                    <td className="py-2 pr-4 text-[13px] text-[#536173] italic">{c.label || 'Additional Charge'}</td>
                    {showGst && <td className="py-2 pr-4" />}
                    <td className="py-2 pr-4" />
                    <td className="py-2 pr-4" />
                    {hasDiscount && <td className="py-2 pr-4" />}
                    {showGst && <td className="py-2 pr-4 text-right text-[13px] text-[#536173]">{c.gstRate ?? 0}%</td>}
                    <td className="py-2 text-right text-[13px] text-[#374151]">{formatCurrency(Number(c.amount) || 0)}</td>
                  </tr>
                ))}

                {items.filter((item) => item.description || Number(item.rate) > 0).length === 0 && charges.length === 0 && (
                  <tr>
                    <td className="py-4 text-center text-[13px] text-[#94a3b8]" colSpan={colCount}>No items added yet</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* GST tax summary */}
          {showGst && Object.keys(totals.gstByRate || {}).length > 0 && (
            <div className="px-4 sm:px-8 py-6 border-b border-[#edf2f7] print:px-8">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-3">Tax Summary</div>
              <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#edf2f7]">
                    <th className="text-left text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">GST Rate</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">Taxable Value</th>
                    {supplyType === 'intrastate' ? (
                      <>
                        <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">CGST</th>
                        <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">SGST</th>
                      </>
                    ) : (
                      <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2 pr-4">IGST</th>
                    )}
                    <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] py-2">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(totals.gstByRate).filter(([, val]) => val.taxable > 0).map(([rate, val]) => (
                    <tr key={rate} className="border-b border-[#f8fafc]">
                      <td className="py-2 pr-4 text-[13px] text-[#374151]">{rate}%</td>
                      <td className="py-2 pr-4 text-right text-[13px] text-[#374151]">{formatCurrency(val.taxable)}</td>
                      {supplyType === 'intrastate' ? (
                        <>
                          <td className="py-2 pr-4 text-right text-[13px] text-[#374151]">{formatCurrency(val.gst / 2)}</td>
                          <td className="py-2 pr-4 text-right text-[13px] text-[#374151]">{formatCurrency(val.gst / 2)}</td>
                        </>
                      ) : (
                        <td className="py-2 pr-4 text-right text-[13px] text-[#374151]">{formatCurrency(val.gst)}</td>
                      )}
                      <td className="py-2 text-right text-[13px] font-medium text-[#111827]">{formatCurrency(val.gst)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end px-4 sm:px-8 py-6 border-b border-[#edf2f7] print:px-8">
            <div className="w-full sm:w-72 print:w-72 flex flex-col gap-2">
              <div className="flex justify-between text-[13px] text-[#536173]">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between text-[13px] text-red-600">
                  <span>Item Discount</span>
                  <span>− {formatCurrency(totals.discount)}</span>
                </div>
              )}

              {totals.chargesSubtotal > 0 && (
                <div className="flex justify-between text-[13px] text-[#536173]">
                  <span>Additional Charges</span>
                  <span>{formatCurrency(totals.chargesSubtotal)}</span>
                </div>
              )}

              {showGst && (totals.totalGst + totals.chargesGst) > 0 && (
                <div className="flex justify-between text-[13px] text-[#536173]">
                  <span>GST</span>
                  <span>{formatCurrency(totals.totalGst + totals.chargesGst)}</span>
                </div>
              )}

              {totals.addDiscAmt > 0 && (
                <div className="flex justify-between text-[13px] text-red-600">
                  <span>Discount{addDiscount?.type === 'percent' && addDiscount.value ? ` (${addDiscount.value}%)` : ''}</span>
                  <span>− {formatCurrency(totals.addDiscAmt)}</span>
                </div>
              )}

              {tds?.enabled && totals.tdsAmt > 0 && (
                <div className="flex justify-between text-[13px] text-orange-600">
                  <span>TDS ({tds.rate}%)</span>
                  <span>− {formatCurrency(totals.tdsAmt)}</span>
                </div>
              )}

              {tcs?.enabled && totals.tcsAmt > 0 && (
                <div className="flex justify-between text-[13px] text-[#536173]">
                  <span>TCS ({tcs.rate}%)</span>
                  <span>+ {formatCurrency(totals.tcsAmt)}</span>
                </div>
              )}

              {Math.abs(totals.roundOff) >= 0.01 && (
                <div className="flex justify-between text-[13px] text-[#536173]">
                  <span>Round Off</span>
                  <span>{totals.roundOff > 0 ? '+' : ''}{formatCurrency(totals.roundOff)}</span>
                </div>
              )}

              <div className="border-t border-[#edf2f7] my-1" />

              <div className="flex justify-between text-[15px] font-bold text-[#111827]">
                <span>Total</span>
                <span>{formatCurrency(totals.finalTotal)}</span>
              </div>

              {Number(advanceAmt) > 0 && (
                <>
                  <div className="flex justify-between text-[13px] text-green-700">
                    <span>Advance Received</span>
                    <span>− {formatCurrency(Number(advanceAmt))}</span>
                  </div>
                  <div className="flex justify-between text-[14px] font-bold text-blue-700">
                    <span>Balance Due</span>
                    <span>{formatCurrency(totals.balanceDue < 0 ? 0 : totals.balanceDue)}</span>
                  </div>
                </>
              )}

              <div className="text-[11px] text-[#536173] italic mt-1 leading-relaxed">
                {numberToWords(totals.finalTotal)}
              </div>
            </div>
          </div>

          {/* Bank details */}
          {showGst && (bizSettings.bankName || bizSettings.accountNumber || bizSettings.ifscCode) && (
            <div className="px-4 sm:px-8 py-6 border-b border-[#edf2f7] print:px-8">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-3">Bank Details</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-1.5 print:grid-cols-3">
                {[
                  { label: 'Bank Name',           value: bizSettings.bankName },
                  { label: 'Account Holder Name', value: bizSettings.accountHolderName },
                  { label: 'Account Number',      value: bizSettings.accountNumber },
                  { label: 'IFSC Code',           value: bizSettings.ifscCode },
                  { label: 'Branch',              value: bizSettings.bankBranch },
                  { label: 'Account Type',        value: bizSettings.accountType },
                ].filter(({ value }) => value).map(({ label, value }) => (
                  <div key={label} className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 print:flex-row print:gap-2">
                    <span className="text-[12px] text-[#94a3b8] sm:w-36 sm:flex-none print:w-36 print:flex-none">{label}:</span>
                    <span className="text-[12px] font-medium text-[#111827] wrap-break-word">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes / Terms */}
          {(notes || terms) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 sm:px-8 py-6 print:grid-cols-2 print:px-8">
              {notes && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-2">Notes</div>
                  <p className="text-[13px] text-[#374151] m-0 whitespace-pre-wrap">{notes}</p>
                </div>
              )}
              {terms && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8] mb-2">Terms &amp; Conditions</div>
                  <p className="text-[13px] text-[#374151] m-0 whitespace-pre-wrap">{terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 sm:px-8 py-4 bg-[#f8fafc] border-t border-[#edf2f7] flex items-center justify-between flex-wrap gap-2 print:px-8 print:flex-nowrap">
            <span className="text-[12px] text-[#94a3b8]">Generated by GoBook · {fmtDate(docMeta.date)}</span>
            {showGst && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                supplyType === 'intrastate' ? 'bg-purple-50 text-purple-700' : 'bg-cyan-50 text-cyan-700'
              }`}>
                {supplyType === 'intrastate' ? 'Intrastate' : 'Interstate'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
