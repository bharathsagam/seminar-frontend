import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Award } from 'lucide-react';
import { useFetch } from '../../hooks';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import { PageLoader } from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/Modal';
import { formatDate, isPast, timeRange } from '../../utils/format';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'closed', label: 'Cancelled & rejected' },
];

export default function MyRegistrations() {
  const { data, loading, error, reload } = useFetch('/registrations/my');
  const toast = useToast();
  const [tab, setTab] = useState('upcoming');
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoader />;
  if (error) return <div className="alert alert-error">{error}</div>;

  const all = data.registrations;
  const groups = {
    upcoming: all.filter((r) => ['pending', 'approved'].includes(r.status) && !isPast(r.seminar.date)),
    past: all.filter((r) => r.status === 'attended' || (['pending', 'approved'].includes(r.status) && isPast(r.seminar.date))),
    closed: all.filter((r) => ['cancelled', 'rejected'].includes(r.status)),
  };
  const list = groups[tab];

  const cancel = async () => {
    setBusy(true);
    try {
      await api.patch(`/registrations/${cancelling._id}/cancel`);
      toast.success('Registration cancelled');
      setCancelling(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="My registrations" subtitle="Track the status of every seminar you signed up for." />
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} <span className="tab-count">{groups[t.key].length}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Ticket} title={tab === 'upcoming' ? 'No upcoming registrations' : 'Nothing here yet'}
          action={tab === 'upcoming' && <Link to="/seminars" className="btn btn-primary">Browse seminars</Link>} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Seminar</th><th>Date & time</th><th>Venue</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r._id}>
                  <td><Link to={`/seminars/${r.seminar._id}`} className="strong-link">{r.seminar.title}</Link><small className="muted block">Registered {formatDate(r.registrationDate)}</small></td>
                  <td>{formatDate(r.seminar.date)}<small className="muted block">{timeRange(r.seminar.startTime, r.seminar.endTime)}</small></td>
                  <td>{r.seminar.venue}</td>
                  <td><StatusBadge status={r.status} />{r.remarks && <small className="muted block">{r.remarks}</small>}</td>
                  <td className="actions">
                    {r.certificate && <Link to={`/certificates/${r.certificate._id}`} className="btn btn-sm btn-primary"><Award size={14} /> Certificate</Link>}
                    {['pending', 'approved'].includes(r.status) && !isPast(r.seminar.date) && (
                      <button className="btn btn-sm btn-ghost" onClick={() => setCancelling(r)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cancelling && (
        <ConfirmDialog danger busy={busy} title="Cancel your registration?" confirmLabel="Cancel registration"
          message={`Your seat for "${cancelling.seminar.title}" will be released to other participants.`}
          onClose={() => setCancelling(null)} onConfirm={cancel} />
      )}
    </>
  );
}
