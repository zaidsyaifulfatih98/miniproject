declare function gtag(...args: unknown[]): void;

const API_BASE = import.meta.env.VITE_API_BASE as string;

/** Fire-and-forget POST to backend so DB stays in sync with GA4. */
function persistToDb(eventId: string, step: "detail" | "checkout" | "finalized"): void {
  fetch(`${API_BASE}/events/${eventId}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step }),
  }).catch(() => {});
}

/**
 * Track funnel step — dual track: GA4 + backend DB.
 * step: "detail" | "checkout"
 */
export function trackFunnel(eventId: string, step: "detail" | "checkout"): void {
  // 1. Google Analytics 4
  if (typeof gtag !== "undefined") {
    gtag("event", step === "detail" ? "view_event_detail" : "begin_checkout", {
      event_category: "funnel",
      event_id: eventId,
    });
  }

  // 2. Backend DB (keeps Report.tsx funnel data in sync)
  persistToDb(eventId, step);
}

/** Called when a booking reaches DONE status — dual track: GA4 + backend DB. */
export function trackFinalized(eventId: string): void {
  // 1. Google Analytics 4
  if (typeof gtag !== "undefined") {
    gtag("event", "purchase", {
      event_category: "funnel",
      event_id: eventId,
    });
  }

  // 2. Backend DB
  persistToDb(eventId, "finalized");
}

