"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, Trophy, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { useState, Fragment, useMemo } from "react"
import { Button } from "@/components/ui/button"

interface RankingsTableProps {
    data: any[]
    periods: string[]
    selectedConcepts: string[]
    onToggleConcept: (concept: string) => void
}

type SortConfig = {
    key: string | null
    direction: 'asc' | 'desc' | null
}

export function RankingsTable({ data, periods, selectedConcepts, onToggleConcept }: RankingsTableProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null })

    const toggleRow = (concept: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setExpandedRows(prev => ({
            ...prev,
            [concept]: !prev[concept]
        }))
    }

    const handleSort = (period: string) => {
        setSortConfig(current => {
            if (current.key === period) {
                if (current.direction === 'asc') return { key: period, direction: 'desc' }
                if (current.direction === 'desc') return { key: null, direction: null }
                return { key: null, direction: null } // Should not happen start from null
            }
            return { key: period, direction: 'asc' }
        })
    }

    const sortedData = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) {
            return data
        }

        const sorted = [...data]
        sorted.sort((a, b) => {
            const aVal = a[sortConfig.key!]?.position_rank ?? 999999
            const bVal = b[sortConfig.key!]?.position_rank ?? 999999

            if (sortConfig.direction === 'asc') return aVal - bVal
            return bVal - aVal
        })
        return sorted
    }, [data, sortConfig])

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
                            "py-2 font-medium sticky left-0 bg-background/95 backdrop-blur z-20 transition-colors group-hover:bg-muted/30",
                            isSelected && "bg-muted/40"
                        )}>
                            <div className="flex items-center gap-3" style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}>
                                {hasChildren ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 p-0 hover:bg-muted"
                                        onClick={(e) => toggleRow(row.concept, e)}
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                ) : (
                                    <div className="w-5" />
                                )}

                                <div className={cn(
                                    "w-1 h-1 rounded-full transition-all duration-300",
                                    isSelected ? "bg-yellow-500 scale-125" : "bg-muted-foreground/30 group-hover:bg-yellow-500/50"
                                )} />
                                <div className="min-w-[1.5rem] text-xs font-light text-muted-foreground/50 tabular-nums select-none group-hover:text-muted-foreground/80 transition-colors">
                                    {(expandedRows[row.concept] || !hasChildren) ? (rows.indexOf(row) + 1) : ""}
                                </div>
                                <span className={cn(
                                    "truncate text-sm transition-colors",
                                    isSelected ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                    {row.concept}
                                </span>
                            </div>
                        </TableCell>
                        {periods.map(period => {
                            const cellData = row[period]
                            const ranking = cellData?.ranking
                            const position = cellData?.position_rank

                            return (
                                <TableCell key={period} className="text-right py-2 align-top">
                                    <div className={cn(
                                        "flex flex-col items-end gap-0.5 transition-all duration-300",
                                        sortConfig.key === period && "scale-105 font-medium"
                                    )}>
                                        <span className={cn(
                                            "font-mono text-xs transition-colors",
                                            sortConfig.key === period ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {ranking !== null && ranking !== undefined
                                                ? new Intl.NumberFormat('en-US').format(ranking)
                                                : '-'}
                                        </span>
                                        {position !== null && position !== undefined && (
                                            <div className="flex items-center gap-1">
                                                {position === 1 && <Trophy className="h-3 w-3 text-yellow-500" />}
                                                {position === 2 && <Trophy className="h-3 w-3 text-slate-400" />}
                                                {position === 3 && <Trophy className="h-3 w-3 text-amber-600" />}

                                                <span className={cn(
                                                    "text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded-full border transition-colors",
                                                    position === 1 ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                        position === 2 ? "bg-slate-400/10 text-slate-400 border-slate-400/20" :
                                                            position === 3 ? "bg-amber-600/10 text-amber-600 border-amber-600/20" :
                                                                "bg-muted/50 text-muted-foreground border-border/50",
                                                    sortConfig.key === period && "bg-primary/10 text-primary border-primary/20"
                                                )}>
                                                    #{position}
                                                </span>
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
        return <div className="text-center p-8 text-muted-foreground text-sm font-light">No ranking data available</div>
    }

    return (
        <div className="w-full border border-border/50 rounded-xl overflow-hidden shadow-sm bg-muted/20">
            <div className="overflow-auto relative max-h-[600px] scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
                <Table>
                    <TableHeader className="sticky top-0 z-40 bg-background/95 backdrop-blur shadow-sm">
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="w-[150px] min-w-[120px] sticky left-0 top-0 z-50 bg-background/95 backdrop-blur h-10 border-b border-border/50 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground pl-8">Symbol</span>
                            </TableHead>
                            {periods.map(period => (
                                <TableHead
                                    key={period}
                                    className="text-right min-w-[120px] h-10 cursor-pointer hover:bg-muted/50 transition-colors group bg-background/95 backdrop-blur"
                                    onClick={() => handleSort(period)}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="flex flex-col items-end">
                                            <span className={cn(
                                                "text-[10px] font-medium uppercase tracking-wider transition-colors",
                                                sortConfig.key === period ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                            )}>
                                                {period}
                                            </span>
                                        </div>
                                        <div className="w-3 h-3 flex items-center justify-center">
                                            {sortConfig.key === period ? (
                                                sortConfig.direction === 'asc' ?
                                                    <ArrowUp className="h-3 w-3 text-primary animate-in fade-in zoom-in duration-200" /> :
                                                    <ArrowDown className="h-3 w-3 text-primary animate-in fade-in zoom-in duration-200" />
                                            ) : (
                                                <ArrowUpDown className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderRows(sortedData)}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
