import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header      from './components/layout/Header';
import Sidebar     from './components/layout/Sidebar';
import { CursorBubble, StarField } from './components/ui/CursorBubble';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage   from './pages/LoginPage';
import SignupPage  from './pages/SignupPage';

// App pages
import Dashboard  from './pages/Dashboard';
import Analytics  from './pages/Analytics';
import UploadData from './pages/UploadData';
import Reports    from './pages/Reports';
import Alerts     from './pages/Alerts';
import Settings   from './pages/Settings';

// H9 fix — 404 catch-all
import NotFound from './pages/NotFound';

const PUBLIC_ROUTES = ['/', '/login', '/signup'];

function AppShell() {
  const location = useLocation();
  const isPublic = PUBLIC_ROUTES.includes(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isPublic) {
    return (
      <Routes>
        <Route path="/"       element={<LandingPage />} />
        <Route path="/login"  element={<LoginPage />}   />
        <Route path="/signup" element={<SignupPage />}  />
        {/* H9 fix — catch undefined public routes too */}
        <Route path="*"       element={<NotFound />}    />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <StarField />
      <CursorBubble />
      <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
      <div className="main-container">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="content-area">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />}  />
            <Route path="/analytics" element={<Analytics />}  />
            <Route path="/upload"    element={<UploadData />} />
            <Route path="/reports"   element={<Reports />}    />
            <Route path="/alerts"    element={<Alerts />}     />
            <Route path="/settings"  element={<Settings />}   />
            {/* H9 fix — catch undefined app routes */}
            <Route path="*"          element={<NotFound />}   />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ThemeProvider>
  );
}
