import { Link } from 'react-router-dom';
import { CalendarSearch, Ticket, Award, Mic, PlusCircle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks';
import PageHeader from '../components/PageHeader';
import { PageLoader } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import SeminarTicket from '../components/SeminarTicket';
import StatusBadge from '../components/StatusBadge';
import { formatDate, isPast, timeRange } from '../utils/format';

const Stat = ({ value, label, to }) => {
  const inner = (<><strong>{value ?? 0}</strong><span>{label}</span></>);
  return to ? <Link to={to} className="stat">{inner}</Link> : <div className="stat">{inner}</div>;
};

function StudentDashboard({ user }) {
  const regs = useFetch('/registrations/my');
  const upcoming = useFetch('/seminars?when=upcoming&status=upcoming&limit=4');
  if (regs.loading || upcoming.loading) return <PageLoader />;

  const list = regs.data?.registrations || [];
  const active = list.filter((r) => ['pending', 'approved'].includes(r.status) && !isPast(r.seminar.date));
  const certs = list.filter((r) => r.certificate).length;
  const suggestions = (upcoming.data?.seminars || []).filter((s) => !s.myStatus).slice(0, 3);

  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} subtitle="Here is what is coming up for you." />
      <div className="stats">
        <Stat value={active.length} label="Upcoming seminars" to="/my-registrations" />
        <Stat value={list.filter((r) => r.status === 'pending').length} label="Awaiting approval" to="/my-registrations" />
        <Stat value={certs} label="Certificates earned" to="/my-certificates" />
      </div>

      <section className="section">
        <div className="section-head"><h2>Your next seminars</h2><Link to="/my-registrations">All registrations</Link></div>
        {active.length ? (
          <div className="list-rows">
            {active.slice(0, 4).map((r) => (
              <Link key={r._id} to={`/seminars/${r.seminar._id}`} className="row-link">
                <div><strong>{r.seminar.title}</strong><span className="muted">{formatDate(r.seminar.date)}, {timeRange(r.seminar.startTime, r.seminar.endTime)} at {r.seminar.venue}</span></div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={Ticket} title="No upcoming registrations" action={<Link className="btn btn-primary" to="/seminars">Browse seminars</Link>}>
            Pick a seminar and reserve a seat.
          </EmptyState>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Open for registration</h2><Link to="/seminars">Browse all</Link></div>
          <div className="ticket-grid">{suggestions.map((s) => <SeminarTicket key={s._id} seminar={s} />)}</div>
        </section>
      )}
    </>
  );
}

function ManagerDashboard({ user }) {
  const { data, loading, error } = useFetch('/reports/overview');
  if (loading) return <PageLoader />;
  if (error) return <div className="alert alert-error">{error}</div>;
  const { stats, upcoming, recentRegistrations } = data;
  const isAdmin = user.role === 'admin';

  return (
    <>
      <PageHeader
        title={isAdmin ? 'System overview' : `Hello, ${user.name.split(' ')[0]}`}
        subtitle={isAdmin ? 'Seminars, registrations and users across the system.' : 'Activity across the seminars you organize.'}
        actions={<Link to="/seminars/new" className="btn btn-primary"><PlusCircle size={18} /> Create seminar</Link>}
      />
      <div className="stats">
        <Stat value={stats.totalSeminars} label={isAdmin ? 'Seminars' : 'Your seminars'} to={isAdmin ? '/seminars' : '/organizer/seminars'} />
        <Stat value={stats.seminarsByStatus.upcoming} label="Upcoming" />
        <Stat value={stats.registrationsByStatus.pending} label="Awaiting approval" />
        <Stat value={stats.certificatesIssued} label="Certificates issued" />
        {isAdmin && <Stat value={stats.totalUsers} label="Users" to="/admin/users" />}
      </div>

      <div className="two-col">
        <section className="section panel">
          <div className="section-head"><h2>Coming up</h2></div>
          {upcoming.length ? (
            <div className="list-rows">
              {upcoming.map((s) => (
                <Link key={s._id} to={`/seminars/${s._id}`} className="row-link">
                  <div><strong>{s.title}</strong><span className="muted">{formatDate(s.date)} at {s.venue}</span></div>
                  <span className="pill">{s.registeredCount}/{s.capacity}</span>
                </Link>
              ))}
            </div>
          ) : <EmptyState icon={CalendarSearch} title="Nothing scheduled">Create a seminar to open registrations.</EmptyState>}
        </section>
        <section className="section panel">
          <div className="section-head"><h2>Latest registrations</h2></div>
          {recentRegistrations.length ? (
            <div className="list-rows">
              {recentRegistrations.map((r) => (
                <Link key={r._id} to={`/seminars/${r.seminar._id}/participants`} className="row-link">
                  <div><strong>{r.student.name}</strong><span className="muted">{r.seminar.title}</span></div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          ) : <EmptyState icon={Users} title="No registrations yet" />}
        </section>
      </div>
    </>
  );
}

function SpeakerDashboard({ user }) {
  const { data, loading } = useFetch('/sessions/my');
  if (loading) return <PageLoader />;
  const sessions = (data?.sessions || []).filter((s) => !isPast(s.seminar.date));
  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} subtitle="Your upcoming speaking sessions." />
      <div className="stats">
        <Stat value={sessions.length} label="Upcoming sessions" to="/speaker/sessions" />
        <Stat value={data?.sessions?.length} label="Sessions in total" to="/speaker/sessions" />
      </div>
      <section className="section">
        {sessions.length ? (
          <div className="list-rows">
            {sessions.map((s) => (
              <Link key={s._id} to={`/seminars/${s.seminar._id}`} className="row-link">
                <div><strong>{s.topic}</strong><span className="muted">{s.seminar.title}, {formatDate(s.seminar.date)}, {timeRange(s.startTime, s.endTime)}</span></div>
                <span className="pill">{s.seminar.venue}</span>
              </Link>
            ))}
          </div>
        ) : <EmptyState icon={Mic} title="No upcoming sessions">Organizers will assign you to seminar sessions.</EmptyState>}
      </section>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (user.role === 'student') return <StudentDashboard user={user} />;
  if (user.role === 'speaker') return <SpeakerDashboard user={user} />;
  return <ManagerDashboard user={user} />;
}
