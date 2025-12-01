import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function ProfilePageSkeleton() {
  return (
    <div className="py-10">
      <div className="container px-4 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          <Card className="border-black-50 bg-white">
            <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <Skeleton className="h-28 w-28 rounded-3xl" />
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <div className="flex flex-wrap gap-3">
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <div className="flex flex-wrap items-center gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={`tab-skeleton-${index}`} className="h-10 w-32 rounded-xl" />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <Card className="border-black-50 bg-white">
              <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
                <Skeleton className="h-6 w-40" />
                <div className="flex flex-wrap gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton
                      key={`badge-skeleton-${index}`}
                      className="h-20 w-20 rounded-2xl"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-black-50 bg-white">
              <CardContent className="grid gap-4 p-6 sm:grid-cols-2 sm:gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`stat-skeleton-${index}`}
                    className="flex flex-col gap-3"
                  >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-black-50 bg-white">
              <CardContent className="flex flex-col gap-4 p-6">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-40" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
