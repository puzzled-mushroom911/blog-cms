import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getConfig } from '../config';
import OnboardingTour, { hasCompletedOnboarding } from './OnboardingTour';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Lightbulb,
  CalendarDays,
  BarChart3,
  BookOpen,
  PlayCircle,
} from 'lucide-react';

const CORE_NAV = [
  { to: '/', label: 'Content', icon: LayoutDashboard, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/docs', label: 'Docs', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const PIPELINE_NAV = { to: '/topics', label: 'Content Pipeline', icon: Lightbulb };

export default function Layout() {
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const config = getConfig();

  // Auto-open the setup tour once for new users. A tiny delay keeps it from flashing in
  // before the first frame paints.
  useEffect(() => {
    if (hasCompletedOnboarding()) return;
    const timer = setTimeout(() => setTourOpen(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Build nav items: insert Content Pipeline after Content if enabled
  const navItems = [...CORE_NAV];
  if (config.showContentPipeline) {
    navItems.splice(1, 0, PIPELINE_NAV);
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200 flex flex-col z-30 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo area */}
        <div className="h-14 flex items-center px-4 border-b border-slate-100">
          <img
            src="https://moonify.ai/moonify-logo.svg"
            alt="Moonify"
            className={`flex-shrink-0 ${collapsed ? 'w-8 h-8' : 'h-9'}`}
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-slate-100 space-y-1">
          <button
            onClick={() => setTourOpen(true)}
            title="Replay the setup tour"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 w-full transition-colors"
          >
            <PlayCircle className="w-4.5 h-4.5 flex-shrink-0" />
            {!collapsed && <span>Replay tour</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 w-full transition-colors"
          >
            {collapsed ? (
              <PanelLeft className="w-4.5 h-4.5 flex-shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="w-4.5 h-4.5 flex-shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>

        {/* Moonify branding */}
        <div className="px-3 py-3 border-t border-slate-100">
          <a
            href="https://moonify.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            {!collapsed ? 'Built by Moonify AI' : '·'}
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 h-screen overflow-y-auto transition-all duration-200 ${
          collapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <Outlet />
      </main>

      <OnboardingTour open={tourOpen} onOpenChange={setTourOpen} />
    </div>
  );
}
