
"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface FinancialsTableProps {
    data: any[] // Data should be structured as rows: concept, and columns: periods
    periods: string[]
    selectedConcepts: string[]
    onToggleConcept: (concept: string) => void
}

export function FinancialsTable({ data, periods, selectedConcepts, onToggleConcept }: FinancialsTableProps) {
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
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground pl-2">Concept</span>
                            </TableHead>
                            {periods.map(period => (
                                <TableHead key={period} className="text-right min-w-[120px] h-10">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{period}</span>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => {
                            const isSelected = selectedConcepts.includes(row.concept)
                            return (
                                <TableRow
                                    key={row.concept}
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
                                        <div className="flex items-center gap-3 pl-2">
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
                                    {periods.map(period => (
                                        <TableCell key={period} className="text-right py-2">
                                            <span className="font-mono text-xs text-muted-foreground/80 group-hover:text-foreground transition-colors">
                                                {row[period] !== null && row[period] !== undefined
                                                    ? new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(row[period])
                                                    : '-'}
                                            </span>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
