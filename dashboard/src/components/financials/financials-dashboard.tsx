
"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FinancialsChart } from "@/components/financials/financials-chart"
import { FinancialsTable } from "@/components/financials/financials-table"

interface FinancialsDashboardProps {
    symbol: string
    income: any[]
    balance: any[]
    cashFlow: any[]
}

export function FinancialsDashboard({ symbol, income, balance, cashFlow }: FinancialsDashboardProps) {
    const [selectedConcepts, setSelectedConcepts] = useState<string[]>([])
    // Default select "Total Revenue" or "Net Income" if standardizing, but keeping empty is fine too.

    const handleToggleConcept = (concept: string) => {
        setSelectedConcepts(prev => {
            if (prev.includes(concept)) {
                return prev.filter(c => c !== concept)
            } else {
                if (prev.length >= 3) {
                    // Replace the first one (FIFO) or allow max 3? User said "solo hasta 3".
                    // Let's keep the last 2 and add new one
                    return [...prev.slice(1), concept]
                }
                return [...prev, concept]
            }
        })
    }

    const processData = (rawData: any[]) => {
        if (!rawData || rawData.length === 0) return { chartData: [], tableData: [], periods: [] }

        // Unique periods sorted
        const periods = Array.from(new Set(rawData.map(d => d.period_quarter || d.fiscalDateEnding)))
            .sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime())
            .slice(0, 20)

        // Pivot for Table: Rows are concepts
        const concepts = Array.from(new Set(rawData.map(d => d.concept)))
        const tableData = concepts.map(concept => {
            const row: any = { concept }
            periods.forEach(period => {
                const record = rawData.find(d => d.concept === concept && (d.period_quarter === period || d.fiscalDateEnding === period))
                row[period] = record ? record.value : null
            })
            return row
        })

        // Pivot for Chart: Rows are periods, Columns are concepts
        // Chart needs chronological order usually
        const chartPeriods = [...periods].reverse()
        const chartData = chartPeriods.map(period => {
            const row: any = { period }
            selectedConcepts.forEach(concept => {
                const record = rawData.find(d => d.concept === concept && (d.period_quarter === period || d.fiscalDateEnding === period))
                row[concept] = record ? record.value : null
            })
            return row
        })

        return { chartData, tableData, periods }
    }

    // Memoize processed data for each tab
    const incomeProcessed = useMemo(() => processData(income), [income, selectedConcepts])
    const balanceProcessed = useMemo(() => processData(balance), [balance, selectedConcepts])
    const cashProcessed = useMemo(() => processData(cashFlow), [cashFlow, selectedConcepts])

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-light tracking-tight">{symbol} <span className="text-muted-foreground text-xl">Financials</span></h1>
            </div>

            <Tabs defaultValue="income" className="w-full" onValueChange={() => setSelectedConcepts([])}>
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value="income">Income</TabsTrigger>
                    <TabsTrigger value="balance">Balance</TabsTrigger>
                    <TabsTrigger value="cash">Cash Flow</TabsTrigger>
                </TabsList>

                {/* Income Tab */}
                <TabsContent value="income" className="space-y-8 mt-6">
                    <FinancialsChart data={incomeProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <FinancialsTable
                        data={incomeProcessed.tableData}
                        periods={incomeProcessed.periods}
                        selectedConcepts={selectedConcepts}
                        onToggleConcept={handleToggleConcept}
                    />
                </TabsContent>

                {/* Balance Tab */}
                <TabsContent value="balance" className="space-y-8 mt-6">
                    <FinancialsChart data={balanceProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <FinancialsTable
                        data={balanceProcessed.tableData}
                        periods={balanceProcessed.periods}
                        selectedConcepts={selectedConcepts}
                        onToggleConcept={handleToggleConcept}
                    />
                </TabsContent>

                {/* Cash Flow Tab */}
                <TabsContent value="cash" className="space-y-8 mt-6">
                    <FinancialsChart data={cashProcessed.chartData} selectedConcepts={selectedConcepts} />
                    <FinancialsTable
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
