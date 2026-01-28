
"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FinancialsChart } from "@/components/financials/financials-chart"
import { FinancialsTable } from "@/components/financials/financials-table"
import { cn } from "@/lib/utils"

interface FinancialsDashboardProps {
    symbol: string
    income: any[]
    balance: any[]
    cashFlow: any[]
}

export function FinancialsDashboard({ symbol, income, balance, cashFlow }: FinancialsDashboardProps) {
    const [selectedConcepts, setSelectedConcepts] = useState<string[]>([])
    const [variationType, setVariationType] = useState<"none" | "qoq" | "yoy">("qoq")

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
        {
            concept: "costofGoodsAndServicesSold",
            children: [
                { concept: "depreciationAndAmortization" }
            ]
        },
        { concept: "grossProfit" },
        {
            concept: "operatingExpenses",
            children: [
                {
                    concept: "sellingGeneralAndAdministrative",
                    children: [
                        { concept: "researchAndDevelopment" }
                    ]
                }
            ]
        },
        {
            concept: "operatingIncome",
            children: [
                { concept: "interestExpense" },
                { concept: "interestIncome" }
            ]
        },
        { concept: "incomeTaxExpense" },
        { concept: "netIncomeFromContinuingOperations" },
        { concept: "netIncome" },
        { concept: "eps" },
        { concept: "ebitda" },
        { concept: "ebit" }
    ]

    const processData = (rawData: any[], structure?: any[]) => {
        if (!rawData || rawData.length === 0) return { chartData: [], tableData: [], periods: [] }

        // All periods sorted descending - use all available history first
        const allPeriods = Array.from(new Set(rawData.map(d => d.period_quarter || d.fiscalDateEnding)))
            .sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime())

        // Displayed periods (top 20)
        const periods = allPeriods.slice(0, 20)

        // Helper to get value and variation
        const getCellData = (concept: string, period: string) => {
            const currentRecord = rawData.find(d => d.concept === concept && (d.period_quarter === period || d.fiscalDateEnding === period))
            const currentValue = currentRecord ? currentRecord.value : null

            if (currentValue === null) return { value: null, variation: null }

            const currentIndex = allPeriods.indexOf(period)
            let previousPeriod = null

            if (variationType === "qoq") {
                previousPeriod = allPeriods[currentIndex + 1]
            } else if (variationType === "yoy") {
                previousPeriod = allPeriods[currentIndex + 4]
            }

            let variation = null
            if (previousPeriod) {
                const prevRecord = rawData.find(d => d.concept === concept && (d.period_quarter === previousPeriod || d.fiscalDateEnding === previousPeriod))
                const prevValue = prevRecord ? prevRecord.value : null
                if (prevValue) {
                    variation = ((currentValue - prevValue) / Math.abs(prevValue)) * 100
                }
            }

            return { value: currentValue, variation }
        }

        // Helper to build hierarchical rows
        const buildHierarchy = (struct: any[]): any[] => {
            return struct.map(item => {
                const row: any = { concept: item.concept, children: [] }

                // Populate period data
                periods.forEach(period => {
                    row[period] = getCellData(item.concept, period)
                })

                // Recurse for children
                if (item.children) {
                    row.children = buildHierarchy(item.children)
                }

                return row
            })
        }

        // Helper for flat list (if no structure provided)
        const buildFlat = () => {
            const concepts = Array.from(new Set(rawData.map(d => d.concept)))
            return concepts.map(concept => {
                const row: any = { concept }
                periods.forEach(period => {
                    row[period] = getCellData(concept, period)
                })
                return row
            })
        }

        const tableData = structure ? buildHierarchy(structure) : buildFlat()

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
    const incomeProcessed = useMemo(() => processData(income, INCOME_STRUCTURE), [income, selectedConcepts, variationType])
    const balanceProcessed = useMemo(() => processData(balance), [balance, selectedConcepts, variationType])
    const cashProcessed = useMemo(() => processData(cashFlow), [cashFlow, selectedConcepts, variationType])

    // Render Controls helper
    const renderControls = () => (
        <div className="flex justify-end mb-4">
            <div className="flex items-center space-x-2 bg-muted/50 p-1 rounded-lg">
                <button
                    onClick={() => setVariationType("qoq")}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                        variationType === "qoq" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    QoQ
                </button>
                <button
                    onClick={() => setVariationType("yoy")}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                        variationType === "yoy" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    YoY
                </button>
            </div>
        </div>
    )

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
                    {renderControls()}
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
                    {renderControls()}
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
                    {renderControls()}
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
