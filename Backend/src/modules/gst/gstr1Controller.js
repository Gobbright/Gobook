import { Gstr1 } from '../../models/Gstr1.js';
import { httpError } from '../../utils/httpError.js';
import { getActiveGstin } from '../../utils/gst.js';

// GET /api/gst/gstr1?period=May+2026&filingType=monthly
export async function getGstr1(req, res, next) {
  try {
    const { period, filingType = 'monthly' } = req.query;
    if (!period) return next(httpError(400, 'period is required'));

    const gstin = await getActiveGstin();
    const record = await Gstr1.findOne({ gstin, period, filingType }).lean();
    res.json(record ?? null);
  } catch (err) {
    next(err);
  }
}

// PUT /api/gst/gstr1 — upsert by gstin + period + filingType
export async function saveGstr1(req, res, next) {
  try {
    const { period, filingType = 'monthly', ...rest } = req.body;
    if (!period) return next(httpError(400, 'period is required'));

    const gstin = await getActiveGstin();
    const record = await Gstr1.findOneAndUpdate(
      { gstin, period, filingType },
      { $set: { ...rest, period, filingType, gstin } },
      { new: true, upsert: true, runValidators: false },
    ).lean();
    res.json(record);
  } catch (err) {
    next(err);
  }
}

// POST /api/gst/gstr1/file
export async function fileGstr1(req, res, next) {
  try {
    const { period, filingType = 'monthly' } = req.body;
    if (!period) return next(httpError(400, 'period is required'));

    const gstin = await getActiveGstin();
    const arn = `AA${Date.now().toString().slice(-10)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const record = await Gstr1.findOneAndUpdate(
      { gstin, period, filingType },
      { $set: { status: 'filed', arn, filedAt: new Date(), gstin, period, filingType } },
      { new: true, upsert: true, runValidators: false },
    ).lean();
    res.json(record);
  } catch (err) {
    next(err);
  }
}
