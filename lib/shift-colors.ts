import type { ShiftColor } from "@/lib/types";

// Tailwind needs static class names, so this is a fixed lookup rather than
// building class strings from arbitrary DB values.
export const SHIFT_PILL_CLASSES: Record<ShiftColor, string> = {
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  fuchsia: "bg-fuchsia-100 text-fuchsia-800",
  green: "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
};

export const SHIFT_DOT_CLASSES: Record<ShiftColor, string> = {
  blue: "bg-blue-200",
  purple: "bg-purple-200",
  fuchsia: "bg-fuchsia-200",
  green: "bg-green-200",
  orange: "bg-orange-200",
};
