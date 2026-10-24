import { useEffect, useState } from 'react';
import { Check, Circle, Minus, Plus, RefreshCw, Target, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';

function localDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const presets = {
  tasks: { title: 'Finish tasks', target: '3' },
  topics: { title: 'Revise topics', target: '2' },
  chapter: { title: 'Complete a chapter', target: '1' },
  custom: { title: '', target: '1' },
};

export default function DailyGoals() {
  const [dateKey, setDateKey] = useState(localDateKey);
  const [goals, setGoals] = useState([]);
  const [kind, setKind] = useState('tasks');
  const [form, setForm] = useState(presets.tasks);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadGoals() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/daily-goals', { params: { dateKey } });
      setGoals(response.data?.goals || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load daily goals.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGoals(); }, [dateKey]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const today = localDateKey();
      setDateKey((current) => current === today ? current : today);
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  function selectKind(nextKind) {
    setKind(nextKind);
    setForm(presets[nextKind]);
  }

  async function createGoal(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/daily-goals', {
        dateKey,
        kind,
        title: form.title.trim(),
        target: Number(form.target),
      });
      setGoals((current) => [...current, response.data.goal]);
      setForm({ ...presets[kind], title: kind === 'chapter' ? '' : presets[kind].title });
      setSuccess('Daily goal added.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this goal.');
    } finally {
      setSaving(false);
    }
  }

  async function updateProgress(goal, progress) {
    setError('');
    try {
      const response = await api.patch(`/daily-goals/${goal._id}`, { progress });
      setGoals((current) => current.map((item) => item._id === goal._id ? response.data.goal : item));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update goal progress.');
    }
  }

  async function deleteGoal(goal) {
    setError('');
    try {
      await api.delete(`/daily-goals/${goal._id}`);
      setGoals((current) => current.filter((item) => item._id !== goal._id));
      setSuccess('Goal deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this goal.');
    }
  }

  const completed = goals.filter((goal) => goal.progress >= goal.target).length;
  const today = new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return <div className="daily-goals-page">
    <header className="page-heading">
      <div><span className="eyebrow">SMALL STEPS, STEADY PROGRESS</span><h1>Daily study goals</h1><p>{today} · {completed} of {goals.length} goals complete</p></div>
      <button className="button secondary" onClick={loadGoals} disabled={loading}><RefreshCw size={16}/> Refresh</button>
    </header>
    {error && <div className="alert error" role="alert">{error}</div>}
    {success && <div className="exam-success" role="status">{success}</div>}

    <section className="panel daily-goal-create">
      <div className="exam-section-title"><span className="exam-title-icon"><Target size={18}/></span><div><h2>Set a goal for today</h2><p>Choose a quick goal or describe your own.</p></div></div>
      <div className="goal-presets" role="group" aria-label="Goal type">
        {[['tasks', 'Finish tasks'], ['topics', 'Revise topics'], ['chapter', 'Complete a chapter'], ['custom', 'Custom']].map(([value, label]) =>
          <button key={value} type="button" className={`goal-preset ${kind === value ? 'selected' : ''}`} onClick={() => selectKind(value)}>{label}</button>
        )}
      </div>
      <form className="daily-goal-form" onSubmit={createGoal}>
        <label>What will you work on?
          <input required maxLength="160" value={form.title} placeholder={kind === 'chapter' ? 'e.g. Complete Chapter 4' : 'e.g. Finish three practice problems'} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}/>
        </label>
        <label>Target count
          <input required type="number" min="1" max="100" step="1" value={form.target} onChange={(event) => setForm((current) => ({ ...current, target: event.target.value }))}/>
        </label>
        <button className="button primary" type="submit" disabled={saving}><Plus size={16}/>{saving ? 'Saving...' : 'Add goal'}</button>
      </form>
      <p className="goal-form-hint">For a chapter or one-off goal, use a target of 1. Track each completed item with the progress controls.</p>
    </section>

    <section className="daily-goal-list-section">
      <div className="exam-list-heading"><div><h2>Today’s goals</h2><p>Progress is saved to your account.</p></div><span>{goals.length} {goals.length === 1 ? 'goal' : 'goals'}</span></div>
      {loading ? <div className="loading-panel"><div className="spinner"/>Loading goals...</div> : goals.length === 0 ? (
        <div className="panel exam-empty"><Target size={30}/><h3>No goals set for today</h3><p>Add a goal above to give today’s study session a clear focus.</p></div>
      ) : <div className="daily-goal-grid">{goals.map((goal) => {
        const done = goal.progress >= goal.target;
        const percent = Math.round((goal.progress / goal.target) * 100);
        return <article className={`panel daily-goal-card ${done ? 'is-complete' : ''}`} key={goal._id}>
          <div className="daily-goal-card-top"><span className="goal-kind-label">{goal.kind === 'topics' ? 'REVISION' : goal.kind === 'chapter' ? 'CHAPTER' : goal.kind === 'tasks' ? 'TASKS' : 'CUSTOM'}</span>
            <button className="exam-delete" type="button" title="Delete goal" aria-label={`Delete ${goal.title}`} onClick={() => deleteGoal(goal)}><Trash2 size={16}/></button></div>
          <div className="daily-goal-title">{done ? <Check size={19}/> : <Circle size={19}/>}<h3>{goal.title}</h3></div>
          <div className="goal-progress-caption"><strong>{goal.progress} / {goal.target}</strong><span>{done ? 'Complete' : `${percent}%`}</span></div>
          <div className="exam-progress-track"><span style={{ width: `${percent}%` }}/></div>
          <div className="goal-progress-actions">
            <button className="button secondary small-button" type="button" disabled={goal.progress <= 0} onClick={() => updateProgress(goal, goal.progress - 1)}><Minus size={14}/> One less</button>
            <button className="button primary small-button" type="button" disabled={done} onClick={() => updateProgress(goal, Math.min(goal.target, goal.progress + 1))}>{done ? <Check size={14}/> : <Plus size={14}/>} {done ? 'Completed' : 'Mark one done'}</button>
          </div>
        </article>;
      })}</div>}
    </section>
  </div>;
}
