"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FinancialsChart } from "@/components/financials/financials-chart"
import { PointsTable } from "@/components/positions/points-table"
import { cn } from "@/lib/utils"

interface PointsDashboardProps {
    symbol: string
    pointsData: any[]
}

export function PointsDashboard({ symbol, pointsData }: PointsDashboardProps) {
    const [selectedConcepts, setSelectedConcepts] = useState<string[]>([])

    const handleToggleConcept = (concept: string) => {
        setSelectedConcepts(prev => {
            if (prev.includes(concept)) {
                return prev.filter(c => c !== concept)
            } else {
                if (prev.length >= 3) {
                    return [...prev.slice(1), concept]
                }
                return [...prev, concept]
            }
        })
    }

    // Reuse hierarchies or define simplified ones. 
    // Assuming concepts match FinancialsDashboard.
    const INCOME_STRUCTURE = [
        { concept: "totalRevenue" },
        { concept: "costofGoodsAndServicesSold" },
        { concept: "grossProfit" },
        { concept: "operatingExpenses" },
        { concept: "operatingIncome" },
        { concept: "incomeTaxExpense" },
        { concept: "netIncome" },
        { concept: "eps" },
        { concept: "ebitda" },
        { concept: "ebit" }
    ]

    const BALANCE_STRUCTURE = [
        { concept: "totalAssets" },
        { concept: "totalCurrentAssets" },
        { concept: "cashAndShortTermInvestments" },
        { concept: "inventory" },
        { concept: "totalNonCurrentAssets" },
        { concept: "totalLiabilities" },
        { concept: "totalCurrentLiabilities" },
        { concept: "totalNonCurrentLiabilities" },
        { concept: "totalShareholderEquity" },
        { concept: "retainedEarnings" },
        { concept: "commonStock" }
    ]

    const CASH_STRUCTURE = [
        { concept: "operatingCashFlow" },
        { concept: "capitalExpenditure" },
        { concept: "freeCashFlow" }
    ]

    const processData = (baseFilter: string | string[], structure: any[]) => {
        // Filter data for this base (e.g. 'income_statement', 'profitability'?)
        // The action returns 'base' column.
        // bases: 'income_statement', 'balance_sheet', 'cash_flow'
        const rawData = pointsData.filter(d =>
            Array.isArray(baseFilter) ? baseFilter.includes(d.base) : d.base === baseFilter
        )

        if (!rawData || rawData.length === 0) return { chartData: [], tableData: [], periods: [] }

        const allPeriods = Array.from(new Set(rawData.map(d => d.period_quarter)))
            .sort((a: any, b: any) => {
                // Period format "YYYY QX"? Or just sort strings descending? 
                // data is sorted by period_quarter DESC in query.
                // But let's ensure consistency.
                return b.localeCompare(a)
            })

        const periods = allPeriods.slice(0, 20)

        // Helper to get score and rank
        const getCellData = (concept: string, period: string) => {
            const currentRecord = rawData.find(d => d.concept === concept && d.period_quarter === period)
            if (!currentRecord) return { ranking: null, position_rank: null }
            return {
                ranking: currentRecord.ranking,
                position_rank: currentRecord.position_rank
            }
        }

        const buildWrapper = (struct: any[]) => {
            // Supports basic hierarchy just for structure, but data is flat in table logic usually
            // My PointsTable logic handles children recursion if data has 'children'.
            return struct.map(item => {
                const row: any = { concept: item.concept, children: [] }
                periods.forEach(period => {
                    row[period] = getCellData(item.concept, period)
                })
                // No deep hierarchy in my structure definitions above for now to save space, 
                // but can add if needed.
                return row
            })
        }

        const tableData = buildWrapper(structure)

        const chartPeriods = [...periods].reverse()
        const chartData = chartPeriods.map(period => {
            const row: any = { period }
            selectedConcepts.forEach(concept => {
                const record = rawData.find(d => d.concept === concept && d.period_quarter === period)
                row[concept] = record ? record.ranking : null // Chart plots Ranking Value
            })
            return row
        })

        return { chartData, tableData, periods }
    }

    const incomeProcessed = useMemo(() => processData('income_statements', INCOME_STRUCTURE), [pointsData, selectedConcepts])
    const balanceProcessed = useMemo(() => processData('balance_sheet', BALANCE_STRUCTURE), [pointsData, selectedConcepts])
    const cashProcessed = useMemo(() => processData('cash_flow', CASH_STRUCTURE), [pointsData, selectedConcepts])

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-light tracking-tight">{symbol} <span className="text-muted-foreground text-xl">Points & Rankings</span></h1>
            </div>

            <Tabs defaultValue="income" className="w-full" onValueChange={() => setSelectedConcepts([])}>
                <TabsList className="grid w-full grid-cols-3 max-w-[400px] bg-muted/20 p-1 group/list">
                    <TabsTrigger
                        value="income"
                        className="transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer"
                    >
                        Income
                    </TabsTrigger>
                    <TabsTrigger
                        value="balance"
                        className="transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer"
                    >
                        Balance
                    </TabsTrigger>
                    <TabsTrigger
                        value="cash"
                        className="transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer"
                    >
                        Cash Flow
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="income" className="space-y-8 mt-6">
                    <FinancialsChart data={incomeProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <PointsTable
                        data={incomeProcessed.tableData}
                        periods={incomeProcessed.periods}
                        selectedConcepts={selectedConcepts}
                        onToggleConcept={handleToggleConcept}
                    />
                </TabsContent>

                <TabsContent value="balance" className="space-y-8 mt-6">
                    <FinancialsChart data={balanceProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <PointsTable
                        data={balanceProcessed.tableData}
                        periods={balanceProcessed.periods}
                        selectedConcepts={selectedConcepts}
                        onToggleConcept={handleToggleConcept}
                    />
                </TabsContent>

                <TabsContent value="cash" className="space-y-8 mt-6">
                    <FinancialsChart data={cashProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <PointsTable
                        data={cashProcessed.tableData}
                        periods={cashProcessed.periods}
                        selectedConcepts={selectedConcepts}
                        onToggleConcept={handleToggleConcept}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
