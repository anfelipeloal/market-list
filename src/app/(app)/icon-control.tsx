import Link from "next/link";
import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// The one place every icon-only control's accessibility contract lives (UI redesign replacing
// button/link TEXT with icons on phones -- no ticket, requested directly): a tap target of at
// least 44x44px even though the glyph itself is smaller, a visible keyboard focus ring, the
// caller's own disabled/pending state, and a Spanish accessible name that is BOTH the
// `aria-label` (for assistive tech) and the `title` (for a mouse hover tooltip) -- the two must
// never drift apart, so every caller passes one `label` string instead of setting each attribute
// itself. The icon itself is always `aria-hidden`: its meaning is carried entirely by `label`.
const ICON_CONTROL_CLASSNAME =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

const ICON_CLASSNAME = "size-5";

type IconControlProps = {
  // The Lucide icon component to render, e.g. PencilIcon. Never rendered with its own accessible
  // name -- see aria-hidden below.
  icon: LucideIcon;
  // The Spanish accessible name, specific enough to be useful out of context (e.g. "Editar
  // Leche", not just "Editar"). Becomes both `aria-label` and `title`.
  label: string;
  iconClassName?: string;
};

// For anything that ACTS in place: a form submit (CreateNameForm's opt-in icon submit), an
// onClick (e.g. "Hacer administrador"), or the trigger of a base-ui AlertDialog -- passed as that
// trigger's own `render` target, exactly like AlertDialogCancel does with the shadcn Button (see
// src/components/ui/alert-dialog.tsx) -- since base-ui's `render` prop clones whatever element
// it's given and merges its own required props (onClick, aria-*, disabled) onto it, and this is a
// plain function component that spreads the rest of its props onto the real <button> underneath.
export function IconButton({
  icon: Icon,
  label,
  className,
  iconClassName,
  type = "button",
  ...props
}: IconControlProps & Omit<ComponentProps<"button">, "aria-label" | "title" | "children">) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(ICON_CONTROL_CLASSNAME, className)}
      {...props}
    >
      <Icon aria-hidden className={cn(ICON_CLASSNAME, iconClassName)} />
    </button>
  );
}

// For anything that NAVIGATES (next/link's "Editar" and "Volver a..." links). Kept separate from
// IconButton rather than one component papering over both shapes: a Link and a button take
// different props (href vs onClick/type/disabled), and forcing one onto the other would need more
// escape hatches than just having two small components share the same class string and prop
// contract.
export function IconLink({
  icon: Icon,
  label,
  className,
  iconClassName,
  ...props
}: IconControlProps & Omit<ComponentProps<typeof Link>, "aria-label" | "title" | "children">) {
  return (
    <Link aria-label={label} title={label} className={cn(ICON_CONTROL_CLASSNAME, className)} {...props}>
      <Icon aria-hidden className={cn(ICON_CLASSNAME, iconClassName)} />
    </Link>
  );
}
