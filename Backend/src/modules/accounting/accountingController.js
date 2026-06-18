import { BankBookEntry } from '../../models/BankBookEntry.js';
import { CashBookEntry } from '../../models/CashBookEntry.js';
import { JournalEntry } from '../../models/JournalEntry.js';
import { LedgerAccount } from '../../models/LedgerAccount.js';
import { httpError } from '../../utils/httpError.js';

const sumBy = (rows, key) => rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
const closingOf = (account) => Number(account.opening ?? 0) + Number(account.debit ?? 0) - Number(account.credit ?? 0);

function normalizeAmountFields(body, fields) {
  return fields.reduce((payload, field) => {
    if (body[field] !== undefined) payload[field] = Number(body[field]);
    return payload;
  }, { ...body });
}

export async function listLedgerAccounts(req, res, next) {
  try {
    const { search, group } = req.query;
    const filter = {};
    if (search) filter.name = new RegExp(search, 'i');
    if (group && group !== 'All Groups') filter.group = group;

    const accounts = await LedgerAccount.find(filter).sort({ name: 1 }).lean();
    res.json({ accounts });
  } catch (err) {
    next(err);
  }
}

export async function createLedgerAccount(req, res, next) {
  try {
    const payload = normalizeAmountFields(req.body ?? {}, ['opening', 'debit', 'credit']);
    const account = await LedgerAccount.create(payload);
    res.status(201).json({ account });
  } catch (err) {
    next(err);
  }
}

export async function updateLedgerAccount(req, res, next) {
  try {
    const payload = normalizeAmountFields(req.body ?? {}, ['opening', 'debit', 'credit']);
    const account = await LedgerAccount.findByIdAndUpdate(req.params.id, { $set: payload }, {
      new: true,
      runValidators: true,
    }).lean();
    if (!account) return next(httpError(404, 'Ledger account not found'));
    res.json({ account });
  } catch (err) {
    next(err);
  }
}

export async function deleteLedgerAccount(req, res, next) {
  try {
    const account = await LedgerAccount.findByIdAndDelete(req.params.id).lean();
    if (!account) return next(httpError(404, 'Ledger account not found'));
    res.json({ message: 'Ledger account deleted' });
  } catch (err) {
    next(err);
  }
}

export async function listJournalEntries(req, res, next) {
  try {
    const { status } = req.query;
    const filter = status && status !== 'All' ? { status } : {};
    const entries = await JournalEntry.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    res.json({ entries });
  } catch (err) {
    next(err);
  }
}

export async function createJournalEntry(req, res, next) {
  try {
    const payload = normalizeAmountFields(req.body ?? {}, ['debit', 'credit']);
    const entry = await JournalEntry.create(payload);
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function updateJournalEntry(req, res, next) {
  try {
    const payload = normalizeAmountFields(req.body ?? {}, ['debit', 'credit']);
    const entry = await JournalEntry.findByIdAndUpdate(req.params.id, { $set: payload }, {
      new: true,
      runValidators: true,
    }).lean();
    if (!entry) return next(httpError(404, 'Journal entry not found'));
    res.json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function deleteJournalEntry(req, res, next) {
  try {
    const entry = await JournalEntry.findByIdAndDelete(req.params.id).lean();
    if (!entry) return next(httpError(404, 'Journal entry not found'));
    res.json({ message: 'Journal entry deleted' });
  } catch (err) {
    next(err);
  }
}

export async function getTrialBalance(req, res, next) {
  try {
    const accounts = await LedgerAccount.find().sort({ group: 1, name: 1 }).lean();
    res.json({
      accounts: accounts.map((account) => {
        const closing = closingOf(account);
        return {
          _id: account._id,
          account: account.name,
          group: account.group,
          debit: closing >= 0 ? closing : 0,
          credit: closing < 0 ? Math.abs(closing) : 0,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

export async function getPnlStatement(req, res, next) {
  try {
    const accounts = await LedgerAccount.find().sort({ name: 1 }).lean();
    const income = accounts
      .filter((account) => /income|sales/i.test(account.group))
      .map((account) => ({ label: account.name, amount: Math.abs(closingOf(account)) }));
    const expenses = accounts
      .filter((account) => /expense|purchase/i.test(account.group))
      .map((account) => ({ label: account.name, amount: Math.abs(closingOf(account)) }));

    res.json({ income, expenses });
  } catch (err) {
    next(err);
  }
}

export async function getBalanceSheet(req, res, next) {
  try {
    const accounts = await LedgerAccount.find().sort({ name: 1 }).lean();
    const assets = accounts
      .filter((account) => /asset|cash|bank|debtor|stock/i.test(account.group))
      .map((account) => ({ label: account.name, amount: Math.abs(closingOf(account)) }));
    const liabilities = accounts
      .filter((account) => /liabilit|creditor|capital|loan/i.test(account.group))
      .map((account) => ({ label: account.name, amount: Math.abs(closingOf(account)) }));

    res.json({ liabilities, assets });
  } catch (err) {
    next(err);
  }
}

export async function listCashBookEntries(req, res, next) {
  try {
    const entries = await CashBookEntry.find().sort({ date: 1, createdAt: 1 }).lean();
    res.json({ entries });
  } catch (err) {
    next(err);
  }
}

export async function createCashBookEntry(req, res, next) {
  try {
    const payload = normalizeAmountFields(req.body ?? {}, ['receipt', 'payment', 'balance']);
    const entry = await CashBookEntry.create(payload);
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function updateCashBookEntry(req, res, next) {
  try {
    const payload = normalizeAmountFields(req.body ?? {}, ['receipt', 'payment', 'balance']);
    const entry = await CashBookEntry.findByIdAndUpdate(req.params.id, { $set: payload }, {
      new: true,
      runValidators: true,
    }).lean();
    if (!entry) return next(httpError(404, 'Cash book entry not found'));
    res.json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function deleteCashBookEntry(req, res, next) {
  try {
    const entry = await CashBookEntry.findByIdAndDelete(req.params.id).lean();
    if (!entry) return next(httpError(404, 'Cash book entry not found'));
    res.json({ message: 'Cash book entry deleted' });
  } catch (err) {
    next(err);
  }
}

export async function listBankBookEntries(req, res, next) {
  try {
    const banks = await BankBookEntry.distinct('bank');
    const bank = req.query.bank || banks[0] || '';
    const filter = bank ? { bank } : {};
    const entries = await BankBookEntry.find(filter).sort({ date: 1, createdAt: 1 }).lean();
    const first = entries[0] ?? {};

    res.json({
      banks,
      bank,
      accountNo: first.accountNo ?? '',
      ifsc: first.ifsc ?? '',
      accountType: first.accountType ?? '',
      entries,
    });
  } catch (err) {
    next(err);
  }
}

export async function createBankBookEntry(req, res, next) {
  try {
    const payload = normalizeAmountFields(req.body ?? {}, ['deposit', 'withdrawal', 'balance']);
    const entry = await BankBookEntry.create(payload);
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function updateBankBookEntry(req, res, next) {
  try {
    const payload = normalizeAmountFields(req.body ?? {}, ['deposit', 'withdrawal', 'balance']);
    const entry = await BankBookEntry.findByIdAndUpdate(req.params.id, { $set: payload }, {
      new: true,
      runValidators: true,
    }).lean();
    if (!entry) return next(httpError(404, 'Bank book entry not found'));
    res.json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function deleteBankBookEntry(req, res, next) {
  try {
    const entry = await BankBookEntry.findByIdAndDelete(req.params.id).lean();
    if (!entry) return next(httpError(404, 'Bank book entry not found'));
    res.json({ message: 'Bank book entry deleted' });
  } catch (err) {
    next(err);
  }
}

export function getAccountingSummary(_req, res) {
  res.json({
    module: 'Accounting',
    endpoints: [
      '/ledger',
      '/journal-entries',
      '/trial-balance',
      '/pnl',
      '/balance-sheet',
      '/cash-book',
      '/bank-book',
    ],
  });
}
