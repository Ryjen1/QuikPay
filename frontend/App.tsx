import { lazy, Suspense } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import WalletGuard from "./components/WalletGuard";
import ErrorBoundary from "./components/ErrorBoundary";

const Home = lazy(() => import("./pages/Home"));
const EmployerSpace = lazy(() => import("./pages/EmployerSpace"));
const WorkerSpace = lazy(() => import("./pages/WorkerSpace"));
const NotFound = lazy(() => import("./pages/NotFound"));

function AppLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center px-4 py-16">
      <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/80 px-6 py-5 text-center shadow-[0_18px_40px_-20px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-700 border-t-[#00ff88] animate-spin" />
        <p className="text-sm font-semibold text-white">
          Loading QuikPay
        </p>
      </div>
    </div>
  );
}

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B0F19] text-white">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <ErrorBoundary region="page-content">
          <Suspense fallback={<AppLoadingFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<AppLoadingFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          
          <Route
            path="/employer"
            element={
              <WalletGuard>
                <EmployerSpace />
              </WalletGuard>
            }
          />

          <Route
            path="/worker"
            element={
              <WalletGuard>
                <WorkerSpace />
              </WalletGuard>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
