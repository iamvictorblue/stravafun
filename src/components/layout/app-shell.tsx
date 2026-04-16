import { Compass, Flame, LineChart, LockKeyhole, MoonStar, SunMedium } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '@/app/use-theme';
import { PageTransition } from '@/components/layout/page-transition';
import { siteTitle } from '@/lib/constants';

const navItems = [
  { to: '/', label: 'Home', icon: Flame },
  { to: '/activities', label: 'Activities', icon: Compass },
  { to: '/stats', label: 'Stats', icon: LineChart },
];

const statusTokens = ['Auto Sync', 'Calorie Focus', 'Strava Motion', 'Weekly Arcs', 'Live Storytelling'];

export const AppShell = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <div className="ambient ambient--orange" />
      <div className="ambient ambient--blue" />
      <div className="ambient ambient--violet" />

      <header className="topbar">
        <div className="topbar__brand">
          <div className="topbar__eyebrow-row">
            <p className="eyebrow">Public dashboard</p>
            <span className="topbar__live-pill">Auto refresh armed</span>
          </div>
          <h1 className="topbar__title">{siteTitle}</h1>
          <p className="topbar__lede">A cinematic Strava dashboard for volume, effort, and momentum.</p>
        </div>

        <div className="topbar__controls">
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

          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light mode">
            {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>

        <div className="topbar__status-rail" aria-hidden="true">
          <div className="topbar__status-track">
            {[...statusTokens, ...statusTokens].map((token, index) => (
              <span key={`${token}-${index}`} className="topbar__status-token">
                {token}
              </span>
            ))}
          </div>
        </div>
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
};
