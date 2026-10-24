import { useEffect, useRef, useState } from 'react';
import { BookOpen, FileText, Pencil, Plus, RefreshCw, Search, Star, Tags, Trash2, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';

const blankForm = { subject: '', title: '', content: '', tags: [] };

export default function SubjectNotes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState('');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const notesRequestId = useRef(0);
  const subjectFilter = searchParams.get('subjectId') || '';

  async function loadSubjects() {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data?.subjects || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load subjects.');
    }
  }

  async function loadNotes() {
    const requestId = ++notesRequestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/notes', { params: {
        ...(subjectFilter ? { subjectId: subjectFilter } : {}),
        ...(tagFilter ? { tag: tagFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      } });
      if (requestId === notesRequestId.current) setNotes(response.data?.notes || []);
    } catch (err) {
      if (requestId === notesRequestId.current) setError(err.response?.data?.message || 'Could not load notes.');
    } finally {
      if (requestId === notesRequestId.current) setLoading(false);
    }
  }

  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => {
    const timer = window.setTimeout(loadNotes, search.trim() ? 250 : 0);
    return () => {
      window.clearTimeout(timer);
      notesRequestId.current += 1;
    };
  }, [subjectFilter, tagFilter, search]);
  useEffect(() => {
    if (!editingId) setForm((current) => ({ ...current, subject: subjectFilter }));
  }, [subjectFilter, editingId]);

  function toggleTag(tag) {
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag],
    }));
  }

  function startEditing(note) {
    setEditingId(note._id);
    setForm({ subject: note.subject?._id || '', title: note.title, content: note.content, tags: note.tags || [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId('');
    setForm({ ...blankForm, subject: subjectFilter });
  }

  async function saveNote(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = editingId
        ? await api.patch(`/notes/${editingId}`, form)
        : await api.post('/notes', form);
      if (editingId) setNotes((current) => current.map((note) => note._id === editingId ? response.data.note : note));
      else setNotes((current) => [response.data.note, ...current]);
      setSuccess(editingId ? 'Note updated.' : 'Note saved.');
      resetForm();
      if (search.trim() || (tagFilter && !response.data.note.tags?.includes(tagFilter)) || (subjectFilter && response.data.note.subject?._id !== subjectFilter)) {
        await loadNotes();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this note.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(note) {
    if (!window.confirm(`Delete “${note.title}”?`)) return;
    setError('');
    try {
      await api.delete(`/notes/${note._id}`);
      setNotes((current) => current.filter((item) => item._id !== note._id));
      if (editingId === note._id) resetForm();
      setSuccess('Note deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this note.');
    }
  }

  function changeSubjectFilter(value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('subjectId', value);
    else next.delete('subjectId');
    setSearchParams(next);
    if (!editingId) setForm((current) => ({ ...current, subject: value }));
  }

  return <div className="subject-notes-page">
    <header className="page-heading">
      <div><span className="eyebrow">YOUR KNOWLEDGE LIBRARY</span><h1>Subject notes</h1><p>Keep important ideas and revision notes beside each subject.</p></div>
      <div className="notes-count"><FileText size={17}/><span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span></div>
    </header>
    {error && <div className="alert error" role="alert">{error}</div>}
    {success && <div className="exam-success" role="status">{success}</div>}

    <section className="panel note-editor-panel">
      <div className="exam-section-title"><span className="exam-title-icon">{editingId ? <Pencil size={18}/> : <Plus size={18}/>}</span><div><h2>{editingId ? 'Edit note' : 'Create a note'}</h2><p>Notes are saved under one of your subjects.</p></div></div>
      {subjects.length === 0 ? <div className="notes-no-subject"><BookOpen size={18}/>Add a subject before creating notes.</div> : <form className="note-editor-form" onSubmit={saveNote}>
        <div className="note-editor-fields">
          <label>Subject<select required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}><option value="">Choose a subject</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}</select></label>
          <label>Note title<input required maxLength="120" value={form.title} placeholder="e.g. Cell division summary" onChange={(event) => setForm({ ...form, title: event.target.value })}/></label>
        </div>
        <label className="note-content-label">Note<textarea required maxLength="20000" rows="6" value={form.content} placeholder="Write definitions, key ideas, formulas, or questions to revisit..." onChange={(event) => setForm({ ...form, content: event.target.value })}/></label>
        <div className="note-editor-bottom"><fieldset className="note-tag-options"><legend>Tags</legend>{['Important', 'Revision'].map((tag) => <label key={tag} className={`note-tag-toggle ${form.tags.includes(tag) ? 'selected' : ''}`}><input type="checkbox" checked={form.tags.includes(tag)} onChange={() => toggleTag(tag)}/>{tag === 'Important' ? <Star size={14}/> : <RefreshCw size={14}/>} {tag}</label>)}</fieldset>
          <div className="note-editor-actions">{editingId && <button className="button secondary" type="button" onClick={resetForm}><X size={15}/>Cancel</button>}<button className="button primary" type="submit" disabled={saving}><Plus size={16}/>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Save note'}</button></div>
        </div>
      </form>}
    </section>

    <section className="notes-library">
      <div className="notes-toolbar">
        <label className="notes-search"><Search size={16}/><input aria-label="Search notes" value={search} placeholder="Search note titles and text" onChange={(event) => setSearch(event.target.value)}/></label>
        <select aria-label="Filter by subject" value={subjectFilter} onChange={(event) => changeSubjectFilter(event.target.value)}><option value="">All subjects</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}</select>
        <select aria-label="Filter by tag" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}><option value="">All tags</option><option value="Important">Important</option><option value="Revision">Revision</option></select>
      </div>
      {loading ? <div className="loading-panel"><div className="spinner"/>Loading notes...</div> : notes.length === 0 ? <div className="panel exam-empty"><Tags size={28}/><h3>No matching notes</h3><p>Create a note above or adjust your search and filters.</p></div> : <div className="notes-grid">{notes.map((note) => <article className="panel subject-note-card" key={note._id}>
        <div className="subject-note-meta"><span className="note-subject-label" style={{ '--subject-color': note.subject?.color || '#8A70B5' }}><BookOpen size={13}/>{note.subject?.name || 'Subject'}</span><div className="note-card-actions"><button type="button" title="Edit note" aria-label={`Edit ${note.title}`} onClick={() => startEditing(note)}><Pencil size={15}/></button><button type="button" title="Delete note" aria-label={`Delete ${note.title}`} onClick={() => deleteNote(note)}><Trash2 size={15}/></button></div></div>
        <h3>{note.title}</h3><p className="subject-note-content">{note.content}</p>
        {note.tags?.length > 0 && <div className="subject-note-tags">{note.tags.map((tag) => <span className={`subject-note-tag ${tag.toLowerCase()}`} key={tag}>{tag === 'Important' ? <Star size={12}/> : <RefreshCw size={12}/>} {tag}</span>)}</div>}
        <small className="subject-note-updated">Updated {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>
      </article>)}</div>}
    </section>
  </div>;
}
