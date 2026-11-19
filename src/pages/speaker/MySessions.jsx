import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Pencil, MapPin, CalendarDays } from 'lucide-react';
import { useFetch } from '../../hooks';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import { PageLoader } from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import SessionModal from '../seminars/SessionModal';
import { formatLongDate, isPast, timeRange } from '../../utils/format';

export default function MySessions() {
  const { data, loading, error, reload } = useFetch('/sessions/my');
  const toast = useToast();
  const [editing, setEditing] = useState(null);

  if (loading) return <PageLoader />;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <>
      <PageHeader title="My sessions" subtitle="Sessions you are assigned to speak at. You can update the topic, notes and timing." />
      {data.sessions.length === 0 ? (
        <EmptyState icon={Mic} title="No sessions assigned">Organizers will add you to seminar sessions.</EmptyState>
      ) : (
        <div className="session-list">
          {data.sessions.map((s) => {
            const past = isPast(s.seminar.date);
            return (
              <article key={s._id} className={`panel session-card ${past ? 'is-past' : ''}`}>
                <div className="session-time">{timeRange(s.startTime, s.endTime)}</div>
                <div className="session-info">
                  <h3>{s.topic}</h3>
                  <Link to={`/seminars/${s.seminar._id}`} className="strong-link">{s.seminar.title}</Link>
                  <p className="ticket-meta"><CalendarDays size={14} aria-hidden="true" /> {formatLongDate(s.seminar.date)}</p>
                  <p className="ticket-meta"><MapPin size={14} aria-hidden="true" /> {s.seminar.venue}</p>
                  {s.description && <p className="muted">{s.description}</p>}
                  <small className="muted">Organizer: {s.seminar.organizer?.name} ({s.seminar.organizer?.email}), {s.seminar.registeredCount} registered</small>
                </div>
                <div className="session-side">
                  <StatusBadge status={s.seminar.status} />
                  {!past && <button className="btn btn-sm btn-ghost" onClick={() => setEditing(s)}><Pencil size={14} /> Update details</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {editing && (
        <SessionModal seminar={editing.seminar} session={editing} speakerMode
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); toast.success('Session updated'); reload(); }} />
      )}
    </>
  );
}
