import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  Database,
  History,
  Send,
  Home,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ isOpen, onCloseMobile }: SidebarProps) {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Network Map', path: '/map', icon: MapPin },
    { name: 'Leak Priorities', path: '/leaks', icon: AlertTriangle },
    { name: 'Sensor Data', path: '/data', icon: Database },
    { name: 'Analysis History', path: '/analysis', icon: History },
    { name: 'Dispatch History', path: '/dispatches', icon: Send },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Main Navigation */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Operations Center
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-sky-50 text-sky-700 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Quick link to Landing Page */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Platform Info
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Home className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Overview & Landing</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Bottom Infrastructure Card */}
        <div className="p-4 m-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-1">
            <ShieldAlert className="w-4 h-4 text-sky-600" />
            <span>DMA Protection</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Real-time pressure transient analysis & loss quantification.
          </p>
        </div>
      </aside>
    </>
  );
}
