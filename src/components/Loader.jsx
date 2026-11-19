export const Spinner = ({ size = 18 }) => (
  <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />
);

export const PageLoader = ({ label = 'Loading' }) => (
  <div className="page-loader" role="status">
    <Spinner size={28} />
    <span>{label}…</span>
  </div>
);
