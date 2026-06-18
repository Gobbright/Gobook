import { Schema, model } from 'mongoose';

const leaveSchema = new Schema({
  leaveId:    { type: String, required: true, unique: true, trim: true },
  name:       { type: String, required: true, trim: true },
  empId:      { type: String, required: true, trim: true },
  type:       { type: String, enum: ['Casual Leave', 'Sick Leave', 'Annual Leave'], default: 'Casual Leave' },
  from:       { type: String, required: true },
  to:         { type: String, required: true },
  days:       { type: Number, default: 1 },
  status:     { type: String, enum: ['Approved', 'Pending', 'Rejected'], default: 'Pending' },
  applied:    { type: String, default: '' },
  reason:     { type: String, default: '' },
}, { timestamps: true });

leaveSchema.index({ status: 1 });
leaveSchema.index({ empId: 1 });

export const Leave = model('Leave', leaveSchema);
