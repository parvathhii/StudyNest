
import { useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadSubjects() {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/subjects');
      const data =
        response.data?.subjects ?? response.data;

      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not load subjects. Please check your backend.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const subjectName = name.trim();

    if (!subjectName) {
      setError('Please enter a subject name.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/subjects', {
        name: subjectName,
        title: subjectName,
        description: description.trim(),
      });

      setName('');
      setDescription('');
      setSuccess('Subject added successfully.');

      await loadSubjects();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not add subject. Please check your backend API.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(subject) {
    const id = subject._id || subject.id;

    if (!id) {
      setError('This subject has no ID and cannot be deleted.');
      return;
    }

    if (!window.confirm(`Delete "${subject.name || subject.title}"?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await api.delete(`/subjects/${id}`);
      setSubjects((previous) =>
        previous.filter(
          (item) => (item._id || item.id) !== id
        )
      );
      setSuccess('Subject deleted successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not delete subject.'
      );
    }
  }

  function getSubjectName(subject) {
    return subject.name || subject.title || 'Untitled subject';
  }

  const orderedSubjects = [...subjects].sort((a, b) =>
    getSubjectName(a).localeCompare(getSubjectName(b))
  );

  return (
    <main className="subjects-page">
      <header className="subjects-heading">
        <div>
          <span className="eyebrow">YOUR STUDY PLAN</span>
          <h1>My subjects</h1>
          <p>Keep your courses organized in one place.</p>
        </div>
        <div className="subjects-count" aria-live="polite">
          <BookOpen size={17} />
          <span>{subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}</span>
        </div>
      </header>

      {error && (
        <div role="alert" className="subjects-alert subjects-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="subjects-alert subjects-alert-success">
          {success}
        </div>
      )}

      <section className="panel subject-create-panel">
        <div className="subject-create-heading">
          <span className="subject-create-icon"><Plus size={19} /></span>
          <div>
            <h2>Add a subject</h2>
            <p>Create a course space for your tasks.</p>
          </div>
        </div>

        <form className="subject-form" onSubmit={handleSubmit}>
          <label className="subject-field" htmlFor="subject-name">
            <span>Subject name</span>
            <input
              id="subject-name"
              type="text"
              placeholder="e.g. Mathematics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="subject-field" htmlFor="subject-description">
            <span>Description <em>(optional)</em></span>
            <input
              id="subject-description"
              type="text"
              placeholder="e.g. Semester 3 mathematics"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <button className="button primary subject-submit" type="submit" disabled={saving}>
            <Plus size={18} />
            {saving ? 'Saving...' : 'Add subject'}
          </button>
        </form>
      </section>

      <section className="subjects-section">
        <div className="subjects-list-heading">
          <div>
            <h2>All subjects</h2>
            <p>Browse your courses alphabetically.</p>
          </div>

          <button
            type="button"
            className="button secondary small-button subjects-refresh"
            onClick={loadSubjects}
            disabled={loading}
            aria-label="Refresh subjects"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="subjects-loading"><span className="spinner" />Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="subjects-empty">
            <span className="subject-empty-icon"><BookOpen size={23} /></span>
            <h3>No subjects yet</h3>
            <p>Add your first course above to start organizing related tasks.</p>
          </div>
        ) : (
          <div className="subjects-grid">
            {orderedSubjects.map((subject) => (
              <article
                className="subject-card"
                key={subject._id || subject.id || getSubjectName(subject)}
              >
                <div className="subject-card-top">
                  <span className="subject-card-icon"><BookOpen size={20} /></span>
                  <button
                    type="button"
                    className="subject-delete-button"
                    onClick={() => handleDelete(subject)}
                    aria-label={`Delete ${getSubjectName(subject)}`}
                    title="Delete subject"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <h3>{getSubjectName(subject)}</h3>
                <p>{subject.description || 'No description added.'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
