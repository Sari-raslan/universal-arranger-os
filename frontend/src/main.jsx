import "./uaos-langley-xenon.css";
import "./uaos-black-neon-music.css";
import "./uaos-force-visual-final.css";
import "./uaos-force-visual-redesign.css";
import "./uaos-neon-boot";
import "./uaos-neon-theme.css";
import "./uaos-geo-media.css";
import "./uaos-final-polish.css";
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { I18nProvider } from './i18n/I18nProvider.jsx';
import './uaos-workspace.css';
import './uaos-polish.css';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);
