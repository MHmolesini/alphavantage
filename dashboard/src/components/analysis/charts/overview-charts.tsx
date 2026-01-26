"use client"

import { FinancialChart } from "./financial-chart"

interface OverviewChartsProps {
    incomeData: any[]
    balanceData: any[]
    cashInternalData: any[]
}

export function OverviewCharts({ incomeData, balanceData, cashInternalData }: OverviewChartsProps) {

    // Transform data for charts
    // Filter for specific concepts. e.g. TotalRevenue, NetIncome
    const prepareData = (data: any[], concept: string) => {
        if (!data) return []
        return data
            .filter(d => d.concept === concept)
            .sort((a, b) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime()) // sort ascending
            .map(d => ({
                label: d.period_quarter, // e.g. "2024 T3"
                value: d.value
            }))
    }

    const revenueData = prepareData(incomeData, "totalRevenue")
    const netIncomeData = prepareData(incomeData, "netIncome")
    const operatingCashFlowData = prepareData(cashInternalData, "operatingCashflow")


    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FinancialChart
                title="Total Revenue"
                description="Quarterly revenue trend"
                data={revenueData}
            />
            <FinancialChart
                title="Net Income"
                description="Quarterly profit trend"
                data={netIncomeData}
            />
            <FinancialChart
                title="Operating Cash Flow"
                description="Cash generated from operations"
                data={operatingCashFlowData}
            />
        </div>
    )
}
