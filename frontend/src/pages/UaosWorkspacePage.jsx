import React, { useEffect, useState } from 'react';
import LanguageSwitcher from '../components/uaos/LanguageSwitcher';
import StatusPill from '../components/uaos/StatusPill';
import { useI18n } from '../i18n/I18nProvider';
import { getApiBase, safeFetchJson } from '../services/safeFetchJson';

export default function UaosWorkspacePage() {
  const { t } = useI18n();
  const [backendOnline, setBackendOnline] = useState(false);
  const [statusText, setStatusText] = useState(t('checking'));
  const [arrangementMode, setArrangementMode] = useState('full');

  useEffect(() => {
    let alive = true;

    setStatusText(t('checking'));
    safeFetchJson(`${getApiBase()}/health`).then((result) => {
      if (!alive) return;
      setBackendOnline(Boolean(result.ok));
      setStatusText(result.ok ? t('online') : t('offline'));
    });

    return () => {
      alive = false;
    };
  }, [t]);

  return (
    <main className="uaos-shell">
      <header className="uaos-hero">
        <div>
          <h1>{t('appName')}</h1>
          <p>{t('tagline')}</p>
        </div>

        <div className="uaos-actions">
          <LanguageSwitcher />
          <StatusPill online={backendOnline} label={`${t('backend')}: ${statusText}`} />
        </div>
      </header>

      {!backendOnline && (
        <section className="uaos-warning">
          <strong>{t('publicDemo')}</strong>
          <p>{t('publicDemoDesc')}</p>
        </section>
      )}

      <section className="uaos-grid">
        <article className="uaos-panel">
          <h2>{t('upload')}</h2>
          <p>{t('uploadHint')}</p>
          <button type="button" className="uaos-dropzone">
            <strong>SET / STY / MID / KMP / PAD</strong>
            <span>{t('dragFiles')}</span>
          </button>
        </article>

        <article className="uaos-panel">
          <h2>{t('sheetMusic')}</h2>
          <p>{t('sheetMusicDesc')}</p>
          <button type="button" className="uaos-button">
            {t('uploadSheetMusic')}
          </button>
        </article>

        <article className="uaos-panel">
          <h2>{t('liveAudio')}</h2>
          <p>{t('liveAudioDesc')}</p>

          <label className="uaos-field">
            <span>{t('chooseMode')}</span>
            <select
              className="uaos-select wide"
              value={arrangementMode}
              onChange={(event) => setArrangementMode(event.target.value)}
            >
              <option value="full">{t('full')}</option>
              <option value="ork">{t('ork')}</option>
              <option value="studio">{t('studio')}</option>
            </select>
          </label>

          <div className="uaos-button-row">
            <button type="button" className="uaos-button">
              {t('startRecording')}
            </button>
            <button type="button" className="uaos-button secondary">
              {t('stopGenerate')}
            </button>
          </div>
        </article>

        <article className="uaos-panel">
          <h2>{t('library')}</h2>
          <p>{t('emptyLibrary')}</p>
          <h2>{t('soundLibrary')}</h2>
          <p>{t('factorySounds')}</p>
        </article>
      </section>

      <nav className="uaos-footer-nav" aria-label="UAOS">
        <a href="/app">{t('dashboard')}</a>
        <a href="/features">{t('features')}</a>
        <a href="/downloads">{t('downloads')}</a>
        <a href="/pricing">{t('pricing')}</a>
        <a href="/media">{t('media')}</a>
      </nav>
    </main>
  );
}
