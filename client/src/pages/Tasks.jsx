
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Circle,
  CheckCircle2,
  CalendarDays,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.js';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    subject: '',
    dueDate: '',
    priority: 'Medium',
  });

  async function loadTasks() {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/tasks');
      const data = response.data?.tasks ?? response.data;
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setTasks([]);
      setError(
        err.response?.data?.message ||
          'Unable to load tasks. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSubjects() {
    try {
      const response = await api.get('/subjects');
      const data = response.data?.subjects ?? response.data;
      setSubjects(Array.isArray(data) ? data : []);
    } catch {
      setSubjects([]);
    }
  }

  useEffect(() => {
    loadTasks();
    loadSubjects();
  }, []);

  const filteredTasks = (Array.isArray(tasks) ? tasks : []).filter(
    (task) => {
      if (filter === 'pending') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    }
  );

  async function createTask(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title: form.title.trim(),
        priority: form.priority,
      };

      if (form.subject) payload.subject = form.subject;
      if (form.dueDate) payload.dueDate = form.dueDate;

      await api.post('/tasks', payload);

      setForm({
        title: '',
        subject: '',
        dueDate: '',
        priority: 'Medium',
      });

      setShowForm(false);
      await loadTasks();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to create the task. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task) {
    setError('');

    try {
      await api.patch(`/tasks/${task._id}`, {
        completed: !task.completed,
      });

      await loadTasks();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to update the task.'
      );
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    setError('');

    try {
      await api.delete(`/tasks/${task._id}`);
      await loadTasks();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to delete the task.'
      );
    }
  }

  return (
    <div className="tasks-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR STUDY PLAN</span>
          <h1>Your tasks</h1>
          <p>Make progress one small step at a time.</p>
        </div>

        <button
          className="button primary"
          onClick={() => setShowForm((current) => !current)}
        >
          <Plus size={17} />
          {showForm ? 'Cancel' : 'Add a task'}
        </button>
      </div>

      {error && (
        <div className="alert error">
          {error}{' '}
          <button
            className="inline-action"
            onClick={() => {
              loadTasks();
              loadSubjects();
            }}
          >
            Try again
          </button>
        </div>
      )}

      {showForm && (
        <form className="panel task-form" onSubmit={createTask}>
          <h2>Create a task</h2>

          <label htmlFor="task-title">Task title</label>
          <input
            id="task-title"
            type="text"
            placeholder="e.g. Revise data structures"
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            required
          />

          <label htmlFor="task-subject">Subject</label>
          <select
            id="task-subject"
            value={form.subject}
            onChange={(event) =>
              setForm({ ...form, subject: event.target.value })
            }
          >
            <option value="">No subject</option>
            {subjects.map((subject) => (
              <option
                key={subject._id}
                value={subject._id}
              >
                {subject.name || subject.title}
              </option>
            ))}
          </select>

          <label htmlFor="task-due-date">Due date</label>
          <input
            id="task-due-date"
            type="date"
            value={form.dueDate}
            onChange={(event) =>
              setForm({ ...form, dueDate: event.target.value })
            }
          />

          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            value={form.priority}
            onChange={(event) =>
              setForm({ ...form, priority: event.target.value })
            }
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <button
            className="button primary"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save task'}
          </button>
        </form>
      )}

      <div className="task-filters">
        {[
          { value: 'all', label: 'All tasks' },
          { value: 'pending', label: 'To do' },
          { value: 'completed', label: 'Completed' },
        ].map((item) => (
          <button
            key={item.value}
            className={
              filter === item.value
                ? 'button secondary active'
                : 'button secondary'
            }
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}

        <button
          className="button secondary"
          onClick={loadTasks}
          title="Refresh tasks"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className="loading-panel">
          <div className="spinner" />
          Loading your tasks…
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="panel empty-state">
          <span className="empty-icon">
            <CheckCircle2 />
          </span>
          <h3>
            {filter === 'completed'
              ? 'No completed tasks yet.'
              : filter === 'pending'
                ? "You're all caught up."
                : 'Your study plan starts here.'}
          </h3>
          <p>Add a task to make your next study session easier.</p>
          <button
            className="button primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={17} /> Create a task
          </button>
        </div>
      ) : (
        <div className="panel task-list">
          {filteredTasks.map((task) => (
            <div className="task-row" key={task._id}>
              <button
                className="check-button"
                onClick={() => toggleTask(task)}
                aria-label={
                  task.completed
                    ? `Reopen ${task.title}`
                    : `Complete ${task.title}`
                }
              >
                {task.completed ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <Circle size={20} />
                )}
              </button>

              <div className="task-copy">
                <strong
                  className={task.completed ? 'completed-task' : ''}
                >
                  {task.title}
                </strong>

                <span>
                  {task.subject?.name || 'No subject'}
                  {task.dueDate && (
                    <>
                      {' · '}
                      <CalendarDays size={13} />
                      {' '}
                      {new Date(task.dueDate).toLocaleDateString()}
                    </>
                  )}
                </span>
              </div>

              <span
                className={`priority ${String(
                  task.priority || 'medium'
                ).toLowerCase()}`}
              >
                {task.priority || 'Medium'}
              </span>

              <button
                className="check-button"
                onClick={() => deleteTask(task)}
                aria-label={`Delete ${task.title}`}
                title="Delete task"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

