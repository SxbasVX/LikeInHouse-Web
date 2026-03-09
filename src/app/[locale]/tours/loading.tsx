import { Skeleton } from "@/components/ui/skeleton";

export default function ToursLoading() {
  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-3 text-center">
        <Skeleton className="mx-auto h-10 w-56" />
        <Skeleton className="mx-auto h-5 w-80" />
      </div>
      <div className="mb-8 flex gap-3">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
