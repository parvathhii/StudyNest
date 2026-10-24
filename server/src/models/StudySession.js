import mongoose from 'mongoose';
const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  durationMinutes: { type: Number, required: true, min: 1, max: 720 },
  startedAt: { type: Date, default: Date.now },
  note: { type: String, trim: true, maxlength: 240, default: '' }
}, { timestamps: true });
sessionSchema.index({ user: 1, startedAt: -1 });
export default mongoose.model('StudySession', sessionSchema);
