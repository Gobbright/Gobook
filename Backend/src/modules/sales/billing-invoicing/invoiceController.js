import { Invoice } from '../../../models/Invoice.js';
import { Product } from '../../../models/Product.js';
import { StockOut } from '../../../models/StockOut.js';
import { BusinessSettings } from '../../../models/BusinessSettings.js';
import { httpError } from '../../../utils/httpError.js';
import { sendMail } from '../../../utils/mailer.js';

async function nextStockOutNo(userId) {
  const last = await StockOut.findOne({ userId }, { stockOutNo: 1 }, { sort: { createdAt: -1 } });
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

async function adjustStock(items, multiplier, userId) {
  let totalQty = 0, totalValue = 0, matchedCount = 0;
  for (const item of items) {
    if (!item.description || !item.qty) continue;
    const updated = await Product.findOneAndUpdate(
      { userId, description: new RegExp(`^${escapeRegex(item.description)}$`, 'i') },
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

async function deductStockForInvoice(invoice, userId) {
  const items = invoice.items ?? [];
  if (items.length === 0) return;

  const { totalQty, totalValue, matchedCount } = await adjustStock(items, -1, userId);

  if (matchedCount > 0) {
    const stockOutNo = await nextStockOutNo(userId);
    const productName = items.filter((i) => i.description && i.qty).map((i) => i.description).join(', ');
    await StockOut.create({
      userId,
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
    const userId = req.user.id;
    const last = await Invoice.findOne(
      { userId, number: new RegExp(`^${prefix}-`, 'i') },
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
    const filter = { userId: req.user.id };
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
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!invoice) return next(httpError(404, 'Invoice not found'));
    res.json(invoice);
  } catch (err) {
    next(err);
  }
}

// POST /api/sales/invoices
export async function createInvoice(req, res, next) {
  try {
    const invoice = await Invoice.create({ ...req.body, userId: req.user.id });
    deductStockForInvoice(invoice, req.user.id).catch(() => {});
    res.status(201).json(invoice);
  } catch (err) {
    if (err.code === 11000) return next(httpError(409, `Invoice number "${req.body.number}" already exists`));
    next(err);
  }
}

// PUT /api/sales/invoices/:id
export async function updateInvoice(req, res, next) {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
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
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.user.id }).lean();
    if (!invoice) return next(httpError(404, 'Invoice not found'));
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// POST /api/sales/invoices/:id/send-email
export async function sendInvoiceEmail(req, res, next) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!invoice) return next(httpError(404, 'Invoice not found'));

    const { toEmail } = req.body;
    if (!toEmail) return next(httpError(400, 'Recipient email is required'));

    const biz = await BusinessSettings.findOne({ userId: req.user.id }).lean() || {};
    const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    const fmtDate = (s) => { if (!s) return '-'; const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };

    const itemRows = (invoice.items || [])
      .filter((it) => it.description || Number(it.rate) > 0)
      .map((it) => {
        const total = (Number(it.qty) || 0) * (Number(it.rate) || 0) * (1 - (Number(it.discount) || 0) / 100);
        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${it.description || '-'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${it.qty}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${fmtCurrency(it.rate)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${fmtCurrency(total)}</td>
        </tr>`;
      }).join('');

    const grandTotal = fmtCurrency(invoice.grandTotal || invoice.totals?.grandTotal || 0);
    const docLabel = { invoice: 'Invoice', quotation: 'Quotation', 'credit-note': 'Credit Note', 'debit-note': 'Debit Note', 'delivery-challan': 'Delivery Challan' }[invoice.documentType] || 'Invoice';

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:#1e40af;padding:28px 32px">
    <div style="font-size:22px;font-weight:700;color:#ffffff">${biz.businessName || 'GoBook Enterprises'}</div>
    ${biz.gstin ? `<div style="font-size:12px;color:#bfdbfe;margin-top:4px">GSTIN: ${biz.gstin}</div>` : ''}
  </div>
  <div style="padding:28px 32px">
    <div style="font-size:18px;font-weight:600;color:#111827;margin-bottom:4px">${docLabel} #${invoice.number}</div>
    <div style="font-size:13px;color:#6b7280;margin-bottom:20px">Date: ${fmtDate(invoice.meta?.date)}${invoice.meta?.dueDate ? ` &nbsp;|&nbsp; Due: ${fmtDate(invoice.meta.dueDate)}` : ''}</div>

    <div style="background:#f9fafb;border-radius:6px;padding:16px 20px;margin-bottom:24px">
      <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin-bottom:8px">Bill To</div>
      <div style="font-size:15px;font-weight:600;color:#111827">${invoice.customer?.name || '-'}</div>
      ${invoice.customer?.gstin ? `<div style="font-size:12px;color:#6b7280">GSTIN: ${invoice.customer.gstin}</div>` : ''}
      ${invoice.customer?.address ? `<div style="font-size:13px;color:#374151;margin-top:4px">${invoice.customer.address}${invoice.customer.city ? ', ' + invoice.customer.city : ''}${invoice.customer.state ? ', ' + invoice.customer.state : ''}</div>` : ''}
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151">Item</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#374151">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-weight:600;color:#374151">Rate</th>
          <th style="padding:10px 12px;text-align:right;font-weight:600;color:#374151">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="text-align:right;margin-bottom:24px">
      <div style="display:inline-block;background:#1e40af;color:#fff;padding:12px 24px;border-radius:6px;font-size:16px;font-weight:700">Total: ${grandTotal}</div>
    </div>

    ${invoice.notes ? `<div style="border-top:1px solid #e5e7eb;padding-top:16px;font-size:13px;color:#6b7280"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}
    ${invoice.terms ? `<div style="margin-top:8px;font-size:13px;color:#6b7280"><strong>Terms:</strong> ${invoice.terms}</div>` : ''}

    ${biz.bankName ? `<div style="margin-top:20px;background:#f9fafb;border-radius:6px;padding:14px 18px;font-size:13px;color:#374151">
      <div style="font-weight:600;margin-bottom:6px">Bank Details</div>
      <div>${biz.bankName}${biz.accountNumber ? ' &nbsp;|&nbsp; A/C: ' + biz.accountNumber : ''}${biz.ifscCode ? ' &nbsp;|&nbsp; IFSC: ' + biz.ifscCode : ''}</div>
    </div>` : ''}
  </div>
  <div style="background:#f9fafb;padding:16px 32px;font-size:12px;color:#9ca3af;text-align:center">
    ${biz.businessEmail ? biz.businessEmail : ''}${biz.phone ? (biz.businessEmail ? ' &nbsp;·&nbsp; ' : '') + biz.phone : ''}
    <br>This is a system-generated ${docLabel.toLowerCase()}. Please do not reply to this email.
  </div>
</div>
</body></html>`;

    await sendMail({ to: toEmail, subject: `${docLabel} #${invoice.number} from ${biz.businessName || 'GoBook Enterprises'}`, html });
    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    next(err);
  }
}
