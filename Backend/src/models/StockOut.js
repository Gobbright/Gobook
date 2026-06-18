import { Schema, model } from 'mongoose';

const stockOutSchema = new Schema({
  stockOutNo:  { type: String, required: true, unique: true, trim: true },
  date:        { type: Date, required: true },
  productName: { type: String, default: '', trim: true },
  to:          { type: String, required: true, trim: true },
  itemCount:   { type: Number, default: 0, min: 0 },
  totalQty:   { type: Number, default: 0, min: 0 },
  totalValue: { type: Number, default: 0, min: 0 },
  status:     { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
}, { timestamps: true });

stockOutSchema.index({ stockOutNo: 1 });
stockOutSchema.index({ date: -1 });

export const StockOut = model('StockOut', stockOutSchema);
