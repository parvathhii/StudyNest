import { Router } from 'express';
import mongoose from 'mongoose';
import DailyGoal from '../models/DailyGoal.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);

function validDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

router.get('/', asyncHandler(async (req, res) => {
  const dateKey = req.query.dateKey;
  if (!validDateKey(dateKey)) return res.status(400).json({ message: 'Enter a valid goal date.' });
  const goals = await DailyGoal.find({ user: req.user._id, dateKey }).sort({ createdAt: 1 });
  res.json({ goals });
}));

router.post('/', asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  const { dateKey, kind } = req.body;
  const target = Number(req.body.target);
  if (!validDateKey(dateKey)) return res.status(400).json({ message: 'Enter a valid goal date.' });
  if (!title || title.length > 160) return res.status(400).json({ message: 'Goal title is required (maximum 160 characters).' });
  if (!['tasks', 'topics', 'chapter', 'custom'].includes(kind)) return res.status(400).json({ message: 'Choose a valid goal type.' });
  if (!Number.isInteger(target) || target < 1 || target > 100) return res.status(400).json({ message: 'Goal target must be between 1 and 100.' });
  const goal = await DailyGoal.create({ user: req.user._id, dateKey, title, kind, target });
  res.status(201).json({ goal });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid goal ID.' });
  const goal = await DailyGoal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) return res.status(404).json({ message: 'Goal not found.' });
  const progress = Number(req.body.progress);
  if (!Number.isInteger(progress) || progress < 0 || progress > goal.target) {
    return res.status(400).json({ message: `Progress must be between 0 and ${goal.target}.` });
  }
  goal.progress = progress;
  await goal.save();
  res.json({ goal });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid goal ID.' });
  const goal = await DailyGoal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!goal) return res.status(404).json({ message: 'Goal not found.' });
  res.json({ message: 'Goal deleted.' });
}));

export default router;
