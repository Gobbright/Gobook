import { Gstr1 } from '../../models/Gstr1.js';
import { Gstr3b } from '../../models/Gstr3b.js';
import { httpError } from '../../utils/httpError.js';
import { getActiveGstin } from '../../utils/gst.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// "2026-27" -> ['April 2026', ..., 'March 2027']
function periodsForFy(fy) {
  const startYear = Number(fy.split('-')[0]);
  const periods = [];
  for (let i = 0; i < 12; i++) {
    const monthIdx = (3 + i) % 12;
    const year = monthIdx >= 3 ? startYear : startYear + 1;
    periods.push(`${MONTHS[monthIdx]} ${year}`);
  }
  return periods;
}

function sumFields(rows, fields) {
  const out = {};
  for (const f of fields) out[f] = 0;
  for (const r of rows) {
    for (const f of fields) out[f] += r[f] ?? 0;
  }
  return out;
}

const TAX_FIELDS = ['cgst', 'sgst', 'igst', 'cess'];
const ZERO_TAX = { cgst: 0, sgst: 0, igst: 0, cess: 0 };

// GET /api/gst/gstr9?fy=2026-27
export async function getGstr9(req, res, next) {
  try {
    const { fy } = req.query;
    if (!fy) return next(httpError(400, 'fy is required'));

    const gstin = await getActiveGstin();
    const periods = periodsForFy(fy);

    const [gstr1Docs, gstr3bDocs] = await Promise.all([
      Gstr1.find({ gstin, period: { $in: periods }, filingType: 'monthly' }).lean(),
      Gstr3b.find({ gstin, period: { $in: periods } }).lean(),
    ]);

    const b2b = sumFields(gstr1Docs.flatMap((d) => d.b2b ?? []), ['taxable', ...TAX_FIELDS]);
    const b2cs = sumFields(gstr1Docs.flatMap((d) => d.b2cs ?? []), ['taxable', ...TAX_FIELDS]);

    const outwardByKey = {};
    const itcAvailByKey = {};
    const itcRevByKey = {};
    let lateFee = 0;
    for (const doc of gstr3bDocs) {
      for (const row of doc.outwardRows ?? []) {
        const acc = outwardByKey[row.key] ?? (outwardByKey[row.key] = { taxable: 0, ...ZERO_TAX });
        acc.taxable += row.taxable ?? 0;
        for (const f of TAX_FIELDS) acc[f] += row[f] ?? 0;
      }
      for (const row of doc.itcAvailable ?? []) {
        const acc = itcAvailByKey[row.key] ?? (itcAvailByKey[row.key] = { ...ZERO_TAX });
        for (const f of TAX_FIELDS) acc[f] += row[f] ?? 0;
      }
      for (const row of doc.itcReversed ?? []) {
        const acc = itcRevByKey[row.key] ?? (itcRevByKey[row.key] = { ...ZERO_TAX });
        for (const f of TAX_FIELDS) acc[f] += row[f] ?? 0;
      }
      lateFee += (doc.lateFeeCgst ?? 0) + (doc.lateFeeSgst ?? 0);
    }

    const zeroOut = { taxable: 0, ...ZERO_TAX };
    const rcm = outwardByKey['d'] ?? zeroOut;
    const nilExempt = outwardByKey['c'] ?? zeroOut;
    const nonGst = outwardByKey['e'] ?? zeroOut;

    // Table 4 — outward supplies (auto-compiled from GSTR-1 / GSTR-3B; rows with no source default to 0)
    const table4 = [
      { sno: '4A', desc: 'Supplies made to un-registered persons (B2C)', taxable: b2cs.taxable, cgst: b2cs.cgst, sgst: b2cs.sgst, igst: b2cs.igst, cess: 0 },
      { sno: '4B', desc: 'Supplies made to registered persons (B2B)', taxable: b2b.taxable, cgst: b2b.cgst, sgst: b2b.sgst, igst: b2b.igst, cess: 0 },
      { sno: '4C', desc: 'Zero rated supply (Export) on payment of tax', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      { sno: '4D', desc: 'Supplies to SEZs on payment of tax', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      { sno: '4E', desc: 'Deemed exports', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      { sno: '4F', desc: 'Advances on which tax has been paid', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      { sno: '4G', desc: 'Inward supplies on which tax is paid on reverse charge', taxable: rcm.taxable, cgst: rcm.cgst, sgst: rcm.sgst, igst: rcm.igst, cess: rcm.cess },
      { sno: '4I', desc: 'Credit notes issued', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      { sno: '4J', desc: 'Debit notes issued', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      { sno: '4K', desc: 'Supplies / tax declared through amendments', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      { sno: '4L', desc: 'Supplies / tax reduced through amendments', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
    ];

    // Table 5 — taxable supplies breakup
    const table5 = [
      { cat: '5A — Taxable supplies excluding nil rated, exempted', taxable: b2b.taxable + b2cs.taxable, cgst: b2b.cgst + b2cs.cgst, sgst: b2b.sgst + b2cs.sgst, igst: b2b.igst + b2cs.igst },
      { cat: '5B — Zero rated supply without payment of tax', taxable: 0, cgst: 0, sgst: 0, igst: 0 },
      { cat: '5C — Nil rated, exempted', taxable: nilExempt.taxable, cgst: 0, sgst: 0, igst: 0 },
      { cat: '5D — Non-GST supply', taxable: nonGst.taxable, cgst: 0, sgst: 0, igst: 0 },
    ];

    // Table 6 — ITC availed (auto-compiled from GSTR-3B Table 4A)
    const a1 = itcAvailByKey['A(1)'] ?? ZERO_TAX;
    const a2 = itcAvailByKey['A(2)'] ?? ZERO_TAX;
    const a3 = itcAvailByKey['A(3)'] ?? ZERO_TAX;
    const a5 = itcAvailByKey['A(5)'] ?? ZERO_TAX;
    const itcTotal = sumFields([a1, a2, a3, a5], TAX_FIELDS);
    const table6 = [
      { sno: '6A', desc: 'Total ITC available as declared in GSTR-3B', ...itcTotal },
      { sno: '6B', desc: 'ITC availed on goods and services', cgst: a2.cgst + a3.cgst + a5.cgst, sgst: a2.sgst + a3.sgst + a5.sgst, igst: a2.igst + a3.igst + a5.igst, cess: a2.cess + a3.cess + a5.cess },
      { sno: '6C', desc: 'ITC availed on capital goods', cgst: 0, sgst: 0, igst: 0, cess: 0 },
      { sno: '6D', desc: 'ITC availed on import of goods', ...a1 },
    ];

    // Table 7 — ITC reversed (Rule 42/43 and other reversals)
    const b1 = itcRevByKey['B(1)'] ?? ZERO_TAX;
    const b2 = itcRevByKey['B(2)'] ?? ZERO_TAX;
    const table7 = [
      { sno: '7A', desc: 'As per Rule 42 & 43 of CGST Rules', ...b1 },
      { sno: '7B', desc: 'Other reversals', ...b2 },
    ];
    const reversalTotal = sumFields([b1, b2], TAX_FIELDS);

    // Table 9 — tax paid
    const outwardTotal = sumFields(Object.values(outwardByKey), ['taxable', ...TAX_FIELDS]);

    const netItc = {};
    for (const f of TAX_FIELDS) netItc[f] = Math.max(0, itcTotal[f] - reversalTotal[f]);

    const paidViaItc = {};
    const paidCash = {};
    for (const f of TAX_FIELDS) {
      paidViaItc[f] = Math.min(netItc[f], outwardTotal[f]);
      paidCash[f] = Math.max(0, outwardTotal[f] - paidViaItc[f]);
    }

    const table9 = [
      { desc: 'Total tax payable as declared in GSTR-3B returns', cgst: outwardTotal.cgst, sgst: outwardTotal.sgst, igst: outwardTotal.igst, cess: outwardTotal.cess, interest: 0, late: 0 },
      { desc: 'Paid through ITC (CGST, SGST, IGST, Cess)', cgst: paidViaItc.cgst, sgst: paidViaItc.sgst, igst: paidViaItc.igst, cess: paidViaItc.cess, interest: 0, late: 0 },
      { desc: 'Tax paid in cash', cgst: paidCash.cgst, sgst: paidCash.sgst, igst: paidCash.igst, cess: paidCash.cess, interest: 0, late: lateFee },
    ];

    const overview = {
      turnover: outwardTotal.taxable,
      outputTax: outwardTotal.cgst + outwardTotal.sgst + outwardTotal.igst,
      itcClaimed: itcTotal.cgst + itcTotal.sgst + itcTotal.igst,
      cashPaid: paidCash.cgst + paidCash.sgst + paidCash.igst,
    };

    res.json({ fy, gstin, periods, overview, table4, table5, table6, table7, table9 });
  } catch (err) {
    next(err);
  }
}
