import { Schema, model } from 'mongoose';

const ledgerAccountSchema = new Schema({
  name:    { type: String, required: true, trim: true, unique: true },
  group:   { type: String, required: true, trim: true },
  opening: { type: Number, default: 0 },
  debit:   { type: Number, default: 0 },
  credit:  { type: Number, default: 0 },
  color:   { type: String, default: '#2563eb' },
}, { timestamps: true });

ledgerAccountSchema.index({ name: 'text', group: 1 });

export const LedgerAccount = model('LedgerAccount', ledgerAccountSchema);
