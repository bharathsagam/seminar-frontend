import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ClipboardList } from 'lucide-react';
import { useDebounced, useFetch } from '../../hooks';
import PageHeader from '../../components/PageHeader';
import { PageLoader } from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';

export default function AllRegistrations() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const qs = new URLSearchParams({ page, limit: 25 });
  if (q) qs.set('search', q);
  if (status) qs.set('status', status);
  const { data, loading, error } = useFetch(`/registrations?${qs}`);

  return (
    <>
      <PageHeader title="Registrations" subtitle="Monitor registrations across every seminar." />
      <div className="filters">
        <div className="input-wrap search">
          <span className="input-icon" aria-hidden="true"><Search size={18} /></span>
          <input type="search" placeholder="Search participant or seminar" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search registrations" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status">
          <option value="">All statuses</option>
          <option value="pending">Awaiting approval</option>
          <option value="approved">Confirmed</option>
          <option value="attended">Attended</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {loading ? <PageLoader /> : error ? <div className="alert alert-error">{error}</div> : data.registrations.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No registrations match" />
      ) : (
        <>
          <p className="result-count">{data.total} registration{data.total === 1 ? '' : 's'}</p>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Participant</th><th>Seminar</th><th>Seminar date</th><th>Registered</th><th>Status</th></tr></thead>
              <tbody>
                {data.registrations.map((r) => (
                  <tr key={r._id}>
                    <td><strong>{r.student?.name || 'Deleted user'}</strong><small className="muted block">{r.student?.email}</small></td>
                    <td>{r.seminar ? <Link to={`/seminars/${r.seminar._id}/participants`} className="strong-link">{r.seminar.title}</Link> : 'Deleted seminar'}</td>
                    <td>{formatDate(r.seminar?.date)}</td>
                    <td>{formatDate(r.registrationDate)}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pages > 1 && (
            <div className="pager">
              <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {data.page} of {data.pages}</span>
              <button className="btn btn-ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
