import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useFetch } from '../../hooks';
import { PageLoader } from '../../components/Loader';
import { formatDate, formatLongDate } from '../../utils/format';

export default function CertificateView({ standalone }) {
  const { id } = useParams();
  const { data, loading, error } = useFetch(`/certificates/${id}`);
  if (loading) return <PageLoader />;
  if (error) return <div className="alert alert-error">{error}</div>;
  const { certificate: c, speakers } = data;
  const verifyUrl = `${window.location.origin}/verify/${c.certificateNumber}`;

  return (
    <div className={standalone ? 'cert-standalone' : ''}>
      <div className="cert-toolbar no-print">
        <Link to={-1} className="back-link" onClick={(e) => { e.preventDefault(); window.history.back(); }}><ArrowLeft size={16} /> Back</Link>
        <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18} /> Print or save as PDF</button>
      </div>
      <div className="certificate" id="certificate">
        <div className="cert-inner">
          <p className="cert-org">Vasireddy Venkatadri International Technological University</p>
          <h1 className="cert-title">Certificate of Participation</h1>
          <p className="cert-line">This certifies that</p>
          <p className="cert-name">{c.student.name}</p>
          <p className="cert-line">attended the seminar</p>
          <p className="cert-seminar">{c.seminar.title}</p>
          <p className="cert-line">held on {formatLongDate(c.seminar.date)} at {c.seminar.venue}{speakers.length ? `, with talks by ${speakers.join(', ')}` : ''}.</p>
          <div className="cert-foot">
            <div><span className="sig">{c.seminar.organizer?.name}</span><small>Seminar organizer</small></div>
            <div className="cert-meta"><small>Certificate no. {c.certificateNumber}</small><small>Issued {formatDate(c.issueDate)}</small><small>Verify at {verifyUrl}</small></div>
          </div>
        </div>
      </div>
    </div>
  );
}
