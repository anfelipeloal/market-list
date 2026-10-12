import { PageSkeleton, SkeletonBlock, SkeletonCard } from "../page-skeleton";

export default function PantryLoading() {
  return (
    <PageSkeleton title="Despensa">
      <SkeletonBlock className="mt-4 h-(--control-height) w-full" />
      <div className="mt-4 flex flex-col gap-4">
        <SkeletonCard rows={2} />
        <SkeletonCard rows={1} />
        <SkeletonCard rows={2} />
      </div>
    </PageSkeleton>
  );
}
