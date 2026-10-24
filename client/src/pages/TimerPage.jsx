
import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';

const DEFAULT_DURATIONS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15
};

export default function TimerPage() {
  const [mode, setMode] = useState('focus');
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [durationInputs, setDurationInputs] = useState({
    focus: '25',
    shortBreak: '5',
    longBreak: '15'
  });
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [remaining, setRemaining] = useState(1500);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const endTimeRef = useRef(null);
  const runStartedAtRef = useRef(null);
  const sessionStartedAtRef = useRef(null);
  const sessionSubjectRef = useRef('');
  const elapsedMsRef = useRef(0);
  const completedRef = useRef(false);
  const savingRef = useRef(false);

  const formatTime = (seconds) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
      seconds % 60
    ).padStart(2, '0')}`;

  useEffect(() => {
    try {
      const savedDurations = JSON.parse(
        localStorage.getItem('studynest_timer_durations') || 'null'
      );
      if (!savedDurations) return;

      const validDurations = { ...DEFAULT_DURATIONS };
      for (const key of Object.keys(DEFAULT_DURATIONS)) {
        const value = Number(savedDurations[key]);
        if (Number.isInteger(value) && value >= 1 && value <= 720) {
          validDurations[key] = value;
        }
      }

      setDurations(validDurations);
      setDurationInputs({
        focus: String(validDurations.focus),
        shortBreak: String(validDurations.shortBreak),
        longBreak: String(validDurations.longBreak)
      });
      setRemaining(validDurations.focus * 60);
    } catch {
      // Ignore invalid local preferences and use the standard durations.
    }
  }, []);

  useEffect(() => {
    let active = true;

    api.get('/subjects')
      .then(({ data }) => {
        const items = data?.subjects ?? data;
        if (active) setSubjects(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (active) {
          setMessage('Could not load subjects. Sessions can still be saved without one.');
          setMessageType('error');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000)
      );

      setRemaining(left);

      if (left === 0) {
        if (runStartedAtRef.current) {
          elapsedMsRef.current += Date.now() - runStartedAtRef.current;
        }

        runStartedAtRef.current = null;
        endTimeRef.current = null;
        setRunning(false);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (running || remaining !== 0 || completedRef.current) return;

    completedRef.current = true;

    if (mode !== 'focus') {
      setMessage('Break finished! Time to study again.');
      setMessageType('success');
      return;
    }

    const saveSession = async () => {
      if (savingRef.current) return;

      savingRef.current = true;
      setSaving(true);
      setMessage('Saving study session...');
      setMessageType('info');

      try {
        const durationMinutes = Math.floor(elapsedMsRef.current / 60000);

        if (durationMinutes < 1) {
          throw new Error('Study session must last at least one minute.');
        }

        const startedAt =
          sessionStartedAtRef.current || new Date().toISOString();

        await api.post('/sessions', {
          startedAt,
          durationMinutes,
          subject: sessionSubjectRef.current || null,
          note: 'Pomodoro focus session'
        });

        const subjectName = subjects.find(
          (subject) => String(subject._id || subject.id) === sessionSubjectRef.current
        )?.name;
        setMessage(
          `Session saved${subjectName ? ` for ${subjectName}` : ''}: ${durationMinutes} minute(s).`
        );
        setMessageType('success');
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            error.message ||
            'Failed to save session.'
        );
        setMessageType('error');
      } finally {
        setSaving(false);
        savingRef.current = false;
        elapsedMsRef.current = 0;
        sessionStartedAtRef.current = null;
        sessionSubjectRef.current = '';
        runStartedAtRef.current = null;
      }
    };

    saveSession();
  }, [running, remaining, mode]);

  const startTimer = () => {
    if (savingRef.current) return;

    const now = Date.now();

    if (remaining === 0) {
      setRemaining(durations[mode] * 60);
      completedRef.current = false;
      elapsedMsRef.current = 0;
    }

    if (mode === 'focus' && !sessionStartedAtRef.current) {
      sessionStartedAtRef.current = new Date(now).toISOString();
      sessionSubjectRef.current = selectedSubjectId;
    }

    const seconds = remaining === 0 ? durations[mode] * 60 : remaining;

    runStartedAtRef.current = now;
    endTimeRef.current = now + seconds * 1000;

    setMessage('');
    setMessageType('');
    setRunning(true);
  };

  const pauseTimer = () => {
    if (runStartedAtRef.current) {
      elapsedMsRef.current += Date.now() - runStartedAtRef.current;
    }

    runStartedAtRef.current = null;
    endTimeRef.current = null;
    setRunning(false);
  };

  const resetTimer = () => {
    setRunning(false);
    endTimeRef.current = null;
    runStartedAtRef.current = null;
    sessionStartedAtRef.current = null;
    sessionSubjectRef.current = '';
    elapsedMsRef.current = 0;
    completedRef.current = false;
    setRemaining(durations[mode] * 60);
    setMessage('');
    setMessageType('');
  };

  const changeMode = (newMode) => {
    setRunning(false);
    endTimeRef.current = null;
    runStartedAtRef.current = null;
    sessionStartedAtRef.current = null;
    sessionSubjectRef.current = '';
    elapsedMsRef.current = 0;
    completedRef.current = false;

    setMode(newMode);
    setRemaining(durations[newMode] * 60);
    setMessage('');
    setMessageType('');
  };

  const applyDurations = (event) => {
    event.preventDefault();
    if (running || saving || sessionStartedAtRef.current) return;

    const nextDurations = {};
    for (const key of Object.keys(DEFAULT_DURATIONS)) {
      const value = Number(durationInputs[key]);
      if (!Number.isInteger(value) || value < 1 || value > 720) {
        setMessage('Each duration must be a whole number between 1 and 720 minutes.');
        setMessageType('error');
        return;
      }
      nextDurations[key] = value;
    }

    setDurations(nextDurations);
    try {
      localStorage.setItem('studynest_timer_durations', JSON.stringify(nextDurations));
    } catch {
      // The current page still uses the custom values if storage is unavailable.
    }
    setRemaining(nextDurations[mode] * 60);
    completedRef.current = false;
    elapsedMsRef.current = 0;
    sessionStartedAtRef.current = null;
    sessionSubjectRef.current = '';
    setMessage('Timer durations updated.');
    setMessageType('success');
  };

  const progress =
    ((durations[mode] * 60 - remaining) / (durations[mode] * 60)) * 100;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 700,
        margin: '24px auto',
        padding: 20,
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        color: '#1f2937'
      }}
    >
      <h1 style={{ textAlign: 'center', fontSize: 28, marginBottom: 8 }}>
        Study Timer
      </h1>

      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 24 }}>
        Focus on one task at a time.
      </p>

      <section
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 20,
          padding: 24,
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}
      >
        <details
          style={{
            maxWidth: 440,
            margin: '0 auto 20px',
            padding: '12px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            textAlign: 'left',
            background: '#fafafa'
          }}
        >
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            Customize timer durations
          </summary>
          <form onSubmit={applyDurations}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: 10,
                marginTop: 14
              }}
            >
              {[
                ['focus', 'Focus'],
                ['shortBreak', 'Short break'],
                ['longBreak', 'Long break']
              ].map(([key, label]) => (
                <label
                  key={key}
                  style={{ display: 'grid', gap: 6, fontSize: 12, color: '#4b5563' }}
                >
                  {label} (min)
                  <input
                    type="number"
                    min="1"
                    max="720"
                    step="1"
                    required
                    disabled={running || saving || Boolean(sessionStartedAtRef.current)}
                    value={durationInputs[key]}
                    onChange={(event) =>
                      setDurationInputs((current) => ({
                        ...current,
                        [key]: event.target.value
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: 9,
                      background: '#fff',
                      color: '#374151'
                    }}
                  />
                </label>
              ))}
            </div>
            <button
              type="submit"
              disabled={running || saving || Boolean(sessionStartedAtRef.current)}
              style={{
                marginTop: 12,
                padding: '9px 14px',
                border: 0,
                borderRadius: 9,
                background: '#4f46e5',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Apply durations
            </button>
          </form>
        </details>

        {mode === 'focus' && (
          <label
            style={{
              display: 'grid',
              gap: 7,
              maxWidth: 360,
              margin: '0 auto 18px',
              textAlign: 'left',
              color: '#4b5563',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            Study subject <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
            <select
              value={selectedSubjectId}
              disabled={saving || running || Boolean(sessionStartedAtRef.current)}
              onChange={(event) => setSelectedSubjectId(event.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 10,
                background: '#fff',
                color: '#374151',
                fontSize: 14
              }}
            >
              <option value="">General study (no subject)</option>
              {subjects.map((subject) => (
                <option key={subject._id || subject.id} value={subject._id || subject.id}>
                  {subject.name || subject.title || 'Untitled subject'}
                </option>
              ))}
            </select>
          </label>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 24
          }}
        >
          {[
            ['focus', '🧠 Focus'],
            ['shortBreak', '☕ Short break'],
            ['longBreak', '☕ Long break']
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => changeMode(value)}
              disabled={saving}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                background: mode === value ? '#4f46e5' : '#f3f4f6',
                color: mode === value ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          style={{
            width: 180,
            height: 180,
            margin: '0 auto 24px',
            borderRadius: '50%',
            border: '8px solid #e0e7ff',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f9faff',
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: '50%',
              border: '8px solid transparent',
              borderTopColor: '#4f46e5',
              transform: `rotate(${progress * 3.6}deg)`,
              pointerEvents: 'none'
            }}
          />
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            {mode === 'focus' ? 'Focus time' : 'Break time'}
          </span>

          <span
            style={{
              fontSize: 38,
              fontWeight: 700,
              lineHeight: 1.3,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {formatTime(remaining)}
          </span>

          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {running ? 'Keep going!' : 'Ready when you are'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button
            onClick={running ? pauseTimer : startTimer}
            disabled={saving}
            style={{
              padding: '12px 24px',
              background: running ? '#d97706' : '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              cursor: 'pointer'
            }}
          >
            {running ? '⏸ Pause' : '▶ Start'}
          </button>

          <button
            onClick={resetTimer}
            disabled={saving}
            style={{
              padding: '12px 20px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 10,
              fontSize: 15,
              cursor: 'pointer'
            }}
          >
            ↻ Reset
          </button>
        </div>

        {message && (
          <p
            role="status"
            style={{
              marginTop: 20,
              padding: 12,
              borderRadius: 10,
              background: messageType === 'error' ? '#fef2f2' : '#f0fdf4',
              color: messageType === 'error' ? '#b91c1c' : '#166534',
              fontSize: 14,
              overflowWrap: 'anywhere'
            }}
          >
            {saving ? 'Saving… ' : ''}
            {message}
          </p>
        )}
      </section>

    </div>
  );
}

