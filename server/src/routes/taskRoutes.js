import { Router } from 'express';
import Task from '../models/Task.js';
import Subject from '../models/Subject.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
router.use(protect);
router.get('/', asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.completed === 'true') filter.completed = true;
  if (req.query.completed === 'false') filter.completed = false;
  if (req.query.subject) filter.subject = req.query.subject;
  const tasks = await Task.find(filter).populate('subject', 'name color').sort({ completed: 1, dueDate: 1, createdAt: -1 });
  res.json({ tasks });
}));
router.post('/', asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title || title.length > 160) return res.status(400).json({ message: 'Task title is required (maximum 160 characters).' });
  let subject = null;
  if (req.body.subject) {
    subject = await Subject.findOne({ _id: req.body.subject, user: req.user._id });
    if (!subject) return res.status(400).json({ message: 'Choose a subject belonging to your account.' });
  }
  const task = await Task.create({ user: req.user._id, subject: subject?._id || null, title, notes: req.body.notes || '', dueDate: req.body.dueDate || null, priority: req.body.priority || 'Medium' });
  res.status(201).json({ task: await task.populate('subject', 'name color') });
}));
router.patch('/:id', asyncHandler(async (req, res) => {
  const updates = {};
  for (const key of ['title', 'notes', 'dueDate', 'priority', 'completed']) if (req.body[key] !== undefined) updates[key] = req.body[key];
  if (req.body.subject !== undefined) {
    if (!req.body.subject) updates.subject = null;
    else {
      const subject = await Subject.findOne({ _id: req.body.subject, user: req.user._id });
      if (!subject) return res.status(400).json({ message: 'Choose a subject belonging to your account.' });
      updates.subject = subject._id;
    }
  }
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, updates, { new: true, runValidators: true }).populate('subject', 'name color');
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  res.json({ task });
}));
router.delete('/:id', asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  res.json({ message: 'Task deleted.' });
}));
export default router;
