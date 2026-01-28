"use client"

import { useMemo } from "react"
import { scaleLinear } from "d3-scale"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ScatterScaleChartProps {
    data: any[] // Expects { symbol, concept, value, ranking, position_rank }
    base: string
    selectedSymbol: string
}

export function ScatterScaleChart({ data, base, selectedSymbol }: ScatterScaleChartProps) {
    const groupedData = useMemo(() => {
        if (!data || data.length === 0) return {}

        // Group by Concept
        const groups: Record<string, any[]> = {}
        data.forEach(item => {
            if (!groups[item.concept]) groups[item.concept] = []
            groups[item.concept].push(item)
        })
        return groups
    }, [data])

    if (!data || data.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No data available for this chart.</div>
    }

    return (
        <div className="w-full space-y-8">
            {/* Scale Header */}
            <div className="flex items-center gap-4 px-1 text-xs text-muted-foreground uppercase tracking-wider">
                <div className="w-40">Concept</div>
                <div className="flex-1 flex justify-between relative px-2">
                    <span>Min Score</span>
                    <span className="absolute left-1/2 -translate-x-1/2 hidden sm:block">Market Distribution</span>
                    <span>Max Score</span>
                </div>
                <div className="w-24 text-right">Value</div>
            </div>

            {Object.keys(groupedData).map((concept) => (
                <SingleAxisRow
                    key={concept}
                    concept={concept}
                    items={groupedData[concept]}
                    selectedSymbol={selectedSymbol}
                />
            ))}
        </div>
    )
}

function SingleAxisRow({ concept, items, selectedSymbol }: { concept: string, items: any[], selectedSymbol: string }) {
    // Determine the specific item for the selected symbol
    const selectedItem = items.find(i => i.symbol === selectedSymbol)

    // Calculate Min/Max for this specific concept row to normalize distribution
    const scores = items.map(i => i.ranking)
    const minScore = Math.min(...scores)
    const maxScore = Math.max(...scores)
    const range = maxScore - minScore

    // Sort items so bigger/selected ones are on top (z-index)
    const sortedItems = [...items].sort((a, b) => {
        if (a.symbol === selectedSymbol) return 1
        return a.ranking - b.ranking // Draw lower scores first (background), higher scores last? Actually we want selection on top.
    })

    return (
        <div className="flex items-center gap-4 group/row hover:bg-muted/5 rounded-lg p-1 transition-colors">
            <div className="w-40 text-sm font-medium text-muted-foreground truncate" title={concept}>
                {concept}
            </div>

            <div className="flex-1 relative h-8 flex items-center">
                {/* Axis Line */}
                <div className="absolute left-0 right-0 h-0.5 bg-border/40 rounded-full" />

                {/* Dots */}
                <TooltipProvider>
                    {sortedItems.map((item) => {
                        const isSelected = item.symbol === selectedSymbol

                        // Calculate position % based on dynamic range
                        // Avoid division by zero if all scores are same
                        let pct = 0
                        if (range > 0) {
                            pct = ((item.ranking - minScore) / range) * 100
                        } else {
                            pct = 50 // Center if single point or all same
                        }

                        const positionPercent = Math.max(2, Math.min(98, pct))

                        // Size logic: Proportional to ranking score
                        const minSize = 4
                        const maxSize = 20
                        let sizePct = 0
                        if (range > 0) {
                            sizePct = (item.ranking - minScore) / range
                        }
                        let size = minSize + (sizePct * (maxSize - minSize))
                        if (isSelected && size < 8) size = 8

                        return (
                            <Tooltip key={item.symbol}>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            "absolute rounded-full shadow-sm transition-all border-2 cursor-pointer hover:z-50 hover:scale-150",
                                            isSelected
                                                ? "bg-primary border-background z-40 ring-2 ring-primary/20 shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                                                : "bg-muted-foreground/20 border-transparent z-10 hover:bg-foreground/50",
                                            // Colors for Top 3
                                            !isSelected && item.position_rank === 1 && "bg-yellow-500/50 border-yellow-500/20",
                                            !isSelected && item.position_rank === 2 && "bg-slate-400/50 border-slate-400/20",
                                            !isSelected && item.position_rank === 3 && "bg-amber-600/50 border-amber-600/20"
                                        )}
                                        style={{
                                            left: `${positionPercent}%`,
                                            width: `${size}px`,
                                            height: `${size}px`,
                                            backgroundColor: isSelected ? getRankColor(item.position_rank) : undefined
                                        }}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-xs">
                                        <div className="font-bold mb-1">{item.symbol}</div>
                                        <div className="text-muted-foreground">Concept: <span className="text-foreground">{concept}</span></div>
                                        <div className="text-muted-foreground">Value: <span className="text-foreground">{formatValue(item.value)}</span></div>
                                        <div className="text-muted-foreground">Score: <span className="text-foreground">{item.ranking}</span></div>
                                        <div className="text-muted-foreground">Rank: <span className="text-foreground">#{item.position_rank}</span></div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </TooltipProvider>
            </div>

            <div className="w-24 text-right text-sm font-mono transition-colors">
                {selectedItem ? (
                    <span className="text-foreground font-semibold">{formatValue(selectedItem.value)}</span>
                ) : (
                    <span className="text-muted-foreground/30">-</span>
                )}
            </div>
        </div>
    )
}

function getRankColor(rank: number) {
    if (rank === 1) return "#eab308" // Yellow-500
    if (rank === 2) return "#94a3b8" // Slate-400
    if (rank === 3) return "#d97706" // Amber-600
    return "hsl(var(--primary))"
}

function formatValue(val: number) {
    if (val === undefined || val === null) return "-"
    if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(2)}B`
    if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(2)}M`
    if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(2)}K`
    return val.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
