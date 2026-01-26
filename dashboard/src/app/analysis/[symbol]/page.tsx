import { Suspense } from "react"
import { getFinancials } from "@/app/actions/financials"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLayout } from "@/components/layout/app-layout"
import { OverviewCharts } from "@/components/analysis/charts/overview-charts"
import { MinimalMetric } from "@/components/analysis/minimal-metric"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface PageProps {
    params: Promise<{ symbol: string }>
}

export default async function AnalysisPage({ params }: PageProps) {
    const { symbol } = await params

    const [
        income,
        balance,
        cashFlow,
        profitability,
        liquidity,
        indebtedness,
        management,
        assessment
    ] = await Promise.all([
        getFinancials(symbol, "income_statements"),
        getFinancials(symbol, "balance_sheet"),
        getFinancials(symbol, "cash_flow"),
        getFinancials(symbol, "profitability"),
        getFinancials(symbol, "liquidity"),
        getFinancials(symbol, "indebtedness"),
        getFinancials(symbol, "management"),
        getFinancials(symbol, "assessment"),
    ])

    // Helper to find latest value for a concept with trend
    const getMetricWithTrend = (data: any[], concept: string) => {
        // Sort just in case, though query is sorted
        const sorted = [...data]
            .filter(d => d.concept === concept)
            .sort((a, b) => new Date(b.fiscalDateEnding).getTime() - new Date(a.fiscalDateEnding).getTime())

        const current = sorted[0]
        const previous = sorted[1]

        if (!current) return { value: null as number | null, change: null as number | null }

        let change = null
        // Ensure previous exists and is a valid number (not null, not 0) to avoid NaN/Infinity
        if (previous && typeof previous.value === 'number' && previous.value !== 0) {
            // Calculate % change
            change = ((current.value - previous.value) / Math.abs(previous.value)) * 100
        }

        return { value: current.value, change }
    }


    return (
        <AppLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-light tracking-tight">{symbol}</h1>
                    <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">Financial Analysis</span>
                </div>

                <OverviewCharts
                    incomeData={income}
                    balanceData={balance}
                    cashInternalData={cashFlow}
                />

                <Tabs defaultValue="liquidity" className="w-full">
                    <div className="w-full overflow-x-auto pb-4">
                        <TabsList className="h-auto p-1 bg-transparent border-b rounded-none w-full justify-start gap-4">
                            <TabTriggerStyle value="liquidity">Liquidity</TabTriggerStyle>
                            <TabTriggerStyle value="profitability">Profitability</TabTriggerStyle>
                            <TabTriggerStyle value="indebtedness">Indebtedness</TabTriggerStyle>
                            <TabTriggerStyle value="management">Management</TabTriggerStyle>
                            <TabTriggerStyle value="assessment">Assessment</TabTriggerStyle>
                            <TabTriggerStyle value="income">Income</TabTriggerStyle>
                            <TabTriggerStyle value="balance">Balance Sheet</TabTriggerStyle>
                            <TabTriggerStyle value="cash">Cash Flow</TabTriggerStyle>
                        </TabsList>
                    </div>

                    <div className="mt-8">
                        {/* Liquidity Tab */}
                        <TabsContent value="liquidity" className="space-y-6">
                            <div>
                                <h2 className="text-lg font-medium mb-4">Liquidity Ratios</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
                                    <MetricWrapper label="Current Ratio" metric={getMetricWithTrend(liquidity, "currentRatio")} />
                                    <MetricWrapper label="Quick Ratio" metric={getMetricWithTrend(liquidity, "QuickRatio")} />
                                    <MetricWrapper label="Cash To Debt" metric={getMetricWithTrend(liquidity, "CashToDebt")} />
                                    <MetricWrapper label="Equity To Assets" metric={getMetricWithTrend(liquidity, "EquityToAssets")} />
                                    <MetricWrapper label="Interest Coverage" metric={getMetricWithTrend(liquidity, "InterestCoverage")} />
                                    <MetricWrapper label="Sloan Ratio" metric={getMetricWithTrend(liquidity, "SloanRatio")} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Profitability Tab */}
                        <TabsContent value="profitability" className="space-y-6">
                            <div>
                                <h2 className="text-lg font-medium mb-4">Profitability Ratios</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
                                    <MetricWrapper label="Gross Margin" metric={getMetricWithTrend(profitability, "GrossMargin")} />
                                    <MetricWrapper label="Operating Margin" metric={getMetricWithTrend(profitability, "OperatingMargin")} />
                                    <MetricWrapper label="Net Margin" metric={getMetricWithTrend(profitability, "NetMargin")} />
                                    <MetricWrapper label="EBITDA Margin" metric={getMetricWithTrend(profitability, "EbitdaMargin")} />
                                    <MetricWrapper label="ROA" metric={getMetricWithTrend(profitability, "ReturnOnAssets")} />
                                    <MetricWrapper label="ROE" metric={getMetricWithTrend(profitability, "ReturnOnEquity")} />
                                    <MetricWrapper label="Dividend Yield" metric={getMetricWithTrend(profitability, "DividendYield")} />
                                    <MetricWrapper label="Payout Ratio" metric={getMetricWithTrend(profitability, "dividendPayoutRatio")} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Indebtedness Tab */}
                        <TabsContent value="indebtedness" className="space-y-6">
                            <div>
                                <h2 className="text-lg font-medium mb-4">Indebtedness Ratios</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
                                    <MetricWrapper label="Debt To Assets" metric={getMetricWithTrend(indebtedness, "DebtToAssets")} />
                                    <MetricWrapper label="Debt To Equity" metric={getMetricWithTrend(indebtedness, "DebtToEquity")} />
                                    <MetricWrapper label="Debt To EBITDA" metric={getMetricWithTrend(indebtedness, "DebtToEbitda")} />
                                    <MetricWrapper label="Debt To Revenue" metric={getMetricWithTrend(indebtedness, "DebtToRevenue")} />
                                    <MetricWrapper label="Eff. Interest Rate" metric={getMetricWithTrend(indebtedness, "EffectiveInterestRateOnDebt")} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Management Tab */}
                        <TabsContent value="management" className="space-y-6">
                            <div>
                                <h2 className="text-lg font-medium mb-4">Management Efficiency</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
                                    <MetricWrapper label="Beneish M-Score" metric={getMetricWithTrend(management, "BeneishMScore")} />
                                    <MetricWrapper label="Altman Z-Score" metric={getMetricWithTrend(management, "AltmanZScore")} />
                                    <MetricWrapper label="Asset Turnover" metric={getMetricWithTrend(management, "AssetTurnover")} />
                                    <MetricWrapper label="Inventory Turnover" metric={getMetricWithTrend(management, "InventoryTurnover")} />
                                    <MetricWrapper label="Days Sales Outstanding" metric={getMetricWithTrend(management, "DaysSales")} />
                                    <MetricWrapper label="Days Inventory" metric={getMetricWithTrend(management, "DaysInventory")} />
                                    <MetricWrapper label="Days Payable" metric={getMetricWithTrend(management, "DaysPayable")} />
                                    <MetricWrapper label="Cash Conversion Cycle" metric={getMetricWithTrend(management, "CashConversionCycle")} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Assessment Tab */}
                        <TabsContent value="assessment" className="space-y-6">
                            <div>
                                <h2 className="text-lg font-medium mb-4">Valuation & Assessment</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
                                    <MetricWrapper label="Piotroski F-Score" metric={getMetricWithTrend(assessment, "PiotroskiFScore")} />
                                    <MetricWrapper label="P/E Ratio" metric={getMetricWithTrend(assessment, "PriceToEarnings")} />
                                    <MetricWrapper label="P/S Ratio" metric={getMetricWithTrend(assessment, "PriceToSales")} />
                                    <MetricWrapper label="P/B Ratio" metric={getMetricWithTrend(assessment, "PriceToBookValue")} />
                                    <MetricWrapper label="EV / EBITDA" metric={getMetricWithTrend(assessment, "EV_EBITDA")} />
                                    <MetricWrapper label="EV / Revenue" metric={getMetricWithTrend(assessment, "EV_Revenue")} />
                                    <MetricWrapper label="Tobin's Q" metric={getMetricWithTrend(assessment, "TobinsQ")} />
                                    <MetricWrapper label="Graham Number" metric={getMetricWithTrend(assessment, "GrahamNumber")} />
                                    <MetricWrapper label="Earnings Yield" metric={getMetricWithTrend(assessment, "EarningYield")} />
                                    <MetricWrapper label="Price / FCF" metric={getMetricWithTrend(assessment, "PriceToFreeCashFlow")} />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="income">
                            <FinancialCard title="Income Statement" data={income} />
                        </TabsContent>
                        <TabsContent value="balance">
                            <FinancialCard title="Balance Sheet" data={balance} />
                        </TabsContent>
                        <TabsContent value="cash">
                            <FinancialCard title="Cash Flow" data={cashFlow} />
                        </TabsContent>
                    </div>
                </Tabs>

            </div>
        </AppLayout>
    )
}

function TabTriggerStyle({ value, children }: { value: string, children: React.ReactNode }) {
    return (
        <TabsTrigger
            value={value}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-2"
        >
            {children}
        </TabsTrigger>
    )
}

function MetricWrapper({ label, metric }: { label: string, metric: { value: number | null, change: number | null } }) {
    return (
        <MinimalMetric
            label={label}
            value={metric.value}
            change={metric.change}
        />
    )
}

function FinancialCard({ title, data }: { title: string, data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <Card className="border-none shadow-none bg-muted/20">
                <CardHeader><CardTitle className="font-light">{title}</CardTitle></CardHeader>
                <CardContent>No data available</CardContent>
            </Card>
        )
    }

    // Group by concept for display
    const concepts = Array.from(new Set(data.map(item => item.concept))).slice(0, 20)

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-muted">
                            <TableHead className="pl-0">Concept</TableHead>
                            <TableHead className="text-right pr-0">Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {concepts.map(concept => {
                            const item = data.find(d => d.concept === concept)
                            return (
                                <TableRow key={concept} className="hover:bg-muted/50 border-b border-muted/40">
                                    <TableCell className="font-medium text-sm pl-0 py-3">{concept}</TableCell>
                                    <TableCell className="text-right text-sm pr-0 py-3 font-mono">
                                        {item?.value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact" }).format(item.value) : '-'}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
