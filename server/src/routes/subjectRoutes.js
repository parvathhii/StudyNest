import { Router } from 'express';
import Subject from '../models/Subject.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
router.use(protect);
router.get('/', asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ user: req.user._id }).sort({ name: 1 });
  res.json({ subjects });
}));
router.post('/', asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name || name.length > 80) return res.status(400).json({ message: 'Subject name is required (maximum 80 characters).' });
  const subject = await Subject.create({ user: req.user._id, name, color: req.body.color || '#8A70B5', description: req.body.description || '' });
  res.status(201).json({ subject });
}));
router.patch('/:id', asyncHandler(async (req, res) => {
  const allowed = {};
  for (const key of ['name', 'color', 'description']) if (req.body[key] !== undefined) allowed[key] = req.body[key];
  const subject = await Subject.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, allowed, { new: true, runValidators: true });
  if (!subject) return res.status(404).json({ message: 'Subject not found.' });
  res.json({ subject });
}));
router.delete('/:id', asyncHandler(async (req, res) => {
  const subject = await Subject.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!subject) return res.status(404).json({ message: 'Subject not found.' });
  res.json({ message: 'Subject deleted.' });
}));
export default router;
