import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { WorkflowModal } from './components/WorkflowModal';
import { ScadaStreamModal } from './components/ScadaStreamModal';
import { ScadaStreamBanner } from './components/ScadaStreamBanner';
import { TelemetryStreamProvider } from './context/TelemetryStreamContext';
import { DashboardPage } from './pages/DashboardPage';
import { NetworkMapPage } from './pages/NetworkMapPage';
import { LeakPrioritiesPage } from './pages/LeakPrioritiesPage';
import { LeakDetailsPage } from './pages/LeakDetailsPage';
import { SensorDataPage } from './pages/SensorDataPage';
import { AnalysisHistoryPage } from './pages/AnalysisHistoryPage';
import { DispatchHistoryPage } from './pages/DispatchHistoryPage';
import { LandingPage } from './pages/LandingPage';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState<boolean>(false);

  return (
    <Router>
      <TelemetryStreamProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-sky-100 selection:text-sky-900">
          {/* Top Navbar */}
          <Navbar
            onOpenWorkflow={() => setIsWorkflowModalOpen(true)}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />

          {/* AI Automation Workflow Modal */}
          <WorkflowModal
            isOpen={isWorkflowModalOpen}
            onClose={() => setIsWorkflowModalOpen(false)}
          />

          {/* SCADA Telemetry Stream Modal */}
          <ScadaStreamModal />

          {/* Floating SCADA Ingestion Notification Banner */}
          <ScadaStreamBanner />

          <div className="flex flex-1 relative">
            {/* Collapsible Left Sidebar */}
            <Sidebar
              isOpen={isSidebarOpen}
              onCloseMobile={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1 md:pl-64 transition-all duration-200 ease-in-out">
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                  <Route
                    path="/"
                    element={<LandingPage onOpenWorkflow={() => setIsWorkflowModalOpen(true)} />}
                  />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/map" element={<NetworkMapPage />} />
                  <Route path="/leaks" element={<LeakPrioritiesPage />} />
                  <Route path="/leaks/:id" element={<LeakDetailsPage />} />
                  <Route path="/data" element={<SensorDataPage />} />
                  <Route path="/analysis" element={<AnalysisHistoryPage />} />
                  <Route path="/dispatches" element={<DispatchHistoryPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </TelemetryStreamProvider>
    </Router>
  );
}
