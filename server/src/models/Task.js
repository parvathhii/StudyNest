import mongoose from 'mongoose';
const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  notes: { type: String, trim: true, maxlength: 1000, default: '' },
  dueDate: { type: Date, default: null },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  completed: { type: Boolean, default: false }
}, { timestamps: true });
taskSchema.index({ user: 1, completed: 1, dueDate: 1 });
export default mongoose.model('Task', taskSchema);
