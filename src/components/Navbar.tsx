import { Droplets, Activity, Cpu, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScadaStreamBadge } from './ScadaStreamBadge';

interface NavbarProps {
  onOpenWorkflow: () => void;
  onToggleSidebar: () => void;
}

export function Navbar({ onOpenWorkflow, onToggleSidebar }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-700 text-white shadow-sm shadow-sky-600/30 group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-950">
                  NEXORA <span className="text-sky-600 font-black">AI</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 rounded">
                  Municipal Water
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 font-medium tracking-tight -mt-0.5">
                Municipal Water Intelligence • "Detect earlier. Quantify the loss. Fix what matters first."
              </p>
            </div>
          </Link>
        </div>

        {/* Right: Live SCADA Telemetry Badge & Workflow Button */}
        <div className="flex items-center gap-3">
          <ScadaStreamBadge />

          <button
            onClick={onOpenWorkflow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="View the AI Automation Workflow blueprint"
          >
            <Cpu className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">AI Automation</span> Workflow
          </button>
        </div>
      </div>
    </header>
  );
}
