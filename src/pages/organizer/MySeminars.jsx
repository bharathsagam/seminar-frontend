import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FolderKanban } from 'lucide-react';
import { useFetch } from '../../hooks';
import PageHeader from '../../components/PageHeader';
import { PageLoader } from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, timeRange } from '../../utils/format';

export default function MySeminars() {
  const [when, setWhen] = useState('upcoming');
  const { data, loading, error } = useFetch(`/seminars?mine=true&limit=100${when === 'all' ? '' : `&when=${when}`}`);

  return (
    <>
      <PageHeader title="My seminars" subtitle="Seminars you organize."
        actions={<Link to="/seminars/new" className="btn btn-primary"><PlusCircle size={18} /> Create seminar</Link>} />
      <div className="tabs" role="tablist">
        {['upcoming', 'past', 'all'].map((w) => (
          <button key={w} role="tab" aria-selected={when === w} className={`tab ${when === w ? 'active' : ''}`} onClick={() => setWhen(w)}>
            {w[0].toUpperCase() + w.slice(1)}
          </button>
        ))}
      </div>
      {loading ? <PageLoader /> : error ? <div className="alert alert-error">{error}</div> : data.seminars.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No seminars here" action={<Link to="/seminars/new" className="btn btn-primary">Create seminar</Link>} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Seminar</th><th>Date</th><th>Seats</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {data.seminars.map((s) => (
                <tr key={s._id}>
                  <td><Link to={`/seminars/${s._id}`} className="strong-link">{s.title}</Link><small className="muted block">{s.venue}</small></td>
                  <td>{formatDate(s.date)}<small className="muted block">{timeRange(s.startTime, s.endTime)}</small></td>
                  <td>
                    <div className="mini-meter"><span style={{ width: `${(s.registeredCount / s.capacity) * 100}%` }} /></div>
                    <small>{s.registeredCount} / {s.capacity}</small>
                  </td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="actions">
                    <Link to={`/seminars/${s._id}/participants`} className="btn btn-sm btn-primary">Participants</Link>
                    <Link to={`/seminars/${s._id}/edit`} className="btn btn-sm btn-ghost">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
