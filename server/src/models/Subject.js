import mongoose from 'mongoose';
const subjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  color: { type: String, default: '#8A70B5', match: /^#[0-9A-Fa-f]{6}$/ },
  description: { type: String, trim: true, maxlength: 240, default: '' }
}, { timestamps: true });
subjectSchema.index({ user: 1, name: 1 }, { unique: true });
export default mongoose.model('Subject', subjectSchema);
