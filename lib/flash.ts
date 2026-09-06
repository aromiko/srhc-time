/**
 * Appends a ?success= or ?error= param to a redirect URL. Picked up client-side
 * by <ToastListener> on arrival, which fires the toast and strips the param.
 *
 * Hash-aware: a query string must come before any #fragment in a URL, so a
 * url like "/admin/calendar?w=2026-09-06#schedule" needs the param inserted
 * before the "#schedule", not appended after it (which would silently make
 * "success=..." part of the fragment instead of a real query param).
 */
function withParam(url: string, key: "success" | "error", message: string): string {
  const hashIndex = url.indexOf("#");
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex);
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${key}=${encodeURIComponent(message)}${hash}`;
}

export function withSuccess(url: string, message: string): string {
  return withParam(url, "success", message);
}

export function withError(url: string, message: string): string {
  return withParam(url, "error", message);
}
