import { Schema, model } from 'mongoose';

const branchSchema = new Schema({
  name:    { type: String, required: true, trim: true },
  code:    { type: String, required: true, trim: true, uppercase: true },
  manager: { type: String, trim: true, default: '' },
  phone:   { type: String, trim: true, default: '' },
  email:   { type: String, trim: true, lowercase: true, default: '' },
  city:    { type: String, trim: true, default: '' },
  status:  { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  users:   { type: Number, default: 0, min: 0 },
  revenue: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

branchSchema.index({ code: 1 }, { unique: true });

export const Branch = model('Branch', branchSchema);
