import { Product } from '../../../models/Product.js';
import { httpError } from '../../../utils/httpError.js';

// GET /api/sales/products?search=
export async function listProducts(req, res, next) {
  try {
    const { search } = req.query;
    const filter = search
      ? {
          $or: [
            { description: new RegExp(search, 'i') },
            { code: new RegExp(search, 'i') },
            { hsn: new RegExp(search, 'i') },
          ],
        }
      : {};
    const products = await Product.find(filter).sort({ code: 1 }).limit(200).lean();
    res.json(products);
  } catch (err) {
    next(err);
  }
}

// GET /api/sales/products/:id
export async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return next(httpError(404, 'Product not found'));
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// POST /api/sales/products
export async function createProduct(req, res, next) {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) return next(httpError(409, `Product code "${req.body.code}" already exists`));
    next(err);
  }
}

// PUT /api/sales/products/:id
export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    ).lean();
    if (!product) return next(httpError(404, 'Product not found'));
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/sales/products/:id
export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id).lean();
    if (!product) return next(httpError(404, 'Product not found'));
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}
