import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { PublicOnlyRoute } from './components/layout/ProtectedRoute';

import LandingPage       from './pages/LandingPage';
import DashboardPage     from './pages/DashboardPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import SettingsPage      from './pages/SettingsPage';
import PublicProfilePage from './pages/PublicProfilePage';

const toastStyle = {
  borderRadius: '10px',
  background:   '#161b22',
  color:        '#e6edf3',
  fontSize:     '14px',
  border:       '1px solid #30363d',
  boxShadow:    '0 8px 24px rgba(0,0,0,0.4)',
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>

        {/* ── Public-only (redirect to dashboard if logged in) ── */}
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <LandingPage />
            </PublicOnlyRoute>
          }
        />

        {/* ── OAuth callback — no guard, this IS the auth step ── */}
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />

        {/* ── Protected routes ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* ── Public profile routes (no auth required) ── */}

        {/* By custom slug: devpulse.app/u/yug-bhatt */}
        <Route
          path="/u/:slug"
          element={<PublicProfilePage bySlug={true} />}
        />

        {/* By GitHub username: devpulse.app/dev/yug-24 */}
        <Route
          path="/dev/:username"
          element={<PublicProfilePage bySlug={false} />}
        />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style:    toastStyle,
          success:  { iconTheme: { primary: '#22c55e', secondary: '#161b22' } },
          error:    { iconTheme: { primary: '#ef4444', secondary: '#161b22' } },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
