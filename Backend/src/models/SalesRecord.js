import { Schema, model } from 'mongoose';

const salesRecordSchema = new Schema({
  date:     { type: String, required: true },
  number:   { type: String, required: true, trim: true, unique: true },
  customer: { type: String, trim: true, default: '' },
  person:   { type: String, trim: true, default: '' },
  amount:   { type: Number, default: 0, min: 0 },
  status:   { type: String, trim: true, default: 'Pending' },
  type:     { type: String, enum: ['quotation', 'order', 'invoice'], default: 'quotation' },
}, { timestamps: true });

salesRecordSchema.index({ type: 1, status: 1, createdAt: -1 });

export const SalesRecord = model('SalesRecord', salesRecordSchema);
