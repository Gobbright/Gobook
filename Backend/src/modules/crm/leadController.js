import { Lead } from '../../models/Lead.js';
import { httpError } from '../../utils/httpError.js';

// GET /api/crm/leads?search=
export async function listLeads(req, res, next) {
  try {
    const { search, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ leads });
  } catch (err) {
    next(err);
  }
}

// POST /api/crm/leads
export async function createLead(req, res, next) {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
}

// PUT /api/crm/leads/:id
export async function updateLead(req, res, next) {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    ).lean();
    if (!lead) return next(httpError(404, 'Lead not found'));
    res.json(lead);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/crm/leads/:id
export async function deleteLead(req, res, next) {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id).lean();
    if (!lead) return next(httpError(404, 'Lead not found'));
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    next(err);
  }
}
