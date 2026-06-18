import { Gstr1 } from '../../models/Gstr1.js';
import { Gstr3b } from '../../models/Gstr3b.js';
import { getActiveGstin } from '../../utils/gst.js';

const CURRENT_PERIOD = 'June 2026';
const TREND_PERIODS = ['January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026'];

// Returns due date strings matching the filing calendar format
function dueDateStr(period, day) {
  const [mon, yr] = period.split(' ');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const mIdx = months.indexOf(mon);
  const nextMonth = new Date(Number(yr), mIdx + 1, day);
  return nextMonth.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(period, day) {
  const [mon, yr] = period.split(' ');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const mIdx = months.indexOf(mon);
  const due = new Date(Number(yr), mIdx + 1, day);
  return Math.max(0, Math.ceil((due - Date.now()) / 86_400_000));
}

function itcSum(rows) {
  return (rows || []).reduce((a, r) => a + r.cgst + r.sgst + r.igst, 0);
}

function taxSum(rows) {
  return (rows || []).reduce((a, r) => a + r.cgst + r.sgst + r.igst, 0);
}

// GET /api/gst/dashboard
export async function getGstDashboard(_req, res, next) {
  try {
    const calendarPeriods = ['May 2026', 'April 2026', 'March 2026'];
    const gstin = await getActiveGstin();

    const [gstr3bTrend, gstr1All, gstr3bAll, gstr3bCurrent] = await Promise.all([
      Gstr3b.find({ gstin, period: { $in: TREND_PERIODS } }).lean(),
      Gstr1.find({ gstin, period: { $in: calendarPeriods } }).lean(),
      Gstr3b.find({ gstin, period: { $in: calendarPeriods } }).lean(),
      Gstr3b.findOne({ gstin, period: CURRENT_PERIOD }).lean(),
    ]);

    // Monthly trend
    const monthlyTrend = TREND_PERIODS.map((period) => {
      const rec = gstr3bTrend.find((r) => r.period === period);
      const output = rec ? taxSum(rec.outwardRows) : 0;
      const itc    = rec ? itcSum(rec.itcAvailable) - itcSum(rec.itcReversed) : 0;
      return { month: period.slice(0, 3), output, itc };
    });

    // Current period stats
    const outputTax  = gstr3bCurrent ? taxSum(gstr3bCurrent.outwardRows) : 0;
    const itcAvail   = gstr3bCurrent ? itcSum(gstr3bCurrent.itcAvailable) - itcSum(gstr3bCurrent.itcReversed) : 0;
    const netTaxable = Math.max(0, outputTax - itcAvail);

    // Filing calendar
    const filingCalendar = [];
    for (const period of calendarPeriods) {
      const g1  = gstr1All.find((r) => r.period === period);
      const g3b = gstr3bAll.find((r) => r.period === period);
      filingCalendar.push({
        return:   'GSTR-1',
        period,
        dueDate:  dueDateStr(period, 11),
        status:   g1?.status === 'filed' ? 'filed' : 'pending',
        daysLeft: daysUntil(period, 11),
        arn:      g1?.arn ?? null,
        href:     '#gstr-1',
      });
      filingCalendar.push({
        return:   'GSTR-3B',
        period,
        dueDate:  dueDateStr(period, 20),
        status:   g3b?.status === 'filed' ? 'filed' : 'pending',
        daysLeft: daysUntil(period, 20),
        arn:      g3b?.arn ?? null,
        href:     '#gstr-3b',
      });
    }

    const pendingCount = filingCalendar.filter((f) => f.status === 'pending').length;

    res.json({
      gstin,
      currentPeriod: CURRENT_PERIOD,
      stats: {
        outputTax,
        itcAvailable: itcAvail,
        netTaxPayable: netTaxable,
        pendingFilings: pendingCount,
      },
      filingCalendar,
      monthlyTrend,
    });
  } catch (err) {
    next(err);
  }
}
