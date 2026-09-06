"use client";

import Link, { useLinkStatus, type LinkProps } from "next/link";
import type { ReactNode } from "react";

function PendingSpinner() {
  const { pending } = useLinkStatus();
  return (
    <svg
      aria-hidden
      className={`h-3.5 w-3.5 animate-spin transition-opacity ${pending ? "opacity-100" : "opacity-0"}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/**
 * Drop-in replacement for next/link's <Link> that shows an inline spinner
 * while its own navigation is pending (via useLinkStatus). Needed because
 * quick same-page searchParams-only navigations (Prev/Next/Today, filter
 * chips) often don't visibly trigger a route's loading.tsx fallback -
 * that's Next's documented behavior, and useLinkStatus is the recommended
 * fix. prefetch={false} makes the pending state fire reliably (per Next's
 * own docs: prefetched links can skip the pending phase entirely).
 *
 * scroll={false} too: these are all same-page controls (calendar nav,
 * filter chips) further down a page - jumping the scroll position back to
 * the top on every click is disorienting, not helpful, here.
 */
export function PendingLink({
  children,
  className,
  ...props
}: LinkProps & { children: ReactNode; className?: string }) {
  return (
    <Link
      {...props}
      prefetch={false}
      scroll={false}
      className={`inline-flex items-center gap-1.5 ${className ?? ""}`}
    >
      {children}
      <PendingSpinner />
    </Link>
  );
}
