
import { useEffect, useState } from 'react';
import {
  ChartNoAxesColumn,
  ListTodo,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.js';

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-icon purple">
        <Icon size={19} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAnalytics(showLoading = true) {
    if (showLoading) setLoading(true);
    if (showLoading) setError('');

    try {
      const summaryResponse = await api.get('/analytics/summary');

      const data = summaryResponse.data?.summary ?? summaryResponse.data;
      setSummary(data || {});
    } catch (err) {
      if (showLoading || !summary) {
        setError(
          err.response?.data?.message ||
            'Unable to load analytics. Please check your login and backend.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();

    // Refresh when the user returns to Analytics after completing a timer
    // in another tab or while the page was in the background.
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadAnalytics(false);
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadAnalytics(false);
    }, 15000);

    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.clearInterval(refreshInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-panel">
        <div className="spinner" />
        Gathering your progress…
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert error" role="alert">
          {error}
        </div>
        <button onClick={loadAnalytics}>
          <RefreshCw size={16} /> Try again
        </button>
      </div>
    );
  }

  const s = summary || {};
  const subjectProgress = Array.isArray(s.subjectProgress)
    ? s.subjectProgress
    : [];

  const completedTasks = Number(s.completedTasks) || 0;
  const totalTasks = Number(s.totalTasks) || 0;
  const subjectCount = Number(s.subjectCount) || 0;
  const completionRate = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">NOTICE THE SMALL WINS</span>
          <h1>Your progress</h1>
          <p>Real progress, built one session at a time.</p>
        </div>
        <button onClick={loadAnalytics} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="stats-grid">
        <Metric
          icon={ListTodo}
          label="Tasks completed"
          value={`${completedTasks} / ${totalTasks}`}
        />
        <Metric icon={BookOpen} label="Subjects" value={subjectCount} />
        <Metric
          icon={ChartNoAxesColumn}
          label="Completion rate"
          value={`${completionRate}%`}
        />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <section className="panel subject-progress-panel">
          <div className="panel-heading">
            <div>
              <h2>By subject</h2>
              <p>Tasks completed in each course.</p>
            </div>
          </div>

          {subjectProgress.length === 0 ? (
            <div className="empty-inline">
              {totalTasks === 0
                ? 'Create subjects and tasks to start tracking your progress.'
                : 'No subject-wise progress data is available yet.'}
            </div>
          ) : (
            subjectProgress.map((sub, index) => {
              const color = sub.color || '#8A70B5';
              const completion = Math.min(
                100,
                Math.max(0, Number(sub.completion) || 0)
              );

              return (
                <div
                  className="progress-item"
                  key={sub.id || sub._id || sub.name || index}
                >
                  <div className="progress-item-head">
                    <span
                      className="subject-dot"
                      style={{ background: color }}
                    />
                    <strong>{sub.name || 'Unnamed subject'}</strong>
                    <span>{completion}%</span>
                  </div>

                  <div className="progress-track">
                    <span
                      style={{
                        width: `${completion}%`,
                        background: color,
                      }}
                    />
                  </div>

                  <small>
                    {Number(sub.completedTasks) || 0} of{' '}
                    {Number(sub.totalTasks) || 0} tasks completed
                  </small>
                </div>
              );
            })
          )}
        </section>
      </div>

    </>
  );
}
