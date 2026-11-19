// Two-panel frame shared by login and register
export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <section className="auth-art" aria-hidden="true">
        <div className="auth-brand"><span className="brand-mark" /> Seminar Registration</div>
        <div className="auth-pitch">
          <h2>Find a seat at the next seminar.</h2>
          <p>Browse sessions, reserve your place, and collect your certificate when it&rsquo;s over.</p>
        </div>
        <div className="auth-ticket">
          <div className="ticket-stub">
            <span className="stub-month">Admit</span>
            <span className="stub-day">1</span>
            <span className="stub-week">Seat</span>
          </div>
          <div className="auth-ticket-body">
            <span>Seminar Hall A</span>
            <strong>Introduction to Machine Learning</strong>
            <span>10:00 AM – 1:00 PM</span>
          </div>
        </div>
        <p className="auth-foot">Vasireddy Venkatadri International Technological University</p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">{children}</div>
      </section>
    </div>
  );
}
