import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDown, ArrowUp, Check, ChevronDown, ChevronRight, Copy, Download, FileAudio, FolderOpen, HardDriveUpload, Keyboard, RefreshCw, Search, Trash2, Usb } from 'lucide-react';
import { selectExplorerState } from './explorerState.js';
import MultiFileUpload from './components/MultiFileUpload.jsx';
import LibraryBrowser from './components/LibraryBrowser.jsx';
import MidiPreview from './components/MidiPreview.jsx';
import SheetMusicUpload from './components/SheetMusicUpload.jsx';
import LiveAudioToMidiArranger from './components/LiveAudioToMidiArranger.jsx';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function KeyboardManagerApp() {
  const [status, setStatus] = useState(null);
  const [library, setLibrary] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function loadLibrary() {
    setError('');
    const [statusRes, libraryRes] = await Promise.all([
      fetch(`${API}/api/status`),
      fetch(`${API}/api/library`)
    ]);
    setStatus(await statusRes.json());
    setLibrary(await libraryRes.json());
  }

  async function analyze(id) {
    setBusy(true);
    setError('');
    setSelectedId(id);
    try {
      const response = await fetch(`${API}/api/library/${encodeURIComponent(id)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Analysis failed');
      setSelected(body);
    } catch (err) {
      setSelected(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file) {
    if (!file) return;
    setBusy(true);
    setError('');
    const data = new FormData();
    data.append('file', file);
    try {
      const response = await fetch(`${API}/api/upload`, { method: 'POST', body: data });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Upload failed');
      setSelectedId(body.id || null);
      setSelected(body);
      await loadLibrary();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(id) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/library/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      if (selectedId === id) {
        setSelectedId(null);
        setSelected(null);
      }
      await loadLibrary();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadLibrary().catch((err) => setError(`Backend unavailable: ${err.message}`));
  }, []);

  const debouncedQuery = useDebouncedValue(query, 180);
  const explorerState = useMemo(
    () => selectExplorerState(library, selectedId, debouncedQuery, selected, { categoryFilter, sort }),
    [library, selectedId, debouncedQuery, selected, categoryFilter, sort]
  );
  const { rows: visibleRows, stats, categoryChips } = explorerState;
  const initialLoading = !status && !library.length && !error;

  function changeSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brandLockup" aria-label="Keyboard Manager">
          <img src="/logo-icon.svg" alt="" className="brandMark" />
          <div>
            <p className="brandName">Keyboard Manager</p>
            <p className="brandMeta">Arranger workstation library / مدير ملفات الأورغ</p>
          </div>
        </div>
        <div className="topbarCopy">
          <p className="eyebrow">MIDI, SysEx, style and SET inspection</p>
          <h1>Professional arranger file control</h1>
        </div>
        <button className="iconButton" onClick={loadLibrary} title="Refresh library">
          <RefreshCw size={18} />
        </button>
      </header>

      {initialLoading && <SplashBrand />}

      {error && <div className="error">{error}</div>}

      <section className="dashboard">
        <Metric icon={<FolderOpen />} label="Library" value={stats.visibleCount} hint={`${stats.totalCount} total files and SET folders`} />
        <Metric icon={<FileAudio />} label="Storage" value={formatBytes(stats.totalBytes)} hint="safe local samples" />
        <Metric icon={<Activity />} label="Backend" value={status?.ok ? 'Online' : 'Offline'} hint="Express API" />
        <Metric icon={<Keyboard />} label="Parsers" value={status?.supportedExtensions?.length || 0} hint="MIDI, SysEx, arranger" />
      </section>

      <section className="workspace">
        <div className="panel uploadPanel">
          <div className="panelHeader">
            <HardDriveUpload size={19} />
            <h2>Upload / رفع ملف</h2>
          </div>
          <MultiFileUpload onUploaded={loadLibrary} />
          <MidiPreview />
          <SheetMusicUpload />
          <LiveAudioToMidiArranger />
          <LibraryBrowser />
          <label className="dropzone">
            <input type="file" onChange={(event) => uploadFile(event.target.files?.[0])} />
            <span>Choose MIDI, SysEx, style, set, backup, package, or unknown binary file</span>
          </label>

          <div className="panelHeader compact">
            <FolderOpen size={19} />
            <h2>Library / المكتبة</h2>
          </div>
          <label className="searchField">
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, path, extension, category, metadata"
            />
          </label>
          <div className="categoryChips" aria-label="Explorer categories">
            {categoryChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="categoryChip"
                aria-pressed={categoryFilter === chip.key}
                onClick={() => setCategoryFilter(chip.key)}
              >
                <span>{chip.label}</span>
                <strong>{chip.count}</strong>
              </button>
            ))}
          </div>
          <div className="libraryHeader" role="row">
            <SortButton label="Name" column="name" sort={sort} onSort={changeSort} />
            <SortButton label="Type" column="category" sort={sort} onSort={changeSort} />
            <SortButton label="Size" column="size" sort={sort} onSort={changeSort} />
            <SortButton label="Updated" column="updatedAt" sort={sort} onSort={changeSort} />
            <span className="libraryActionsLabel">Actions</span>
          </div>
          <div className="libraryList">
            {visibleRows.map((row) => (
              <div className="libraryItem" key={row.id}>
                <button onClick={() => analyze(row.id)} className="itemButton" aria-current={row.isSelected ? 'true' : undefined}>
                  <span className="itemName">{row.name}</span>
                  <small>{row.categoryLabel}</small>
                  <small>{row.kindLabel}</small>
                  <small>{formatDate(row.updatedAt)}</small>
                </button>
                <a className="iconButton small" href={`${API}/api/export/${encodeURIComponent(row.id)}`} title="Export JSON">
                  <Download size={16} />
                </a>
                <button className="iconButton small danger" onClick={() => deleteItem(row.id)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {!visibleRows.length && <p className="muted">{stats.totalCount ? 'No library items match this search.' : 'No library items yet.'}</p>}
          </div>
        </div>

        <AnalysisViewer analysis={selected} busy={busy} />
      </section>

      <MidiMonitor />
    </main>
  );
}

function SortButton({ label, column, sort, onSort }) {
  const active = sort.key === column;
  const Icon = active && sort.direction === 'desc' ? ArrowDown : ArrowUp;
  return (
    <button type="button" className="sortButton" aria-pressed={active} onClick={() => onSort(column)}>
      <span>{label}</span>
      {active && <Icon size={14} />}
    </button>
  );
}

function SplashBrand() {
  return (
    <section className="splash" aria-label="Loading Keyboard Manager">
      <img src="/logo-horizontal.svg" alt="Keyboard Manager" />
      <div className="splashLine" />
    </section>
  );
}

function Metric({ icon, label, value, hint }) {
  return (
    <div className="metric">
      <div className="metricIcon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

function AnalysisViewer({ analysis, busy }) {
  const [childrenExpanded, setChildrenExpanded] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    setChildrenExpanded(true);
    setCopied('');
  }, [analysis?.id]);

  async function copyAnalysisValue(kind) {
    const value = kind === 'metadata' ? JSON.stringify(analysis, null, 2) : (analysis.path || analysis.id || analysis.name || '');
    try {
      await copyToClipboard(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(''), 1600);
    } catch (err) {
      setCopied('failed');
    }
  }

  if (busy) return <section className="panel analysis"><p className="muted">Analyzing...</p></section>;
  if (!analysis) return <section className="panel analysis"><p className="muted">Select a library item to inspect metadata, MIDI counts, SysEx blocks, strings, and safe hex previews.</p></section>;
  const hasChildren = Boolean(analysis.children?.length);
  return (
    <section className="panel analysis">
      <div className="panelHeader">
        <FileAudio size={19} />
        <h2>Analysis / التحليل</h2>
        <div className="panelActions">
          <button type="button" className="inlineButton" onClick={() => copyAnalysisValue('path')} title="Copy path">
            {copied === 'path' ? <Check size={16} /> : <Copy size={16} />}
            <span>Path</span>
          </button>
          <button type="button" className="inlineButton" onClick={() => copyAnalysisValue('metadata')} title="Copy metadata">
            {copied === 'metadata' ? <Check size={16} /> : <Copy size={16} />}
            <span>Metadata</span>
          </button>
        </div>
      </div>
      {copied === 'failed' && <p className="copyStatus">Copy failed in this browser context.</p>}
      <div className="analysisTitle">
        <div>
          <h3>{analysis.name}</h3>
          <p>{analysis.parser || analysis.kind} · {analysis.possibleBrand || 'unknown brand'} · {formatBytes(analysis.size)}</p>
        </div>
        {analysis.deepParserNeeded && <span className="badge">Deep parser needed</span>}
      </div>
      {analysis.midi && <KeyValue title="MIDI" data={analysis.midi} />}
      {analysis.sysex && <KeyValue title="SysEx" data={analysis.sysex} />}
      {analysis.metadata && <KeyValue title="Binary metadata" data={analysis.metadata} />}
      {analysis.extensionCounts && <KeyValue title="Extensions" data={analysis.extensionCounts} />}
      {analysis.hexPreview && <CodeBlock title="Hex preview" value={analysis.hexPreview} />}
      {!!analysis.strings?.length && <CodeBlock title="Extracted strings" value={analysis.strings.join('\n')} />}
      {hasChildren && (
        <div>
          <div className="sectionHeader">
            <h4>Contained files</h4>
            <button type="button" className="inlineButton" onClick={() => setChildrenExpanded((value) => !value)}>
              {childrenExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>{childrenExpanded ? 'Collapse all' : 'Expand all'}</span>
            </button>
          </div>
          {childrenExpanded && (
            <div className="childGrid">
              {analysis.children.map((child) => (
                <div className="child" key={child.id}>
                  <strong>{child.id}</strong>
                  <span>{child.extension || '[none]'} · {formatBytes(child.size)} · {child.parser}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function KeyValue({ title, data }) {
  return (
    <div>
      <h4>{title}</h4>
      <dl className="kv">
        {Object.entries(data).filter(([, value]) => typeof value !== 'object').map(([key, value]) => (
          <React.Fragment key={key}>
            <dt>{key}</dt>
            <dd>{String(value)}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}

function CodeBlock({ title, value }) {
  return (
    <div>
      <h4>{title}</h4>
      <pre>{value}</pre>
    </div>
  );
}

function MidiMonitor() {
  const [supported, setSupported] = useState(Boolean(navigator.requestMIDIAccess));
  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [events, setEvents] = useState([]);

  async function connect() {
    if (!navigator.requestMIDIAccess) {
      setSupported(false);
      return;
    }
    const access = await navigator.requestMIDIAccess({ sysex: false });
    setInputs([...access.inputs.values()]);
    setOutputs([...access.outputs.values()]);
    access.inputs.forEach((input) => {
      input.onmidimessage = (message) => {
        const [status, data1, data2] = message.data;
        const type = status >= 0x90 && status < 0xa0 ? 'note' : status >= 0xb0 && status < 0xc0 ? 'controller' : status >= 0xc0 && status < 0xd0 ? 'program' : 'midi';
        setEvents((current) => [{ time: new Date().toLocaleTimeString(), type, bytes: [...message.data], data1, data2 }, ...current].slice(0, 40));
      };
    });
  }

  return (
    <section className="panel midi">
      <div className="panelHeader">
        <Usb size={19} />
        <h2>USB MIDI monitor / مراقبة MIDI</h2>
        <button onClick={connect} className="actionButton">Connect</button>
      </div>
      {!supported && <p className="muted">Web MIDI is not available in this browser.</p>}
      <div className="midiDevices">
        <span>Inputs: {inputs.map((item) => item.name).join(', ') || 'none'}</span>
        <span>Outputs: {outputs.map((item) => item.name).join(', ') || 'none'}</span>
      </div>
      <div className="eventList">
        {events.map((event, index) => (
          <div className="event" key={`${event.time}-${index}`}>
            <strong>{event.type}</strong>
            <span>{event.time}</span>
            <code>{event.bytes.map((byte) => byte.toString(16).padStart(2, '0')).join(' ')}</code>
          </div>
        ))}
        {!events.length && <p className="muted">No live MIDI messages yet.</p>}
      </div>
    </section>
  );
}

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

async function copyToClipboard(value) {
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable.');
  await navigator.clipboard.writeText(value);
}
