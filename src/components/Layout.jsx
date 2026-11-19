import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarSearch, Ticket, Award, UserCircle, PlusCircle, FolderKanban,
  BarChart3, Mic, Users, ClipboardList, LogOut, Menu, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initials, roleLabel } from '../utils/format';

const NAV = {
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/seminars', label: 'Browse seminars', icon: CalendarSearch },
    { to: '/my-registrations', label: 'My registrations', icon: Ticket },
    { to: '/my-certificates', label: 'My certificates', icon: Award },
  ],
  organizer: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/organizer/seminars', label: 'My seminars', icon: FolderKanban },
    { to: '/seminars/new', label: 'Create seminar', icon: PlusCircle },
    { to: '/seminars', label: 'All seminars', icon: CalendarSearch },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ],
  speaker: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/speaker/sessions', label: 'My sessions', icon: Mic },
    { to: '/seminars', label: 'All seminars', icon: CalendarSearch },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/seminars', label: 'Seminars', icon: CalendarSearch },
    { to: '/seminars/new', label: 'Create seminar', icon: PlusCircle },
    { to: '/admin/registrations', label: 'Registrations', icon: ClipboardList },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout('You have been logged out.');
    navigate('/login', { replace: true });
  };

  const links = [...(NAV[user.role] || []), { to: '/profile', label: 'Profile', icon: UserCircle }];

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Seminar<br />Registration</span>
          <button className="icon-btn sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/seminars'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{roleLabel[user.role]}</small>
          </div>
        </div>
        <button className="nav-link logout" onClick={handleLogout}>
          <LogOut size={18} aria-hidden="true" /> <span>Log out</span>
        </button>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="main-col">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <span className="topbar-title">Seminar Registration</span>
          <span className="avatar small" aria-hidden="true">{initials(user.name)}</span>
        </header>
        <main id="main" className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
