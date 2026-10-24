import { Router } from 'express';
import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import Subject from '../models/Subject.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(protect);

// GET: Retrieve the logged-in user's study sessions
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const sessions = await StudySession.find({
      user: req.user._id
    })
      .populate('subject', 'name color')
      .sort({ startedAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  })
);

// POST: Record a completed study session
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const durationMinutes = Number(req.body.durationMinutes);

    if (
      !Number.isFinite(durationMinutes) ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 720
    ) {
      return res.status(400).json({
        success: false,
        message: 'Session duration must be a whole number between 1 and 720 minutes.'
      });
    }

    let startedAt = new Date();

    if (req.body.startedAt !== undefined) {
      startedAt = new Date(req.body.startedAt);

      if (Number.isNaN(startedAt.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid session start date.'
        });
      }

      if (startedAt.getTime() > Date.now()) {
        return res.status(400).json({
          success: false,
          message: 'Session start date cannot be in the future.'
        });
      }
    }

    let subjectId = null;

    if (req.body.subject) {
      if (!mongoose.isValidObjectId(req.body.subject)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subject ID.'
        });
      }

      const subject = await Subject.findOne({
        _id: req.body.subject,
        user: req.user._id
      });

      if (!subject) {
        return res.status(400).json({
          success: false,
          message: 'Choose a subject belonging to your account.'
        });
      }

      subjectId = subject._id;
    }

    const note =
      typeof req.body.note === 'string'
        ? req.body.note.trim()
        : '';

    if (note.length > 240) {
      return res.status(400).json({
        success: false,
        message: 'Session note cannot exceed 240 characters.'
      });
    }

    const session = await StudySession.create({
      user: req.user._id,
      subject: subjectId,
      durationMinutes,
      startedAt,
      note
    });

    const savedSession = await StudySession.findById(session._id)
      .populate('subject', 'name color')
      .lean();

    console.log(
      `Study session saved: ${savedSession._id}, user: ${req.user._id}, duration: ${durationMinutes} minutes`
    );

    return res.status(201).json({
      success: true,
      message: 'Study session recorded successfully.',
      session: savedSession
    });
  })
);

// DELETE: Delete a session belonging to the logged-in user
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID.'
      });
    }

    const session = await StudySession.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Study session deleted successfully.'
    });
  })
);

export default router;
