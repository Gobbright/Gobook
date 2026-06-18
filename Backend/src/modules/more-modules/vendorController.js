import { Vendor } from '../../models/Vendor.js';
import { httpError } from '../../utils/httpError.js';

// GET /api/more-modules/vendors?search=&category=
export async function listVendors(req, res, next) {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (category && category !== 'All Categories') filter.category = category;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { contact: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    const vendors = await Vendor.find(filter).sort({ name: 1 }).lean();
    const total    = vendors.length;
    const active   = vendors.filter((v) => v.status === 'Active').length;
    const categories = [...new Set(vendors.map((v) => v.category).filter(Boolean))].sort();
    res.json({ vendors, stats: { total, active, inactive: total - active }, categories });
  } catch (err) {
    next(err);
  }
}

// POST /api/more-modules/vendors
export async function createVendor(req, res, next) {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json(vendor);
  } catch (err) {
    next(err);
  }
}

// PUT /api/more-modules/vendors/:id
export async function updateVendor(req, res, next) {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true, runValidators: true },
    ).lean();
    if (!vendor) return next(httpError(404, 'Vendor not found'));
    res.json(vendor);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/more-modules/vendors/:id
export async function deleteVendor(req, res, next) {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id).lean();
    if (!vendor) return next(httpError(404, 'Vendor not found'));
    res.json({ message: 'Vendor deleted' });
  } catch (err) {
    next(err);
  }
}
