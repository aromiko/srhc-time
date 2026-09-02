"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Reads ?success= off the current URL on arrival, fires a toast, then strips
 * the param from the address bar (no navigation/refetch - just
 * history.replaceState) so a refresh doesn't re-fire it.
 *
 * ?error= is intentionally NOT handled here - every page that can redirect
 * with one already renders it inline near the relevant form (better for
 * validation errors, which should stay visible until fixed rather than
 * auto-dismiss like a toast). Toasting it too would just duplicate that.
 */
export function ToastListener() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    if (!success) return;

    toast.success(success);

    params.delete("success");
    const query = params.toString();
    const newUrl = window.location.pathname + (query ? `?${query}` : "");
    window.history.replaceState(null, "", newUrl);
  }, []);

  return null;
}
