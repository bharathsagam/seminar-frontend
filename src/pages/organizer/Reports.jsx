import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useFetch } from '../../hooks';
import { downloadFile, errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import { PageLoader } from '../../components/Loader';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, roleLabel } from '../../utils/format';

const Bars = ({ data, labels }) => {
  const max = Math.max(1, ...Object.values(data));
  return (
    <ul className="bars">
      {Object.keys(labels).map((k) => (
        <li key={k}>
          <span>{labels[k]}</span>
          <div className="bar"><span style={{ width: `${((data[k] || 0) / max) * 100}%` }} /></div>
          <strong>{data[k] || 0}</strong>
        </li>
      ))}
    </ul>
  );
};

export default function Reports() {
  const { user } = useAuth();
  const toast = useToast();
  const overview = useFetch('/reports/overview');
  const table = useFetch('/reports/seminars');

  if (overview.loading || table.loading) return <PageLoader />;
  if (overview.error || table.error) return <div className="alert alert-error">{overview.error || table.error}</div>;
  const { stats } = overview.data;

  const exportCsv = () => downloadFile('/reports/seminars?format=csv', 'seminar_report.csv').catch((e) => toast.error(errorMessage(e)));

  return (
    <>
      <PageHeader title="Reports" subtitle={user.role === 'admin' ? 'Figures for the whole system.' : 'Figures for the seminars you organize.'}
        actions={<button className="btn btn-primary" onClick={exportCsv}><Download size={18} /> Export CSV</button>} />

      <div className="report-grid">
        <section className="panel">
          <h2>Registrations by status</h2>
          <Bars data={stats.registrationsByStatus} labels={{ pending: 'Awaiting approval', approved: 'Confirmed', attended: 'Attended', cancelled: 'Cancelled', rejected: 'Rejected' }} />
          <p className="muted">{stats.totalRegistrations} registrations in total, {stats.certificatesIssued} certificates issued.</p>
        </section>
        <section className="panel">
          <h2>Seminars by status</h2>
          <Bars data={stats.seminarsByStatus} labels={{ upcoming: 'Upcoming', ongoing: 'In progress', completed: 'Completed', cancelled: 'Cancelled' }} />
        </section>
        {stats.usersByRole && (
          <section className="panel">
            <h2>Users by role</h2>
            <Bars data={stats.usersByRole} labels={{ student: roleLabel.student, organizer: roleLabel.organizer, speaker: roleLabel.speaker, admin: roleLabel.admin }} />
          </section>
        )}
      </div>

      <section className="section">
        <h2>Seminar breakdown</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Seminar</th><th>Date</th>{user.role === 'admin' && <th>Organizer</th>}<th>Fill</th><th>Pending</th><th>Confirmed</th><th>Attended</th><th>Status</th></tr></thead>
            <tbody>
              {table.data.rows.map((r) => (
                <tr key={r._id}>
                  <td><Link to={`/seminars/${r._id}`} className="strong-link">{r.title}</Link></td>
                  <td>{formatDate(r.date)}</td>
                  {user.role === 'admin' && <td>{r.organizer}</td>}
                  <td><div className="mini-meter"><span style={{ width: `${r.fillRate}%` }} /></div><small>{r.registered}/{r.capacity} ({r.fillRate}%)</small></td>
                  <td>{r.pending}</td><td>{r.approved}</td><td>{r.attended}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
