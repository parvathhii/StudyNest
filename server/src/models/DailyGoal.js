import mongoose from 'mongoose';

const dailyGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  kind: { type: String, enum: ['tasks', 'topics', 'chapter', 'custom'], default: 'custom' },
  target: { type: Number, required: true, min: 1, max: 100 },
  progress: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

dailyGoalSchema.index({ user: 1, dateKey: 1, createdAt: 1 });

export default mongoose.model('DailyGoal', dailyGoalSchema);
