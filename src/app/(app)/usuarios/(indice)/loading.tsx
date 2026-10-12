import { PageSkeleton, SkeletonBlock } from "../../page-skeleton";

export default function UsersLoading() {
  return (
    <PageSkeleton title="Usuarios">
      <div className="mt-4 flex flex-col gap-3 rounded-xl border bg-card p-4">
        <SkeletonBlock className="h-4 w-1/4" />
        <SkeletonBlock className="h-(--control-height) w-full" />
        <SkeletonBlock className="h-(--control-height) w-full" />
        <SkeletonBlock className="h-(--control-height) w-full" />
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <SkeletonBlock className="h-16 w-full rounded-xl" />
        <SkeletonBlock className="h-16 w-full rounded-xl" />
      </div>
    </PageSkeleton>
  );
}
