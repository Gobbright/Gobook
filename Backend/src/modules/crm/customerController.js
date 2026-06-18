import { Customer } from '../../models/Customer.js';
import { httpError } from '../../utils/httpError.js';

// GET /api/crm/customers?search=
export async function listCustomers(req, res, next) {
  try {
    const { search } = req.query;
    const filter = search
      ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }] }
      : {};
    const customers = await Customer.find(filter).sort({ name: 1 }).lean();
    res.json({ customers });
  } catch (err) {
    next(err);
  }
}

// POST /api/crm/customers
export async function createCustomer(req, res, next) {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
}

// PUT /api/crm/customers/:id
export async function updateCustomer(req, res, next) {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    ).lean();
    if (!customer) return next(httpError(404, 'Customer not found'));
    res.json(customer);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/crm/customers/:id
export async function deleteCustomer(req, res, next) {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id).lean();
    if (!customer) return next(httpError(404, 'Customer not found'));
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    next(err);
  }
}
