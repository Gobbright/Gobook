import { Invoice } from '../../../models/Invoice.js';
import { httpError } from '../../../utils/httpError.js';

const DOCTYPE = 'debit-note';

// GET /api/sales/debit-notes/next-number?prefix=DBN
export async function getNextDebitNoteNumber(req, res, next) {
  try {
    const { prefix = 'DBN' } = req.query;
    const userId = req.user.id;
    const last = await Invoice.findOne(
      { userId, documentType: DOCTYPE, number: new RegExp(`^${prefix}-`, 'i') },
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

// GET /api/sales/debit-notes
export async function listDebitNotes(req, res, next) {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user.id, documentType: DOCTYPE };
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

// GET /api/sales/debit-notes/:id
export async function getDebitNote(req, res, next) {
  try {
    const note = await Invoice.findOne({ _id: req.params.id, userId: req.user.id, documentType: DOCTYPE }).lean();
    if (!note) return next(httpError(404, 'Debit note not found'));
    res.json(note);
  } catch (err) {
    next(err);
  }
}

// POST /api/sales/debit-notes
export async function createDebitNote(req, res, next) {
  try {
    const note = await Invoice.create({ ...req.body, userId: req.user.id, documentType: DOCTYPE });
    res.status(201).json(note);
  } catch (err) {
    if (err.code === 11000) return next(httpError(409, `Debit note number "${req.body.number}" already exists`));
    next(err);
  }
}

// PUT /api/sales/debit-notes/:id
export async function updateDebitNote(req, res, next) {
  try {
    const note = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, documentType: DOCTYPE },
      { $set: { ...req.body, documentType: DOCTYPE } },
      { new: true, runValidators: false },
    ).lean();
    if (!note) return next(httpError(404, 'Debit note not found'));
    res.json(note);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/sales/debit-notes/:id
export async function deleteDebitNote(req, res, next) {
  try {
    const note = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.user.id, documentType: DOCTYPE }).lean();
    if (!note) return next(httpError(404, 'Debit note not found'));
    res.json({ message: 'Debit note deleted successfully' });
  } catch (err) {
    next(err);
  }
}
