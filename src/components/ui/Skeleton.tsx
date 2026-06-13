import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-white/5',
        className
      )}
    />
  );
}

export function TrackCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md">
      <Skeleton className="w-4 h-4" />
      <Skeleton className="w-10 h-10 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2 w-20" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

export function AlbumCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square rounded-lg" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-2 w-1/2" />
    </div>
  );
}

export function ArtistCardSkeleton() {
  return (
    <div className="space-y-3 text-center">
      <Skeleton className="aspect-square rounded-full" />
      <Skeleton className="h-3 w-2/3 mx-auto" />
      <Skeleton className="h-2 w-1/2 mx-auto" />
    </div>
  );
}

export function PlaylistCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square rounded-lg" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-2 w-1/2" />
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/5 rounded-md p-2">
            <Skeleton className="w-12 h-12 rounded" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => <AlbumCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
