import { StockIn } from '../../models/StockIn.js';
import { httpError } from '../../utils/httpError.js';

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { $gte: start, $lte: end };
}

// GET /api/inventory/stock-in/next-number
export async function getNextStockInNumber(req, res, next) {
  try {
    const last = await StockIn.findOne({}, { stockInNo: 1 }, { sort: { createdAt: -1 } });
    let seq = 1;
    if (last) {
      const parts = last.stockInNo.split('-');
      const n = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(n)) seq = n + 1;
    }
    const year = new Date().getFullYear();
    res.json({ number: `SIN-${year}-${String(seq).padStart(3, '0')}` });
  } catch (err) {
    next(err);
  }
}

// GET /api/inventory/stock-in/stats
export async function getStockInStats(req, res, next) {
  try {
    const range = monthRange();
    const [result, pending] = await Promise.all([
      StockIn.aggregate([
        { $match: { date: range } },
        {
          $group: {
            _id: null,
            count:      { $sum: 1 },
            totalItems: { $sum: '$itemCount' },
            totalValue: { $sum: '$totalValue' },
            totalQty:   { $sum: '$totalQty' },
          },
        },
      ]),
      StockIn.countDocuments({ status: 'Pending' }),
    ]);
    const r = result[0] ?? { count: 0, totalItems: 0, totalValue: 0, totalQty: 0 };
    res.json({
      totalStockIn: r.count,
      totalItems:   r.totalItems,
      totalValue:   r.totalValue,
      avgCost:      r.totalQty > 0 ? r.totalValue / r.totalQty : 0,
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

// GET /api/inventory/stock-in?search=&dateFrom=&dateTo=&page=&limit=
export async function listStockIn(req, res, next) {
  try {
    const { search, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const filter = {};
    applyDateRange(filter, dateFrom, dateTo);
    if (search) {
      filter.$or = [
        { stockInNo: new RegExp(search, 'i') },
        { supplier:  new RegExp(search, 'i') },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      StockIn.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)).lean(),
      StockIn.countDocuments(filter),
    ]);
    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// GET /api/inventory/stock-in/:id
export async function getStockIn(req, res, next) {
  try {
    const entry = await StockIn.findById(req.params.id).lean();
    if (!entry) return next(httpError(404, 'Stock-in record not found'));
    res.json(entry);
  } catch (err) {
    next(err);
  }
}

// POST /api/inventory/stock-in
export async function createStockIn(req, res, next) {
  try {
    const entry = await StockIn.create(req.body);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

// PUT /api/inventory/stock-in/:id
export async function updateStockIn(req, res, next) {
  try {
    const entry = await StockIn.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    ).lean();
    if (!entry) return next(httpError(404, 'Stock-in record not found'));
    res.json(entry);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/inventory/stock-in/:id
export async function deleteStockIn(req, res, next) {
  try {
    const entry = await StockIn.findByIdAndDelete(req.params.id).lean();
    if (!entry) return next(httpError(404, 'Stock-in record not found'));
    res.json({ message: 'Stock-in record deleted' });
  } catch (err) {
    next(err);
  }
}
