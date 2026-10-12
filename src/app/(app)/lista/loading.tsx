import { PageSkeleton, SkeletonBlock, SkeletonCard } from "../page-skeleton";

export default function ShoppingListLoading() {
  return (
    <PageSkeleton title="Lista de compras">
      <SkeletonCard rows={3} className="mt-4" />
      <SkeletonBlock className="mt-6 h-(--control-height) w-full" />
    </PageSkeleton>
  );
}
