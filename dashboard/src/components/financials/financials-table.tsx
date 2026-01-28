"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useState, Fragment } from "react"
import { Button } from "@/components/ui/button"

interface FinancialsTableProps {
    data: any[] // Data should be structured as rows: concept, and columns: periods. Now supports children.
    periods: string[]
    selectedConcepts: string[]
    onToggleConcept: (concept: string) => void
}

export function FinancialsTable({ data, periods, selectedConcepts, onToggleConcept }: FinancialsTableProps) {
    // State to track expanded rows (by concept name)
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

    const toggleRow = (concept: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setExpandedRows(prev => ({
            ...prev,
            [concept]: !prev[concept]
        }))
    }

    // Helper to render rows recursively
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
                                    <div className="w-5" /> // Spacer for alignment
                                )}

                                <div className={cn(
                                    "w-1 h-1 rounded-full transition-all duration-300",
                                    isSelected ? "bg-primary scale-125" : "bg-muted-foreground/30 group-hover:bg-primary/50"
                                )} />
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
                            const value = cellData?.value
                            const variation = cellData?.variation

                            return (
                                <TableCell key={period} className="text-right py-2 align-top">
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="font-mono text-xs text-muted-foreground/80 group-hover:text-foreground transition-colors">
                                            {value !== null && value !== undefined
                                                ? new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(value)
                                                : '-'}
                                        </span>
                                        {variation !== null && variation !== undefined && (
                                            <span className={cn(
                                                "text-[10px] font-medium tracking-tight",
                                                variation > 0 ? "text-emerald-500" : variation < 0 ? "text-rose-500" : "text-muted-foreground"
                                            )}>
                                                {variation > 0 ? "+" : ""}{variation.toFixed(1)}%
                                            </span>
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
        return <div className="text-center p-8 text-muted-foreground text-sm font-light">No data available</div>
    }

    return (
        <div className="w-full border rounded-xl overflow-hidden shadow-sm bg-card">
            <div className="overflow-x-auto relative">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="w-[300px] min-w-[200px] sticky left-0 bg-background/95 backdrop-blur z-20 h-10">
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground pl-8">Concept</span>
                            </TableHead>
                            {periods.map(period => (
                                <TableHead key={period} className="text-right min-w-[120px] h-10">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{period}</span>
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
