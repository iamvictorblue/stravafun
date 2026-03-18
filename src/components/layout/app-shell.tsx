import { Compass, Flame, LineChart, LockKeyhole } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { PageTransition } from '@/components/layout/page-transition';
import { siteTitle } from '@/lib/constants';

const navItems = [
  { to: '/', label: 'Home', icon: Flame },
  { to: '/activities', label: 'Activities', icon: Compass },
  { to: '/stats', label: 'Stats', icon: LineChart },
];

export const AppShell = () => (
  <div className="app-shell">
    <div className="ambient ambient--orange" />
    <div className="ambient ambient--blue" />
    <div className="ambient ambient--violet" />

    <header className="topbar">
      <div>
        <p className="eyebrow">Public dashboard</p>
        <h1 className="topbar__title">{siteTitle}</h1>
      </div>

      <nav className="topbar__nav" aria-label="Primary">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `topbar__nav-link ${isActive ? 'is-active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>

    <main className="page-shell">
      <PageTransition>
        <Outlet />
      </PageTransition>
    </main>

    <footer className="footer">
      <p>Synced privately from Strava. Served publicly from Supabase.</p>
      <NavLink className="footer__link" to="/connect">
        <LockKeyhole size={15} />
        Owner setup
      </NavLink>
    </footer>
  </div>
);
