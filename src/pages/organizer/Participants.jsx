import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Check, X, UserCheck, Users, Search } from 'lucide-react';
import { useFetch } from '../../hooks';
import api, { downloadFile, errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import { PageLoader } from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { formatDate, formatLongDate, isPast, timeRange } from '../../utils/format';

const FILTERS = ['all', 'pending', 'approved', 'attended', 'rejected', 'cancelled'];

export default function Participants() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(`/registrations/seminar/${id}`);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [remarks, setRemarks] = useState('');

  const counts = useMemo(() => {
    const c = { all: 0 };
    (data?.registrations || []).forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; c.all += 1; });
    return c;
  }, [data]);

  if (loading) return <PageLoader />;
  if (error) return <div className="alert alert-error">{error}</div>;

  const { seminar, registrations } = data;
  const seminarDay = isPast(seminar.date) || new Date(seminar.date).toDateString() === new Date().toDateString();
  const rows = registrations.filter((r) =>
    (filter === 'all' || r.status === filter) &&
    (!q || `${r.student?.name} ${r.student?.email}`.toLowerCase().includes(q.toLowerCase())));

  const setStatus = async (reg, status, rem) => {
    setBusyId(reg._id);
    try {
      const res = await api.patch(`/registrations/${reg._id}/status`, { status, ...(rem !== undefined && { remarks: rem }) });
      toast.success(status === 'attended' ? `Attendance marked. Certificate ${res.data.certificate?.certificateNumber} issued.` : res.data.message);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = async () => {
    try {
      await downloadFile(`/registrations/seminar/${id}/export`, `participants_${seminar.title.replace(/\W+/g, '_')}.csv`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const printable = registrations.filter((r) => ['pending', 'approved', 'attended'].includes(r.status));

  return (
    <>
      <Link to={`/seminars/${id}`} className="back-link no-print"><ArrowLeft size={16} /> {seminar.title}</Link>
      <div className="no-print">
        <PageHeader title="Participants" subtitle={`${seminar.registeredCount} of ${seminar.capacity} seats taken, ${formatDate(seminar.date)}`}
          actions={<>
            <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={18} /> Print list</button>
            <button className="btn btn-primary" onClick={exportCsv}><Download size={18} /> Export CSV</button>
          </>} />

        <div className="filters">
          <div className="input-wrap search">
            <span className="input-icon" aria-hidden="true"><Search size={18} /></span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" aria-label="Search participants" />
          </div>
        </div>
        <div className="tabs" role="tablist">
          {FILTERS.map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)} <span className="tab-count">{counts[f] || 0}</span>
            </button>
          ))}
        </div>
        {!seminarDay && <p className="hint">Attendance can be marked from the seminar day onward.</p>}

        {rows.length === 0 ? <EmptyState icon={Users} title="No participants in this view" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>#</th><th>Participant</th><th>Registered</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r._id}>
                    <td>{i + 1}</td>
                    <td><strong>{r.student?.name}</strong><small className="muted block">{r.student?.email}{r.student?.phone ? `, ${r.student.phone}` : ''}</small></td>
                    <td>{formatDate(r.registrationDate)}</td>
                    <td><StatusBadge status={r.status} />{r.certificate && <small className="muted block">{r.certificate.certificateNumber}</small>}</td>
                    <td className="actions">
                      {r.status === 'pending' && <>
                        <button className="btn btn-sm btn-primary" disabled={busyId === r._id} onClick={() => setStatus(r, 'approved')}><Check size={14} /> Approve</button>
                        <button className="btn btn-sm btn-ghost" disabled={busyId === r._id} onClick={() => { setRejecting(r); setRemarks(''); }}><X size={14} /> Reject</button>
                      </>}
                      {r.status === 'approved' && <>
                        <button className="btn btn-sm btn-primary" disabled={busyId === r._id || !seminarDay} onClick={() => setStatus(r, 'attended')}
                          title={seminarDay ? '' : 'Available from the seminar day'}><UserCheck size={14} /> Mark attended</button>
                        <button className="btn btn-sm btn-ghost" disabled={busyId === r._id} onClick={() => { setRejecting(r); setRemarks(''); }}>Reject</button>
                      </>}
                      {r.status === 'attended' && r.certificate && <Link to={`/certificates/${r.certificate._id}`} className="btn btn-sm btn-ghost">Certificate</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print-only participant list */}
      <div className="print-only">
        <h1>{seminar.title}</h1>
        <p>{formatLongDate(seminar.date)}, {timeRange(seminar.startTime, seminar.endTime)}, {seminar.venue}</p>
        <table className="print-table">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Signature</th></tr></thead>
          <tbody>{printable.map((r, i) => (
            <tr key={r._id}><td>{i + 1}</td><td>{r.student?.name}</td><td>{r.student?.email}</td><td>{r.student?.phone}</td><td>{r.status}</td><td /></tr>
          ))}</tbody>
        </table>
      </div>

      {rejecting && (
        <Modal title={`Reject ${rejecting.student?.name}?`} onClose={() => setRejecting(null)} width={460}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setRejecting(null)}>Keep registration</button>
            <button className="btn btn-danger" onClick={() => { setStatus(rejecting, 'rejected', remarks.trim()); setRejecting(null); }}>Reject registration</button>
          </>}>
          <div className="field">
            <label htmlFor="remarks">Reason shown to the participant (optional)</label>
            <textarea id="remarks" rows={3} maxLength={300} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        </Modal>
      )}
    </>
  );
}
