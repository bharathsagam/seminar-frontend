const labels = {
  pending: 'Awaiting approval',
  approved: 'Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  attended: 'Attended',
  upcoming: 'Upcoming',
  ongoing: 'In progress',
  completed: 'Completed',
  active: 'Active',
  inactive: 'Inactive',
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}
