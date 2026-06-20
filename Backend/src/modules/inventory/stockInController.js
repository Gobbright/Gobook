import { StockIn } from '../../models/StockIn.js';
import { httpError } from '../../utils/httpError.js';
import { asNumber, asText, enumValue, importSummary, parseExcelRows } from '../../utils/excelImport.js';

const STOCK_IN_IMPORT_COLUMNS = {
  'stock in no': 'stockInNo',
  'stock no': 'stockInNo',
  stockinno: 'stockInNo',
  number: 'stockInNo',
  grn: 'stockInNo',
  'grn no': 'stockInNo',
  'grn number': 'stockInNo',
  'gr no': 'stockInNo',
  date: 'date',
  product: 'productName',
  'product name': 'productName',
  'item name': 'productName',
  supplier: 'supplier',
  vendor: 'supplier',
  'item count': 'itemCount',
  'no of items': 'itemCount',
  'item qty': 'itemCount',
  items: 'itemCount',
  qty: 'totalQty',
  quantity: 'totalQty',
  'total qty': 'totalQty',
  value: 'totalValue',
  'total value': 'totalValue',
  amount: 'totalValue',
  'total amount': 'totalValue',
  'purchase value': 'totalValue',
  cost: 'totalValue',
  status: 'status',
};

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { $gte: start, $lte: end };
}

// GET /api/inventory/stock-in/next-number
export async function getNextStockInNumber(req, res, next) {
  try {
    const userId = req.user.id;
    const last = await StockIn.findOne({ userId }, { stockInNo: 1 }, { sort: { createdAt: -1 } });
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
    const userId = req.user.id;
    const range = monthRange();
    const [result, pending] = await Promise.all([
      StockIn.aggregate([
        { $match: { userId, date: range } },
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
      StockIn.countDocuments({ userId, status: 'Pending' }),
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
    const filter = { userId: req.user.id };
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
    const entry = await StockIn.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!entry) return next(httpError(404, 'Stock-in record not found'));
    res.json(entry);
  } catch (err) {
    next(err);
  }
}

// POST /api/inventory/stock-in
export async function createStockIn(req, res, next) {
  try {
    const { stockInNo } = req.body;
    const userId = req.user.id;
    if (stockInNo) {
      const existing = await StockIn.findOne({ userId, stockInNo });
      if (existing) return next(httpError(409, `Stock-in record "${stockInNo}" already exists`));
    }
    const entry = await StockIn.create({ ...req.body, userId });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

// POST /api/inventory/stock-in/import
export async function importStockIn(req, res, next) {
  try {
    const userId = req.user.id;
    const rows = await parseExcelRows(req.file, STOCK_IN_IMPORT_COLUMNS, 'Stock In No, Date, Supplier, Qty, Value');
    const summary = importSummary();

    for (const { rowNumber, record } of rows) {
      const stockInNo = asText(record.stockInNo);
      const dateText = asText(record.date);
      const supplier = asText(record.supplier);
      if (!stockInNo || !dateText || !supplier) {
        summary.skipped++;
        summary.errors.push(`Row ${rowNumber}: stock in no, date, and supplier are required`);
        continue;
      }

      const date = new Date(dateText);
      if (Number.isNaN(date.getTime())) {
        summary.skipped++;
        summary.errors.push(`Row ${rowNumber}: invalid date`);
        continue;
      }

      const data = {
        userId,
        stockInNo,
        date,
        productName: asText(record.productName),
        supplier,
        itemCount: asNumber(record.itemCount, 0),
        totalQty: asNumber(record.totalQty, 0),
        totalValue: asNumber(record.totalValue, 0),
        status: enumValue(record.status, ['Pending', 'Completed'], 'Completed'),
      };

      const existing = await StockIn.findOne({ userId, stockInNo });
      if (existing) {
        await StockIn.findByIdAndUpdate(existing._id, { $set: data }, { runValidators: true });
        summary.updated++;
      } else {
        await StockIn.create(data);
        summary.imported++;
      }
    }

    res.json(summary);
  } catch (err) {
    if (err.code === 11000) return next(httpError(409, 'Duplicate stock-in number found in import'));
    next(err);
  }
}

// PUT /api/inventory/stock-in/:id
export async function updateStockIn(req, res, next) {
  try {
    const entry = await StockIn.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
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
    const entry = await StockIn.findOneAndDelete({ _id: req.params.id, userId: req.user.id }).lean();
    if (!entry) return next(httpError(404, 'Stock-in record not found'));
    res.json({ message: 'Stock-in record deleted' });
  } catch (err) {
    next(err);
  }
}
