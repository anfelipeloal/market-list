// Refresh on return and pull-to-refresh (ticket #16) aren't the only thing that brings fresh
// server data to the Despensa and the Lista de compras: every ordinary mutation (moveToShoppingList,
// toggleInCart, Finish Trip, Reset...) already triggers its own re-render through its Server
// Action's revalidatePath, on top of setting an optimistic local override synchronously. If a
// hook-triggered refresh (focus, visibility, pull) was already in flight when one of those
// mutations set its override, the refresh's own landed data can predate that mutation -- it was
// requested before the mutation committed. Reconciling (clearing) local overrides against that
// stale snapshot would resurrect a row the mutation just hid, or hide one it just revealed, until
// the mutation's own revalidation corrects it a moment later.
//
// The guard: the caller counts every optimistic mutation in a ref (see
// src/app/(app)/use-refresh-on-return.ts's notifyMutation), reads that count when a hook-triggered
// refresh starts, and reads it again when that refresh lands. If the count changed in between, a
// mutation's own override was set during the window and must be left alone -- that mutation's own
// revalidation is what should reconcile it, not this refresh. Only an unchanged count means the
// landed data is guaranteed to be at least as fresh as every override currently in local state.
export function canReconcileAfterRefresh(mutationCountAtRefreshStart: number, mutationCountAtLanding: number): boolean {
  return mutationCountAtLanding === mutationCountAtRefreshStart;
}
