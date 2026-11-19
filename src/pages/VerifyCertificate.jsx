import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, XCircle } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { formatDate } from '../utils/format';

export default function VerifyCertificate() {
  const { number } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(number || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!number) return;
    setLoading(true);
    setError('');
    setResult(null);
    api.get(`/certificates/verify/${encodeURIComponent(number)}`)
      .then((r) => setResult(r.data.certificate))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [number]);

  return (
    <div className="center-page verify">
      <h1>Verify a certificate</h1>
      <p className="muted">Enter the certificate number printed on the certificate.</p>
      <form className="verify-form" onSubmit={(e) => { e.preventDefault(); if (input.trim()) navigate(`/verify/${input.trim()}`); }}>
        <input value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} placeholder="SRS-2026-XXXXXXXX" aria-label="Certificate number" />
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Checking…' : 'Verify'}</button>
      </form>
      {result && (
        <div className="verify-result ok">
          <BadgeCheck size={28} aria-hidden="true" />
          <div>
            <strong>Valid certificate</strong>
            <p>Issued to {result.studentName} for &ldquo;{result.seminarTitle}&rdquo; ({formatDate(result.seminarDate)}), on {formatDate(result.issueDate)}.</p>
          </div>
        </div>
      )}
      {error && (
        <div className="verify-result bad"><XCircle size={28} aria-hidden="true" /><div><strong>Not verified</strong><p>{error}</p></div></div>
      )}
      <Link to="/login">Back to login</Link>
    </div>
  );
}
