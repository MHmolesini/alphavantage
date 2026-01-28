import { getSymbolPoints } from "@/app/actions/financials"
import { TrophyDetailDialog } from "./trophy-detail-dialog"
import { cn } from "@/lib/utils"
import { Trophy, ChevronUp, ChevronDown, Minus } from "lucide-react"

interface TrophyDetailProps {
    symbol: string
    rolling: number
    period?: string
}

export async function TrophyDetail({ symbol, rolling, period }: TrophyDetailProps) {
    const allPoints = await getSymbolPoints(symbol, rolling)

    // Filter by period. If no period, use the latest one found in the data.
    let targetPeriod = period
    if (!targetPeriod && allPoints.length > 0) {
        // Find latest period
        const periods = Array.from(new Set(allPoints.map((p: any) => p.period_quarter))).sort().reverse()
        targetPeriod = periods[0] as string
    }

    // Identify Previous Period
    const allPeriods = Array.from(new Set(allPoints.map((p: any) => p.period_quarter))).sort().reverse()
    const targetIndex = allPeriods.indexOf(targetPeriod)
    const previousPeriod = targetIndex >= 0 && targetIndex < allPeriods.length - 1 ? allPeriods[targetIndex + 1] : null

    const currentPoints = allPoints.filter((p: any) => p.period_quarter === targetPeriod)
    const previousPoints = previousPeriod ? allPoints.filter((p: any) => p.period_quarter === previousPeriod) : []

    // Create a map for previous ranks for O(1) lookup
    const previousRanksMap = new Map<string, number>()
    previousPoints.forEach((p: any) => {
        previousRanksMap.set(p.concept, p.position_rank)
    })

    // Calculate Summary
    const summary = {
        gold: currentPoints.filter((p: any) => p.position_rank === 1).length,
        silver: currentPoints.filter((p: any) => p.position_rank === 2).length,
        bronze: currentPoints.filter((p: any) => p.position_rank === 3).length,
    }

    // Group by Base
    const grouped: Record<string, any[]> = {}
    currentPoints.forEach((p: any) => {
        if (!grouped[p.base]) {
            grouped[p.base] = []
        }
        grouped[p.base].push(p)
    })

    // Sort Bases (optional, define order)
    const baseOrder = ['income_statements', 'balance_sheet', 'cash_flow', 'profitability', 'liquidity', 'indebtedness', 'management', 'assessment']
    const sortedBases = Object.keys(grouped).sort((a, b) => {
        const ia = baseOrder.indexOf(a)
        const ib = baseOrder.indexOf(b)
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })

    const formatBase = (base: string) => {
        return base.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <TrophyDetailDialog symbol={symbol} summary={summary}>
            <div className="space-y-8">
                {sortedBases.map(base => {
                    const items = grouped[base].sort((a, b) => (a.position_rank || 999) - (b.position_rank || 999))

                    return (
                        <div key={base} className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1">
                                {formatBase(base)}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {items.map((item: any) => {
                                    const prevRank = previousRanksMap.get(item.concept)
                                    let variationContent = null

                                    if (prevRank) {
                                        const diff = prevRank - item.position_rank // Positive means rank improved (decreased number)

                                        if (diff > 0) {
                                            variationContent = (
                                                <div className="flex items-center gap-0.5 text-green-500/90" title={`Improved by ${diff} positions`}>
                                                    <ChevronUp className="h-3 w-3" strokeWidth={3} />
                                                    <span className="text-[10px] font-bold">{diff}</span>
                                                </div>
                                            )
                                        } else if (diff < 0) {
                                            variationContent = (
                                                <div className="flex items-center gap-0.5 text-red-500/90" title={`Dropped by ${Math.abs(diff)} positions`}>
                                                    <ChevronDown className="h-3 w-3" strokeWidth={3} />
                                                    <span className="text-[10px] font-bold">{Math.abs(diff)}</span>
                                                </div>
                                            )
                                        } else {
                                            variationContent = (
                                                <div className="flex items-center justify-center text-muted-foreground/50" title="No change">
                                                    <Minus className="h-3 w-3" />
                                                </div>
                                            )
                                        }
                                    }

                                    return (
                                        <div key={item.concept} className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-default",
                                            item.position_rank === 1 ? "bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10" :
                                                item.position_rank === 2 ? "bg-slate-400/5 border-slate-400/20 hover:bg-slate-400/10" :
                                                    item.position_rank === 3 ? "bg-orange-600/5 border-orange-600/20 hover:bg-orange-600/10" :
                                                        "bg-muted/10 border-border/30 hover:bg-muted/20"
                                        )}>
                                            <span className="text-sm font-medium truncate pr-2" title={item.concept}>
                                                {item.concept}
                                            </span>
                                            <div className="flex items-center gap-3 shrink-0">
                                                {/* Variation Indicator */}
                                                {variationContent && (
                                                    <div className="flex items-center justify-end w-8">
                                                        {variationContent}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-1.5 min-w-[3.5rem] justify-end">
                                                    {item.position_rank <= 3 && (
                                                        <Trophy className={cn("h-3.5 w-3.5",
                                                            item.position_rank === 1 ? "text-yellow-500" :
                                                                item.position_rank === 2 ? "text-slate-400" :
                                                                    "text-orange-600"
                                                        )} />
                                                    )}
                                                    <span className={cn(
                                                        "text-xs font-bold px-2 py-0.5 rounded-full",
                                                        item.position_rank === 1 ? "bg-yellow-500/10 text-yellow-600" :
                                                            item.position_rank === 2 ? "bg-slate-400/10 text-slate-500" :
                                                                item.position_rank === 3 ? "bg-orange-600/10 text-orange-700" :
                                                                    "bg-muted text-muted-foreground"
                                                    )}>
                                                        #{item.position_rank}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </TrophyDetailDialog>
    )
}
