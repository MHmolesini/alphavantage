
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

    // Data passed here is expected to be an array of objects where concept is the key
    // But typically financial data comes as a list of records. 
    // We need to pivot or the parent should pass pivot data.
    // Let's assume parent pivots it: { concept: "Revenue", "2024 T4": 100, "2024 T3": 90 ... }

    if (!data || data.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No data available</div>
    }

    return (
        <div className="w-full border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/50">
                            <TableHead className="w-[300px] min-w-[200px] sticky left-0 bg-background/95 backdrop-blur z-10 border-r">
                                Concept
                            </TableHead>
                            {periods.map(period => (
                                <TableHead key={period} className="text-right min-w-[120px] font-mono text-xs">
                                    {period}
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
                                        "cursor-pointer transition-colors hover:bg-muted/50",
                                        isSelected && "bg-muted/50"
                                    )}
                                    onClick={() => onToggleConcept(row.concept)}
                                >
                                    <TableCell className="font-medium sticky left-0 bg-background/95 backdrop-blur border-r z-10 flex items-center gap-2">
                                        <div className={cn(
                                            "w-1 h-full absolute left-0 top-0 bottom-0 transition-colors",
                                            isSelected ? "bg-primary" : "bg-transparent"
                                        )} />
                                        <span className={cn("truncate", isSelected && "font-semibold")}>
                                            {row.concept}
                                        </span>
                                    </TableCell>
                                    {periods.map(period => (
                                        <TableCell key={period} className="text-right font-mono text-xs">
                                            {row[period] !== null && row[period] !== undefined
                                                ? new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(row[period])
                                                : '-'}
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
