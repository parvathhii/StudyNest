
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Flame,
  ListTodo,
  Plus,
  Timer,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="stat-card">
      <span className={`stat-icon ${tone}`}>
        <Icon size={19} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(showLoading = true) {
    if (showLoading) {
      setLoading(true);
      setError('');
    }

    try {
      const [summaryResponse, tasksResponse] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/tasks?completed=false'),
      ]);

      const summaryData =
        summaryResponse.data?.summary ??
        summaryResponse.data ??
        {};

      const taskData =
        tasksResponse.data?.tasks ??
        tasksResponse.data;

      setSummary(summaryData);
      setTasks(
        Array.isArray(taskData) ? taskData.slice(0, 5) : []
      );
    } catch (e) {
      if (showLoading) {
        setError(
          e.response?.data?.message ||
            e.message ||
            'Could not load your dashboard data.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') load(false);
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') load(false);
    }, 15000);

    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.clearInterval(refreshInterval);
    };
  }, []);

  async function toggle(task) {
    try {
      await api.patch(`/tasks/${task._id}`, {
        completed: true,
      });

      await load();
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          'Could not update this task.'
      );
    }
  }

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{date.toUpperCase()}</span>
          <h1>
            Good to see you, {user?.name?.split(' ')[0] || 'there'}.
          </h1>
          <p>Small steps today make progress tomorrow.</p>
        </div>

        <Link className="button primary" to="/app/tasks">
          <Plus size={17} /> Add a task
        </Link>
      </div>

      {error && (
        <div className="alert error">
          {error}{' '}
          <button className="inline-action" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-panel">
          <div className="spinner" />
          Loading your study space…
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <Stat
              icon={ListTodo}
              label="Tasks to do"
              value={summary?.pendingTasks ?? 0}
              tone="purple"
            />

            <Stat
              icon={CheckCircle2}
              label="Completed"
              value={summary?.completedTasks ?? 0}
              tone="green"
            />

            <Stat
              icon={BookOpen}
              label="Subjects"
              value={summary?.subjectCount ?? 0}
              tone="pink"
            />
          </div>

          <div className="dashboard-grid">
            <section className="panel task-panel">
              <div className="panel-heading">
                <div>
                  <h2>Up next</h2>
                  <p>A manageable list for today.</p>
                </div>

                <Link
                  to="/app/tasks"
                  className="subtle-link"
                >
                  All tasks <ArrowRight size={15} />
                </Link>
              </div>

              {tasks.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    <CheckCircle2 />
                  </span>
                  <h3>You're all caught up.</h3>
                  <p>
                    Add a task whenever you're ready for the next
                    step.
                  </p>
                  <Link
                    to="/app/tasks"
                    className="button secondary"
                  >
                    Plan a task
                  </Link>
                </div>
              ) : (
                <div className="task-list">
                  {tasks.map((task) => (
                    <div className="task-row" key={task._id}>
                      <button
                        className="check-button"
                        aria-label={`Complete ${task.title}`}
                        onClick={() => toggle(task)}
                      >
                        <Circle size={19} />
                      </button>

                      <div className="task-copy">
                        <strong>{task.title}</strong>
                        <span>
                          {task.subject?.name || 'No subject'}
                          {task.dueDate
                            ? ` · Due ${new Date(
                                task.dueDate
                              ).toLocaleDateString()}`
                            : ''}
                        </span>
                      </div>

                      <span
                        className={`priority ${String(
                          task.priority || 'medium'
                        ).toLowerCase()}`}
                      >
                        {task.priority || 'Medium'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel focus-panel">
              <span className="eyebrow">A MOMENT FOR YOU</span>

              <div className="focus-art">
                <Timer size={28} />
              </div>

              <h2>One thing at a time.</h2>
              <p>
                Give one task your full attention. The rest can
                wait.
              </p>

              <Link
                className="button primary full-width"
                to="/app/timer"
              >
                Start a focus session <ArrowRight size={16} />
              </Link>

              <div className="focus-foot">
                <Flame size={15} />
                Your routine, at your own pace.
              </div>
            </section>
          </div>

        </>
      )}
    </>
  );
}
