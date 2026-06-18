import { Router } from 'express';

import {
  createBankBookEntry,
  createCashBookEntry,
  createJournalEntry,
  createLedgerAccount,
  deleteBankBookEntry,
  deleteCashBookEntry,
  deleteJournalEntry,
  deleteLedgerAccount,
  getAccountingSummary,
  getBalanceSheet,
  getPnlStatement,
  getTrialBalance,
  listBankBookEntries,
  listCashBookEntries,
  listJournalEntries,
  listLedgerAccounts,
  updateBankBookEntry,
  updateCashBookEntry,
  updateJournalEntry,
  updateLedgerAccount,
} from './accountingController.js';

export const accountingRouter = Router();

accountingRouter.get('/', getAccountingSummary);

accountingRouter.get('/ledger', listLedgerAccounts);
accountingRouter.post('/ledger', createLedgerAccount);
accountingRouter.put('/ledger/:id', updateLedgerAccount);
accountingRouter.delete('/ledger/:id', deleteLedgerAccount);

accountingRouter.get('/journal-entries', listJournalEntries);
accountingRouter.post('/journal-entries', createJournalEntry);
accountingRouter.put('/journal-entries/:id', updateJournalEntry);
accountingRouter.delete('/journal-entries/:id', deleteJournalEntry);

accountingRouter.get('/trial-balance', getTrialBalance);
accountingRouter.get('/pnl', getPnlStatement);
accountingRouter.get('/balance-sheet', getBalanceSheet);

accountingRouter.get('/cash-book', listCashBookEntries);
accountingRouter.post('/cash-book', createCashBookEntry);
accountingRouter.put('/cash-book/:id', updateCashBookEntry);
accountingRouter.delete('/cash-book/:id', deleteCashBookEntry);

accountingRouter.get('/bank-book', listBankBookEntries);
accountingRouter.post('/bank-book', createBankBookEntry);
accountingRouter.put('/bank-book/:id', updateBankBookEntry);
accountingRouter.delete('/bank-book/:id', deleteBankBookEntry);
