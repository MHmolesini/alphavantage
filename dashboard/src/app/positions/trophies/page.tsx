import { Suspense } from "react"
import { getTrophiesData, getTrophiesPeriods } from "@/app/actions/trophies"
import { TrophyCard } from "@/components/trophies/trophy-card"
import { PeriodSelector } from "@/components/trophies/period-selector"
import { TrophyDetail } from "@/components/trophies/trophy-detail"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface TrophiesPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TrophiesPage(props: TrophiesPageProps) {
    const searchParams = await props.searchParams
    const rolling = searchParams.rolling ? parseInt(searchParams.rolling as string) : 1
    const period = searchParams.period as string | undefined
    const showSymbol = searchParams.show as string | undefined

    // Fetch data
    const trophiesData = await getTrophiesData(rolling, period)
    const periods = await getTrophiesPeriods()

    // Determine default symbol for sidebar navigation (use selected symbol or top ranking one)
    const defaultSymbol = showSymbol || (trophiesData.length > 0 ? trophiesData[0].symbol : undefined)

    return (
        <AppLayout symbol={defaultSymbol}>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-light tracking-tight">Trophies <span className="text-muted-foreground text-xl">Overview</span></h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Top performing companies by ranking counts across all financial concepts.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row items-end sm:items-center">
                        <PeriodSelector periods={periods} currentPeriod={period} />

                        <div className="flex bg-muted/20 p-1 rounded-lg">
                            {[1, 4, 8, 12].map((r) => (
                                <Button
                                    key={r}
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "text-xs font-medium px-3 h-7 cursor-pointer",
                                        rolling === r ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Link href={`?rolling=${r}${period ? `&period=${period}` : ''}`} scroll={false}>
                                        Ranking {r}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground border-b border-border/40 pb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{trophiesData.length}</span>
                        <span>Tickets</span>
                    </div>
                    <div className="h-4 w-[1px] bg-border/60" />
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                            {trophiesData.reduce((acc, curr) => acc + curr.gold + curr.silver + curr.bronze, 0)}
                        </span>
                        <span>Total Trophies</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {trophiesData.map((data) => (
                        <TrophyCard
                            key={data.symbol}
                            symbol={data.symbol}
                            gold={data.gold}
                            silver={data.silver}
                            bronze={data.bronze}
                            score={data.total_score}
                            searchParams={searchParams}
                        />
                    ))}
                    {trophiesData.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                            No trophy data available for this period.
                        </div>
                    )}
                </div>

                {showSymbol && (
                    <Suspense fallback={<div className="fixed inset-0 z-50 bg-transparent" />}>
                        <TrophyDetail
                            symbol={showSymbol}
                            rolling={rolling}
                            period={period}
                        />
                    </Suspense>
                )}
            </div>
        </AppLayout>
    )
}
