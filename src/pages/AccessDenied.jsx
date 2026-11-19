import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="center-page">
      <ShieldAlert size={40} aria-hidden="true" />
      <h1>You don&rsquo;t have access to this page</h1>
      <p className="muted">This page is for a different role. Go back to your dashboard to continue.</p>
      <Link to="/dashboard" className="btn btn-primary">Go to dashboard</Link>
    </div>
  );
}
