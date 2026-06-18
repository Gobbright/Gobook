import { Invoice } from '../../../models/Invoice.js';
import { Product } from '../../../models/Product.js';
import { StockOut } from '../../../models/StockOut.js';
import { httpError } from '../../../utils/httpError.js';

async function nextStockOutNo() {
  const last = await StockOut.findOne({}, { stockOutNo: 1 }, { sort: { createdAt: -1 } });
  let seq = 1;
  if (last) {
    const parts = last.stockOutNo.split('-');
    const n = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return `SOUT-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function adjustStock(items, multiplier) {
  let totalQty = 0, totalValue = 0, matchedCount = 0;
  for (const item of items) {
    if (!item.description || !item.qty) continue;
    const updated = await Product.findOneAndUpdate(
      { description: new RegExp(`^${escapeRegex(item.description)}$`, 'i') },
      { $inc: { stock: multiplier * Number(item.qty) } },
      { new: false },
    );
    if (updated) {
      totalQty  += Number(item.qty);
      totalValue += Number(item.qty) * Number(item.rate ?? 0);
      matchedCount++;
    }
  }
  return { totalQty, totalValue, matchedCount };
}

async function deductStockForInvoice(invoice) {
  const items = invoice.items ?? [];
  if (items.length === 0) return;

  const { totalQty, totalValue, matchedCount } = await adjustStock(items, -1);

  if (matchedCount > 0) {
    const stockOutNo = await nextStockOutNo();
    const productName = items.filter((i) => i.description && i.qty).map((i) => i.description).join(', ');
    await StockOut.create({
      stockOutNo,
      date: invoice.meta?.date ? new Date(invoice.meta.date) : new Date(),
      productName,
      to: invoice.customer?.name || 'Customer',
      itemCount: matchedCount,
      totalQty,
      totalValue,
      status: 'Completed',
    });
  }
}

// GET /api/sales/invoices/next-number?prefix=INV
export async function getNextNumber(req, res, next) {
  try {
    const { prefix = 'INV' } = req.query;
    const last = await Invoice.findOne(
      { number: new RegExp(`^${prefix}-`, 'i') },
      { number: 1 },
      { sort: { createdAt: -1 } },
    );
    let seq = 1;
    if (last) {
      const parts = last.number.split('-');
      const n = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(n)) seq = n + 1;
    }
    res.json({ number: `${prefix}-${String(seq).padStart(4, '0')}` });
  } catch (err) {
    next(err);
  }
}

// GET /api/sales/invoices
export async function listInvoices(req, res, next) {
  try {
    const { documentType, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (documentType) filter.documentType = documentType;
    if (search) {
      filter.$or = [
        { number: new RegExp(search, 'i') },
        { 'customer.name': new RegExp(search, 'i') },
      ];
    }

    const [data, total] = await Promise.all([
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// GET /api/sales/invoices/:id
export async function getInvoice(req, res, next) {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) return next(httpError(404, 'Invoice not found'));
    res.json(invoice);
  } catch (err) {
    next(err);
  }
}

// POST /api/sales/invoices
export async function createInvoice(req, res, next) {
  try {
    const invoice = await Invoice.create(req.body);
    deductStockForInvoice(invoice).catch(() => {});
    res.status(201).json(invoice);
  } catch (err) {
    if (err.code === 11000) return next(httpError(409, `Invoice number "${req.body.number}" already exists`));
    next(err);
  }
}

// PUT /api/sales/invoices/:id
export async function updateInvoice(req, res, next) {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: false },
    ).lean();
    if (!invoice) return next(httpError(404, 'Invoice not found'));

    res.json(invoice);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/sales/invoices/:id
export async function deleteInvoice(req, res, next) {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id).lean();
    if (!invoice) return next(httpError(404, 'Invoice not found'));
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    next(err);
  }
}
