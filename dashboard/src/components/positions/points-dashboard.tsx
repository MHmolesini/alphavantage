"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PointsChart } from "@/components/positions/points-chart"
import { PointsTable } from "@/components/positions/points-table"
import { cn } from "@/lib/utils"

interface PointsDashboardProps {
    symbol: string
    pointsData: any[]
    currentRolling: number
}

export function PointsDashboard({ symbol, pointsData, currentRolling }: PointsDashboardProps) {
    const [selectedConcepts, setSelectedConcepts] = useState<string[]>([])
    const router = useRouter()

    const handleRollingChange = (val: number) => {
        router.push(`?rolling=${val}`)
    }

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

    const PROFITABILITY_STRUCTURE = [
        { concept: "GrossMargin" },
        { concept: "OperatingMargin" },
        { concept: "NetMargin" },
        { concept: "EbitdaMargin" },
        { concept: "ReturnOnAssets" },
        { concept: "ReturnOnEquity" },
        { concept: "COGStoRevenue" },
        { concept: "DividendYield" },
        { concept: "dividendPayoutRatio" },
        { concept: "QualityRatio" }
    ]

    const LIQUIDITY_STRUCTURE = [
        { concept: "currentRatio" },
        { concept: "QuickRatio" },
        { concept: "CashToDebt" },
        { concept: "EquityToAssets" },
        { concept: "InterestCoverage" },
        { concept: "SloanRatio" }
    ]

    const INDEBTEDNESS_STRUCTURE = [
        { concept: "DebtToAssets" },
        { concept: "DebtToEquity" },
        { concept: "DebtToEbitda" },
        { concept: "DebtToRevenue" },
        { concept: "EffectiveInterestRateOnDebt" },
        { concept: "LmDebtToAssets" }
    ]

    const MANAGEMENT_STRUCTURE = [
        { concept: "AssetTurnover" },
        { concept: "InventoryTurnover" },
        { concept: "DaysSales" },
        { concept: "DaysInventory" },
        { concept: "DaysPayable" },
        { concept: "CashConversionCycle" },
        { concept: "InventoryToRevenue" },
        { concept: "ResearchAndDevelopmentToRevenue" },
        { concept: "GoodwillToAsset" },
        { concept: "GrossProfitToAssets" },
        { concept: "AltmanZScore" },
        { concept: "BeneishMScore" },
        { concept: "SpringateScore" },
        { concept: "ZmijewskiScore" }
    ]

    const ASSESSMENT_STRUCTURE = [
        { concept: "PiotroskiFScore" },
        { concept: "NetCurrentAssetValue" },
        { concept: "NetNetWorkingCapital" },
        { concept: "PriceToEarnings" },
        { concept: "PriceToSales" },
        { concept: "PriceToFreeCashFlow" },
        { concept: "PriceToBook" },
        { concept: "EnterpriseValue" },
        { concept: "EvToEbit" },
        { concept: "EvToEbitda" },
        { concept: "EvToRevenue" },
        { concept: "EarningsYield" },
        { concept: "TobinsQ" },
        { concept: "SharesBuyback" }
    ]

    const processData = (baseFilter: string | string[], structure: any[]) => {
        const rawData = pointsData.filter(d =>
            Array.isArray(baseFilter) ? baseFilter.includes(d.base) : d.base === baseFilter
        )

        if (!rawData || rawData.length === 0) return { chartData: [], tableData: [], periods: [] }

        const allPeriods = Array.from(new Set(rawData.map(d => d.period_quarter)))
            .sort((a: any, b: any) => {
                return b.localeCompare(a)
            })

        const periods = allPeriods.slice(0, 20)

        const getCellData = (concept: string, period: string) => {
            const currentRecord = rawData.find(d => d.concept === concept && d.period_quarter === period)
            if (!currentRecord) return { ranking: null, position_rank: null }
            return {
                ranking: currentRecord.ranking,
                position_rank: currentRecord.position_rank
            }
        }

        const buildWrapper = (struct: any[]) => {
            return struct.map(item => {
                const row: any = { concept: item.concept, children: [] }
                periods.forEach(period => {
                    row[period] = getCellData(item.concept, period)
                })
                return row
            })
        }

        const tableData = buildWrapper(structure)

        const chartPeriods = [...periods].reverse()
        const chartData = chartPeriods.map(period => {
            const row: any = { period }
            selectedConcepts.forEach(concept => {
                const record = rawData.find(d => d.concept === concept && d.period_quarter === period)
                row[`${concept}_points`] = record ? record.ranking : null
                row[`${concept}_rank`] = record ? record.position_rank : null
            })
            return row
        })

        return { chartData, tableData, periods }
    }

    const incomeProcessed = useMemo(() => processData('income_statements', INCOME_STRUCTURE), [pointsData, selectedConcepts])
    const balanceProcessed = useMemo(() => processData('balance_sheet', BALANCE_STRUCTURE), [pointsData, selectedConcepts])
    const cashProcessed = useMemo(() => processData('cash_flow', CASH_STRUCTURE), [pointsData, selectedConcepts])
    const profitabilityProcessed = useMemo(() => processData('profitability', PROFITABILITY_STRUCTURE), [pointsData, selectedConcepts])
    const liquidityProcessed = useMemo(() => processData('liquidity', LIQUIDITY_STRUCTURE), [pointsData, selectedConcepts])
    const indebtednessProcessed = useMemo(() => processData('indebtedness', INDEBTEDNESS_STRUCTURE), [pointsData, selectedConcepts])
    const managementProcessed = useMemo(() => processData('management', MANAGEMENT_STRUCTURE), [pointsData, selectedConcepts])
    const assessmentProcessed = useMemo(() => processData('assessment', ASSESSMENT_STRUCTURE), [pointsData, selectedConcepts])

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-light tracking-tight">{symbol} <span className="text-muted-foreground text-xl">Points & Rankings</span></h1>

                <div className="flex bg-muted/20 p-1 rounded-lg">
                    {[1, 4, 8, 12].map((r) => (
                        <Button
                            key={r}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRollingChange(r)}
                            className={cn(
                                "text-xs font-medium px-3 h-7",
                                currentRolling === r ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Ranking {r}
                        </Button>
                    ))}
                </div>
            </div>

            <Tabs defaultValue="income" className="w-full" onValueChange={() => setSelectedConcepts([])}>
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-muted/20 p-1 group/list h-auto">
                    <TabsTrigger value="income" className="transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer">Income</TabsTrigger>
                    <TabsTrigger value="balance" className="transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer">Balance</TabsTrigger>
                    <TabsTrigger value="cash" className="transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer">Cash Flow</TabsTrigger>
                    <TabsTrigger value="profitability" className="transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer">Profitability</TabsTrigger>
                    <TabsTrigger value="liquidity" className="transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer">Liquidity</TabsTrigger>
                    <TabsTrigger value="indebtedness" className="transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer">Indebtedness</TabsTrigger>
                    <TabsTrigger value="management" className="transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer">Management</TabsTrigger>
                    <TabsTrigger value="assessment" className="transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer">Assessment</TabsTrigger>
                </TabsList>

                <TabsContent value="income" className="space-y-8 mt-6">
                    <PointsChart data={incomeProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <PointsTable data={incomeProcessed.tableData} periods={incomeProcessed.periods} selectedConcepts={selectedConcepts} onToggleConcept={handleToggleConcept} />
                </TabsContent>

                <TabsContent value="balance" className="space-y-8 mt-6">
                    <PointsChart data={balanceProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <PointsTable data={balanceProcessed.tableData} periods={balanceProcessed.periods} selectedConcepts={selectedConcepts} onToggleConcept={handleToggleConcept} />
                </TabsContent>

                <TabsContent value="cash" className="space-y-8 mt-6">
                    <PointsChart data={cashProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <PointsTable data={cashProcessed.tableData} periods={cashProcessed.periods} selectedConcepts={selectedConcepts} onToggleConcept={handleToggleConcept} />
                </TabsContent>

                <TabsContent value="profitability" className="space-y-8 mt-6">
                    <PointsChart data={profitabilityProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <PointsTable data={profitabilityProcessed.tableData} periods={profitabilityProcessed.periods} selectedConcepts={selectedConcepts} onToggleConcept={handleToggleConcept} />
                </TabsContent>

                <TabsContent value="liquidity" className="space-y-8 mt-6">
                    <PointsChart data={liquidityProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <PointsTable data={liquidityProcessed.tableData} periods={liquidityProcessed.periods} selectedConcepts={selectedConcepts} onToggleConcept={handleToggleConcept} />
                </TabsContent>

                <TabsContent value="indebtedness" className="space-y-8 mt-6">
                    <PointsChart data={indebtednessProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <PointsTable data={indebtednessProcessed.tableData} periods={indebtednessProcessed.periods} selectedConcepts={selectedConcepts} onToggleConcept={handleToggleConcept} />
                </TabsContent>

                <TabsContent value="management" className="space-y-8 mt-6">
                    <PointsChart data={managementProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <PointsTable data={managementProcessed.tableData} periods={managementProcessed.periods} selectedConcepts={selectedConcepts} onToggleConcept={handleToggleConcept} />
                </TabsContent>

                <TabsContent value="assessment" className="space-y-8 mt-6">
                    <PointsChart data={assessmentProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <PointsTable data={assessmentProcessed.tableData} periods={assessmentProcessed.periods} selectedConcepts={selectedConcepts} onToggleConcept={handleToggleConcept} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
