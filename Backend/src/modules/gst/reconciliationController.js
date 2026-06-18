import { GstReconciliation } from '../../models/GstReconciliation.js';
import { httpError } from '../../utils/httpError.js';
import { getActiveGstin } from '../../utils/gst.js';

// GET /api/gst/reconciliation?period=May+2026&type=2b
export async function getReconciliation(req, res, next) {
  try {
    const { period, type = '2b' } = req.query;
    if (!period) return next(httpError(400, 'period is required'));

    const gstin = await getActiveGstin();
    const record = await GstReconciliation.findOne({ gstin, period, type }).lean();
    res.json(record ?? null);
  } catch (err) {
    next(err);
  }
}

// PUT /api/gst/reconciliation — upsert entries for a period
export async function saveReconciliation(req, res, next) {
  try {
    const { period, type = '2b', entries } = req.body;
    if (!period) return next(httpError(400, 'period is required'));

    const gstin = await getActiveGstin();
    const record = await GstReconciliation.findOneAndUpdate(
      { gstin, period, type },
      { $set: { entries, gstin, period, type } },
      { new: true, upsert: true, runValidators: false },
    ).lean();
    res.json(record);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/gst/reconciliation/entry/:entryId — accept or dispute a single entry
export async function updateEntry(req, res, next) {
  try {
    const { entryId } = req.params;
    const { period, type = '2b', resolution } = req.body;
    if (!period) return next(httpError(400, 'period is required'));
    if (!['accepted', 'disputed', 'none'].includes(resolution)) {
      return next(httpError(400, 'resolution must be accepted, disputed, or none'));
    }

    const gstin = await getActiveGstin();
    const record = await GstReconciliation.findOneAndUpdate(
      { gstin, period, type, 'entries._id': entryId },
      { $set: { 'entries.$.resolution': resolution } },
      { new: true, runValidators: false },
    ).lean();
    if (!record) return next(httpError(404, 'Entry not found'));
    res.json(record);
  } catch (err) {
    next(err);
  }
}
