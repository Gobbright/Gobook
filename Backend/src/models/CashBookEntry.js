import { Schema, model } from 'mongoose';

const cashBookEntrySchema = new Schema({
  date:        { type: String, required: true, trim: true },
  particulars: { type: String, required: true, trim: true },
  vchType:     { type: String, required: true, trim: true },
  vchNo:       { type: String, required: true, trim: true, unique: true },
  receipt:     { type: Number, default: 0, min: 0 },
  payment:     { type: Number, default: 0, min: 0 },
  balance:     { type: Number, default: 0 },
}, { timestamps: true });

cashBookEntrySchema.index({ date: -1, vchType: 1 });

export const CashBookEntry = model('CashBookEntry', cashBookEntrySchema);
