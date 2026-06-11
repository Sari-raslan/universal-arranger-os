export const DEFAULT_TIMELINE = [
  { section: "Intro", bars: 4 },
  { section: "Main A", bars: 8 },
  { section: "Fill", bars: 1 },
  { section: "Main B", bars: 8 },
  { section: "Ending", bars: 4 }
];

export function normalizeTimeline(items) {
  const source = Array.isArray(items) && items.length ? items : DEFAULT_TIMELINE;

  return source.map((item) => ({
    section: String(item.section || "Main A"),
    bars: Math.max(1, Math.min(64, Number(item.bars ?? 4)))
  }));
}

export function appendTimelineSection(items, section, bars = 4) {
  return [...normalizeTimeline(items), { section: String(section || "Main A"), bars: Math.max(1, Math.min(64, Number(bars ?? 4))) }];
}

export function removeTimelineSection(items, index) {
  const timeline = normalizeTimeline(items);
  const next = timeline.filter((_, itemIndex) => itemIndex !== index);
  return next.length ? next : normalizeTimeline(DEFAULT_TIMELINE);
}

export function timelineToStructure(items) {
  return normalizeTimeline(items).map((item) => item.section);
}
