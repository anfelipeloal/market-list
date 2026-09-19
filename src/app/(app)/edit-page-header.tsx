import type { ReactNode } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { IconLink } from "./icon-control";

// The shared "app-bar" header for a per-entity edit page (Categoría, Producto): a back arrow on
// the left and, for whoever's allowed to do it, a single trailing icon action on the right (the
// delete trigger, Admin-only) -- both above the page's own <h1>. Extracted after the catalog edit
// pages' delete control first shipped as a large red-bordered card around a lone centred trash
// icon (UI redesign, no ticket): that looked unfinished and wasted exactly the space going
// icon-only was meant to save, and the fix is the same shape on both pages, so it belongs here
// instead of being duplicated.
//
// `-mx-3` pulls both the back arrow and `trailing` to the row's outer edges: each is a 44px tap
// target (see icon-control.tsx) with its own internal padding around a smaller glyph, so without
// this they'd sit visibly indented from where the old underlined text / bordered card used to
// start and end.
//
// Usuarios' own per-User edit page has no header like this: a User is deleted from the Usuarios
// list itself (see usuarios/user-row.tsx), never from that per-User edit screen, so it never had
// the bordered-card problem this replaces and is left with its own plain back link.
export function EditPageHeader({
  backHref,
  backLabel,
  trailing,
}: {
  backHref: string;
  backLabel: string;
  // The Admin-only delete trigger (or null for a non-Admin / a not-yet-loaded entity): omitted
  // entirely rather than reserving space for it, so a non-Admin's header is just the back arrow.
  trailing?: ReactNode;
}) {
  return (
    <div className="-mx-3 flex items-center justify-between">
      <IconLink href={backHref} icon={ArrowLeftIcon} label={backLabel} />
      {trailing}
    </div>
  );
}
