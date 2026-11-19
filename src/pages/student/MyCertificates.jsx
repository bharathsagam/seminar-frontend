import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';
import { useFetch } from '../../hooks';
import PageHeader from '../../components/PageHeader';
import { PageLoader } from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { formatDate } from '../../utils/format';

export default function MyCertificates() {
  const { data, loading, error } = useFetch('/certificates/my');
  if (loading) return <PageLoader />;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <>
      <PageHeader title="My certificates" subtitle="Certificates are issued once the organizer marks your attendance." />
      {data.certificates.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet" action={<Link to="/my-registrations" className="btn btn-ghost">View my registrations</Link>}>
          Attend a seminar to earn your first certificate.
        </EmptyState>
      ) : (
        <div className="cert-grid">
          {data.certificates.map((c) => (
            <Link key={c._id} to={`/certificates/${c._id}`} className="cert-card">
              <Award size={26} aria-hidden="true" />
              <strong>{c.seminar.title}</strong>
              <span className="muted">Seminar on {formatDate(c.seminar.date)}</span>
              <span className="cert-no">{c.certificateNumber}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
