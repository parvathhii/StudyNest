import mongoose from 'mongoose';

const subjectNoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  content: { type: String, required: true, trim: true, maxlength: 20000 },
  tags: { type: [{ type: String, enum: ['Important', 'Revision'] }], default: [] },
}, { timestamps: true });

subjectNoteSchema.index({ user: 1, subject: 1, updatedAt: -1 });
export default mongoose.model('SubjectNote', subjectNoteSchema);
