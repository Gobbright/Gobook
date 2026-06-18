import { Gstr1 } from '../../models/Gstr1.js';
import { Gstr3b } from '../../models/Gstr3b.js';
import { httpError } from '../../utils/httpError.js';
import { getActiveGstin } from '../../utils/gst.js';

const TREND_PERIODS = [
  'January 2026', 'February 2026', 'March 2026',
  'April 2026', 'May 2026', 'June 2026',
];

// GET /api/gst/reports?type=hsn-summary&period=May+2026
export async function getReport(req, res, next) {
  try {
    const { type, period } = req.query;
    if (!type || !period) return next(httpError(400, 'type and period are required'));

    const gstin = await getActiveGstin();

    switch (type) {
      case 'hsn-summary': {
        const record = await Gstr1.findOne({ gstin, period }).lean();
        return res.json({ data: record?.hsn ?? [] });
      }

      case 'tax-rate': {
        const record = await Gstr1.findOne({ gstin, period }).lean();
        if (!record) return res.json({ data: [] });

        const rateMap = {};
        for (const row of record.b2b) {
          const r = row.rate;
          if (!rateMap[r]) rateMap[r] = { rate: r, taxable: 0, cgst: 0, sgst: 0, igst: 0, invoices: 0 };
          rateMap[r].taxable  += row.taxable;
          rateMap[r].cgst     += row.cgst;
          rateMap[r].sgst     += row.sgst;
          rateMap[r].igst     += row.igst;
          rateMap[r].invoices += 1;
        }
        for (const row of record.b2cs) {
          const r = row.rate;
          if (!rateMap[r]) rateMap[r] = { rate: r, taxable: 0, cgst: 0, sgst: 0, igst: 0, invoices: 0 };
          rateMap[r].taxable += row.taxable;
          rateMap[r].cgst    += row.cgst;
          rateMap[r].sgst    += row.sgst;
          rateMap[r].igst    += row.igst;
        }
        return res.json({ data: Object.values(rateMap).sort((a, b) => a.rate - b.rate) });
      }

      case 'state-wise': {
        const record = await Gstr1.findOne({ gstin, period }).lean();
        if (!record) return res.json({ data: [] });

        const stateMap = {};
        for (const row of record.b2b) {
          const key   = row.igst > 0 ? `${row.name}-interstate` : 'Maharashtra-intrastate';
          const state = row.igst > 0 ? (row.name || 'Interstate') : 'Maharashtra';
          const type  = row.igst > 0 ? 'Interstate' : 'Intrastate';
          if (!stateMap[key]) stateMap[key] = { state, type, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
          stateMap[key].taxable += row.taxable;
          stateMap[key].cgst   += row.cgst;
          stateMap[key].sgst   += row.sgst;
          stateMap[key].igst   += row.igst;
        }
        return res.json({ data: Object.values(stateMap) });
      }

      case 'customer': {
        const record = await Gstr1.findOne({ gstin, period }).lean();
        if (!record) return res.json({ data: [] });

        const custMap = {};
        for (const row of record.b2b) {
          if (!custMap[row.gstin]) {
            custMap[row.gstin] = { name: row.name, gstin: row.gstin, invoices: 0, taxable: 0, tax: 0, lastInv: '' };
          }
          custMap[row.gstin].invoices += 1;
          custMap[row.gstin].taxable  += row.taxable;
          custMap[row.gstin].tax      += row.cgst + row.sgst + row.igst;
          if (!custMap[row.gstin].lastInv || row.date > custMap[row.gstin].lastInv) {
            custMap[row.gstin].lastInv = row.date;
          }
        }
        return res.json({ data: Object.values(custMap) });
      }

      case 'itc': {
        const records = await Gstr3b.find({ gstin, period: { $in: TREND_PERIODS } }).lean();
        const data = TREND_PERIODS.map((p) => {
          const r = records.find((rec) => rec.period === p);
          const available = r ? r.itcAvailable.reduce((a, row) => a + row.cgst + row.sgst + row.igst, 0) : 0;
          const reversal  = r ? r.itcReversed.reduce((a, row) => a + row.cgst + row.sgst + row.igst, 0) : 0;
          return {
            month:     p.slice(0, 3),
            available,
            utilised:  available - reversal,
            reversal,
            net:       available - reversal,
          };
        });
        return res.json({ data });
      }

      default:
        return res.json({ data: [] });
    }
  } catch (err) {
    next(err);
  }
}
