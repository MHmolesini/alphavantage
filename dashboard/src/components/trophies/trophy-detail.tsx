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
    // ALWAYS fetch with rolling=1 (Raw Data) for the Detail View
    // This ensures medals shown are for the specific quarter(s), not the rolling sum.
    // The "Score" calculation (Rolling) is handled separately in the Card/Sorting logic.
    const allPoints = await getSymbolPoints(symbol, 1)

    // 1. Determine Target Periods
    let targetPeriods: string[] = []
    if (period) {
        targetPeriods = period.split(",")
    } else {
        // Default to latest
        const periods = Array.from(new Set(allPoints.map((p: any) => p.period_quarter))).sort().reverse()
        if (periods.length > 0) targetPeriods = [periods[0] as string]
    }

    const isMultiPeriod = targetPeriods.length > 1

    // Filter points for selected periods
    const currentPoints = allPoints.filter((p: any) => targetPeriods.includes(p.period_quarter))

    // 2. Identify Previous Period (Only for Single Period Mode)
    let previousPoints: any[] = []
    if (!isMultiPeriod && targetPeriods.length === 1) {
        const allPeriods = Array.from(new Set(allPoints.map((p: any) => p.period_quarter))).sort().reverse()
        const targetIndex = allPeriods.indexOf(targetPeriods[0])
        const previousPeriod = targetIndex >= 0 && targetIndex < allPeriods.length - 1 ? allPeriods[targetIndex + 1] : null
        previousPoints = previousPeriod ? allPoints.filter((p: any) => p.period_quarter === previousPeriod) : []
    }

    const previousRanksMap = new Map<string, number>()
    previousPoints.forEach((p: any) => {
        previousRanksMap.set(p.concept, p.position_rank)
    })

    // 3. Calculate Summary (Aggregate)
    const summary = {
        gold: currentPoints.filter((p: any) => p.position_rank === 1).length,
        silver: currentPoints.filter((p: any) => p.position_rank === 2).length,
        bronze: currentPoints.filter((p: any) => p.position_rank === 3).length,
    }

    // 4. Group by Base -> Concept
    const groupedByBase: Record<string, any[]> = {}

    // For Multi-Period: We need to aggregate by concept first
    // Map: Concept -> { counts: {1: n, 2: n, 3: n}, base: string, bestRank: number }
    const conceptAggregation = new Map<string, { base: string, ranks: number[] }>()

    currentPoints.forEach((p: any) => {
        if (!conceptAggregation.has(p.concept)) {
            conceptAggregation.set(p.concept, { base: p.base, ranks: [] })
        }
        const data = conceptAggregation.get(p.concept)!
        if (p.position_rank) data.ranks.push(p.position_rank)
    })

    // Convert Aggregated Data to renderable structure
    // If Multi-Period: Show concepts that have AT LEAST one podium finish in the selection? 
    // Or all? User said "sumar los trofeos". Let's show all that have activity.

    Array.from(conceptAggregation.entries()).forEach(([concept, data]) => {
        if (!groupedByBase[data.base]) groupedByBase[data.base] = []

        // Calculate stats
        const goldCount = data.ranks.filter(r => r === 1).length
        const silverCount = data.ranks.filter(r => r === 2).length
        const bronzeCount = data.ranks.filter(r => r === 3).length
        const bestRank = Math.min(...data.ranks)

        // Only include if it has at least one podium rank (<=3) if we want to reduce noise?
        // Or keep all. User wants to see potential. Let's keep all but sort by best rank.

        groupedByBase[data.base].push({
            concept,
            goldCount,
            silverCount,
            bronzeCount,
            bestRank,
            // For single period, these matches exactly
            position_rank: isMultiPeriod ? bestRank : data.ranks[0]
        })
    })

    // Sort Bases
    const baseOrder = ['income_statements', 'balance_sheet', 'cash_flow', 'profitability', 'liquidity', 'indebtedness', 'management', 'assessment']
    const sortedBases = Object.keys(groupedByBase).sort((a, b) => {
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
                    const items = groupedByBase[base].sort((a, b) => b.goldCount - a.goldCount || b.silverCount - a.silverCount || (a.bestRank || 999) - (b.bestRank || 999))

                    return (
                        <div key={base} className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1">
                                {formatBase(base)}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {items.map((item: any) => {
                                    // Variation (Only for Single Period)
                                    let variationContent = null
                                    if (!isMultiPeriod) {
                                        const prevRank = previousRanksMap.get(item.concept)
                                        if (prevRank) {
                                            const diff = prevRank - item.position_rank
                                            if (diff > 0) {
                                                variationContent = <div className="flex items-center gap-0.5 text-green-500/90" title={`Improved by ${diff}`}><ChevronUp className="h-3 w-3" strokeWidth={3} /><span className="text-[10px] font-bold">{diff}</span></div>
                                            } else if (diff < 0) {
                                                variationContent = <div className="flex items-center gap-0.5 text-red-500/90" title={`Dropped by ${Math.abs(diff)}`}><ChevronDown className="h-3 w-3" strokeWidth={3} /><span className="text-[10px] font-bold">{Math.abs(diff)}</span></div>
                                            } else {
                                                variationContent = <div className="flex items-center justify-center text-muted-foreground/50"><Minus className="h-3 w-3" /></div>
                                            }
                                        }
                                    }

                                    return (
                                        <div key={item.concept} className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-default",
                                            item.goldCount > 0 ? "bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10" :
                                                item.silverCount > 0 ? "bg-slate-400/5 border-slate-400/20 hover:bg-slate-400/10" :
                                                    item.bronzeCount > 0 ? "bg-orange-600/5 border-orange-600/20 hover:bg-orange-600/10" :
                                                        "bg-muted/10 border-border/30 hover:bg-muted/20"
                                        )}>
                                            <span className="text-sm font-medium truncate pr-2" title={item.concept}>
                                                {item.concept}
                                            </span>

                                            <div className="flex items-center gap-3 shrink-0">
                                                {/* Single Period: Variation Content */}
                                                {!isMultiPeriod && variationContent && (
                                                    <div className="flex items-center justify-end w-8">{variationContent}</div>
                                                )}

                                                <div className="flex items-center gap-1.5 min-w-[3.5rem] justify-end">
                                                    {isMultiPeriod ? (
                                                        // Multi-Period: Show Counts (e.g. 2x Gold)
                                                        <div className="flex gap-1">
                                                            {item.goldCount > 0 && <span className="flex items-center px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 text-[10px] font-bold border border-yellow-500/20" title={`${item.goldCount} Gold`}>🏆 {item.goldCount}</span>}
                                                            {item.silverCount > 0 && <span className="flex items-center px-1.5 py-0.5 rounded-full bg-slate-400/10 text-slate-500 text-[10px] font-bold border border-slate-400/20" title={`${item.silverCount} Silver`}>🥈 {item.silverCount}</span>}
                                                            {item.bronzeCount > 0 && <span className="flex items-center px-1.5 py-0.5 rounded-full bg-orange-600/10 text-orange-700 text-[10px] font-bold border border-orange-600/20" title={`${item.bronzeCount} Bronze`}>🥉 {item.bronzeCount}</span>}

                                                            {item.goldCount === 0 && item.silverCount === 0 && item.bronzeCount === 0 && (
                                                                <span className="text-xs text-muted-foreground/50 font-mono">#{item.bestRank}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        // Single Period: Show Rank
                                                        <>
                                                            {item.position_rank <= 3 && (
                                                                <Trophy className={cn("h-3.5 w-3.5",
                                                                    item.position_rank === 1 ? "text-yellow-500" :
                                                                        item.position_rank === 2 ? "text-slate-400" : "text-orange-600"
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
                                                        </>
                                                    )}
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
