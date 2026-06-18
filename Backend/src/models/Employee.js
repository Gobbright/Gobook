import { Schema, model } from 'mongoose';

const employeeSchema = new Schema({
  employeeId:  { type: String, required: true, unique: true, trim: true },
  name:        { type: String, required: true, trim: true },
  dept:        { type: String, default: '', trim: true },
  designation: { type: String, default: '', trim: true },
  email:       { type: String, default: '', trim: true },
  phone:       { type: String, default: '', trim: true },
  gender:      { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  status:      { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  joinDate:    { type: String, default: '' },
  basicSalary: { type: Number, default: 0 },
}, { timestamps: true });

employeeSchema.index({ status: 1, dept: 1 });
employeeSchema.index({ name: 1 });

export const Employee = model('Employee', employeeSchema);
