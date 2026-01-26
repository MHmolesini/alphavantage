
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MinimalMetric } from "@/components/analysis/minimal-metric"
import { HistoricalChart } from "@/components/analysis/historical-chart"
import { cn } from "@/lib/utils"

interface AnalysisDashboardProps {
    symbol: string
    income: any[]
    balance: any[]
    cashFlow: any[]
    profitability: any[]
    liquidity: any[]
    indebtedness: any[]
    management: any[]
    assessment: any[]
}

export function AnalysisDashboard({
    symbol,
    income,
    balance,
    cashFlow,
    profitability,
    liquidity,
    indebtedness,
    management,
    assessment
}: AnalysisDashboardProps) {
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
    const [selectedMetricName, setSelectedMetricName] = useState<string>("")
    const [chartData, setChartData] = useState<any[]>([])

    // Helper to process data for the chart when a metric is clicked
    const handleMetricClick = (data: any[], concept: string, label: string) => {

        // Filter for the specific concept
        const conceptData = data.filter(d => d.concept === concept)

        // Sort by date ascending for the chart (oldest to newest)
        const sortedData = [...conceptData]
            .sort((a, b) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime())
            // Take up to last 40 quarters if available
            .slice(-40)
            .map(item => ({
                period: item.period_quarter || item.fiscalDateEnding,
                value: item.value
            }))

        setSelectedMetric(concept)
        setSelectedMetricName(label)
        setChartData(sortedData)
    }

    // Helper to find latest value for a concept with trend
    const getMetricWithTrend = (data: any[], concept: string) => {
        // Sort descending to get latest
        const sorted = [...data]
            .filter(d => d.concept === concept)
            .sort((a, b) => new Date(b.fiscalDateEnding).getTime() - new Date(a.fiscalDateEnding).getTime())

        const current = sorted[0]
        const previous = sorted[1]

        if (!current) return { value: null as number | null, change: null as number | null }

        let change = null
        if (previous && typeof previous.value === 'number' && previous.value !== 0) {
            change = ((current.value - previous.value) / Math.abs(previous.value)) * 100
        }

        return { value: current.value, change }
    }

    const MetricCard = ({ label, concept, data }: { label: string, concept: string, data: any[] }) => {
        const metric = getMetricWithTrend(data, concept)
        const isSelected = selectedMetric === concept

        return (
            <div
                className={cn(
                    "cursor-pointer transition-all duration-200 rounded-lg p-2 -ml-2 hover:bg-muted/50 border border-transparent",
                    isSelected && "bg-muted/50 border-muted"
                )}
                onClick={() => handleMetricClick(data, concept, label)}
            >
                <MinimalMetric
                    label={label}
                    value={metric.value}
                    change={metric.change}
                />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-light tracking-tight">{symbol}</h1>
                <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">Financial Analysis</span>
            </div>

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
                    {/* Charts only show if we have data selected, or empty state placeholder */}
                    {/* User requested: "adds a chart below, full width, empty initially. user touches cards, chart fills." */}

                    {/* Liquidity Tab */}
                    <TabsContent value="liquidity" className="space-y-6">
                        <div>
                            <h2 className="text-lg font-medium mb-4">Liquidity Ratios</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
                                <MetricCard label="Current Ratio" concept="currentRatio" data={liquidity} />
                                <MetricCard label="Quick Ratio" concept="QuickRatio" data={liquidity} />
                                <MetricCard label="Cash To Debt" concept="CashToDebt" data={liquidity} />
                                <MetricCard label="Equity To Assets" concept="EquityToAssets" data={liquidity} />
                                <MetricCard label="Interest Coverage" concept="InterestCoverage" data={liquidity} />
                                <MetricCard label="Sloan Ratio" concept="SloanRatio" data={liquidity} />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Profitability Tab */}
                    <TabsContent value="profitability" className="space-y-6">
                        <div>
                            <h2 className="text-lg font-medium mb-4">Profitability Ratios</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
                                <MetricCard label="Gross Margin" concept="GrossMargin" data={profitability} />
                                <MetricCard label="Operating Margin" concept="OperatingMargin" data={profitability} />
                                <MetricCard label="Net Margin" concept="NetMargin" data={profitability} />
                                <MetricCard label="EBITDA Margin" concept="EbitdaMargin" data={profitability} />
                                <MetricCard label="ROA" concept="ReturnOnAssets" data={profitability} />
                                <MetricCard label="ROE" concept="ReturnOnEquity" data={profitability} />
                                <MetricCard label="Dividend Yield" concept="DividendYield" data={profitability} />
                                <MetricCard label="Payout Ratio" concept="dividendPayoutRatio" data={profitability} />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Indebtedness Tab */}
                    <TabsContent value="indebtedness" className="space-y-6">
                        <div>
                            <h2 className="text-lg font-medium mb-4">Indebtedness Ratios</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
                                <MetricCard label="Debt To Assets" concept="DebtToAssets" data={indebtedness} />
                                <MetricCard label="Debt To Equity" concept="DebtToEquity" data={indebtedness} />
                                <MetricCard label="Debt To EBITDA" concept="DebtToEbitda" data={indebtedness} />
                                <MetricCard label="Debt To Revenue" concept="DebtToRevenue" data={indebtedness} />
                                <MetricCard label="Eff. Interest Rate" concept="EffectiveInterestRateOnDebt" data={indebtedness} />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Management Tab */}
                    <TabsContent value="management" className="space-y-6">
                        <div>
                            <h2 className="text-lg font-medium mb-4">Management Efficiency</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
                                <MetricCard label="Beneish M-Score" concept="BeneishMScore" data={management} />
                                <MetricCard label="Altman Z-Score" concept="AltmanZScore" data={management} />
                                <MetricCard label="Asset Turnover" concept="AssetTurnover" data={management} />
                                <MetricCard label="Inventory Turnover" concept="InventoryTurnover" data={management} />
                                <MetricCard label="Days Sales Outstanding" concept="DaysSales" data={management} />
                                <MetricCard label="Days Inventory" concept="DaysInventory" data={management} />
                                <MetricCard label="Days Payable" concept="DaysPayable" data={management} />
                                <MetricCard label="Cash Conversion Cycle" concept="CashConversionCycle" data={management} />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Assessment Tab */}
                    <TabsContent value="assessment" className="space-y-6">
                        <div>
                            <h2 className="text-lg font-medium mb-4">Valuation & Assessment</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
                                <MetricCard label="Piotroski F-Score" concept="PiotroskiFScore" data={assessment} />
                                <MetricCard label="P/E Ratio" concept="PriceToEarnings" data={assessment} />
                                <MetricCard label="P/S Ratio" concept="PriceToSales" data={assessment} />
                                <MetricCard label="P/B Ratio" concept="PriceToBookValue" data={assessment} />
                                <MetricCard label="EV / EBITDA" concept="EV_EBITDA" data={assessment} />
                                <MetricCard label="EV / Revenue" concept="EV_Revenue" data={assessment} />
                                <MetricCard label="Tobin's Q" concept="TobinsQ" data={assessment} />
                                <MetricCard label="Graham Number" concept="GrahamNumber" data={assessment} />
                                <MetricCard label="Earnings Yield" concept="EarningYield" data={assessment} />
                                <MetricCard label="Price / FCF" concept="PriceToFreeCashFlow" data={assessment} />
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

                    {/* Chart Section - Visually separated but persistent below the content (or inside tabs?)
                        The user asked: "adds a chart below". This implies it should be always visible or appear below the grid.
                        If I put it outside tabs content, it will show for all tabs, but 'selectedMetric' might be from a different tab.
                        Ideally, clearing the selection when switching tabs might be good, or just keep it.
                        Let's put it inside the numeric tabs (liquidity, etc) and hide for the raw data tabs (income, etc).
                     */}

                    <div className="mt-12">
                        {/* Only show chart for the ratio tabs, not raw financial statements if that's preferred. 
                            However, the chart consumes 'selectedMetric' state. If 'income' tab is selected, the chart might still show 
                            last selected metric from 'liquidity' which is confusing. 
                            Maybe hiding it when on raw data tabs is better.
                        */}
                        <TabsContent value="liquidity">
                            <HistoricalChart data={chartData} metricName={selectedMetricName} />
                        </TabsContent>
                        <TabsContent value="profitability">
                            <HistoricalChart data={chartData} metricName={selectedMetricName} />
                        </TabsContent>
                        <TabsContent value="indebtedness">
                            <HistoricalChart data={chartData} metricName={selectedMetricName} />
                        </TabsContent>
                        <TabsContent value="management">
                            <HistoricalChart data={chartData} metricName={selectedMetricName} />
                        </TabsContent>
                        <TabsContent value="assessment">
                            <HistoricalChart data={chartData} metricName={selectedMetricName} />
                        </TabsContent>
                    </div>

                </div>
            </Tabs>
        </div>
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
