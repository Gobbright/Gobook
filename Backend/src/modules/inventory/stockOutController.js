import { StockOut } from '../../models/StockOut.js';
import { httpError } from '../../utils/httpError.js';

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { $gte: start, $lte: end };
}

// GET /api/inventory/stock-out/next-number
export async function getNextStockOutNumber(req, res, next) {
  try {
    const userId = req.user.id;
    const last = await StockOut.findOne({ userId }, { stockOutNo: 1 }, { sort: { createdAt: -1 } });
    let seq = 1;
    if (last) {
      const parts = last.stockOutNo.split('-');
      const n = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(n)) seq = n + 1;
    }
    const year = new Date().getFullYear();
    res.json({ number: `SOUT-${year}-${String(seq).padStart(3, '0')}` });
  } catch (err) {
    next(err);
  }
}

// GET /api/inventory/stock-out/stats
export async function getStockOutStats(req, res, next) {
  try {
    const userId = req.user.id;
    const range = monthRange();
    const [result, pending] = await Promise.all([
      StockOut.aggregate([
        { $match: { userId, date: range } },
        {
          $group: {
            _id: null,
            count:      { $sum: 1 },
            totalItems: { $sum: '$itemCount' },
            totalValue: { $sum: '$totalValue' },
          },
        },
      ]),
      StockOut.countDocuments({ userId, status: 'Pending' }),
    ]);
    const r = result[0] ?? { count: 0, totalItems: 0, totalValue: 0 };
    res.json({
      totalStockOut: r.count,
      totalItems:    r.totalItems,
      totalValue:    r.totalValue,
      pending,
    });
  } catch (err) {
    next(err);
  }
}

function applyDateRange(filter, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return;
  filter.date = {};
  if (dateFrom) filter.date.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
  if (dateTo) filter.date.$lte = new Date(`${dateTo}T23:59:59.999Z`);
}

// GET /api/inventory/stock-out?search=&dateFrom=&dateTo=&page=&limit=
export async function listStockOut(req, res, next) {
  try {
    const { search, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user.id };
    applyDateRange(filter, dateFrom, dateTo);
    if (search) {
      filter.$or = [
        { stockOutNo: new RegExp(search, 'i') },
        { to:         new RegExp(search, 'i') },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      StockOut.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)).lean(),
      StockOut.countDocuments(filter),
    ]);
    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// GET /api/inventory/stock-out/:id
export async function getStockOut(req, res, next) {
  try {
    const entry = await StockOut.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!entry) return next(httpError(404, 'Stock-out record not found'));
    res.json(entry);
  } catch (err) {
    next(err);
  }
}

// POST /api/inventory/stock-out
export async function createStockOut(req, res, next) {
  try {
    const entry = await StockOut.create({ ...req.body, userId: req.user.id });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

// PUT /api/inventory/stock-out/:id
export async function updateStockOut(req, res, next) {
  try {
    const entry = await StockOut.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true },
    ).lean();
    if (!entry) return next(httpError(404, 'Stock-out record not found'));
    res.json(entry);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/inventory/stock-out/:id
export async function deleteStockOut(req, res, next) {
  try {
    const entry = await StockOut.findOneAndDelete({ _id: req.params.id, userId: req.user.id }).lean();
    if (!entry) return next(httpError(404, 'Stock-out record not found'));
    res.json({ message: 'Stock-out record deleted' });
  } catch (err) {
    next(err);
  }
}
