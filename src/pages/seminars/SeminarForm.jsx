import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api, { errorMessage, fieldErrors } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import { PageLoader } from '../../components/Loader';
import { toInputDate } from '../../utils/format';

const empty = { title: '', description: '', category: '', date: '', startTime: '10:00', endTime: '13:00', venue: '', capacity: 50, requiresApproval: false, status: 'upcoming', organizer: '' };

export default function SeminarForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [registered, setRegistered] = useState(0);
  const [organizers, setOrganizers] = useState([]);

  useEffect(() => {
    if (!editing) return;
    api.get(`/seminars/${id}`)
      .then(({ data }) => {
        if (!data.canManage) {
          toast.error('You can only edit seminars you organize.');
          navigate(`/seminars/${id}`, { replace: true });
          return;
        }
        const s = data.seminar;
        setRegistered(s.registeredCount);
        setForm({ ...empty, ...s, date: toInputDate(s.date), organizer: s.organizer?._id || '' });
      })
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, editing, navigate, toast]);

  useEffect(() => {
    if (user.role === 'admin' && !editing) {
      api.get('/users/organizers').then((r) => setOrganizers(r.data.users)).catch(() => {});
    }
  }, [user.role, editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 3) e.title = 'Enter a title of at least 3 characters';
    if (form.description.trim().length < 10) e.description = 'Describe the seminar in at least 10 characters';
    if (!form.date) e.date = 'Choose a date';
    else if (!editing && form.date < new Date().toISOString().slice(0, 10)) e.date = 'Choose today or a future date';
    if (!form.startTime) e.startTime = 'Choose a start time';
    if (!form.endTime || form.endTime <= form.startTime) e.endTime = 'End time must be after start time';
    if (form.venue.trim().length < 2) e.venue = 'Enter a venue';
    const cap = Number(form.capacity);
    if (!Number.isInteger(cap) || cap < 1) e.capacity = 'Capacity must be a whole number of at least 1';
    else if (cap < registered) e.capacity = `Capacity cannot be below the ${registered} seats already taken`;
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(Object.keys(e)[0])?.focus();
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || 'General',
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      venue: form.venue.trim(),
      capacity: Number(form.capacity),
      requiresApproval: form.requiresApproval,
    };
    if (editing) payload.status = form.status;
    if (!editing && user.role === 'admin' && form.organizer) payload.organizer = form.organizer;
    try {
      const res = editing ? await api.patch(`/seminars/${id}`, payload) : await api.post('/seminars', payload);
      toast.success(editing ? 'Seminar saved' : 'Seminar created');
      navigate(`/seminars/${res.data.seminar._id}`);
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  const err = (k) => errors[k] && <p className="error-text" id={`${k}-err`}>{errors[k]}</p>;
  const aria = (k) => ({ 'aria-invalid': Boolean(errors[k]) || undefined, 'aria-describedby': errors[k] ? `${k}-err` : undefined });

  return (
    <>
      <Link to={editing ? `/seminars/${id}` : '/seminars'} className="back-link"><ArrowLeft size={16} /> Back</Link>
      <PageHeader title={editing ? 'Edit seminar' : 'Create seminar'} subtitle={editing ? 'Changes are visible to participants straight away.' : 'Participants can register as soon as you create it.'} />
      <form className="panel form form-wide" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" value={form.title} onChange={set('title')} maxLength={150} {...aria('title')} />
          {err('title')}
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" rows={5} value={form.description} onChange={set('description')} maxLength={3000} {...aria('description')} />
          {err('description')}
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="category">Category</label>
            <input id="category" value={form.category} onChange={set('category')} placeholder="e.g. Artificial Intelligence" maxLength={60} />
          </div>
          <div className="field">
            <label htmlFor="venue">Venue</label>
            <input id="venue" value={form.venue} onChange={set('venue')} placeholder="e.g. Seminar Hall A" {...aria('venue')} />
            {err('venue')}
          </div>
        </div>
        <div className="field-row three">
          <div className="field">
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={form.date} onChange={set('date')} {...aria('date')} />
            {err('date')}
          </div>
          <div className="field">
            <label htmlFor="startTime">Starts</label>
            <input id="startTime" type="time" value={form.startTime} onChange={set('startTime')} {...aria('startTime')} />
            {err('startTime')}
          </div>
          <div className="field">
            <label htmlFor="endTime">Ends</label>
            <input id="endTime" type="time" value={form.endTime} onChange={set('endTime')} {...aria('endTime')} />
            {err('endTime')}
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="capacity">Seats</label>
            <input id="capacity" type="number" min={Math.max(1, registered)} value={form.capacity} onChange={set('capacity')} {...aria('capacity')} />
            {err('capacity')}
            {editing && registered > 0 && <p className="hint">{registered} seats are already taken.</p>}
          </div>
          {editing ? (
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" value={form.status} onChange={set('status')}>
                <option value="upcoming">Upcoming (open for registration)</option>
                <option value="ongoing">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ) : user.role === 'admin' ? (
            <div className="field">
              <label htmlFor="organizer">Organizer</label>
              <select id="organizer" value={form.organizer} onChange={set('organizer')}>
                <option value="">Me (administrator)</option>
                {organizers.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
              </select>
            </div>
          ) : <div />}
        </div>
        <label className="check">
          <input type="checkbox" checked={form.requiresApproval} onChange={set('requiresApproval')} />
          <span>Review each registration before confirming it</span>
        </label>
        <div className="form-actions">
          <Link to={editing ? `/seminars/${id}` : '/seminars'} className="btn btn-ghost">Cancel</Link>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save seminar' : 'Create seminar'}</button>
        </div>
      </form>
    </>
  );
}
