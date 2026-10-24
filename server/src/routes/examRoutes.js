import { Router } from 'express';
import mongoose from 'mongoose';
import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);

async function resolveSubject(subjectId, userId) {
  if (!subjectId) return null;
  if (!mongoose.isValidObjectId(subjectId)) return undefined;
  return Subject.findOne({ _id: subjectId, user: userId });
}

function parseExamDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

router.get('/', asyncHandler(async (req, res) => {
  const exams = await Exam.find({ user: req.user._id })
    .populate('subject', 'name color')
    .sort({ examDate: 1 });
  res.json({ exams });
}));

router.post('/', asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  const examDate = parseExamDate(req.body.examDate);
  const syllabusCompletion = Number(req.body.syllabusCompletion ?? 0);

  if (!title || title.length > 100) {
    return res.status(400).json({ message: 'Exam name is required (maximum 100 characters).' });
  }
  if (!examDate) {
    return res.status(400).json({ message: 'Enter a valid exam date.' });
  }
  if (!Number.isInteger(syllabusCompletion) || syllabusCompletion < 0 || syllabusCompletion > 100) {
    return res.status(400).json({ message: 'Syllabus completion must be between 0 and 100.' });
  }

  const subject = await resolveSubject(req.body.subject, req.user._id);
  if (subject === undefined) return res.status(400).json({ message: 'Invalid subject.' });
  if (req.body.subject && !subject) {
    return res.status(400).json({ message: 'Choose a subject belonging to your account.' });
  }

  const exam = await Exam.create({
    user: req.user._id,
    subject: subject?._id || null,
    title,
    examDate,
    syllabusCompletion,
  });
  res.status(201).json({ exam: await exam.populate('subject', 'name color') });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid exam ID.' });
  }

  const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
  if (!exam) return res.status(404).json({ message: 'Exam not found.' });

  if (req.body.title !== undefined) {
    const title = String(req.body.title).trim();
    if (!title || title.length > 100) {
      return res.status(400).json({ message: 'Exam name is required (maximum 100 characters).' });
    }
    exam.title = title;
  }
  if (req.body.examDate !== undefined) {
    const examDate = parseExamDate(req.body.examDate);
    if (!examDate) return res.status(400).json({ message: 'Enter a valid exam date.' });
    exam.examDate = examDate;
  }
  if (req.body.syllabusCompletion !== undefined) {
    const percent = Number(req.body.syllabusCompletion);
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      return res.status(400).json({ message: 'Syllabus completion must be between 0 and 100.' });
    }
    exam.syllabusCompletion = percent;
  }
  if (req.body.subject !== undefined) {
    const subject = await resolveSubject(req.body.subject, req.user._id);
    if (req.body.subject && (subject === undefined || !subject)) {
      return res.status(400).json({ message: 'Choose a subject belonging to your account.' });
    }
    exam.subject = subject?._id || null;
  }

  await exam.save();
  res.json({ exam: await exam.populate('subject', 'name color') });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid exam ID.' });
  }
  const exam = await Exam.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!exam) return res.status(404).json({ message: 'Exam not found.' });
  res.json({ message: 'Exam deleted.' });
}));

router.post('/:id/revision-tasks', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid exam ID.' });
  }
  const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
  if (!exam) return res.status(404).json({ message: 'Exam not found.' });

  const title = String(req.body.title || '').trim();
  const dueDate = parseExamDate(req.body.dueDate);
  if (!title || title.length > 160) {
    return res.status(400).json({ message: 'Revision task is required (maximum 160 characters).' });
  }
  if (!dueDate) return res.status(400).json({ message: 'Enter a valid revision date.' });
  if (dueDate > exam.examDate) {
    return res.status(400).json({ message: 'Revision tasks must be scheduled on or before the exam date.' });
  }

  exam.revisionTasks.push({ title, dueDate });
  await exam.save();
  res.status(201).json({ exam: await exam.populate('subject', 'name color') });
}));

router.patch('/:id/revision-tasks/:taskId', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.taskId)) {
    return res.status(400).json({ message: 'Invalid exam or task ID.' });
  }
  const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
  if (!exam) return res.status(404).json({ message: 'Exam not found.' });
  const task = exam.revisionTasks.id(req.params.taskId);
  if (!task) return res.status(404).json({ message: 'Revision task not found.' });
  if (typeof req.body.completed === 'boolean') task.completed = req.body.completed;
  await exam.save();
  res.json({ exam: await exam.populate('subject', 'name color') });
}));

router.delete('/:id/revision-tasks/:taskId', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.taskId)) {
    return res.status(400).json({ message: 'Invalid exam or task ID.' });
  }
  const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
  if (!exam) return res.status(404).json({ message: 'Exam not found.' });
  const task = exam.revisionTasks.id(req.params.taskId);
  if (!task) return res.status(404).json({ message: 'Revision task not found.' });
  task.deleteOne();
  await exam.save();
  res.json({ exam: await exam.populate('subject', 'name color') });
}));

export default router;
