import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, User, Users, Pencil, Trash2, Plus, Award, ArrowLeft } from 'lucide-react';
import { useFetch } from '../../hooks';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/Loader';
import StatusBadge from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/Modal';
import SessionModal from './SessionModal';
import { formatLongDate, isPast, timeRange, formatDate } from '../../utils/format';

export default function SeminarDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(`/seminars/${id}`);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [sessionModal, setSessionModal] = useState(null);

  if (loading) return <PageLoader />;
  if (error) return <div className="alert alert-error">{error} <Link to="/seminars">Back to seminars</Link></div>;

  const { seminar, sessions, myRegistration, myCertificate, canManage } = data;
  const left = Math.max(seminar.capacity - seminar.registeredCount, 0);
  const past = isPast(seminar.date);
  const regActive = myRegistration && ['pending', 'approved', 'attended'].includes(myRegistration.status);

  const register = async () => {
    setBusy(true);
    try {
      const res = await api.post('/registrations', { seminarId: seminar._id });
      toast.success(res.data.message);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
      reload();
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = async () => {
    setBusy(true);
    try {
      if (confirm.type === 'cancel') {
        await api.patch(`/registrations/${myRegistration._id}/cancel`);
        toast.success('Registration cancelled. Your seat has been released.');
        reload();
      } else if (confirm.type === 'delete') {
        await api.delete(`/seminars/${seminar._id}`);
        toast.success('Seminar deleted');
        navigate(user.role === 'organizer' ? '/organizer/seminars' : '/seminars', { replace: true });
        return;
      } else if (confirm.type === 'session') {
        await api.delete(`/sessions/${confirm.session._id}`);
        toast.success('Session removed');
        reload();
      }
      setConfirm(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const studentAction = () => {
    if (user.role !== 'student') return null;
    if (myCertificate) {
      return <Link to={`/certificates/${myCertificate._id}`} className="btn btn-primary btn-block"><Award size={18} /> View certificate</Link>;
    }
    if (regActive) {
      return (
        <>
          <div className="reg-state">
            <StatusBadge status={myRegistration.status} />
            <span>Registered on {formatDate(myRegistration.registrationDate)}</span>
          </div>
          {myRegistration.status === 'pending' && <p className="hint">The organizer will review your registration.</p>}
          {['pending', 'approved'].includes(myRegistration.status) && !past && (
            <button className="btn btn-ghost btn-block" onClick={() => setConfirm({ type: 'cancel' })}>Cancel registration</button>
          )}
        </>
      );
    }
    if (myRegistration?.status === 'rejected') return <p className="hint">Your registration was not approved{myRegistration.remarks ? `: ${myRegistration.remarks}` : '.'}</p>;
    if (seminar.status !== 'upcoming' || past) return <p className="hint">Registration is closed for this seminar.</p>;
    if (left === 0) return <><button className="btn btn-primary btn-block" disabled>Seminar full</button><p className="hint">Registration is unavailable because every seat is taken.</p></>;
    return (
      <>
        <button className="btn btn-primary btn-block" onClick={register} disabled={busy}>{busy ? 'Registering…' : 'Register for this seminar'}</button>
        {seminar.requiresApproval && <p className="hint">The organizer approves registrations for this seminar.</p>}
        {myRegistration?.status === 'cancelled' && <p className="hint">You cancelled earlier. You can register again.</p>}
      </>
    );
  };

  return (
    <>
      <Link to="/seminars" className="back-link"><ArrowLeft size={16} /> Seminars</Link>
      <div className="detail">
        <div className="detail-main">
          <div className="detail-tags">
            <span className="ticket-cat">{seminar.category}</span>
            <StatusBadge status={seminar.status} />
          </div>
          <h1>{seminar.title}</h1>
          <ul className="facts">
            <li><CalendarDays size={18} aria-hidden="true" /> {formatLongDate(seminar.date)}</li>
            <li><Clock size={18} aria-hidden="true" /> {timeRange(seminar.startTime, seminar.endTime)}</li>
            <li><MapPin size={18} aria-hidden="true" /> {seminar.venue}</li>
            <li><User size={18} aria-hidden="true" /> Organized by {seminar.organizer?.name}</li>
          </ul>
          <p className="prose">{seminar.description}</p>

          <section className="section">
            <div className="section-head">
              <h2>Sessions</h2>
              {canManage && <button className="btn btn-ghost btn-sm" onClick={() => setSessionModal({})}><Plus size={16} /> Add session</button>}
            </div>
            {sessions.length ? (
              <ol className="timeline">
                {sessions.map((s) => {
                  const mine = user.role === 'speaker' && s.speaker?._id === user._id;
                  return (
                    <li key={s._id}>
                      <span className="tl-time">{timeRange(s.startTime, s.endTime)}</span>
                      <div className="tl-body">
                        <strong>{s.topic}</strong>
                        <span className="muted">{s.speaker?.name}{s.speaker?.specialization ? `, ${s.speaker.specialization}` : ''}</span>
                        {s.description && <p>{s.description}</p>}
                      </div>
                      {(canManage || mine) && (
                        <div className="tl-actions">
                          <button className="icon-btn" onClick={() => setSessionModal({ session: s, speakerMode: mine && !canManage })} aria-label={`Edit ${s.topic}`}><Pencil size={16} /></button>
                          {canManage && <button className="icon-btn danger" onClick={() => setConfirm({ type: 'session', session: s })} aria-label={`Remove ${s.topic}`}><Trash2 size={16} /></button>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : <p className="muted">The session schedule has not been published yet.</p>}
          </section>
        </div>

        <aside className="detail-side">
          <div className="panel seat-panel">
            <div className="seat-number"><strong>{left}</strong><span>of {seminar.capacity} seats left</span></div>
            <div className="seats-bar big" aria-hidden="true"><span style={{ width: `${Math.min(100, (seminar.registeredCount / seminar.capacity) * 100)}%` }} className={left === 0 ? 'full' : ''} /></div>
            {studentAction()}
          </div>

          {canManage && (
            <div className="panel manage-panel">
              <h2>Manage</h2>
              <Link to={`/seminars/${seminar._id}/participants`} className="btn btn-primary btn-block"><Users size={18} /> Participants ({seminar.registeredCount})</Link>
              <Link to={`/seminars/${seminar._id}/edit`} className="btn btn-ghost btn-block"><Pencil size={18} /> Edit seminar</Link>
              <button className="btn btn-ghost btn-block danger-text" onClick={() => setConfirm({ type: 'delete' })}><Trash2 size={18} /> Delete seminar</button>
            </div>
          )}
        </aside>
      </div>

      {confirm && (
        <ConfirmDialog
          busy={busy}
          danger
          onClose={() => setConfirm(null)}
          onConfirm={runConfirm}
          {...({
            cancel: { title: 'Cancel your registration?', message: 'Your seat will be released to other participants.', confirmLabel: 'Cancel registration' },
            delete: { title: 'Delete this seminar?', message: 'This removes the seminar and its sessions permanently. Seminars with active registrations cannot be deleted; set their status to cancelled instead.', confirmLabel: 'Delete seminar' },
            session: { title: 'Remove this session?', message: `"${confirm.session?.topic}" will be removed from the schedule.`, confirmLabel: 'Remove session' },
          })[confirm.type]}
        />
      )}
      {sessionModal && (
        <SessionModal
          seminar={seminar}
          session={sessionModal.session}
          speakerMode={sessionModal.speakerMode}
          onClose={() => setSessionModal(null)}
          onSaved={() => { setSessionModal(null); toast.success('Session saved'); reload(); }}
        />
      )}
    </>
  );
}
