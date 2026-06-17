export const ARRANGEMENT_PLAN_READY_EVENT = "uaos:arrangement-plan-ready";

export function normalizeArrangementTransport(plan = {}) {
  const source = plan?.manifest || plan?.arrangement || plan;
  const sections = Array.isArray(source?.sections) ? source.sections : [];

  const bpmValue = Number(source?.bpm ?? plan?.bpm);
  const bpm = Number.isFinite(bpmValue)
    ? Math.min(240, Math.max(40, Math.round(bpmValue)))
    : 100;

  const barsFromSections = sections.reduce((maximum, section) => {
    const startBar = Number(section?.startBar) || 1;
    const lengthBars = Number(section?.lengthBars) || 0;
    return Math.max(maximum, startBar + lengthBars - 1);
  }, 0);

  const explicitBars = Number(source?.bars ?? source?.totalBars ?? plan?.bars);
  const bars = Math.min(
    128,
    Math.max(
      1,
      Math.round(
        Number.isFinite(explicitBars) && explicitBars > 0
          ? explicitBars
          : barsFromSections || 1,
      ),
    ),
  );

  return {
    bpm,
    bars,
    key: String(source?.key ?? plan?.key ?? "C"),
    scale: String(source?.scale ?? plan?.scale ?? "minor"),
    title: String(source?.title ?? plan?.title ?? "Arrangement"),
    sectionCount: sections.length,
  };
}

export function publishArrangementPlanToHardware(plan, target = window) {
  if (!target || typeof target.dispatchEvent !== "function") {
    throw new TypeError("A valid event target is required.");
  }

  const transport = normalizeArrangementTransport(plan);
  target.dispatchEvent(
    new CustomEvent(ARRANGEMENT_PLAN_READY_EVENT, {
      detail: { plan, transport },
    }),
  );

  return transport;
}

export function subscribeArrangementPlanForHardware(listener, target = window) {
  if (!target || typeof target.addEventListener !== "function") {
    throw new TypeError("A valid event target is required.");
  }

  const handler = (event) => listener(event.detail);
  target.addEventListener(ARRANGEMENT_PLAN_READY_EVENT, handler);

  return () => {
    target.removeEventListener(ARRANGEMENT_PLAN_READY_EVENT, handler);
  };
}