export const formatDate = (d, opts = {}) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...opts }) : '-';

export const formatLongDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-';

export const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const timeRange = (a, b) => `${formatTime(a)} – ${formatTime(b)}`;

export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const dateParts = (d) => {
  const x = new Date(d);
  return {
    day: x.getDate(),
    month: x.toLocaleDateString('en-IN', { month: 'short' }),
    weekday: x.toLocaleDateString('en-IN', { weekday: 'short' }),
  };
};

export const isPast = (d) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(d) < today;
};

export const roleLabel = { student: 'Participant', organizer: 'Organizer', speaker: 'Speaker', admin: 'Administrator' };

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
