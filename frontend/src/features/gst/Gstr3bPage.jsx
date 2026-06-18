import { useEffect, useState } from 'react';

import { gstService } from '../../services/gstService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

const PERIODS = ['May 2026', 'April 2026', 'March 2026', 'February 2026', 'January 2026'];

// Row structure (keys/labels) for the GSTR-3B form sections — values start at zero
// until populated from real backend data for the selected period.
const EMPTY_OUTWARD = [
  { key: 'a', label: 'Outward taxable supplies (other than zero rated, nil rated and exempted)', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
  { key: 'b', label: 'Outward taxable supplies (zero rated)',                                    taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
  { key: 'c', label: 'Other outward supplies (nil rated, exempted)',                             taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
  { key: 'd', label: 'Inward supplies liable to reverse charge',                                 taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
  { key: 'e', label: 'Non-GST outward supplies',                                                 taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
];

const EMPTY_ITC_AVAILABLE = [
  { key: 'A(1)', label: 'Import of goods',                       cgst: 0, sgst: 0, igst: 0, cess: 0 },
  { key: 'A(2)', label: 'Import of services',                    cgst: 0, sgst: 0, igst: 0, cess: 0 },
  { key: 'A(3)', label: 'Inward supplies from ISD',              cgst: 0, sgst: 0, igst: 0, cess: 0 },
  { key: 'A(5)', label: 'All other ITC (incl. from GSTR-2B)',    cgst: 0, sgst: 0, igst: 0, cess: 0 },
];

const EMPTY_ITC_REVERSED = [
  { key: 'B(1)', label: 'As per Rule 42 & 43 of CGST Rules', cgst: 0, sgst: 0, igst: 0, cess: 0 },
  { key: 'B(2)', label: 'Other reversals',                    cgst: 0, sgst: 0, igst: 0, cess: 0 },
];

const SECTIONS = [
  { id: '3.1', label: '3.1 Outward Supplies' },
  { id: '3.2', label: '3.2 Inter-state Supplies' },
  { id: '4',   label: '4. Eligible ITC' },
  { id: '5',   label: '5. Exempt Supplies' },
  { id: '5.1', label: '5.1 Interest & Late Fee' },
  { id: '6',   label: '6. Tax Payment' },
];

const TH_R = 'text-right text-xs font-semibold uppercase tracking-wide text-[#536173] px-4 py-3 border-b border-[#edf2f7]';
const TH_L = 'text-left text-xs font-semibold uppercase tracking-wide text-[#536173] px-5 py-3 border-b border-[#edf2f7]';
const TD_R = 'px-4 py-3.5 border-b border-[#f3f4f6] text-[13px] text-right font-mono';
const TD_L = 'px-5 py-3.5 border-b border-[#f3f4f6] text-[13px]';

function sum(arr, field) { return arr.reduce((a, r) => a + (r[field] ?? 0), 0); }

function TaxTableHeader() {
  return (
    <thead>
      <tr className="bg-[#f8fafc]">
        <th className={TH_L}>Nature / Description</th>
        <th className={TH_R}>Taxable Value (₹)</th>
        <th className={TH_R}>CGST (₹)</th>
        <th className={TH_R}>SGST / UTGST (₹)</th>
        <th className={TH_R}>IGST (₹)</th>
        <th className={TH_R}>Cess (₹)</th>
      </tr>
    </thead>
  );
}

export function Gstr3bPage() {
  const [period, setPeriod]               = useState('May 2026');
  const [activeSection, setActiveSection] = useState('3.1');

  const [outwardRows,  setOutwardRows]  = useState(EMPTY_OUTWARD);
  const [itcAvailable, setItcAvailable] = useState(EMPTY_ITC_AVAILABLE);
  const [itcReversed,  setItcReversed]  = useState(EMPTY_ITC_REVERSED);
  const [lateFeeCgst,  setLateFeeCgst]  = useState('');
  const [lateFeeSgst,  setLateFeeSgst]  = useState('');
  const [status, setStatus]             = useState('draft');

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [filing,  setFiling]  = useState(false);
  const [toast,   setToast]   = useState(null);

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    setLoading(true);
    gstService.getGstr3b(period)
      .then((data) => {
        if (data) {
          setOutwardRows(data.outwardRows?.length  ? data.outwardRows  : EMPTY_OUTWARD);
          setItcAvailable(data.itcAvailable?.length ? data.itcAvailable : EMPTY_ITC_AVAILABLE);
          setItcReversed(data.itcReversed?.length  ? data.itcReversed  : EMPTY_ITC_REVERSED);
          setLateFeeCgst(data.lateFeeCgst ? String(data.lateFeeCgst) : '');
          setLateFeeSgst(data.lateFeeSgst ? String(data.lateFeeSgst) : '');
          setStatus(data.status ?? 'draft');
        } else {
          setOutwardRows(EMPTY_OUTWARD);
          setItcAvailable(EMPTY_ITC_AVAILABLE);
          setItcReversed(EMPTY_ITC_REVERSED);
          setLateFeeCgst('');
          setLateFeeSgst('');
          setStatus('draft');
        }
      })
      .catch(() => showToast('Failed to load data', false))
      .finally(() => setLoading(false));
  }, [period]);

  async function handleSaveDraft() {
    setSaving(true);
    try {
      await gstService.saveGstr3b({
        period, status: 'draft',
        outwardRows, itcAvailable, itcReversed,
        lateFeeCgst: Number(lateFeeCgst) || 0,
        lateFeeSgst: Number(lateFeeSgst) || 0,
      });
      setStatus('draft');
      showToast('Draft saved successfully');
    } catch {
      showToast('Failed to save draft', false);
    } finally {
      setSaving(false);
    }
  }

  async function handleFile() {
    setFiling(true);
    try {
      const data = await gstService.fileGstr3b(period);
      setStatus('filed');
      showToast(`GSTR-3B filed! ARN: ${data.arn}`);
    } catch {
      showToast('Failed to file GSTR-3B', false);
    } finally {
      setFiling(false);
    }
  }

  const outwardTotals = { taxable: sum(outwardRows,'taxable'), cgst: sum(outwardRows,'cgst'), sgst: sum(outwardRows,'sgst'), igst: sum(outwardRows,'igst'), cess: sum(outwardRows,'cess') };
  const itcAvailTotals = { cgst: sum(itcAvailable,'cgst'), sgst: sum(itcAvailable,'sgst'), igst: sum(itcAvailable,'igst'), cess: sum(itcAvailable,'cess') };
  const itcRevTotals   = { cgst: sum(itcReversed,'cgst'),  sgst: sum(itcReversed,'sgst'),  igst: sum(itcReversed,'igst'),  cess: sum(itcReversed,'cess') };
  const netItc = {
    cgst: itcAvailTotals.cgst - itcRevTotals.cgst,
    sgst: itcAvailTotals.sgst - itcRevTotals.sgst,
    igst: itcAvailTotals.igst - itcRevTotals.igst,
    cess: itcAvailTotals.cess - itcRevTotals.cess,
  };
  const taxPayable = { cgst: outwardTotals.cgst, sgst: outwardTotals.sgst, igst: outwardTotals.igst };
  const netCash = {
    cgst: Math.max(0, taxPayable.cgst - netItc.cgst),
    sgst: Math.max(0, taxPayable.sgst - netItc.sgst),
    igst: Math.max(0, taxPayable.igst - netItc.igst),
  };
  const totalCashDue = netCash.cgst + netCash.sgst + netCash.igst;

  return (
    <div className="p-4 md:p-7">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.ok ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1 text-[13px] text-[#536173]">
            <a className="text-blue-600 no-underline hover:underline" href="#/dashboard">Home</a>
            <span>›</span>
            <a className="text-blue-600 no-underline hover:underline" href="#gst-dashboard">GST</a>
            <span>›</span>
            <span>GSTR-3B</span>
          </nav>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="m-0 text-[22px] font-bold">GSTR-3B</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide ${status === 'filed' ? 'text-green-700 bg-green-100' : 'text-amber-700 bg-amber-100'}`}>
              {status === 'filed' ? 'Filed' : 'Pending'}
            </span>
            {loading && <span className="text-xs text-[#536173]">Loading…</span>}
          </div>
          <div className="text-[13px] text-[#536173] mt-0.5">Monthly Self-Assessed Summary Return</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] bg-white font-[inherit] outline-none" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-gray-700 bg-white border border-[#dbe4ef] rounded-md cursor-pointer hover:bg-gray-50 font-[inherit] disabled:opacity-50"
            disabled={saving || status === 'filed'}
            type="button"
            onClick={handleSaveDraft}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white bg-blue-600 border border-blue-600 rounded-md cursor-pointer hover:bg-blue-700 font-[inherit] disabled:opacity-50"
            disabled={filing || status === 'filed'}
            type="button"
            onClick={handleFile}
          >
            <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14">
              <line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {filing ? 'Filing…' : status === 'filed' ? 'Filed ✓' : 'File GSTR-3B'}
          </button>
        </div>
      </div>

      {/* ── Tax Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Output Tax Liability',      value: outwardTotals.cgst + outwardTotals.sgst + outwardTotals.igst, color: '#dc2626', sub: 'CGST + SGST + IGST' },
          { label: 'ITC Available (Net)',        value: netItc.cgst + netItc.sgst + netItc.igst,                      color: '#16a34a', sub: 'After reversals' },
          { label: 'Net Tax Payable in Cash',    value: totalCashDue,                                                  color: '#d97706', sub: 'Deposit to GST ledger' },
          { label: 'Total Taxable Turnover',     value: outwardTotals.taxable,                                         color: '#2563eb', sub: 'Including RCM inward' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#dfe7f1] rounded-lg p-4">
            <div className="text-xs text-[#536173] mb-1.5">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{formatCurrency(s.value)}</div>
            <div className="text-xs text-[#536173] mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Section Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">

        {/* Section Nav */}
        <div className="bg-white border border-[#dfe7f1] rounded-lg p-2 flex flex-col gap-0.5 h-fit">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              className={`w-full text-left px-3.5 py-2.5 rounded-md text-[13px] font-medium cursor-pointer border-0 font-[inherit] transition-colors ${activeSection === sec.id ? 'bg-blue-600 text-white' : 'text-[#374151] bg-transparent hover:bg-gray-50'}`}
              type="button"
              onClick={() => setActiveSection(sec.id)}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="bg-white border border-[#dfe7f1] rounded-lg overflow-hidden">

          {/* 3.1 Outward Supplies */}
          {activeSection === '3.1' && (
            <>
              <div className="px-5 py-4 border-b border-[#edf2f7]">
                <div className="font-semibold text-[15px]">3.1 Details of Outward Supplies and Inward Supplies liable to Reverse Charge</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-187">
                  <TaxTableHeader />
                  <tbody>
                    {outwardRows.map((row) => (
                      <tr key={row.key} className="hover:bg-gray-50">
                        <td className={TD_L}><span className="font-semibold text-[#374151]">({row.key})</span>{' '}{row.label}</td>
                        <td className={TD_R}>{formatCurrency(row.taxable)}</td>
                        <td className={TD_R}>{formatCurrency(row.cgst)}</td>
                        <td className={TD_R}>{formatCurrency(row.sgst)}</td>
                        <td className={TD_R}>{formatCurrency(row.igst)}</td>
                        <td className={TD_R}>{formatCurrency(row.cess)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#f0f9ff] font-bold">
                      <td className={`${TD_L} font-bold`}>Total Outward Tax Liability</td>
                      <td className={`${TD_R} font-bold text-blue-700`}>{formatCurrency(outwardTotals.taxable)}</td>
                      <td className={`${TD_R} font-bold text-blue-700`}>{formatCurrency(outwardTotals.cgst)}</td>
                      <td className={`${TD_R} font-bold text-blue-700`}>{formatCurrency(outwardTotals.sgst)}</td>
                      <td className={`${TD_R} font-bold text-blue-700`}>{formatCurrency(outwardTotals.igst)}</td>
                      <td className={`${TD_R} font-bold text-blue-700`}>{formatCurrency(outwardTotals.cess)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          {/* 3.2 Inter-state Supplies */}
          {activeSection === '3.2' && (
            <>
              <div className="px-5 py-4 border-b border-[#edf2f7]">
                <div className="font-semibold text-[15px]">3.2 Of the supplies shown in 3.1(a), details of inter-state supplies</div>
              </div>
              <div className="p-5">
                <div className="text-[13px] text-[#536173] mb-4">
                  Breakup of inter-state outward supplies to unregistered persons, composition taxable persons, and UIN holders.
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-[#edf2f7] rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-[#f8fafc]">
                        <th className="text-left text-xs font-semibold uppercase tracking-wide text-[#536173] px-4 py-3 border-b border-[#edf2f7]">Category</th>
                        <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] px-4 py-3 border-b border-[#edf2f7]">Taxable Value</th>
                        <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] px-4 py-3 border-b border-[#edf2f7]">IGST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { cat: 'Supplies to unregistered persons',         taxable: 0, igst: 0 },
                        { cat: 'Supplies to composition taxable persons',  taxable: 0, igst: 0 },
                        { cat: 'Supplies to UIN holders',                  taxable: 0, igst: 0 },
                      ].map((r) => (
                        <tr key={r.cat} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border-b border-[#f3f4f6] text-[13px]">{r.cat}</td>
                          <td className="px-4 py-3 border-b border-[#f3f4f6] text-[13px] text-right font-mono">{formatCurrency(r.taxable)}</td>
                          <td className="px-4 py-3 border-b border-[#f3f4f6] text-[13px] text-right font-mono">{formatCurrency(r.igst)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 4. Eligible ITC */}
          {activeSection === '4' && (
            <>
              <div className="px-5 py-4 border-b border-[#edf2f7]">
                <div className="font-semibold text-[15px]">4. Eligible Input Tax Credit (ITC)</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-175">
                  <thead>
                    <tr className="bg-[#f8fafc]">
                      <th className="text-left text-xs font-semibold uppercase tracking-wide text-[#536173] px-5 py-3 border-b border-[#edf2f7]">Details</th>
                      <th className={TH_R}>CGST (₹)</th>
                      <th className={TH_R}>SGST / UTGST (₹)</th>
                      <th className={TH_R}>IGST (₹)</th>
                      <th className={TH_R}>Cess (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-5 py-2 border-b border-[#edf2f7] bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-[#536173]" colSpan={5}>
                        A) ITC Available (whether in full or part)
                      </td>
                    </tr>
                    {itcAvailable.map((row) => (
                      <tr key={row.key} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5 border-b border-[#f3f4f6] text-[13px] pl-10">({row.key}) {row.label}</td>
                        <td className={TD_R}>{formatCurrency(row.cgst)}</td>
                        <td className={TD_R}>{formatCurrency(row.sgst)}</td>
                        <td className={TD_R}>{formatCurrency(row.igst)}</td>
                        <td className={TD_R}>{formatCurrency(row.cess)}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#f0fdf4]">
                      <td className="px-5 py-3.5 border-b border-[#edf2f7] text-[13px] font-semibold text-green-800">ITC Available — Total (A)</td>
                      <td className="px-4 py-3.5 border-b border-[#edf2f7] text-[13px] text-right font-bold font-mono text-green-700">{formatCurrency(itcAvailTotals.cgst)}</td>
                      <td className="px-4 py-3.5 border-b border-[#edf2f7] text-[13px] text-right font-bold font-mono text-green-700">{formatCurrency(itcAvailTotals.sgst)}</td>
                      <td className="px-4 py-3.5 border-b border-[#edf2f7] text-[13px] text-right font-bold font-mono text-green-700">{formatCurrency(itcAvailTotals.igst)}</td>
                      <td className="px-4 py-3.5 border-b border-[#edf2f7] text-[13px] text-right font-bold font-mono text-green-700">{formatCurrency(itcAvailTotals.cess)}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-2 border-b border-[#edf2f7] bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-[#536173]" colSpan={5}>
                        B) ITC Reversed
                      </td>
                    </tr>
                    {itcReversed.map((row) => (
                      <tr key={row.key} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5 border-b border-[#f3f4f6] text-[13px] pl-10">({row.key}) {row.label}</td>
                        <td className={TD_R}>{formatCurrency(row.cgst)}</td>
                        <td className={TD_R}>{formatCurrency(row.sgst)}</td>
                        <td className={TD_R}>{formatCurrency(row.igst)}</td>
                        <td className={TD_R}>{formatCurrency(row.cess)}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#fef9ee]">
                      <td className="px-5 py-3.5 border-b border-[#edf2f7] text-[13px] font-semibold text-amber-800">ITC Reversed — Total (B)</td>
                      <td className="px-4 py-3.5 border-b border-[#edf2f7] text-[13px] text-right font-bold font-mono text-amber-700">{formatCurrency(itcRevTotals.cgst)}</td>
                      <td className="px-4 py-3.5 border-b border-[#edf2f7] text-[13px] text-right font-bold font-mono text-amber-700">{formatCurrency(itcRevTotals.sgst)}</td>
                      <td className="px-4 py-3.5 border-b border-[#edf2f7] text-[13px] text-right font-bold font-mono text-amber-700">{formatCurrency(itcRevTotals.igst)}</td>
                      <td className="px-4 py-3.5 border-b border-[#edf2f7] text-[13px] text-right font-bold font-mono text-amber-700">{formatCurrency(itcRevTotals.cess)}</td>
                    </tr>
                    <tr className="bg-[#eff6ff]">
                      <td className="px-5 py-3.5 text-[13px] font-bold text-blue-800">C) Net ITC Available (A − B)</td>
                      <td className="px-4 py-3.5 text-[13px] text-right font-bold font-mono text-blue-700">{formatCurrency(netItc.cgst)}</td>
                      <td className="px-4 py-3.5 text-[13px] text-right font-bold font-mono text-blue-700">{formatCurrency(netItc.sgst)}</td>
                      <td className="px-4 py-3.5 text-[13px] text-right font-bold font-mono text-blue-700">{formatCurrency(netItc.igst)}</td>
                      <td className="px-4 py-3.5 text-[13px] text-right font-bold font-mono text-blue-700">{formatCurrency(netItc.cess)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* 5. Exempt Supplies */}
          {activeSection === '5' && (
            <>
              <div className="px-5 py-4 border-b border-[#edf2f7]">
                <div className="font-semibold text-[15px]">5. Values of Exempt, Nil-rated and Non-GST Inward Supplies</div>
              </div>
              <div className="overflow-x-auto p-5">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafc]">
                      <th className="text-left text-xs font-semibold uppercase tracking-wide text-[#536173] px-4 py-3 border-b border-[#edf2f7]">Nature of Supply</th>
                      <th className="text-right text-xs font-semibold uppercase tracking-wide text-[#536173] px-4 py-3 border-b border-[#edf2f7]">Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { desc: 'From a composition taxable person',   value: 0 },
                      { desc: 'From non-resident taxable person',    value: 0 },
                      { desc: 'From exempt/nil supplies',            value: 0 },
                      { desc: 'Non-GST inward supplies',             value: 0 },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3.5 border-b border-[#f3f4f6] text-[13px]">{row.desc}</td>
                        <td className="px-4 py-3.5 border-b border-[#f3f4f6] text-[13px] text-right font-mono">{formatCurrency(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* 5.1 Interest & Late Fee */}
          {activeSection === '5.1' && (
            <>
              <div className="px-5 py-4 border-b border-[#edf2f7]">
                <div className="font-semibold text-[15px]">5.1 Interest and Late Fee</div>
                <div className="text-[13px] text-[#536173] mt-1">Applicable only if return is filed after due date.</div>
              </div>
              <div className="p-5">
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-5 flex items-center gap-2">
                  <svg fill="none" height="16" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24" width="16"><polyline points="20 6 9 17 4 12" /></svg>
                  <span className="text-[13px] text-green-800 font-medium">No late fee or interest applicable if filed on time.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Late Fee — CGST (₹)', value: lateFeeCgst, set: setLateFeeCgst },
                    { label: 'Late Fee — SGST (₹)', value: lateFeeSgst, set: setLateFeeSgst },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-1">
                      <label className="text-xs text-[#536173] font-medium">{f.label}</label>
                      <input
                        className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] w-full outline-none focus:border-blue-500 font-[inherit]"
                        min="0" placeholder="0" type="number"
                        value={f.value}
                        onChange={(e) => f.set(e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 6. Tax Payment */}
          {activeSection === '6' && (
            <>
              <div className="px-5 py-4 border-b border-[#edf2f7]">
                <div className="font-semibold text-[15px]">6. Payment of Tax</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-175">
                  <thead>
                    <tr className="bg-[#f8fafc]">
                      <th className="text-left text-xs font-semibold uppercase tracking-wide text-[#536173] px-5 py-3 border-b border-[#edf2f7]">Description</th>
                      <th className={TH_R}>CGST (₹)</th>
                      <th className={TH_R}>SGST / UTGST (₹)</th>
                      <th className={TH_R}>IGST (₹)</th>
                      <th className={TH_R}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Tax Payable',                        cgst: taxPayable.cgst, sgst: taxPayable.sgst, igst: taxPayable.igst, rowCls: '' },
                      { label: 'Paid through ITC (Input Tax Credit)', cgst: netItc.cgst,    sgst: netItc.sgst,    igst: netItc.igst,    rowCls: 'text-green-700' },
                      { label: 'Net Tax Payable in Cash',             cgst: netCash.cgst,   sgst: netCash.sgst,   igst: netCash.igst,   rowCls: 'font-bold text-amber-700 bg-[#fffbeb]' },
                    ].map(({ label, cgst, sgst, igst, rowCls }) => (
                      <tr key={label} className={rowCls || 'hover:bg-gray-50'}>
                        <td className={`px-5 py-3.5 border-b border-[#f3f4f6] text-[13px] ${rowCls}`}>{label}</td>
                        <td className={`px-4 py-3.5 border-b border-[#f3f4f6] text-[13px] text-right font-mono ${rowCls}`}>{formatCurrency(cgst)}</td>
                        <td className={`px-4 py-3.5 border-b border-[#f3f4f6] text-[13px] text-right font-mono ${rowCls}`}>{formatCurrency(sgst)}</td>
                        <td className={`px-4 py-3.5 border-b border-[#f3f4f6] text-[13px] text-right font-mono ${rowCls}`}>{formatCurrency(igst)}</td>
                        <td className={`px-4 py-3.5 border-b border-[#f3f4f6] text-[13px] text-right font-mono ${rowCls}`}>{formatCurrency(cgst + sgst + igst)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-4 bg-blue-50 border-t border-blue-100 flex flex-wrap gap-2 justify-between items-center">
                <div className="text-[13px] text-blue-800 font-medium">Total cash to be deposited to GST Electronic Cash Ledger</div>
                <div className="text-[22px] font-bold text-blue-700">{formatCurrency(totalCashDue)}</div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
