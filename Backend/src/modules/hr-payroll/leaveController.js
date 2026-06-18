import { Leave } from '../../models/Leave.js';
import { httpError } from '../../utils/httpError.js';

async function nextLeaveId() {
  const last = await Leave.findOne({}, { leaveId: 1 }, { sort: { createdAt: -1 } });
  let seq = 1;
  if (last) {
    const parts = last.leaveId.split('-');
    const n = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return `LV-${String(seq).padStart(3, '0')}`;
}

// GET /api/hr-payroll/leaves/stats
export async function getLeaveStats(req, res, next) {
  try {
    const result = await Leave.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    const stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
    for (const r of result) {
      stats.total += r.count;
      if (r._id === 'Pending') stats.pending = r.count;
      else if (r._id === 'Approved') stats.approved = r.count;
      else if (r._id === 'Rejected') stats.rejected = r.count;
    }
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

// GET /api/hr-payroll/leaves?status=&page=&limit=
export async function listLeaves(req, res, next) {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== 'All Status') filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Leave.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Leave.countDocuments(filter),
    ]);
    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// GET /api/hr-payroll/leaves/:id
export async function getLeave(req, res, next) {
  try {
    const leave = await Leave.findById(req.params.id).lean();
    if (!leave) return next(httpError(404, 'Leave request not found'));
    res.json(leave);
  } catch (err) {
    next(err);
  }
}

// POST /api/hr-payroll/leaves
export async function createLeave(req, res, next) {
  try {
    const leaveId = await nextLeaveId();
    const leave = await Leave.create({ ...req.body, leaveId });
    res.status(201).json(leave);
  } catch (err) {
    if (err.code === 11000) return next(httpError(409, 'Leave ID already exists'));
    next(err);
  }
}

// PUT /api/hr-payroll/leaves/:id
export async function updateLeave(req, res, next) {
  try {
    const { leaveId, ...rest } = req.body;
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { $set: rest },
      { new: true, runValidators: true },
    ).lean();
    if (!leave) return next(httpError(404, 'Leave request not found'));
    res.json(leave);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/hr-payroll/leaves/:id/status
export async function patchLeaveStatus(req, res, next) {
  try {
    const { status } = req.body;
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true },
    ).lean();
    if (!leave) return next(httpError(404, 'Leave request not found'));
    res.json(leave);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/hr-payroll/leaves/:id
export async function deleteLeave(req, res, next) {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id).lean();
    if (!leave) return next(httpError(404, 'Leave request not found'));
    res.json({ message: 'Leave request deleted' });
  } catch (err) {
    next(err);
  }
}
