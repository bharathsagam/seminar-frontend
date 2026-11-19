import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { dateParts, timeRange } from '../utils/format';
import StatusBadge from './StatusBadge';

// Seminar card drawn as an admission ticket: date stub, perforation, details
export default function SeminarTicket({ seminar, footer }) {
  const { day, month, weekday } = dateParts(seminar.date);
  const left = Math.max(seminar.capacity - seminar.registeredCount, 0);
  const fill = Math.min(100, Math.round((seminar.registeredCount / seminar.capacity) * 100));
  const full = left === 0;

  return (
    <article className={`ticket ${seminar.status !== 'upcoming' ? 'ticket-muted' : ''}`}>
      <div className="ticket-stub" aria-hidden="true">
        <span className="stub-month">{month}</span>
        <span className="stub-day">{day}</span>
        <span className="stub-week">{weekday}</span>
      </div>
      <div className="ticket-body">
        <div className="ticket-top">
          <span className="ticket-cat">{seminar.category}</span>
          {seminar.myStatus ? <StatusBadge status={seminar.myStatus} /> : seminar.status !== 'upcoming' && <StatusBadge status={seminar.status} />}
        </div>
        <h3 className="ticket-title">
          <Link to={`/seminars/${seminar._id}`}>{seminar.title}</Link>
        </h3>
        <p className="ticket-meta"><Clock size={14} aria-hidden="true" /> {timeRange(seminar.startTime, seminar.endTime)}</p>
        <p className="ticket-meta"><MapPin size={14} aria-hidden="true" /> {seminar.venue}</p>
        <div className="seats">
          <div className="seats-bar" aria-hidden="true"><span style={{ width: `${fill}%` }} className={full ? 'full' : fill > 80 ? 'warm' : ''} /></div>
          <span className="seats-label">{full ? 'Full' : `${left} of ${seminar.capacity} seats left`}</span>
        </div>
        {footer}
      </div>
    </article>
  );
}
