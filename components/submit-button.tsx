"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: string;
};

/**
 * Drop-in replacement for a plain <button type="submit">. Must be rendered
 * inside the <form> it submits (useFormStatus reads the nearest form
 * ancestor's pending state) - works with formAction too, since useFormStatus
 * reflects whichever action the form is currently running.
 */
export function SubmitButton({ children, pendingText, className, disabled, ...props }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      disabled={disabled || pending}
      className={`inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
    >
      {pending && (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
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
      )}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
