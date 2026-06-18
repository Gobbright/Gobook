import { Schema, model } from 'mongoose';

const bankBookEntrySchema = new Schema({
  bank:        { type: String, required: true, trim: true },
  accountNo:   { type: String, trim: true, default: '' },
  ifsc:        { type: String, trim: true, uppercase: true, default: '' },
  accountType: { type: String, trim: true, default: 'Current Account' },
  date:        { type: String, required: true, trim: true },
  particulars: { type: String, required: true, trim: true },
  vchType:     { type: String, required: true, trim: true },
  vchNo:       { type: String, required: true, trim: true, unique: true },
  deposit:     { type: Number, default: 0, min: 0 },
  withdrawal:  { type: Number, default: 0, min: 0 },
  balance:     { type: Number, default: 0 },
}, { timestamps: true });

bankBookEntrySchema.index({ bank: 1, date: -1 });

export const BankBookEntry = model('BankBookEntry', bankBookEntrySchema);
