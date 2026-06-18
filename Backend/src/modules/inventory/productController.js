import ExcelJS from 'exceljs';
import multer from 'multer';

import { Product } from '../../models/Product.js';
import { StockIn } from '../../models/StockIn.js';
import { httpError } from '../../utils/httpError.js';

export const uploadProductsFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/\.xlsx$/i.test(file.originalname)) cb(null, true);
    else cb(httpError(400, 'Only .xlsx files are supported'));
  },
});

const FIELD_ALIASES = {
  'product name': 'description',
  description: 'description',
  name: 'description',
  'item name': 'description',
  item: 'description',
  sku: 'code',
  code: 'code',
  'product code': 'code',
  'product id': 'code',
  'item code': 'code',
  category: 'category',
  unit: 'unit',
  uom: 'unit',
  rate: 'rate',
  price: 'rate',
  'sale price': 'rate',
  'selling price': 'rate',
  mrp: 'rate',
  gst: 'gstRate',
  'gst rate': 'gstRate',
  tax: 'gstRate',
  'tax rate': 'gstRate',
  stock: 'stock',
  quantity: 'stock',
  qty: 'stock',
  'opening stock': 'stock',
  'current stock': 'stock',
  'min stock': 'minStockLevel',
  'min stock level': 'minStockLevel',
  'minimum stock': 'minStockLevel',
  'reorder level': 'minStockLevel',
  hsn: 'hsn',
  'hsn code': 'hsn',
  'hsn sac': 'hsn',
  barcode: 'barcode',
  'bar code': 'barcode',
  status: 'status',
};

function normalizeHeader(value) {
  if (value == null) return null;
  const text = typeof value === 'object' ? (value.richText?.map((r) => r.text).join('') ?? value.text ?? '') : String(value);
  const key = text
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // strip parenthetical units, e.g. "Sale Price (₹)" -> "Sale Price"
    .replace(/[^a-z0-9\s]/g, ' ') // strip remaining symbols, e.g. "Min. Stock Level" -> "Min  Stock Level"
    .replace(/\s+/g, ' ')
    .trim();
  return FIELD_ALIASES[key] ?? null;
}

function cellValue(value) {
  if (value == null) return '';
  if (typeof value === 'object') {
    if ('result' in value) return value.result ?? '';
    if (Array.isArray(value.richText)) return value.richText.map((r) => r.text).join('');
    if ('text' in value) return value.text ?? '';
  }
  return value;
}

async function nextStockInNo() {
  const last = await StockIn.findOne({}, { stockInNo: 1 }, { sort: { createdAt: -1 } });
  let seq = 1;
  if (last) {
    const parts = last.stockInNo.split('-');
    const n = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return `SIN-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
}

// GET /api/inventory/products/stats
export async function getProductStats(req, res, next) {
  try {
    const [total, lowStock, outOfStock, valueResult] = await Promise.all([
      Product.countDocuments({ status: 'Active' }),
      Product.countDocuments({ status: 'Active', stock: { $gt: 0 }, $expr: { $lte: ['$stock', '$minStockLevel'] } }),
      Product.countDocuments({ status: 'Active', stock: 0 }),
      Product.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$rate', '$stock'] } } } },
      ]),
    ]);
    res.json({
      total,
      lowStock,
      outOfStock,
      totalValue: valueResult[0]?.totalValue ?? 0,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/inventory/products/next-code
export async function getNextProductCode(req, res, next) {
  try {
    const products = await Product.find({}, { code: 1 }).lean();
    let max = 1000;
    products.forEach(({ code }) => {
      const n = parseInt(code, 10);
      if (!isNaN(n) && n > max) max = n;
    });
    res.json({ code: String(max + 1) });
  } catch (err) {
    next(err);
  }
}

// GET /api/inventory/products?search=&category=&page=&limit=
export async function listProducts(req, res, next) {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { description: new RegExp(search, 'i') },
        { code: new RegExp(search, 'i') },
      ];
    }
    if (category && category !== 'All Categories') filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ code: 1 }).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(filter),
    ]);
    res.json({ data: products, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// GET /api/inventory/products/categories
export async function getCategories(req, res, next) {
  try {
    const categories = await Product.distinct('category');
    res.json(categories.filter(Boolean).sort());
  } catch (err) {
    next(err);
  }
}

// GET /api/inventory/products/:id
export async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return next(httpError(404, 'Product not found'));
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// POST /api/inventory/products/import
export async function importProducts(req, res, next) {
  try {
    if (!req.file) return next(httpError(400, 'No file uploaded'));

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return next(httpError(400, 'No worksheet found in file'));

    const headers = {};
    sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const field = normalizeHeader(cell.value);
      if (field) headers[colNumber] = field;
    });

    if (Object.keys(headers).length === 0) {
      return next(httpError(400, 'No recognizable columns found. Expected columns like Product Name, Code, Rate, etc.'));
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const record = {};
      for (const [colNumber, field] of Object.entries(headers)) {
        record[field] = cellValue(row.getCell(Number(colNumber)).value);
      }

      const description = String(record.description ?? '').trim();
      const code = String(record.code ?? '').trim().toUpperCase();
      if (!description && !code) continue;

      const rate = Number(record.rate);
      if (!description || !code || record.rate === '' || record.rate == null || !Number.isFinite(rate)) {
        skipped++;
        errors.push(`Row ${rowNumber}: missing or invalid required field (Code, Product Name, or Rate)`);
        continue;
      }

      const data = { code, description, rate };
      if (record.category) data.category = String(record.category).trim();
      if (record.unit) data.unit = String(record.unit).trim();
      if (record.hsn) data.hsn = String(record.hsn).trim();
      if (record.barcode) data.barcode = String(record.barcode).trim();
      if (record.gstRate !== '') {
        const g = Number(record.gstRate);
        if ([0, 5, 12, 18, 28].includes(g)) data.gstRate = g;
      }
      if (record.stock !== '') {
        const s = Number(record.stock);
        if (Number.isFinite(s)) data.stock = Math.max(0, s);
      }
      if (record.minStockLevel !== '') {
        const m = Number(record.minStockLevel);
        if (Number.isFinite(m)) data.minStockLevel = Math.max(0, m);
      }
      if (record.status) {
        const st = String(record.status).trim().toLowerCase();
        if (st === 'active') data.status = 'Active';
        else if (st === 'inactive') data.status = 'Inactive';
      }

      try {
        const existing = await Product.findOne({ code });
        let savedProduct;
        let stockQty;
        let supplier;

        if (existing) {
          savedProduct = await Product.findOneAndUpdate({ _id: existing._id }, { $set: data }, { new: true, runValidators: true });
          updated++;
          stockQty = data.stock !== undefined ? data.stock - (existing.stock ?? 0) : 0;
          supplier = 'Stock Adjustment';
        } else {
          savedProduct = await Product.create(data);
          imported++;
          stockQty = data.stock ?? 0;
          supplier = 'Initial Stock';
        }

        if (stockQty > 0) {
          try {
            const stockInNo = await nextStockInNo();
            await StockIn.create({
              stockInNo,
              date: new Date(),
              productName: savedProduct.description,
              supplier,
              itemCount: 1,
              totalQty: stockQty,
              totalValue: stockQty * savedProduct.rate,
              status: 'Completed',
            });
          } catch {
            // ignore stock-in logging failure; product import already succeeded
          }
        }
      } catch (err) {
        skipped++;
        errors.push(`Row ${rowNumber}: ${err.code === 11000 ? `Duplicate product code "${code}"` : err.message}`);
      }
    }

    res.json({ imported, updated, skipped, errors });
  } catch (err) {
    next(err);
  }
}

// POST /api/inventory/products
export async function createProduct(req, res, next) {
  try {
    const product = await Product.create(req.body);

    if (product.stock > 0) {
      nextStockInNo()
        .then((stockInNo) =>
          StockIn.create({
            stockInNo,
            date: new Date(),
            productName: product.description,
            supplier: 'Initial Stock',
            itemCount: 1,
            totalQty: product.stock,
            totalValue: product.stock * product.rate,
            status: 'Completed',
          }),
        )
        .catch(() => {});
    }

    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) return next(httpError(409, `Product code "${req.body.code}" already exists`));
    next(err);
  }
}

// PUT /api/inventory/products/:id
export async function updateProduct(req, res, next) {
  try {
    const old = await Product.findById(req.params.id).lean();

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    ).lean();
    if (!product) return next(httpError(404, 'Product not found'));

    const stockDiff = (product.stock ?? 0) - (old?.stock ?? 0);
    if (stockDiff > 0) {
      nextStockInNo()
        .then((stockInNo) =>
          StockIn.create({
            stockInNo,
            date: new Date(),
            productName: product.description,
            supplier: 'Stock Adjustment',
            itemCount: 1,
            totalQty: stockDiff,
            totalValue: stockDiff * product.rate,
            status: 'Completed',
          }),
        )
        .catch(() => {});
    }

    res.json(product);
  } catch (err) {
    if (err.code === 11000) return next(httpError(409, `Product code "${req.body.code}" already exists`));
    next(err);
  }
}

// DELETE /api/inventory/products/:id
export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id).lean();
    if (!product) return next(httpError(404, 'Product not found'));
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}
