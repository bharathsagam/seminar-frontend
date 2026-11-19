import { useState } from 'react';
import { Search, UserPlus, Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import { useDebounced, useFetch } from '../../hooks';
import api, { errorMessage, fieldErrors } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import { PageLoader } from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Modal, { ConfirmDialog } from '../../components/Modal';
import PasswordInput from '../../components/PasswordInput';
import { formatDate, roleLabel } from '../../utils/format';

function UserModal({ user, onClose, onSaved }) {
  const editing = Boolean(user);
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', role: user?.role || 'student',
    phone: user?.phone || '', specialization: user?.specialization || '', password: '', isActive: user?.isActive ?? true,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const fe = {};
    if (form.name.trim().length < 2) fe.name = 'Enter a name';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) fe.email = 'Enter a valid email';
    if ((!editing || form.password) && (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))) {
      fe.password = 'Use 8+ characters with a letter and a number';
    }
    setErrors(fe);
    if (Object.keys(fe).length) return;
    setBusy(true);
    setError('');
    try {
      const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role, phone: form.phone.trim(), specialization: form.specialization.trim() };
      if (form.password) payload.password = form.password;
      if (editing) payload.isActive = form.isActive;
      const res = editing ? await api.patch(`/users/${user._id}`, payload) : await api.post('/users', payload);
      onSaved(res.data.user, editing);
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={editing ? 'Edit user' : 'Add user'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="user-form" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save user' : 'Add user'}</button></>}>
      <form id="user-form" className="form" onSubmit={save} noValidate>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="field-row">
          <div className="field"><label htmlFor="u-name">Name</label><input id="u-name" value={form.name} onChange={set('name')} />{errors.name && <p className="error-text">{errors.name}</p>}</div>
          <div className="field">
            <label htmlFor="u-role">Role</label>
            <select id="u-role" value={form.role} onChange={set('role')}>
              {Object.entries(roleLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label htmlFor="u-email">Email</label><input id="u-email" type="email" value={form.email} onChange={set('email')} />{errors.email && <p className="error-text">{errors.email}</p>}</div>
        <div className="field-row">
          <div className="field"><label htmlFor="u-phone">Phone</label><input id="u-phone" value={form.phone} onChange={set('phone')} />{errors.phone && <p className="error-text">{errors.phone}</p>}</div>
          {form.role === 'speaker' && <div className="field"><label htmlFor="u-spec">Specialization</label><input id="u-spec" value={form.specialization} onChange={set('specialization')} /></div>}
        </div>
        <div className="field">
          <label htmlFor="u-pw">{editing ? 'New password (leave blank to keep)' : 'Temporary password'}</label>
          <PasswordInput id="u-pw" autoComplete="new-password" value={form.password} onChange={set('password')} invalid={Boolean(errors.password)} />
          {errors.password && <p className="error-text">{errors.password}</p>}
        </div>
        {editing && (
          <label className="check"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /><span>Account is active (inactive users cannot log in)</span></label>
        )}
      </form>
    </Modal>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const qs = new URLSearchParams({ page, limit: 20 });
  if (q) qs.set('search', q);
  if (role) qs.set('role', role);
  const { data, loading, error, reload } = useFetch(`/users?${qs}`);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/users/${deleting._id}`);
      toast.success('User deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.patch(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? `${u.name} deactivated` : `${u.name} reactivated`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader title="Users" subtitle="Create organizer, speaker and administrator accounts, and manage access."
        actions={<button className="btn btn-primary" onClick={() => setModal({})}><UserPlus size={18} /> Add user</button>} />
      <div className="filters">
        <div className="input-wrap search">
          <span className="input-icon" aria-hidden="true"><Search size={18} /></span>
          <input type="search" placeholder="Search by name or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search users" />
        </div>
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Role">
          <option value="">All roles</option>
          {Object.entries(roleLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : error ? <div className="alert alert-error">{error}</div> : data.users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users match" />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Role</th><th>Joined</th><th>Last login</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong>{u._id === me._id && <span className="pill">You</span>}<small className="muted block">{u.email}</small></td>
                    <td>{roleLabel[u.role]}{u.specialization && <small className="muted block">{u.specialization}</small>}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                    <td><StatusBadge status={u.isActive ? 'active' : 'inactive'} /></td>
                    <td className="actions">
                      <button className="icon-btn" onClick={() => setModal({ user: u })} aria-label={`Edit ${u.name}`}><Pencil size={16} /></button>
                      {u._id !== me._id && <>
                        <button className="btn btn-sm btn-ghost" onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Reactivate'}</button>
                        <button className="icon-btn danger" onClick={() => setDeleting(u)} aria-label={`Delete ${u.name}`}><Trash2 size={16} /></button>
                      </>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pages > 1 && (
            <div className="pager">
              <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {data.page} of {data.pages}</span>
              <button className="btn btn-ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {modal && <UserModal user={modal.user} onClose={() => setModal(null)}
        onSaved={(u, editing) => { setModal(null); toast.success(editing ? 'User saved' : `${u.name} added`); reload(); }} />}
      {deleting && <ConfirmDialog danger busy={busy} title={`Delete ${deleting.name}?`} confirmLabel="Delete user"
        message="This permanently removes the account. Users with seminars, sessions or active registrations must be deactivated instead."
        onClose={() => setDeleting(null)} onConfirm={remove} />}
    </>
  );
}
