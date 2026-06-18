import { apiClient } from './apiClient.js';

export function getLedgerAccounts() {
  return apiClient('/accounting/ledger');
}

export function createLedgerAccount(account) {
  return apiClient('/accounting/ledger', {
    method: 'POST',
    body: JSON.stringify(account),
  });
}

export function updateLedgerAccount(id, account) {
  return apiClient(`/accounting/ledger/${id}`, {
    method: 'PUT',
    body: JSON.stringify(account),
  });
}

export function deleteLedgerAccount(id) {
  return apiClient(`/accounting/ledger/${id}`, { method: 'DELETE' });
}

export function getJournalEntries() {
  return apiClient('/accounting/journal-entries');
}

export function createJournalEntry(entry) {
  return apiClient('/accounting/journal-entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export function updateJournalEntry(id, entry) {
  return apiClient(`/accounting/journal-entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  });
}

export function deleteJournalEntry(id) {
  return apiClient(`/accounting/journal-entries/${id}`, { method: 'DELETE' });
}

export function getTrialBalance() {
  return apiClient('/accounting/trial-balance');
}

export function getPnlStatement() {
  return apiClient('/accounting/pnl');
}

export function getBalanceSheet() {
  return apiClient('/accounting/balance-sheet');
}

export function getCashBook() {
  return apiClient('/accounting/cash-book');
}

export function createCashBookEntry(entry) {
  return apiClient('/accounting/cash-book', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export function updateCashBookEntry(id, entry) {
  return apiClient(`/accounting/cash-book/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  });
}

export function deleteCashBookEntry(id) {
  return apiClient(`/accounting/cash-book/${id}`, { method: 'DELETE' });
}

export function getBankBook(bank) {
  const query = bank ? `?bank=${encodeURIComponent(bank)}` : '';
  return apiClient(`/accounting/bank-book${query}`);
}

export function createBankBookEntry(entry) {
  return apiClient('/accounting/bank-book', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export function updateBankBookEntry(id, entry) {
  return apiClient(`/accounting/bank-book/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  });
}

export function deleteBankBookEntry(id) {
  return apiClient(`/accounting/bank-book/${id}`, { method: 'DELETE' });
}
