import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="center-page">
      <h1>Page not found</h1>
      <p className="muted">The address may be mistyped, or the page was moved.</p>
      <Link to="/dashboard" className="btn btn-primary">Go to dashboard</Link>
    </div>
  );
}
