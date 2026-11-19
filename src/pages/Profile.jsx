import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import PasswordInput, { PasswordStrength } from '../components/PasswordInput';
import api, { errorMessage, fieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate, roleLabel } from '../utils/format';

export default function Profile() {
  const { user, setUser, refreshToken } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', specialization: user.specialization || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errs, setErrs] = useState({});
  const [pwErrs, setPwErrs] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrs({});
    try {
      const payload = { name: form.name.trim(), phone: form.phone.trim() };
      if (user.role === 'speaker') payload.specialization = form.specialization.trim();
      const res = await api.patch('/auth/profile', payload);
      setUser(res.data.user);
      toast.success('Profile saved');
    } catch (err) {
      setErrs(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const pe = {};
    if (!pw.currentPassword) pe.currentPassword = 'Enter your current password';
    if (pw.newPassword.length < 8 || !/[A-Za-z]/.test(pw.newPassword) || !/\d/.test(pw.newPassword)) pe.newPassword = 'Use 8+ characters with a letter and a number';
    if (pw.newPassword !== pw.confirm) pe.confirm = 'Passwords do not match';
    setPwErrs(pe);
    if (Object.keys(pe).length) return;
    setSavingPw(true);
    try {
      const res = await api.patch('/auth/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      refreshToken(res.data.token);
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed. Other devices have been signed out.');
    } catch (err) {
      setPwErrs({ ...fieldErrors(err), form: errorMessage(err) });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <PageHeader title="Profile" subtitle={`${roleLabel[user.role]} account, created ${formatDate(user.createdAt)}`} />
      <div className="two-col">
        <form className="panel form" onSubmit={saveProfile}>
          <h2>Your details</h2>
          <div className="field">
            <label htmlFor="p-name">Full name</label>
            <input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} />
            {errs.name && <p className="error-text">{errs.name}</p>}
          </div>
          <div className="field">
            <label htmlFor="p-email">Email</label>
            <input id="p-email" value={user.email} disabled />
            <p className="hint">Ask an administrator to change your email.</p>
          </div>
          <div className="field">
            <label htmlFor="p-phone">Phone</label>
            <input id="p-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {errs.phone && <p className="error-text">{errs.phone}</p>}
          </div>
          {user.role === 'speaker' && (
            <div className="field">
              <label htmlFor="p-spec">Specialization</label>
              <input id="p-spec" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </div>
          )}
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save details'}</button>
        </form>

        <form className="panel form" onSubmit={changePassword}>
          <h2>Change password</h2>
          {pwErrs.form && <div className="alert alert-error" role="alert">{pwErrs.form}</div>}
          <div className="field">
            <label htmlFor="cur-pw">Current password</label>
            <PasswordInput id="cur-pw" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} invalid={Boolean(pwErrs.currentPassword)} />
            {pwErrs.currentPassword && <p className="error-text">{pwErrs.currentPassword}</p>}
          </div>
          <div className="field">
            <label htmlFor="new-pw">New password</label>
            <PasswordInput id="new-pw" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} invalid={Boolean(pwErrs.newPassword)} />
            {pwErrs.newPassword && <p className="error-text">{pwErrs.newPassword}</p>}
            <PasswordStrength value={pw.newPassword} />
          </div>
          <div className="field">
            <label htmlFor="conf-pw">Confirm new password</label>
            <PasswordInput id="conf-pw" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} invalid={Boolean(pwErrs.confirm)} />
            {pwErrs.confirm && <p className="error-text">{pwErrs.confirm}</p>}
          </div>
          <button className="btn btn-primary" disabled={savingPw}>{savingPw ? 'Changing…' : 'Change password'}</button>
        </form>
      </div>
    </>
  );
}
