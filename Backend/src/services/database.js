import mongoose from 'mongoose';

import { env } from '../config/env.js';

async function dropLegacyIndexes() {
  const db = mongoose.connection.db;
  const drops = [
    { col: 'products',        index: 'code_1' },
    { col: 'employees',       index: 'employeeId_1' },
    { col: 'invoices',        index: 'number_1' },
    { col: 'stockins',        index: 'stockInNo_1' },
    { col: 'stockouts',       index: 'stockOutNo_1' },
    { col: 'bankbookentries', index: 'vchNo_1' },
    { col: 'cashbookentries', index: 'vchNo_1' },
    { col: 'journalentries',  index: 'entryNo_1' },
    { col: 'ledgeraccounts',  index: 'name_1' },
    { col: 'salesrecords',    index: 'number_1' },
    { col: 'leaves',          index: 'leaveId_1' },
    { col: 'branches',        index: 'code_1' },
    { col: 'attendances',     index: 'employeeId_1_date_1' },
    { col: 'payrolls',        index: 'employeeId_1_month_1' },
  ];
  for (const { col, index } of drops) {
    await db.collection(col).dropIndex(index).catch(() => {});
  }
}

export async function connectDatabase() {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  await mongoose.connect(env.mongodbUri, {
    dbName: env.mongodbDbName,
  });

  await dropLegacyIndexes();
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
