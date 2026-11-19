import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import AuthShell from './AuthShell';
import PasswordInput, { PasswordStrength } from '../../components/PasswordInput';
import { Spinner } from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage, fieldErrors } from '../../api/client';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^[+]?[\d\s-]{7,15}$/;

export const validateRegistration = (f) => {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Enter your full name (at least 2 characters)';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (f.phone && !PHONE_RE.test(f.phone.trim())) e.phone = 'Enter a valid phone number';
  if (f.password.length < 8) e.password = 'Use at least 8 characters';
  else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Include at least one letter and one number';
  if (f.confirm !== f.password) e.confirm = 'Passwords do not match';
  return e;
};

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (ev) => {
    const next = { ...form, [field]: ev.target.value };
    setForm(next);
    setServerError('');
    if (Object.keys(touched).length) setErrors(validateRegistration(next));
  };
  const blur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validateRegistration(form));
  };
  const show = (f) => touched[f] && errors[f];

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validateRegistration(form);
    setErrors(e);
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true });
    if (Object.keys(e).length) return;
    setSubmitting(true);
    try {
      const { confirm, ...data } = form;
      await register({ ...data, name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim() });
      toast.success('Account created. You can register for seminars now.');
      navigate('/seminars', { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setServerError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div className={`input-wrap ${show(name) ? 'invalid' : ''}`}>
        <input id={name} value={form[name]} onChange={update(name)} onBlur={blur(name)}
          aria-invalid={Boolean(show(name)) || undefined} aria-describedby={show(name) ? `${name}-error` : undefined} {...props} />
      </div>
      {show(name) && <p className="error-text" id={`${name}-error`}>{errors[name]}</p>}
    </div>
  );

  return (
    <AuthShell>
      <h1>Create your account</h1>
      <p className="muted">Participant accounts can browse and register for seminars. Organizer and speaker accounts are created by an administrator.</p>

      {serverError && (
        <div className="alert alert-error" role="alert"><AlertCircle size={18} aria-hidden="true" /><span>{serverError}</span></div>
      )}

      <form onSubmit={submit} noValidate>
        {field('name', 'Full name', { autoComplete: 'name', autoFocus: true })}
        {field('email', 'Email', { type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'name@example.com' })}
        {field('phone', 'Phone (optional)', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}

        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput id="password" value={form.password} onChange={update('password')} onBlur={blur('password')}
            autoComplete="new-password" invalid={Boolean(show('password'))} describedBy="pw-help" />
          {show('password') && <p className="error-text">{errors.password}</p>}
          <div id="pw-help"><PasswordStrength value={form.password} /></div>
        </div>

        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <PasswordInput id="confirm" value={form.confirm} onChange={update('confirm')} onBlur={blur('confirm')}
            autoComplete="new-password" invalid={Boolean(show('confirm'))} />
          {show('confirm') && <p className="error-text">{errors.confirm}</p>}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? <><Spinner /> Creating account…</> : 'Create account'}
        </button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthShell>
  );
}
