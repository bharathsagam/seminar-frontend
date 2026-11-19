import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, CalendarSearch, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDebounced, useFetch } from '../../hooks';
import PageHeader from '../../components/PageHeader';
import SeminarTicket from '../../components/SeminarTicket';
import EmptyState from '../../components/EmptyState';
import { PageLoader } from '../../components/Loader';

export default function SeminarList() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [when, setWhen] = useState(params.get('when') || 'upcoming');
  const [category, setCategory] = useState(params.get('category') || '');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);

  useEffect(() => {
    const next = {};
    if (q) next.q = q;
    if (when !== 'upcoming') next.when = when;
    if (category) next.category = category;
    setParams(next, { replace: true });
    setPage(1);
  }, [q, when, category, setParams]);

  const qs = new URLSearchParams({ page, limit: 12 });
  if (q) qs.set('search', q);
  if (when !== 'all') qs.set('when', when);
  if (category) qs.set('category', category);

  const { data, loading, error } = useFetch(`/seminars?${qs}`);
  const cats = useFetch('/seminars/categories');
  const canCreate = ['organizer', 'admin'].includes(user.role);

  return (
    <>
      <PageHeader
        title={user.role === 'student' ? 'Browse seminars' : 'Seminars'}
        subtitle="Search by title, topic, venue or category."
        actions={canCreate && <Link to="/seminars/new" className="btn btn-primary"><PlusCircle size={18} /> Create seminar</Link>}
      />

      <div className="filters">
        <div className="input-wrap search">
          <span className="input-icon" aria-hidden="true"><Search size={18} /></span>
          <input type="search" placeholder="Search seminars" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search seminars" />
        </div>
        <select value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Date range">
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="all">All dates</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {(cats.data?.categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : error ? <div className="alert alert-error">{error}</div> : data.seminars.length === 0 ? (
        <EmptyState icon={CalendarSearch} title="No seminars match your search">
          Try different words, or switch the date filter to &ldquo;All dates&rdquo;.
        </EmptyState>
      ) : (
        <>
          <p className="result-count">{data.total} seminar{data.total === 1 ? '' : 's'}</p>
          <div className="ticket-grid">{data.seminars.map((s) => <SeminarTicket key={s._id} seminar={s} />)}</div>
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
