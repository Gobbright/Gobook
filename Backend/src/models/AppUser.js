import { Schema, model } from 'mongoose';

const appUserSchema = new Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, trim: true, lowercase: true },
  password:     { type: String, select: false },
  businessName: { type: String, trim: true, default: '' },
  role:         { type: String, trim: true, default: 'Sales Executive' },
  branch:       { type: String, trim: true, default: '' },
  phone:        { type: String, trim: true, default: '' },
  status:       { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  lastLogin:    { type: String, default: '' },
}, { timestamps: true });

appUserSchema.index({ email: 1 }, { unique: true });

export const AppUser = model('AppUser', appUserSchema);
