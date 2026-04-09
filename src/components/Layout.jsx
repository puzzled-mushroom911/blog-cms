import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getConfig } from '../config';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  FileText,
  Lightbulb,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/topics', label: 'Topics', icon: Lightbulb },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const config = getConfig();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200 flex flex-col z-30 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo area */}
        <div className="h-14 flex items-center px-4 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-slate-900 text-sm truncate">
              {config.cmsTitle}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-200 ${
          collapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
