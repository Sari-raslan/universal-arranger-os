import StatusPage from './pages/StatusPage.jsx';
import React from 'react';
import KeyboardManagerApp from './KeyboardManagerApp.jsx';
import DemoPage from './pages/DemoPage.jsx';
import DownloadsPage from './pages/DownloadsPage.jsx';
import FeaturesPage from './pages/FeaturesPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import MediaPage from './pages/MediaPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import UaosWorkspacePage from './pages/UaosWorkspacePage.jsx';
import PublicRuntimeStatus from './components/PublicRuntimeStatus.jsx';

function withRuntimeStatus(page) {
  return (
    <>
      <PublicRuntimeStatus />
      {page}
    </>
  );
}

export default function App() {
  const path = window.location.pathname;

  if (path === '/pricing') return withRuntimeStatus(<PricingPage />);
  if (path === '/status') return withRuntimeStatus(<StatusPage />);
  if (path === '/downloads') return withRuntimeStatus(<DownloadsPage />);
  if (path === '/demo') return withRuntimeStatus(<DemoPage />);
  if (path === '/features') return withRuntimeStatus(<FeaturesPage />);
  if (path === '/media') return withRuntimeStatus(<MediaPage />);
  if (path === '/app') return withRuntimeStatus(<UaosWorkspacePage />);
  if (path === '/keyboard') return withRuntimeStatus(<KeyboardManagerApp />);

  return withRuntimeStatus(<LandingPage />);
}

