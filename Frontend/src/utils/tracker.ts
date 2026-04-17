const STORAGE_KEY = "funnel_tracker";
const API_BASE = import.meta.env.VITE_API_BASE as string;

interface FunnelRecord {
  detail: number;
  checkout: number;
}

type FunnelStore = Record<string, FunnelRecord>;

export function trackFunnel(eventId: string, step: "detail" | "checkout"): void {
  // 1. Update local cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const store: FunnelStore = raw ? JSON.parse(raw) : {};
    if (!store[eventId]) store[eventId] = { detail: 0, checkout: 0 };
    store[eventId][step]++;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage errors
  }

  // 2. Persist to database (fire-and-forget)
  const dbStep = step === "detail" ? "detail" : "checkout";
  fetch(`${API_BASE}/events/${eventId}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step: dbStep }),
  }).catch(() => {
    // silently ignore network errors – local cache is source of truth for display
  });
}

/** Called when a booking reaches DONE status */
export function trackFinalized(eventId: string): void {
  fetch(`${API_BASE}/events/${eventId}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step: "finalized" }),
  }).catch(() => {});
}

export function getFunnelData(eventId: string): FunnelRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const store: FunnelStore = raw ? JSON.parse(raw) : {};
    return store[eventId] ?? { detail: 0, checkout: 0 };
  } catch {
    return { detail: 0, checkout: 0 };
  }
}
