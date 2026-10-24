import { Router } from 'express';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import SubjectNote from '../models/SubjectNote.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);
const allowedTags = ['Important', 'Revision'];

async function ownedSubject(subjectId, userId) {
  if (!mongoose.isValidObjectId(subjectId)) return null;
  return Subject.findOne({ _id: subjectId, user: userId });
}

function normalizeTags(tags) {
  if (tags === undefined) return [];
  if (!Array.isArray(tags) || tags.some((tag) => !allowedTags.includes(tag))) return null;
  return [...new Set(tags)];
}

router.get('/', asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.subjectId) {
    if (!mongoose.isValidObjectId(req.query.subjectId)) return res.status(400).json({ message: 'Invalid subject.' });
    filter.subject = req.query.subjectId;
  }
  if (req.query.tag) {
    if (!allowedTags.includes(req.query.tag)) return res.status(400).json({ message: 'Invalid note tag.' });
    filter.tags = req.query.tag;
  }
  const search = String(req.query.search || '').trim();
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ title: { $regex: escaped, $options: 'i' } }, { content: { $regex: escaped, $options: 'i' } }];
  }
  const notes = await SubjectNote.find(filter).populate('subject', 'name color').sort({ updatedAt: -1 });
  res.json({ notes });
}));

router.post('/', asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  const content = String(req.body.content || '').trim();
  const tags = normalizeTags(req.body.tags);
  const subject = await ownedSubject(req.body.subject, req.user._id);
  if (!subject) return res.status(400).json({ message: 'Choose a subject belonging to your account.' });
  if (!title || title.length > 120) return res.status(400).json({ message: 'Note title is required (maximum 120 characters).' });
  if (!content || content.length > 20000) return res.status(400).json({ message: 'Note content is required (maximum 20,000 characters).' });
  if (!tags) return res.status(400).json({ message: 'Choose valid note tags.' });
  const note = await SubjectNote.create({ user: req.user._id, subject: subject._id, title, content, tags });
  res.status(201).json({ note: await note.populate('subject', 'name color') });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid note ID.' });
  const note = await SubjectNote.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) return res.status(404).json({ message: 'Note not found.' });
  if (req.body.title !== undefined) {
    const title = String(req.body.title).trim();
    if (!title || title.length > 120) return res.status(400).json({ message: 'Note title is required (maximum 120 characters).' });
    note.title = title;
  }
  if (req.body.content !== undefined) {
    const content = String(req.body.content).trim();
    if (!content || content.length > 20000) return res.status(400).json({ message: 'Note content is required (maximum 20,000 characters).' });
    note.content = content;
  }
  if (req.body.tags !== undefined) {
    const tags = normalizeTags(req.body.tags);
    if (!tags) return res.status(400).json({ message: 'Choose valid note tags.' });
    note.tags = tags;
  }
  if (req.body.subject !== undefined) {
    const subject = await ownedSubject(req.body.subject, req.user._id);
    if (!subject) return res.status(400).json({ message: 'Choose a subject belonging to your account.' });
    note.subject = subject._id;
  }
  await note.save();
  res.json({ note: await note.populate('subject', 'name color') });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid note ID.' });
  const note = await SubjectNote.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!note) return res.status(404).json({ message: 'Note not found.' });
  res.json({ message: 'Note deleted.' });
}));

export default router;
