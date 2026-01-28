"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PointsChart } from "@/components/positions/points-chart"
import { RankingsTable } from "@/components/rankings/rankings-table"
import { cn } from "@/lib/utils"
import { getConceptRankings } from "@/app/actions/financials"
import { Loader2 } from "lucide-react"

interface RankingsDashboardProps {
    symbol: string
    currentRolling: number
}

export function RankingsDashboard({ symbol, currentRolling }: RankingsDashboardProps) {
    const [selectedCategory, setSelectedCategory] = useState("profitability")
    const [selectedConcept, setSelectedConcept] = useState<string>("GrossMargin")
    const [rankingData, setRankingData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [chartTickers, setChartTickers] = useState<string[]>([symbol])

    const router = useRouter()

    const handleRollingChange = (val: number) => {
        router.push(`?rolling=${val}`)
    }

    const STRUCTURES: Record<string, any[]> = {
        income: [
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
        ],
        balance: [
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
        ],
        cash: [
            { concept: "operatingCashFlow" },
            { concept: "capitalExpenditure" },
            { concept: "freeCashFlow" }
        ],
        profitability: [
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
        ],
        liquidity: [
            { concept: "currentRatio" },
            { concept: "QuickRatio" },
            { concept: "CashToDebt" },
            { concept: "EquityToAssets" },
            { concept: "InterestCoverage" },
            { concept: "SloanRatio" }
        ],
        indebtedness: [
            { concept: "DebtToAssets" },
            { concept: "DebtToEquity" },
            { concept: "DebtToEbitda" },
            { concept: "DebtToRevenue" },
            { concept: "EffectiveInterestRateOnDebt" },
            { concept: "LmDebtToAssets" }
        ],
        management: [
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
        ],
        assessment: [
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
    }

    // Effect to fetch data when concept changes
    useEffect(() => {
        if (!selectedConcept) return

        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Determine base from selectedCategory
                let base = selectedCategory
                if (selectedCategory === 'income') base = 'income_statements'
                if (selectedCategory === 'balance') base = 'balance_sheet'
                if (selectedCategory === 'cash') base = 'cash_flow'

                const data = await getConceptRankings(base, selectedConcept, currentRolling)
                setRankingData(data)
            } catch (err) {
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [selectedConcept, selectedCategory, currentRolling])

    // Update selected Concept default when Category changes
    const handleTabChange = (val: string) => {
        setSelectedCategory(val)
        // Set first concept of the new category
        const firstConcept = STRUCTURES[val]?.[0]?.concept
        if (firstConcept) setSelectedConcept(firstConcept)
    }

    // Process Data for Chart and Table
    const { chartData, tableData, periods } = useMemo(() => {
        if (!rankingData || rankingData.length === 0) return { chartData: [], tableData: [], periods: [] }

        const allPeriods = Array.from(new Set(rankingData.map(d => d.period_quarter)))
            .sort((a: any, b: any) => b.localeCompare(a))
        const periods = allPeriods.slice(0, 20)

        // Table Data: Rows are Symbols
        const symbols = Array.from(new Set(rankingData.map(d => d.symbol)))
        const symbolRows = symbols.map(sym => {
            const row: any = { concept: sym, children: [] } // Reuse 'concept' key for Symbol name
            periods.forEach(p => {
                const record = rankingData.find(d => d.symbol === sym && d.period_quarter === p)
                row[p] = record ? { ranking: record.ranking, position_rank: record.position_rank } : { ranking: null, position_rank: null }
            })
            return row
        })

        // Sort rows by latest period rank
        const latestPeriod = periods[0]
        symbolRows.sort((a, b) => {
            const rankA = a[latestPeriod]?.position_rank ?? 999999
            const rankB = b[latestPeriod]?.position_rank ?? 999999
            return rankA - rankB
        })

        // Chart Data: Periods x Selected Tickers
        const chartPeriods = [...periods].reverse()
        const chartData = chartPeriods.map(period => {
            const row: any = { period }
            chartTickers.forEach(ticker => {
                const record = rankingData.find(d => d.symbol === ticker && d.period_quarter === period)
                row[`${ticker}_points`] = record ? record.ranking : null
                row[`${ticker}_rank`] = record ? record.position_rank : null
            })
            return row
        })

        return { chartData, tableData: symbolRows, periods }
    }, [rankingData, chartTickers])

    const handleToggleTicker = (ticker: string) => {
        setChartTickers(prev => {
            if (prev.includes(ticker)) return prev.filter(t => t !== ticker)
            if (prev.length >= 5) return [...prev.slice(1), ticker]
            return [...prev, ticker]
        })
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-light tracking-tight">{symbol} <span className="text-muted-foreground text-xl">Rankings</span></h1>

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

            <Tabs defaultValue="profitability" value={selectedCategory} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-muted/20 p-1 group/list h-auto">
                    {Object.keys(STRUCTURES).map(key => (
                        <TabsTrigger
                            key={key}
                            value={key}
                            className="capitalize transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer"
                        >
                            {key === 'cash' ? 'Cash Flow' : key}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="flex gap-6 mt-6 min-h-[500px]">
                    {/* Left Sidebar: Concepts */}
                    <div className="w-[240px] flex-shrink-0 flex flex-col gap-1 pr-2 border-r border-border/40">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pl-2">
                            Concepts
                        </span>
                        {STRUCTURES[selectedCategory]?.map((item) => (
                            <Button
                                key={item.concept}
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedConcept(item.concept)}
                                className={cn(
                                    "justify-start text-sm h-9 px-3 w-full text-left font-normal",
                                    selectedConcept === item.concept
                                        ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                {item.concept}
                            </Button>
                        ))}
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 space-y-6 min-w-0 relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                <div className="bg-background/80 p-3 rounded-full shadow-lg border">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            </div>
                        )}
                        <div className={cn("space-y-6 transition-opacity duration-200", isLoading ? "opacity-50 pointer-events-none" : "opacity-100")}>
                            <PointsChart data={chartData} selectedConcepts={chartTickers} />
                            <div className="text-xs text-muted-foreground mb-2 flex justify-between">
                                <span>Comparison: {selectedConcept}</span>
                                <span>{tableData.length} Companies</span>
                            </div>
                            <RankingsTable
                                data={tableData}
                                periods={periods}
                                selectedConcepts={chartTickers}
                                onToggleConcept={handleToggleTicker}
                            />
                        </div>
                    </div>
                </div>
            </Tabs>
        </div>
    )
}
