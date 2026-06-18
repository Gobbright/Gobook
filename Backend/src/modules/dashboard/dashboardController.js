import { Invoice } from '../../models/Invoice.js';
import { Product } from '../../models/Product.js';

function fmtCurrency(n) {
  return `INR ${Number(n).toLocaleString('en-IN')}`;
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
}

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { $gte: start, $lte: end };
}

function sumTotals(invoices) {
  return invoices.reduce((a, inv) => {
    const t = inv.totals ?? {};
    return a + Number(t.grandTotal ?? t.total ?? t.subTotal ?? 0);
  }, 0);
}

// GET /api/dashboard/summary
export async function getDashboardSummary(_req, res, next) {
  try {
    const [todayInvoices, monthInvoices, pendingInvoices, recentInvoices, lowStockProducts] = await Promise.all([
      Invoice.find({ documentType: 'invoice', status: 'paid', createdAt: todayRange() }).select('totals').lean(),
      Invoice.find({ documentType: 'invoice', status: { $in: ['paid', 'sent'] }, createdAt: monthRange() }).select('totals').lean(),
      Invoice.find({ documentType: 'invoice', status: { $in: ['sent', 'overdue'] } }).select('totals').lean(),
      Invoice.find({ documentType: 'invoice' }).sort({ createdAt: -1 }).limit(5).lean(),
      Product.find({ $expr: { $lte: ['$stock', '$minStockLevel'] }, status: 'Active' }).select('description stock minStockLevel').lean(),
    ]);

    const todaySales   = sumTotals(todayInvoices);
    const monthRevenue = sumTotals(monthInvoices);
    const pending      = sumTotals(pendingInvoices);

    const metrics = [
      { label: "Today's Sales",    value: fmtCurrency(todaySales),   trend: `${todayInvoices.length} invoice(s)`,    tone: 'blue' },
      { label: 'Monthly Revenue',  value: fmtCurrency(monthRevenue), trend: `${monthInvoices.length} invoice(s)`,    tone: 'green' },
      { label: 'Pending Payments', value: fmtCurrency(pending),      trend: `${pendingInvoices.length} pending`,     tone: 'orange' },
      { label: 'Low Stock Items',  value: String(lowStockProducts.length), trend: 'Below min stock level',          tone: 'purple' },
    ];

    const transactions = recentInvoices.map((inv) => {
      const t = inv.totals ?? {};
      const amt = Number(t.grandTotal ?? t.total ?? t.subTotal ?? 0);
      return {
        invoice:  inv.number,
        customer: inv.customer?.name ?? '—',
        amount:   fmtCurrency(amt),
        status:   inv.status === 'paid' ? 'Paid' : inv.status === 'overdue' ? 'Overdue' : 'Pending',
        date:     new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      };
    });

    const reminders = [];
    if (pendingInvoices.length > 0) {
      reminders.push({ title: `${pendingInvoices.length} Pending Invoice(s)`, description: `Total: ${fmtCurrency(pending)}` });
    }
    if (lowStockProducts.length > 0) {
      reminders.push({ title: 'Inventory Low Stock Alert', description: `${lowStockProducts.length} item(s) below minimum stock level` });
    }
    const overdueCount = pendingInvoices.filter((i) => i.status === 'overdue').length;
    if (overdueCount > 0) {
      reminders.push({ title: 'Overdue Invoices', description: `${overdueCount} invoice(s) are overdue` });
    }

    const insights = [];
    if (monthRevenue > 0) insights.push(`Monthly revenue is ${fmtCurrency(monthRevenue)}`);
    if (lowStockProducts.length > 0) insights.push(`Restock ${lowStockProducts.length} low-stock item(s) soon`);
    if (pendingInvoices.length > 0) insights.push(`Follow up on ${pendingInvoices.length} pending payment(s)`);

    res.json({ metrics, transactions, reminders, insights });
  } catch (err) {
    next(err);
  }
}
