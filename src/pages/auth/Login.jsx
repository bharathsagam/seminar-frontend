import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Mail } from 'lucide-react';
import AuthShell from './AuthShell';
import PasswordInput from '../../components/PasswordInput';
import { Spinner } from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage, fieldErrors } from '../../api/client';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const DEMO = [
  { role: 'Participant', email: 'student@srs.edu', password: 'Student@123' },
  { role: 'Organizer', email: 'organizer@srs.edu', password: 'Organizer@123' },
  { role: 'Speaker', email: 'speaker@srs.edu', password: 'Speaker@123' },
  { role: 'Admin', email: 'admin@srs.edu', password: 'Admin@123' },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = (f = form) => {
    const e = {};
    if (!f.email.trim()) e.email = 'Enter your email address';
    else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address, like name@example.com';
    if (!f.password) e.password = 'Enter your password';
    return e;
  };

  const update = (field) => (ev) => {
    const value = field === 'rememberMe' ? ev.target.checked : ev.target.value;
    const next = { ...form, [field]: value };
    setForm(next);
    setServerError('');
    if (touched[field]) setErrors(validate(next));
  };

  const blur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate());
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setTouched({ email: true, password: true });
    if (Object.keys(e).length) return;

    setSubmitting(true);
    setServerError('');
    try {
      const user = await login(form.email.trim(), form.password, form.rememberMe);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
      const dest = location.state?.from?.pathname;
      navigate(dest && dest !== '/login' ? dest : '/dashboard', { replace: true });
    } catch (err) {
      const fe = fieldErrors(err);
      if (Object.keys(fe).length) setErrors(fe);
      setServerError(errorMessage(err));
      setForm((f) => ({ ...f, password: '' }));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (d) => {
    setForm((f) => ({ ...f, email: d.email, password: d.password }));
    setErrors({});
    setServerError('');
  };

  return (
    <AuthShell>
      <h1>Log in</h1>
      <p className="muted">Use the email and password for your account.</p>

      {serverError && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <div className={`input-wrap ${errors.email && touched.email ? 'invalid' : ''}`}>
            <span className="input-icon" aria-hidden="true"><Mail size={18} /></span>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoFocus
              value={form.email}
              onChange={update('email')}
              onBlur={blur('email')}
              aria-invalid={Boolean(errors.email && touched.email) || undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
              placeholder="name@example.com"
            />
          </div>
          {errors.email && touched.email && <p className="error-text" id="email-error">{errors.email}</p>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            value={form.password}
            onChange={update('password')}
            onBlur={blur('password')}
            invalid={Boolean(errors.password && touched.password)}
            describedBy={errors.password ? 'password-error' : undefined}
          />
          {errors.password && touched.password && <p className="error-text" id="password-error">{errors.password}</p>}
        </div>

        <label className="check">
          <input type="checkbox" checked={form.rememberMe} onChange={update('rememberMe')} />
          <span>Keep me logged in for 7 days</span>
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? <><Spinner /> Logging in…</> : 'Log in'}
        </button>
      </form>

      <p className="auth-switch">New participant? <Link to="/register">Create an account</Link></p>

      {import.meta.env.DEV && (
        <details className="demo">
          <summary>Demo accounts (from npm run seed)</summary>
          <div className="demo-grid">
            {DEMO.map((d) => (
              <button key={d.email} type="button" className="demo-btn" onClick={() => fillDemo(d)}>
                <strong>{d.role}</strong>
                <span>{d.email}</span>
              </button>
            ))}
          </div>
        </details>
      )}
    </AuthShell>
  );
}
