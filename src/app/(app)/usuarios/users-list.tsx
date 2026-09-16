"use client";

import { useCallback, useMemo, useState } from "react";
import type { SignedInUser } from "@/db/users";
import { UserRow } from "./user-row";

// Owns the Usuarios list's one interactive behaviour beyond navigation (ticket #13): removing a
// User hides their row instantly instead of waiting for a full navigation to reflect the
// server's revalidatePath("/usuarios") (see src/app/(app)/lista/shopping-list-view.tsx's
// hiddenProductIds for the same layered-local-state pattern). Server truth is still the source of
// record — a page refresh always reflects it exactly.
export function UsersList({ users }: { users: SignedInUser[] }) {
  const [hiddenUserIds, setHiddenUserIds] = useState<ReadonlySet<string>>(new Set());

  const visibleUsers = useMemo(() => users.filter((user) => !hiddenUserIds.has(user.id)), [users, hiddenUserIds]);

  const handleRemoved = useCallback((userId: string) => {
    setHiddenUserIds((prev) => new Set(prev).add(userId));
  }, []);

  return (
    <ul className="mt-6 flex flex-col gap-2">
      {visibleUsers.map((user) => (
        <UserRow key={user.id} user={user} onRemoved={handleRemoved} />
      ))}
    </ul>
  );
}
