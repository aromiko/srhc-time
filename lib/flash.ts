/**
 * Appends a ?success= or ?error= param to a redirect URL. Picked up client-side
 * by <ToastListener> on arrival, which fires the toast and strips the param.
 */
function withParam(url: string, key: "success" | "error", message: string): string {
  return url + (url.includes("?") ? "&" : "?") + key + "=" + encodeURIComponent(message);
}

export function withSuccess(url: string, message: string): string {
  return withParam(url, "success", message);
}

export function withError(url: string, message: string): string {
  return withParam(url, "error", message);
}
