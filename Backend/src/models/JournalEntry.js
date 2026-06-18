import { Schema, model } from 'mongoose';

const journalEntrySchema = new Schema({
  date:        { type: String, required: true, trim: true },
  entryNo:     { type: String, required: true, trim: true, unique: true },
  particulars: { type: String, required: true, trim: true },
  debit:       { type: Number, required: true, min: 0 },
  credit:      { type: Number, required: true, min: 0 },
  status:      { type: String, enum: ['Draft', 'Posted'], default: 'Posted' },
}, { timestamps: true });

journalEntrySchema.index({ date: -1, status: 1 });

export const JournalEntry = model('JournalEntry', journalEntrySchema);
