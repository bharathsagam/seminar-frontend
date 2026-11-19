import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import api, { errorMessage } from '../../api/client';

// Add / edit a session. Speakers can edit topic, description and time only.
export default function SessionModal({ seminar, session, speakerMode, onClose, onSaved }) {
  const [form, setForm] = useState({
    topic: session?.topic || '',
    description: session?.description || '',
    startTime: session?.startTime || seminar.startTime,
    endTime: session?.endTime || seminar.endTime,
    speaker: session?.speaker?._id || '',
  });
  const [speakers, setSpeakers] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (speakerMode) return;
    api.get('/users/speakers').then((r) => setSpeakers(r.data.speakers)).catch((e) => setError(errorMessage(e)));
  }, [speakerMode]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!form.topic.trim()) return setError('Enter a topic');
    if (!speakerMode && !form.speaker) return setError('Select a speaker');
    if (form.startTime >= form.endTime) return setError('End time must be after start time');
    setBusy(true);
    setError('');
    try {
      const payload = { topic: form.topic.trim(), description: form.description.trim(), startTime: form.startTime, endTime: form.endTime };
      if (!speakerMode) payload.speaker = form.speaker;
      const res = session
        ? await api.patch(`/sessions/${session._id}`, payload)
        : await api.post('/sessions', { ...payload, seminar: seminar._id });
      onSaved(res.data.session);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={session ? 'Edit session' : 'Add session'}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose} type="button">Cancel</button>
        <button className="btn btn-primary" form="session-form" disabled={busy}>{busy ? 'Saving…' : session ? 'Save session' : 'Add session'}</button>
      </>}
    >
      <form id="session-form" className="form" onSubmit={save}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="field">
          <label htmlFor="s-topic">Topic</label>
          <input id="s-topic" value={form.topic} onChange={set('topic')} maxLength={150} />
        </div>
        {!speakerMode && (
          <div className="field">
            <label htmlFor="s-speaker">Speaker</label>
            <select id="s-speaker" value={form.speaker} onChange={set('speaker')}>
              <option value="">Select a speaker</option>
              {speakers.map((s) => <option key={s._id} value={s._id}>{s.name}{s.specialization ? ` (${s.specialization})` : ''}</option>)}
            </select>
            {speakers.length === 0 && <p className="hint">No speaker accounts yet. An administrator can create one under Users.</p>}
          </div>
        )}
        <div className="field-row">
          <div className="field">
            <label htmlFor="s-start">Starts</label>
            <input id="s-start" type="time" value={form.startTime} onChange={set('startTime')} min={seminar.startTime} max={seminar.endTime} />
          </div>
          <div className="field">
            <label htmlFor="s-end">Ends</label>
            <input id="s-end" type="time" value={form.endTime} onChange={set('endTime')} min={seminar.startTime} max={seminar.endTime} />
          </div>
        </div>
        <p className="hint">Must fall within the seminar time, {seminar.startTime}–{seminar.endTime}.</p>
        <div className="field">
          <label htmlFor="s-desc">Notes for participants (optional)</label>
          <textarea id="s-desc" rows={3} value={form.description} onChange={set('description')} maxLength={1500} />
        </div>
      </form>
    </Modal>
  );
}
