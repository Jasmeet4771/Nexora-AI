import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  Droplets,
  Layers,
  MapPin,
  Radio,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Waves,
} from 'lucide-react';

interface LandingPageProps {
  onOpenWorkflow: () => void;
}

export function LandingPage({ onOpenWorkflow }: LandingPageProps) {
  return (
    <div className="space-y-20 py-6 animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-sky-950 text-white p-8 md:p-14 border border-slate-800 shadow-xl">
        {/* Background decorative circles */}
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-300 bg-sky-950/80 rounded-full border border-sky-800/60 shadow-xs">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span>Next-Generation Municipal Water Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08]">
            NEXORA <span className="text-sky-400">AI</span>
          </h1>

          <p className="text-xl sm:text-2xl font-bold text-sky-200 tracking-tight">
            "Detect earlier. Quantify the loss. Fix what matters first."
          </p>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Autonomous pressure and flow anomaly intelligence for municipal water networks. Eliminate Non-Revenue Water (NRW) loss, quantify subterranean main ruptures in liters per day, and arm field crews with actionable AI repair dossiers.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-extrabold text-slate-950 bg-sky-400 hover:bg-sky-300 active:scale-[0.98] rounded-xl transition-all shadow-lg shadow-sky-400/20 cursor-pointer"
            >
              <span>Launch Operations Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={onOpenWorkflow}
              className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>AI Automation Architecture</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Floating Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">42,000 L</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Top Leak Loss Rate / Day</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-sky-400">&lt; 2 Sec</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Network Triage Speed</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">94%</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Hydraulic Confidence</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">100% Real</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">PDF & Dispatch Engine</div>
          </div>
        </div>
      </section>

      {/* The Municipal Problem vs Solution */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
            The Infrastructure Crisis
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Why Municipal Water Networks Leak in Secret
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Millions of cubic meters of treated potable water are lost underground before reaching consumers due to aging distribution mains and delayed manual telemetry analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Non-Revenue Water (NRW) Loss</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Municipalities suffer 20% to 40% clean treated water loss annually through small fissures that expand into structural blowouts beneath roads.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Slow Telemetry Reconciliation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              SCADA systems log millions of sensor rows, but engineering teams take days to manually cross-reference pressure drops against diurnal flow fluctuations.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">The Nexora AI Solution</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated mathematical anomaly filters coupled with Gemini generative models to instantly quantify loss, prioritize zones, and output field repair instructions.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step How It Works Workflow */}
      <section className="p-8 md:p-12 rounded-3xl bg-slate-50 border border-slate-200 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-3 py-1 rounded-full">
              End-to-End Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              From Raw SCADA CSV to Field Dispatch in Minutes
            </h2>
          </div>

          <Link
            to="/data"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900"
          >
            <span>Explore Sensor Ingestion</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-black text-sky-600 font-mono">STEP 01</span>
            <h3 className="text-sm font-bold text-slate-900">Import Sensor CSV</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload time-series pressure and flow datasets from district metered areas into the persistent SQLite store.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-black text-sky-600 font-mono">STEP 02</span>
            <h3 className="text-sm font-bold text-slate-900">Hydraulic Triage Scan</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The anomaly engine detects sustained pressure drops combined with unmetered flow surges and computes estimated water loss in L/day.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-black text-sky-600 font-mono">STEP 03</span>
            <h3 className="text-sm font-bold text-slate-900">AI Investigation Report</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Gemini analyzes the anomaly divergence, explains why the zone is suspicious, and generates field acoustic listening instructions.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-black text-sky-600 font-mono">STEP 04</span>
            <h3 className="text-sm font-bold text-slate-900">PDF & Worker Dispatch</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Download formal engineering PDF reports and immediately dispatch repair work orders with real-time status tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Bento Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Built for Municipal Engineering Standards
          </h2>
          <p className="text-xs text-slate-600 mt-2">
            Every feature is backed by real mathematical algorithms and full-stack backend persistence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-600 w-fit">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Spatial GIS Distribution Map</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Interactive Leaflet integration with pipeline polylines, status filters, and color-coded telemetry markers for quick spatial orientation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-600 w-fit">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Automated PDF Engineering Reports</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              One-click server-side PDF generation formatted with baseline telemetry metrics, anomaly deltas, and worker safety instructions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-600 w-fit">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Crew Work Order Dispatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct routing to specialized maintenance teams (Acoustic Correlators, Rapid Response, Excavation) with audit trail logging.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-sky-600 to-cyan-700 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Ready to inspect municipal network anomalies?
          </h2>
          <p className="text-sm text-sky-100 font-medium">
            Jump directly into the operations center to run the prototype detection engine or import test SCADA datasets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="px-6 py-3 text-sm font-extrabold text-slate-950 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-md cursor-pointer shrink-0"
          >
            Access Operations Center
          </Link>
        </div>
      </section>
    </div>
  );
}
