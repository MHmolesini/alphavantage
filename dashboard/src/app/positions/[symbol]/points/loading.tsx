import { Skeleton } from "@/components/ui/skeleton"
import { AppLayout } from "@/components/layout/app-layout"

export default function Loading() {
    return (
        <AppLayout>
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <div className="flex gap-2">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-9 w-20" />
                        ))}
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="w-full">
                    <div className="grid w-full grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>

                    {/* Content Skeleton (Chart + Table) */}
                    <div className="space-y-6">
                        {/* Chart Skeleton */}
                        <div className="w-full h-[400px] border border-border/50 rounded-xl bg-muted/10 p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="flex items-end justify-between h-[300px] gap-2 pb-2">
                                {[...Array(12)].map((_, i) => (
                                    <Skeleton key={i} className="w-full h-full" style={{ height: `${Math.random() * 60 + 20}%` }} />
                                ))}
                            </div>
                            <div className="flex justify-between">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="h-3 w-8" />
                                ))}
                            </div>
                        </div>

                        {/* Table Skeleton */}
                        <div className="w-full border border-border/50 rounded-xl overflow-hidden bg-muted/10">
                            <div className="border-b border-border/50 bg-muted/50 p-3 flex gap-4">
                                <Skeleton className="h-4 w-24" />
                                <div className="flex-1 flex justify-end gap-8">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-4 w-16" />
                                    ))}
                                </div>
                            </div>
                            <div className="p-0">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="flex items-center border-b border-border/40 p-3 gap-4">
                                        <div className="flex items-center gap-3 w-32">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <div className="flex-1 flex justify-end gap-8">
                                            {[...Array(5)].map((_, j) => (
                                                <div key={j} className="flex flex-col items-end gap-1">
                                                    <Skeleton className="h-4 w-12" />
                                                    <Skeleton className="h-3 w-8 bg-muted/60" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
