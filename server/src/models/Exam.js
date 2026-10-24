import mongoose from 'mongoose';

const revisionTaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  dueDate: { type: Date, required: true },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

const examSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  examDate: { type: Date, required: true },
  syllabusCompletion: { type: Number, min: 0, max: 100, default: 0 },
  revisionTasks: [revisionTaskSchema],
}, { timestamps: true });

examSchema.index({ user: 1, examDate: 1 });

export default mongoose.model('Exam', examSchema);
