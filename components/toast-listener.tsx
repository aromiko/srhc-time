"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Reads ?success= off the current URL, fires a toast, then strips the param
 * so a later refresh/back-navigation doesn't re-fire it.
 *
 * Must key off useSearchParams() (reactive to every client-side navigation),
 * not a mount-only effect - this component lives once in the root layout, so
 * it only truly mounts on a hard page load. Server Action redirects and Link
 * clicks are client-side transitions that never remount it, so a plain
 * useEffect(..., []) here would only ever catch a success param that
 * happened to already be in the URL at the very first page load - i.e.
 * effectively never.
 *
 * ?error= is intentionally NOT handled here - every page that can redirect
 * with one already renders it inline near the relevant form (better for
 * validation errors, which should stay visible until fixed rather than
 * auto-dismiss like a toast). Toasting it too would just duplicate that.
 */
export function ToastListener() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  useEffect(() => {
    if (!success) return;

    toast.success(success);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("success");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [success, searchParams, pathname, router]);

  return null;
}
