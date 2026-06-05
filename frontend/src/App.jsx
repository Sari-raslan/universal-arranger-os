import React from 'react';
import KeyboardManagerApp from './KeyboardManagerApp.jsx';
import DemoPage from './pages/DemoPage.jsx';
import DownloadsPage from './pages/DownloadsPage.jsx';
import FeaturesPage from './pages/FeaturesPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PricingPage from './pages/PricingPage.jsx';

export default function App() {
  const path = window.location.pathname;

  if (path === '/pricing') return <PricingPage />;
  if (path === '/downloads') return <DownloadsPage />;
  if (path === '/demo') return <DemoPage />;
  if (path === '/features') return <FeaturesPage />;
  if (path === '/app') return <KeyboardManagerApp />;

  return <LandingPage />;
}
