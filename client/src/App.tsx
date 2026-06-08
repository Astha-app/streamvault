import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AppToaster } from './components/shared/Toast';
import { Spinner } from './components/shared/Spinner';

const HomePage = lazy(() => import('./pages/HomePage'));
const ResolverPage = lazy(() => import('./pages/ResolverPage'));
const PlayerPage = lazy(() => import('./pages/PlayerPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CachePage = lazy(() => import('./pages/CachePage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppToaster />
      <Routes>
        {/* Player page has its own layout (full-screen bg) */}
        <Route
          path="/player/:videoId"
          element={
            <Suspense fallback={<PageLoader />}>
              <PlayerPage />
            </Suspense>
          }
        />
        {/* All other pages use the app shell */}
        <Route
          path="/*"
          element={
            <AppLayout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/resolver" element={<ResolverPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/cache" element={<CachePage />} />
                </Routes>
              </Suspense>
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
