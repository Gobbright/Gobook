import { Schema, model } from 'mongoose';

const stockInSchema = new Schema({
  stockInNo:   { type: String, required: true, unique: true, trim: true },
  date:        { type: Date, required: true },
  productName: { type: String, default: '', trim: true },
  supplier:    { type: String, required: true, trim: true },
  itemCount:   { type: Number, default: 0, min: 0 },
  totalQty:   { type: Number, default: 0, min: 0 },
  totalValue: { type: Number, default: 0, min: 0 },
  status:     { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
}, { timestamps: true });

stockInSchema.index({ stockInNo: 1 });
stockInSchema.index({ date: -1 });

export const StockIn = model('StockIn', stockInSchema);
