
import { Router } from 'express';
import Task from '../models/Task.js';
import StudySession from '../models/StudySession.js';
import Subject from '../models/Subject.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(protect);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const user = req.user._id;

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      subjects,
    ] = await Promise.all([
      Task.countDocuments({ user }),
      Task.countDocuments({ user, completed: true }),
      Task.countDocuments({ user, completed: false }),
      Subject.find({ user }).sort({ name: 1 }),
    ]);

    // Count sessions on the day they were completed and saved. This keeps a
    // session that crosses midnight in the day its completed record arrives.
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);

    const sessions = await StudySession.find({
      user,
      createdAt: {
        $gte: weekStart,
        $lte: now,
      },
    })
      .populate('subject', 'name color')
      .sort({ createdAt: -1 });

    // Build a seven-day study-time series.
    const weekly = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const minutes = sessions
        .filter((session) => {
          const sessionDate = new Date(session.createdAt);
          return sessionDate >= date && sessionDate < nextDate;
        })
        .reduce(
          (sum, session) => sum + Number(session.durationMinutes || 0),
          0
        );

      return {
        date: [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, '0'),
          String(date.getDate()).padStart(2, '0'),
        ].join('-'),
        day: date.toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        minutes,
      };
    });

    // Calculate study time and task completion per subject.
    const subjectProgress = await Promise.all(
      subjects.map(async (subject) => {
        const [subjectTotalTasks, subjectCompletedTasks] =
          await Promise.all([
            Task.countDocuments({
              user,
              subject: subject._id,
            }),
            Task.countDocuments({
              user,
              subject: subject._id,
              completed: true,
            }),
          ]);

        const subjectMinutes = sessions
          .filter((session) => {
            const sessionSubject =
              session.subject?._id || session.subject;

            return (
              sessionSubject &&
              String(sessionSubject) === String(subject._id)
            );
          })
          .reduce(
            (sum, session) =>
              sum + Number(session.durationMinutes || 0),
            0
          );

        return {
          id: subject._id,
          name: subject.name,
          color: subject.color,
          totalTasks: subjectTotalTasks,
          completedTasks: subjectCompletedTasks,
          completion: subjectTotalTasks
            ? Math.round(
                (subjectCompletedTasks / subjectTotalTasks) * 100
              )
            : 0,
          minutes: subjectMinutes,
        };
      })
    );

    const weeklyMinutes = weekly.reduce(
      (sum, day) => sum + day.minutes,
      0
    );

    res.json({
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        subjectCount: subjects.length,
        weeklyMinutes,
        weeklySessions: sessions.length,
        weekly,
        subjectProgress,
      },
    });
  })
);

export default router;

