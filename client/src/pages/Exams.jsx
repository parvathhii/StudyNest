import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { api } from '../services/api.js';

const todayInputValue = () => {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
};

function getDaysRemaining(value) {
  const dateKey = new Date(value).toISOString().slice(0, 10);
  const examDay = new Date(`${dateKey}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((examDay.getTime() - today.getTime()) / 86400000);
}

function formatExamDate(value) {
  const dateKey = new Date(value).toISOString().slice(0, 10);
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progressDrafts, setProgressDrafts] = useState({});
  const [revisionDrafts, setRevisionDrafts] = useState({});
  const [form, setForm] = useState({
    title: '',
    subject: '',
    examDate: '',
    syllabusCompletion: '0',
  });

  async function loadData(showLoading = true) {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [examResponse, subjectResponse] = await Promise.all([
        api.get('/exams'),
        api.get('/subjects'),
      ]);
      const loadedExams = examResponse.data?.exams || [];
      setExams(loadedExams);
      setSubjects(subjectResponse.data?.subjects || []);
      setProgressDrafts(Object.fromEntries(
        loadedExams.map((exam) => [exam._id, String(exam.syllabusCompletion || 0)])
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load exam plans.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function replaceExam(updatedExam) {
    setExams((current) => current.map((exam) =>
      exam._id === updatedExam._id ? updatedExam : exam
    ));
    setProgressDrafts((current) => ({
      ...current,
      [updatedExam._id]: String(updatedExam.syllabusCompletion || 0),
    }));
  }

  async function createExam(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/exams', {
        ...form,
        syllabusCompletion: Number(form.syllabusCompletion),
      });
      setExams((current) => [...current, response.data.exam].sort(
        (a, b) => new Date(a.examDate) - new Date(b.examDate)
      ));
      setForm({ title: '', subject: '', examDate: '', syllabusCompletion: '0' });
      setSuccess('Exam added to your plan.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this exam.');
    } finally {
      setSaving(false);
    }
  }

  async function saveProgress(exam) {
    setError('');
    try {
      const response = await api.patch(`/exams/${exam._id}`, {
        syllabusCompletion: Number(progressDrafts[exam._id] ?? exam.syllabusCompletion),
      });
      replaceExam(response.data.exam);
      setSuccess('Syllabus progress updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update syllabus progress.');
    }
  }

  async function addRevisionTask(event, exam) {
    event.preventDefault();
    const draft = revisionDrafts[exam._id] || { title: '', dueDate: '' };
    setError('');
    try {
      const response = await api.post(`/exams/${exam._id}/revision-tasks`, draft);
      replaceExam(response.data.exam);
      setRevisionDrafts((current) => ({ ...current, [exam._id]: { title: '', dueDate: '' } }));
      setSuccess('Revision task added.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this revision task.');
    }
  }

  async function toggleRevisionTask(exam, task) {
    setError('');
    try {
      const response = await api.patch(
        `/exams/${exam._id}/revision-tasks/${task._id}`,
        { completed: !task.completed }
      );
      replaceExam(response.data.exam);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the revision task.');
    }
  }

  async function deleteExam(exam) {
    if (!window.confirm(`Delete the exam plan for “${exam.title}”?`)) return;
    setError('');
    try {
      await api.delete(`/exams/${exam._id}`);
      setExams((current) => current.filter((item) => item._id !== exam._id));
      setSuccess('Exam plan deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this exam.');
    }
  }

  return (
    <div className="exams-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">PLAN AHEAD</span>
          <h1>Exam countdowns</h1>
          <p>Track exam dates, syllabus progress, and revision plans.</p>
        </div>
        <button className="button secondary" onClick={() => loadData()} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {error && <div className="alert error" role="alert">{error}</div>}
      {success && <div className="exam-success" role="status">{success}</div>}

      <section className="panel exam-create-panel">
        <div className="exam-section-title">
          <span className="exam-title-icon"><Plus size={18} /></span>
          <div><h2>Add an exam</h2><p>Set a date and connect it to a subject.</p></div>
        </div>
        <form className="exam-form" onSubmit={createExam}>
          <label>Exam name
            <input maxLength="100" required value={form.title} placeholder="e.g. Biology final"
              onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label>Subject
            <select value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}>
              <option value="">No subject</option>
              {subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}
            </select>
          </label>
          <label>Exam date
            <input type="date" min={todayInputValue()} required value={form.examDate}
              onChange={(event) => setForm({ ...form, examDate: event.target.value })} />
          </label>
          <label>Syllabus done
            <div className="exam-percent-input">
              <input type="number" min="0" max="100" step="1" value={form.syllabusCompletion}
                onChange={(event) => setForm({ ...form, syllabusCompletion: event.target.value })} />
              <span>%</span>
            </div>
          </label>
          <button className="button primary" type="submit" disabled={saving}>
            <Plus size={16} /> {saving ? 'Saving...' : 'Add exam'}
          </button>
        </form>
      </section>

      <section className="exam-list-section">
        <div className="exam-list-heading">
          <div><h2>Your exams</h2><p>Upcoming dates and revision tasks.</p></div>
          <span>{exams.length} {exams.length === 1 ? 'exam' : 'exams'}</span>
        </div>

        {loading ? (
          <div className="loading-panel"><div className="spinner" />Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="panel exam-empty">
            <CalendarDays size={30} />
            <h3>No exams planned yet</h3>
            <p>Add an exam date above to start a countdown and plan revisions.</p>
          </div>
        ) : (
          <div className="exam-grid">
            {exams.map((exam) => {
              const days = getDaysRemaining(exam.examDate);
              const tasks = [...(exam.revisionTasks || [])].sort(
                (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
              );
              const draft = revisionDrafts[exam._id] || { title: '', dueDate: '' };

              return (
                <article className="panel exam-card" key={exam._id}>
                  <div className="exam-card-top">
                    <span className="exam-title-icon"><CalendarDays size={19} /></span>
                    <button className="exam-delete" type="button" title="Delete exam" aria-label={`Delete ${exam.title}`} onClick={() => deleteExam(exam)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3>{exam.title}</h3>
                  <p className="exam-subject">{exam.subject?.name || 'No subject selected'}</p>

                  <div className={`exam-countdown ${days < 0 ? 'past' : ''}`}>
                    <strong>{days < 0 ? Math.abs(days) : days}</strong>
                    <span>{days < 0 ? 'days past' : days === 0 ? 'exam day' : days === 1 ? 'day remaining' : 'days remaining'}</span>
                  </div>
                  <div className="exam-date-line"><Clock3 size={14} /> {formatExamDate(exam.examDate)}</div>

                  <form className="exam-progress-form" onSubmit={(event) => { event.preventDefault(); saveProgress(exam); }}>
                    <div className="exam-progress-label"><strong>Syllabus completion</strong><span>{progressDrafts[exam._id] ?? exam.syllabusCompletion}%</span></div>
                    <div className="exam-progress-track"><span style={{ width: `${Math.min(100, Math.max(0, Number(progressDrafts[exam._id] ?? exam.syllabusCompletion) || 0))}%` }} /></div>
                    <div className="exam-progress-controls">
                      <input aria-label={`Syllabus completion for ${exam.title}`} type="range" min="0" max="100" step="5"
                        value={progressDrafts[exam._id] ?? exam.syllabusCompletion}
                        onChange={(event) => setProgressDrafts((current) => ({ ...current, [exam._id]: event.target.value }))} />
                      <button className="button secondary small-button" type="submit">Save</button>
                    </div>
                  </form>

                  <div className="revision-section">
                    <h4>Revision tasks</h4>
                    {tasks.length === 0 ? <p className="revision-empty">No revision tasks yet.</p> : (
                      <div className="revision-list">
                        {tasks.map((task) => (
                          <button className={`revision-item ${task.completed ? 'completed' : ''}`} type="button" key={task._id}
                            onClick={() => toggleRevisionTask(exam, task)} aria-label={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`}>
                            {task.completed ? <Check size={17} /> : <Circle size={17} />}
                            <span>{task.title}<small>{formatExamDate(task.dueDate)}</small></span>
                          </button>
                        ))}
                      </div>
                    )}
                    <form className="revision-form" onSubmit={(event) => addRevisionTask(event, exam)}>
                      <input aria-label="Revision task" required maxLength="160" placeholder="Add a revision task"
                        value={draft.title}
                        onChange={(event) => setRevisionDrafts((current) => ({ ...current, [exam._id]: { ...draft, title: event.target.value } }))} />
                      <input aria-label="Revision task date" type="date" min={todayInputValue()} max={new Date(exam.examDate).toISOString().slice(0, 10)} required value={draft.dueDate}
                        onChange={(event) => setRevisionDrafts((current) => ({ ...current, [exam._id]: { ...draft, dueDate: event.target.value } }))} />
                      <button className="revision-add" type="submit" aria-label="Add revision task"><Plus size={17} /></button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
