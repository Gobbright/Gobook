import { Schema, model } from 'mongoose';

const productSchema = new Schema({
  code:          { type: String, required: true, trim: true, uppercase: true, unique: true },
  description:   { type: String, required: true, trim: true },
  hsn:           { type: String, trim: true, default: '' },
  unit:          { type: String, trim: true, default: 'Nos' },
  rate:          { type: Number, required: true, min: 0 },
  gstRate:       { type: Number, default: 18, enum: [0, 5, 12, 18, 28] },
  category:      { type: String, trim: true, default: '' },
  stock:         { type: Number, default: 0, min: 0 },
  minStockLevel: { type: Number, default: 0, min: 0 },
  barcode:       { type: String, trim: true, default: '' },
  status:        { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

productSchema.index({ description: 'text', code: 1, hsn: 1 });

export const Product = model('Product', productSchema);
