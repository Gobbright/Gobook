import { useEffect, useState } from 'react';

import { api } from '../../services/api.js';
import { gstService } from '../../services/gstService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

const PERIODS = ['May 2026', 'April 2026', 'March 2026', 'February 2026', 'January 2026'];

const TABS = [
  { id: 'b2b',     label: 'B2B' },
  { id: 'b2cs',    label: 'B2CS' },
  { id: 'cdnr',    label: 'CDNR' },
  { id: 'exports', label: 'Exports' },
  { id: 'hsn',     label: 'HSN Summary' },
  { id: 'docs',    label: 'Documents' },
];

const TH = 'text-left text-xs font-semibold uppercase tracking-wide text-[#536173] px-4 py-3 border-b border-[#edf2f7]';
const TD = 'px-4 py-3 border-b border-[#f3f4f6] text-[13px]';

function sum(arr, key) { return arr.reduce((a, r) => a + (r[key] ?? 0), 0); }

export function Gstr1Page() {
  const [period, setPeriod]       = useState('May 2026');
  const [filing, setFiling]       = useState('monthly');
  const [activeTab, setActiveTab] = useState('b2b');

  const [b2b, setB2b]   = useState([]);
  const [b2cs, setB2cs] = useState([]);
  const [hsn, setHsn]   = useState([]);
  const [status, setStatus] = useState('draft');

  const [bizSettings, setBizSettings] = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [filing2, setFiling2]   = useState(false);
  const [toast, setToast]       = useState(null);

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    api.getSettings().then(setBizSettings).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    gstService.getGstr1(period, filing)
      .then((data) => {
        setB2b(data?.b2b ?? []);
        setB2cs(data?.b2cs ?? []);
        setHsn(data?.hsn ?? []);
        setStatus(data?.status ?? 'draft');
      })
      .catch(() => showToast('Failed to load data', false))
      .finally(() => setLoading(false));
  }, [period, filing]);

  async function handleSaveDraft() {
    setSaving(true);
    try {
      await gstService.saveGstr1({ period, filingType: filing, b2b, b2cs, hsn, status: 'draft' });
      setStatus('draft');
      showToast('Draft saved successfully');
    } catch {
      showToast('Failed to save draft', false);
    } finally {
      setSaving(false);
    }
  }

  async function handleFile() {
    setFiling2(true);
    try {
      const data = await gstService.fileGstr1(period, filing);
      setStatus('filed');
      showToast(`GSTR-1 filed! ARN: ${data.arn}`);
    } catch {
      showToast('Failed to file GSTR-1', false);
    } finally {
      setFiling2(false);
    }
  }

  const b2bTotals  = { value: sum(b2b,'value'), taxable: sum(b2b,'taxable'), cgst: sum(b2b,'cgst'), sgst: sum(b2b,'sgst'), igst: sum(b2b,'igst') };
  const b2csTotals = { taxable: sum(b2cs,'taxable'), cgst: sum(b2cs,'cgst'), sgst: sum(b2cs,'sgst'), igst: sum(b2cs,'igst') };
  const grandTaxable = b2bTotals.taxable + b2csTotals.taxable;
  const grandTax     = b2bTotals.cgst + b2bTotals.sgst + b2bTotals.igst + b2csTotals.cgst + b2csTotals.sgst + b2csTotals.igst;

  const tabsWithCount = TABS.map((t) => ({
    ...t,
    count: t.id === 'b2b' ? b2b.length : t.id === 'b2cs' ? b2cs.length : t.id === 'hsn' ? hsn.length : 0,
  }));

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
            <span>GSTR-1</span>
          </nav>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="m-0 text-[22px] font-bold">GSTR-1</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide ${status === 'filed' ? 'text-green-700 bg-green-100' : 'text-amber-700 bg-amber-100'}`}>
              {status === 'filed' ? 'Filed' : 'Pending'}
            </span>
            {loading && <span className="text-xs text-[#536173]">Loading…</span>}
          </div>
          <div className="text-[13px] text-[#536173] mt-0.5">Details of Outward Supplies of Goods or Services</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-md border border-[#dbe4ef] overflow-hidden text-[13px]">
            {['monthly', 'quarterly'].map((f) => (
              <button
                key={f}
                className={`px-3 py-2 border-0 cursor-pointer font-[inherit] capitalize ${filing === f ? 'text-white bg-blue-600' : 'text-[#536173] bg-white hover:bg-gray-50'}`}
                type="button"
                onClick={() => setFiling(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] bg-white font-[inherit] outline-none"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
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
            disabled={filing2 || status === 'filed'}
            type="button"
            onClick={handleFile}
          >
            <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14">
              <line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {filing2 ? 'Filing…' : status === 'filed' ? 'Filed ✓' : 'File GSTR-1'}
          </button>
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-3.5 mb-5 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-3">
          <svg fill="none" height="16" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24" width="16" className="flex-none">
            <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <span className="text-[13px] text-blue-800">
            <strong>Filing Period: {period}</strong> · GSTIN: {bizSettings.gstin || '—'} · {bizSettings.businessName || 'GoBook Enterprises'}
          </span>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'B2B Invoices',              value: String(b2b.length),         sub: 'Registered buyers' },
          { label: 'B2CS Entries',              value: String(b2cs.length),        sub: 'Unregistered / small' },
          { label: 'Total Taxable Value',       value: formatCurrency(grandTaxable), sub: 'All supplies' },
          { label: 'Total Tax (CGST+SGST+IGST)',value: formatCurrency(grandTax),   sub: 'Output liability' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#dfe7f1] rounded-lg p-4">
            <div className="text-xs text-[#536173] mb-1.5">{s.label}</div>
            <div className="text-xl font-bold text-[#111827]">{s.value}</div>
            <div className="text-xs text-[#536173] mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs + Content ── */}
      <div className="bg-white border border-[#dfe7f1] rounded-lg">
        <div className="flex overflow-x-auto border-b border-[#edf2f7] px-5">
          {tabsWithCount.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-medium border-b-2 cursor-pointer bg-transparent border-0 whitespace-nowrap font-[inherit] transition-colors ${activeTab === tab.id ? 'text-blue-600 border-blue-600' : 'text-[#536173] border-transparent hover:text-[#111827]'}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[11px] font-bold rounded-full px-1.5 py-0.5 ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-[#536173]'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* B2B Table */}
        {activeTab === 'b2b' && (
          <div>
            <div className="px-5 py-3 border-b border-[#edf2f7] flex flex-wrap gap-2 justify-between items-center">
              <span className="text-[13px] text-[#536173]">B2B — Taxable outward supplies made to GST-registered persons</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr>
                    <th className={TH}>GSTIN / UIN</th>
                    <th className={TH}>Party Name</th>
                    <th className={TH}>Invoice No.</th>
                    <th className={TH}>Date</th>
                    <th className={`${TH} text-right`}>Invoice Value</th>
                    <th className={`${TH} text-right`}>Taxable Amt</th>
                    <th className={`${TH} text-center`}>Rate</th>
                    <th className={`${TH} text-right`}>CGST</th>
                    <th className={`${TH} text-right`}>SGST</th>
                    <th className={`${TH} text-right`}>IGST</th>
                    <th className={TH} style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {b2b.length === 0 ? (
                    <tr>
                      <td className="text-center py-12 text-[#536173] text-[13px]" colSpan={11}>
                        No B2B invoices for {period}.
                      </td>
                    </tr>
                  ) : (
                  b2b.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className={`${TD} font-mono text-xs text-[#374151]`}>{row.gstin}</td>
                      <td className={`${TD} font-medium text-[#111827]`}>{row.name}</td>
                      <td className={TD}>{row.invoiceNo}</td>
                      <td className={`${TD} text-[#536173]`}>{row.date}</td>
                      <td className={`${TD} text-right font-medium`}>{formatCurrency(row.value)}</td>
                      <td className={`${TD} text-right`}>{formatCurrency(row.taxable)}</td>
                      <td className={`${TD} text-center`}>
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">{row.rate}%</span>
                      </td>
                      <td className={`${TD} text-right`}>{row.cgst > 0 ? formatCurrency(row.cgst) : <span className="text-[#536173]">—</span>}</td>
                      <td className={`${TD} text-right`}>{row.sgst > 0 ? formatCurrency(row.sgst) : <span className="text-[#536173]">—</span>}</td>
                      <td className={`${TD} text-right`}>{row.igst > 0 ? formatCurrency(row.igst) : <span className="text-[#536173]">—</span>}</td>
                      <td className={TD}>
                        <button
                          className="text-red-400 hover:text-red-600 bg-transparent border-0 cursor-pointer text-lg font-[inherit]"
                          disabled={status === 'filed'}
                          type="button"
                          onClick={() => setB2b((prev) => prev.filter((_, j) => j !== i))}
                        >×</button>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#f8fafc] font-semibold">
                    <td className={`${TD} font-bold`} colSpan={4}>Total</td>
                    <td className={`${TD} text-right font-bold`}>{formatCurrency(b2bTotals.value)}</td>
                    <td className={`${TD} text-right font-bold`}>{formatCurrency(b2bTotals.taxable)}</td>
                    <td className={TD} />
                    <td className={`${TD} text-right font-bold`}>{formatCurrency(b2bTotals.cgst)}</td>
                    <td className={`${TD} text-right font-bold`}>{formatCurrency(b2bTotals.sgst)}</td>
                    <td className={`${TD} text-right font-bold`}>{formatCurrency(b2bTotals.igst)}</td>
                    <td className={TD} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* B2CS Table */}
        {activeTab === 'b2cs' && (
          <div>
            <div className="px-5 py-3 border-b border-[#edf2f7]">
              <span className="text-[13px] text-[#536173]">B2CS — Summary for unregistered buyers (Intrastate all, Interstate ≤ ₹2.5L)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={TH}>State / UT</th>
                    <th className={TH}>Supply Type</th>
                    <th className={`${TH} text-right`}>Taxable Value</th>
                    <th className={`${TH} text-center`}>Rate</th>
                    <th className={`${TH} text-right`}>CGST</th>
                    <th className={`${TH} text-right`}>SGST</th>
                    <th className={`${TH} text-right`}>IGST</th>
                  </tr>
                </thead>
                <tbody>
                  {b2cs.length === 0 ? (
                    <tr>
                      <td className="text-center py-12 text-[#536173] text-[13px]" colSpan={7}>
                        No B2CS entries for {period}.
                      </td>
                    </tr>
                  ) : (
                  b2cs.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className={`${TD} font-medium`}>{row.state}</td>
                      <td className={TD}>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${row.type === 'Intrastate' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className={`${TD} text-right`}>{formatCurrency(row.taxable)}</td>
                      <td className={`${TD} text-center`}>{row.rate}%</td>
                      <td className={`${TD} text-right`}>{row.cgst > 0 ? formatCurrency(row.cgst) : <span className="text-[#536173]">—</span>}</td>
                      <td className={`${TD} text-right`}>{row.sgst > 0 ? formatCurrency(row.sgst) : <span className="text-[#536173]">—</span>}</td>
                      <td className={`${TD} text-right`}>{row.igst > 0 ? formatCurrency(row.igst) : <span className="text-[#536173]">—</span>}</td>
                    </tr>
                  ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#f8fafc]">
                    <td className={`${TD} font-bold`} colSpan={2}>Total</td>
                    <td className={`${TD} text-right font-bold`}>{formatCurrency(b2csTotals.taxable)}</td>
                    <td className={TD} />
                    <td className={`${TD} text-right font-bold`}>{formatCurrency(b2csTotals.cgst)}</td>
                    <td className={`${TD} text-right font-bold`}>{formatCurrency(b2csTotals.sgst)}</td>
                    <td className={`${TD} text-right font-bold`}>{formatCurrency(b2csTotals.igst)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* HSN Summary */}
        {activeTab === 'hsn' && (
          <div>
            <div className="px-5 py-3 border-b border-[#edf2f7]">
              <span className="text-[13px] text-[#536173]">HSN-wise summary of outward supplies — mandatory for turnover above ₹5 Cr</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[900px]">
                <thead>
                  <tr>
                    {['HSN / SAC', 'Description', 'UQC', 'Qty', 'Total Value', 'Taxable Value', 'Rate', 'CGST', 'SGST', 'IGST'].map((h) => (
                      <th key={h} className={`${TH} ${['Total Value', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Qty'].includes(h) ? 'text-right' : h === 'Rate' ? 'text-center' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hsn.length === 0 ? (
                    <tr>
                      <td className="text-center py-12 text-[#536173] text-[13px]" colSpan={10}>
                        No HSN summary for {period}.
                      </td>
                    </tr>
                  ) : (
                  hsn.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className={`${TD} font-mono font-semibold text-[#111827]`}>{row.hsn}</td>
                      <td className={TD}>{row.desc}</td>
                      <td className={TD}>{row.uqc}</td>
                      <td className={`${TD} text-right`}>{row.qty}</td>
                      <td className={`${TD} text-right`}>{formatCurrency(row.value)}</td>
                      <td className={`${TD} text-right font-medium`}>{formatCurrency(row.taxable)}</td>
                      <td className={`${TD} text-center`}>{row.rate}%</td>
                      <td className={`${TD} text-right`}>{row.cgst > 0 ? formatCurrency(row.cgst) : <span className="text-[#536173]">—</span>}</td>
                      <td className={`${TD} text-right`}>{row.sgst > 0 ? formatCurrency(row.sgst) : <span className="text-[#536173]">—</span>}</td>
                      <td className={`${TD} text-right`}>{row.igst > 0 ? formatCurrency(row.igst) : <span className="text-[#536173]">—</span>}</td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty states */}
        {['cdnr', 'exports', 'docs'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center py-16 text-[#536173]">
            <svg fill="none" height="48" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24" width="48">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
              <line x1="12" x2="12" y1="18" y2="12" /><line x1="9" x2="15" y1="15" y2="15" />
            </svg>
            <div className="text-[15px] font-medium mt-4">No entries for {period}</div>
            <div className="text-[13px] mt-1 text-center max-w-xs">
              {activeTab === 'cdnr'    && 'Credit / Debit Notes issued to registered parties will appear here.'}
              {activeTab === 'exports' && 'Export invoices (zero-rated supplies) will appear here.'}
              {activeTab === 'docs'    && 'Supporting documents and acknowledgements will appear here after filing.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
