export function selectExplorerState(library, selectedId, query = '', selectedAnalysis = null, options = {}) {
  const normalizedQuery = query.trim().toLowerCase();
  const activeCategory = options.categoryFilter || 'all';
  const sort = options.sort || { key: 'name', direction: 'asc' };
  const allRows = library.map((item) => {
    const pathSegments = String(item.id || item.name).split('/').filter(Boolean);
    const extension = getExtension(item);
    const category = getExplorerCategory(item, extension);
    const searchText = buildExplorerSearchText(item, { extension, category, selectedAnalysis });
    return {
      ...item,
      pathSegments,
      depth: Math.max(pathSegments.length - 1, 0),
      extension,
      category: category.key,
      categoryLabel: category.label,
      kindLabel: item.isDirectory ? 'SET folder' : formatBytes(item.size),
      isSelected: item.id === selectedId,
      searchText
    };
  });
  const searchedRows = normalizedQuery ? allRows.filter((item) => item.searchText.includes(normalizedQuery)) : allRows;
  const categoryChips = buildCategoryChips(searchedRows);
  const filteredRows = activeCategory === 'all' ? searchedRows : searchedRows.filter((item) => item.category === activeCategory);
  const rows = sortExplorerRows(filteredRows, sort);
  const totalBytes = rows.reduce((sum, item) => sum + (item.size || 0), 0);
  const selectedRow = allRows.find((item) => item.isSelected) || null;
  return {
    rows,
    selectedRow,
    categoryChips,
    stats: {
      totalCount: allRows.length,
      visibleCount: rows.length,
      totalBytes
    }
  };
}

function getExtension(item) {
  const name = item.name || item.id || '';
  const match = String(name).match(/(\.[^.\\/]+)$/);
  return match?.[1]?.toLowerCase() || '';
}

function getExplorerCategory(item, extension) {
  if (item.isDirectory) return { key: 'set', label: 'SET folders', search: 'set folder directory arranger' };
  if (extension === '.mid' || extension === '.midi') return { key: 'midi', label: 'MIDI', search: 'midi sequence' };
  if (extension === '.syx') return { key: 'sysex', label: 'SysEx', search: 'sysex system exclusive' };
  if (['.sty', '.set', '.pcg', '.kst', '.pad', '.prs', '.all', '.bkp', '.pkg'].includes(extension)) {
    return { key: 'arranger', label: 'Arranger', search: 'arranger keyboard' };
  }
  return { key: 'binary', label: 'Binary', search: 'binary file' };
}

function buildExplorerSearchText(item, details) {
  const values = [
    item.name,
    item.id,
    item.path,
    details.extension,
    details.category.search,
    details.category.label,
    item.category,
    item.parser,
    item.possibleBrand
  ];

  if (details.selectedAnalysis?.id === item.id) {
    collectSearchCandidates(details.selectedAnalysis, values);
  }

  return values.filter(Boolean).join(' ').toLowerCase();
}

function buildCategoryChips(rows) {
  const labels = {
    all: 'All',
    set: 'SET folders',
    midi: 'MIDI',
    sysex: 'SysEx',
    arranger: 'Arranger',
    binary: 'Binary'
  };
  const counts = rows.reduce(
    (out, row) => {
      out.all += 1;
      out[row.category] = (out[row.category] || 0) + 1;
      return out;
    },
    { all: 0 }
  );
  return Object.entries(labels)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }))
    .filter((chip) => chip.key === 'all' || chip.count > 0);
}

function sortExplorerRows(rows, sort) {
  const direction = sort.direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const primary = compareExplorerValue(getSortValue(a, sort.key), getSortValue(b, sort.key));
    if (primary !== 0) return primary * direction;
    return compareExplorerValue(a.name, b.name);
  });
}

function getSortValue(row, key) {
  if (key === 'category') return row.categoryLabel;
  if (key === 'size') return row.size || 0;
  if (key === 'updatedAt') return row.updatedAt || '';
  return row.name || '';
}

function compareExplorerValue(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a || '').localeCompare(String(b || ''), undefined, { numeric: true, sensitivity: 'base' });
}

function collectSearchCandidates(value, out, depth = 0) {
  if (value == null || depth > 3) return;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    out.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    value.slice(0, 80).forEach((item) => collectSearchCandidates(item, out, depth + 1));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      out.push(key);
      collectSearchCandidates(item, out, depth + 1);
    });
  }
}

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}
