import { Gstr3b } from '../../models/Gstr3b.js';
import { httpError } from '../../utils/httpError.js';
import { getActiveGstin } from '../../utils/gst.js';

// GET /api/gst/gstr3b?period=May+2026
export async function getGstr3b(req, res, next) {
  try {
    const { period } = req.query;
    if (!period) return next(httpError(400, 'period is required'));

    const gstin = await getActiveGstin();
    const record = await Gstr3b.findOne({ gstin, period }).lean();
    res.json(record ?? null);
  } catch (err) {
    next(err);
  }
}

// PUT /api/gst/gstr3b — upsert by gstin + period
export async function saveGstr3b(req, res, next) {
  try {
    const { period, ...rest } = req.body;
    if (!period) return next(httpError(400, 'period is required'));

    const gstin = await getActiveGstin();
    const record = await Gstr3b.findOneAndUpdate(
      { gstin, period },
      { $set: { ...rest, period, gstin } },
      { new: true, upsert: true, runValidators: false },
    ).lean();
    res.json(record);
  } catch (err) {
    next(err);
  }
}

// POST /api/gst/gstr3b/file
export async function fileGstr3b(req, res, next) {
  try {
    const { period } = req.body;
    if (!period) return next(httpError(400, 'period is required'));

    const gstin = await getActiveGstin();
    const arn = `AA${Date.now().toString().slice(-10)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const record = await Gstr3b.findOneAndUpdate(
      { gstin, period },
      { $set: { status: 'filed', arn, filedAt: new Date(), gstin, period } },
      { new: true, upsert: true, runValidators: false },
    ).lean();
    res.json(record);
  } catch (err) {
    next(err);
  }
}
