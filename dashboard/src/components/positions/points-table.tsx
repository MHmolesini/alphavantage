"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, Trophy } from "lucide-react"
import { useState, Fragment } from "react"
import { Button } from "@/components/ui/button"

interface PointsTableProps {
    data: any[]
    periods: string[]
    selectedConcepts: string[]
    onToggleConcept: (concept: string) => void
}

export function PointsTable({ data, periods, selectedConcepts, onToggleConcept }: PointsTableProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

    const toggleRow = (concept: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setExpandedRows(prev => ({
            ...prev,
            [concept]: !prev[concept]
        }))
    }

    const renderRows = (rows: any[], depth = 0): React.ReactNode[] => {
        return rows.map((row) => {
            const isSelected = selectedConcepts.includes(row.concept)
            const hasChildren = row.children && row.children.length > 0
            const isExpanded = expandedRows[row.concept]

            return (
                <Fragment key={row.concept}>
                    <TableRow
                        className={cn(
                            "cursor-pointer transition-all duration-200 border-b border-border/40 hover:bg-muted/30 group",
                            isSelected && "bg-muted/40"
                        )}
                        onClick={() => onToggleConcept(row.concept)}
                    >
                        <TableCell className={cn(
                            "py-1 sm:py-2 font-medium sticky left-0 bg-background/95 backdrop-blur z-20 transition-colors group-hover:bg-muted/30",
                            isSelected && "bg-muted/40"
                        )}>
                            <div className="flex items-center gap-1 sm:gap-3" style={{ paddingLeft: `${depth * 0.5 + 0.25}rem` }}>
                                {hasChildren ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 sm:h-5 sm:w-5 p-0 hover:bg-muted"
                                        onClick={(e) => toggleRow(row.concept, e)}
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                ) : (
                                    <div className="w-4 sm:w-5" />
                                )}

                                <div className={cn(
                                    "w-1 h-1 rounded-full transition-all duration-300 flex-shrink-0",
                                    isSelected ? "bg-yellow-500 scale-125" : "bg-muted-foreground/30 group-hover:bg-yellow-500/50"
                                )} />
                                <span className={cn(
                                    "truncate text-xs sm:text-sm transition-colors",
                                    isSelected ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                    {row.concept}
                                </span>
                            </div>
                        </TableCell>
                        {periods.map((period, index) => {
                            const cellData = row[period]
                            const ranking = cellData?.ranking
                            const position = cellData?.position_rank

                            // Calculate Variation vs Previous Quarter (which is the NEXT item in the array)
                            let variationEl = null
                            if (position && index < periods.length - 1) {
                                const prevPeriod = periods[index + 1]
                                const prevData = row[prevPeriod]
                                const prevPosition = prevData?.position_rank

                                if (prevPosition) {
                                    const diff = prevPosition - position // e.g. Prev 5, Curr 3 => 2 (Improved)

                                    if (diff > 0) {
                                        variationEl = (
                                            <div className="flex items-center gap-0.5 text-green-500/90" title={`Improved by ${diff} positions`}>
                                                <div className="bg-green-500/10 p-0.5 rounded-full"><ChevronDown className="h-2 w-2 sm:h-2.5 sm:w-2.5 rotate-180" strokeWidth={3} /></div>
                                                <span className="text-[9px] sm:text-[10px] font-bold">{diff}</span>
                                            </div>
                                        )
                                    } else if (diff < 0) {
                                        variationEl = (
                                            <div className="flex items-center gap-0.5 text-red-500/90" title={`Dropped by ${Math.abs(diff)} positions`}>
                                                <div className="bg-red-500/10 p-0.5 rounded-full"><ChevronDown className="h-2 w-2 sm:h-2.5 sm:w-2.5" strokeWidth={3} /></div>
                                                <span className="text-[9px] sm:text-[10px] font-bold">{Math.abs(diff)}</span>
                                            </div>
                                        )
                                    } else {
                                        variationEl = (
                                            <div className="flex items-center justify-center text-muted-foreground/30" title="No change">
                                                <div className="w-1 h-1 rounded-full bg-current" />
                                            </div>
                                        )
                                    }
                                }
                            }

                            return (
                                <TableCell key={period} className="text-right py-1 sm:py-2 align-top">
                                    <div className="flex flex-col items-end gap-0.5 sm:gap-1">
                                        <span className="font-mono text-[10px] sm:text-xs text-foreground font-medium transition-colors">
                                            {ranking !== null && ranking !== undefined
                                                ? new Intl.NumberFormat('en-US').format(ranking)
                                                : '-'}
                                        </span>
                                        {position !== null && position !== undefined && (
                                            <div className="flex items-center gap-1 justify-end w-full flex-wrap sm:flex-nowrap">
                                                {/* Variation Indicator */}
                                                {variationEl && (
                                                    <div className="w-6 sm:w-8 flex justify-end">
                                                        {variationEl}
                                                    </div>
                                                )}

                                                {/* Rank Badge */}
                                                <div className="flex items-center gap-1">
                                                    {position === 1 && <Trophy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500" />}
                                                    {position === 2 && <Trophy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400" />}
                                                    {position === 3 && <Trophy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-600" />}

                                                    <span className={cn(
                                                        "text-[9px] sm:text-[10px] font-bold tracking-tight px-1 py-0.5 rounded-full border",
                                                        position === 1 ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                            position === 2 ? "bg-slate-400/10 text-slate-400 border-slate-400/20" :
                                                                position === 3 ? "bg-amber-600/10 text-amber-600 border-amber-600/20" :
                                                                    "bg-muted/50 text-muted-foreground border-border/50"
                                                    )}>
                                                        #{position}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            )
                        })}
                    </TableRow>
                    {hasChildren && isExpanded && renderRows(row.children, depth + 1)}
                </Fragment>
            )
        })
    }

    if (!data || data.length === 0) {
        return <div className="text-center p-8 text-muted-foreground text-sm font-light">No points data available</div>
    }

    return (
        <div className="w-full border border-border/50 rounded-xl overflow-hidden shadow-sm bg-muted/20">
            <div className="overflow-x-auto relative">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="w-[140px] min-w-[140px] sm:w-[300px] sm:min-w-[200px] sticky left-0 bg-background/95 backdrop-blur z-20 h-10">
                                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground pl-2 sm:pl-8">Concept</span>
                            </TableHead>
                            {periods.map(period => (
                                <TableHead key={period} className="text-right min-w-[80px] sm:min-w-[120px] h-10">
                                    <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{period}</span>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderRows(data)}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
