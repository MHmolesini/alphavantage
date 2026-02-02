"use client"

import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'
import { useMediaQuery } from "@/hooks/use-media-query"
import { formatCompactNumber } from "@/lib/utils"

interface MetricSankeyProps {
    data: {
        revenue: number
        costOfRevenue: number
        grossProfit: number
        depreciation?: number
        operatingExpenses?: number
        sga?: number
        rAndD?: number
        incomeTaxExpense?: number
        netIncome?: number
        currency?: string
        previousData?: any
        comparisonMode?: "qoq" | "yoy"
    }
}

export function MetricSankey({ data }: MetricSankeyProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const isMobile = useMediaQuery("(max-width: 768px)")

    // Helper to safely get value from data object by name
    const getValueByName = (data: any, name: string, derived: any): number => {
        switch (name) {
            case 'Total Revenue': return data.revenue
            case 'Cost of Revenue': return data.costOfRevenue
            case 'Gross Profit': return data.grossProfit
            case 'Depreciation & Amort': return data.depreciation || 0
            case 'Other Costs': return derived.otherCosts
            case 'Operating Expenses': return data.operatingExpenses || 0
            case 'Operating Income': return derived.operatingIncome
            case 'SG&A': return data.sga || 0
            case 'R&D': return data.rAndD || 0
            case 'Other OpEx': return derived.otherOpEx
            case 'Income Tax': return data.incomeTaxExpense || 0
            case 'Net Income': return data.netIncome || 0
            case 'Interest & Other': return derived.otherExpense
            case 'Other Income': return derived.otherIncome
            default: return 0
        }
    }

    const option = useMemo(() => {
        if (!data || !data.revenue) return {}

        const {
            revenue,
            costOfRevenue,
            grossProfit,
            depreciation = 0,
            operatingExpenses = 0,
            sga = 0,
            rAndD = 0,
            incomeTaxExpense = 0,
            netIncome = 0,
            currency,
            previousData, // Destructure previousData
            comparisonMode = 'qoq' // Default to qoq
        } = data

        // --- Logic (Current) ---
        // 1. Cost of Revenue Breakdown
        const otherCosts = Math.max(0, costOfRevenue - depreciation)
        const hasDepreciation = depreciation > 0

        // 2. Gross Profit Breakdown
        const hasOpEx = operatingExpenses > 0
        // Operating Income is what remains of Gross Profit after paying Operating Expenses
        const operatingIncome = Math.max(0, grossProfit - operatingExpenses)

        // 3. Operating Expenses Breakdown
        // Other OpEx = OpEx - (SG&A + R&D)
        const otherOpEx = Math.max(0, operatingExpenses - (sga + rAndD))
        const hasSubOpEx = sga > 0 || rAndD > 0

        // 4. Operating Income Breakdown (Tax + Net Income + Interest/Other)
        const hasNetIncomeFlow = netIncome !== 0 || incomeTaxExpense !== 0

        // Calculate the gap between Operating Income and (Net Income + Tax)
        // If OpIncome > (Net + Tax), the difference is likely Interest Expense or Other Non-Op Expense.
        // If OpIncome < (Net + Tax), the difference is likely Other Non-Op Income.
        const opIncomeGap = operatingIncome - (netIncome + incomeTaxExpense)

        const hasOtherExpense = opIncomeGap > 0
        const otherExpense = hasOtherExpense ? opIncomeGap : 0

        const hasOtherIncome = opIncomeGap < 0
        const otherIncome = hasOtherIncome ? Math.abs(opIncomeGap) : 0

        const derivedCurrent = { otherCosts, operatingIncome, otherOpEx, otherExpense, otherIncome }

        // --- Logic (Previous) for Growth Calc ---
        let derivedPrev: any = {}
        if (previousData) {
            const prevOtherCosts = Math.max(0, previousData.costOfRevenue - (previousData.depreciation || 0))
            const prevOperatingIncome = Math.max(0, previousData.grossProfit - (previousData.operatingExpenses || 0))
            const prevOtherOpEx = Math.max(0, (previousData.operatingExpenses || 0) - ((previousData.sga || 0) + (previousData.rAndD || 0)))

            const prevOpIncomeGap = prevOperatingIncome - ((previousData.netIncome || 0) + (previousData.incomeTaxExpense || 0))
            const prevOtherExpense = prevOpIncomeGap > 0 ? prevOpIncomeGap : 0
            const prevOtherIncome = prevOpIncomeGap < 0 ? Math.abs(prevOpIncomeGap) : 0

            derivedPrev = {
                otherCosts: prevOtherCosts,
                operatingIncome: prevOperatingIncome,
                otherOpEx: prevOtherOpEx,
                otherExpense: prevOtherExpense,
                otherIncome: prevOtherIncome
            }
        }

        // Nodes
        const nodes = [
            { name: 'Total Revenue', itemStyle: { color: isDark ? '#3b82f6' : '#2563eb' } }, // Blue
            { name: 'Cost of Revenue', itemStyle: { color: isDark ? '#ef4444' : '#dc2626' } }, // Red
            { name: 'Gross Profit', itemStyle: { color: isDark ? '#22c55e' : '#16a34a' } } // Green
        ]

        if (hasDepreciation) {
            nodes.push(
                { name: 'Depreciation & Amort', itemStyle: { color: isDark ? '#ef4444' : '#ef4444' } }, // Light Red
                { name: 'Other Costs', itemStyle: { color: isDark ? '#ef4444' : '#ef4444' } } // Dark Red
            )
        }

        if (hasOpEx) {
            nodes.push(
                { name: 'Operating Expenses', itemStyle: { color: isDark ? '#ef4444' : '#ef4444' } }, // Red
                { name: 'Operating Income', itemStyle: { color: isDark ? '#22c55e' : '#22c55e' } } // Green
            )
        }

        if (hasSubOpEx) {
            if (sga > 0) nodes.push({ name: 'SG&A', itemStyle: { color: isDark ? '#ef4444' : '#ef4444' } }) // Light Red
            if (rAndD > 0) nodes.push({ name: 'R&D', itemStyle: { color: isDark ? '#ef4444' : '#ef4444' } }) // Lighter Red
            if (otherOpEx > 0) nodes.push({ name: 'Other OpEx', itemStyle: { color: isDark ? '#ef4444' : '#ef4444' } }) // Dark Red
        }

        if (hasNetIncomeFlow) {
            // Destinations
            if (incomeTaxExpense > 0) nodes.push({ name: 'Income Tax', itemStyle: { color: isDark ? '#ef4444' : '#ef4444' } }) // Red
            if (netIncome > 0) nodes.push({ name: 'Net Income', itemStyle: { color: isDark ? '#22c55e' : '#22c55e' } }) // Lime Green

            // Gap Fillers
            if (hasOtherExpense) nodes.push({ name: 'Interest & Other', itemStyle: { color: isDark ? '#ef4444' : '#ef4444' } }) // Dark Red
            if (hasOtherIncome) nodes.push({ name: 'Other Income', depth: 2, itemStyle: { color: isDark ? '#22c55e' : '#22c55e' } }) // Green (Depth 2 aligned with Op Income)
        }

        // Links
        const links = [
            {
                source: 'Total Revenue',
                target: 'Cost of Revenue',
                value: costOfRevenue,
                lineStyle: { color: 'target', opacity: 0.4 } // Red (Target)
            },
            {
                source: 'Total Revenue',
                target: 'Gross Profit',
                value: grossProfit,
                lineStyle: { color: 'target', opacity: 0.4 } // Green (Target)
            }
        ]

        if (hasDepreciation) {
            links.push(
                {
                    source: 'Cost of Revenue',
                    target: 'Depreciation & Amort',
                    value: depreciation,
                    lineStyle: { color: 'target', opacity: 0.4 } // Red
                },
                {
                    source: 'Cost of Revenue',
                    target: 'Other Costs',
                    value: otherCosts,
                    lineStyle: { color: 'target', opacity: 0.4 } // Red
                }
            )
        }

        if (hasOpEx) {
            links.push(
                {
                    source: 'Gross Profit',
                    target: 'Operating Expenses',
                    value: operatingExpenses,
                    lineStyle: { color: 'target', opacity: 0.4 } // Red
                },
                {
                    source: 'Gross Profit',
                    target: 'Operating Income',
                    value: operatingIncome,
                    lineStyle: { color: 'source', opacity: 0.4 } // Green
                }
            )
        }

        if (hasSubOpEx) {
            if (sga > 0) links.push({ source: 'Operating Expenses', target: 'SG&A', value: sga, lineStyle: { color: 'target', opacity: 0.4 } })
            if (rAndD > 0) links.push({ source: 'Operating Expenses', target: 'R&D', value: rAndD, lineStyle: { color: 'target', opacity: 0.4 } })
            if (otherOpEx > 0) links.push({ source: 'Operating Expenses', target: 'Other OpEx', value: otherOpEx, lineStyle: { color: 'target', opacity: 0.4 } })
        }

        if (hasNetIncomeFlow) {
            // Calculate the actual flows from Operating Income to ensure balance
            let remainingOperatingIncome = operatingIncome;

            // 1. Flow to Income Tax
            if (incomeTaxExpense > 0) {
                const flowToTax = Math.min(remainingOperatingIncome, incomeTaxExpense);
                if (flowToTax > 0) {
                    links.push({
                        source: 'Operating Income',
                        target: 'Income Tax',
                        value: flowToTax,
                        lineStyle: { color: 'target', opacity: 0.4 } // Red!
                    });
                    remainingOperatingIncome -= flowToTax;
                }
            }

            // 2. Flow to Interest & Other (if hasOtherExpense)
            if (hasOtherExpense && otherExpense > 0) {
                const flowToOtherExpense = Math.min(remainingOperatingIncome, otherExpense);
                if (flowToOtherExpense > 0) {
                    links.push({
                        source: 'Operating Income',
                        target: 'Interest & Other',
                        value: flowToOtherExpense,
                        lineStyle: { color: 'target', opacity: 0.4 } // Red
                    });
                    remainingOperatingIncome -= flowToOtherExpense;
                }
            }

            // 3. Flow to Net Income from Operating Income
            if (netIncome > 0) {
                const flowOpToNet = Math.min(remainingOperatingIncome, netIncome);
                if (flowOpToNet > 0) {
                    links.push({
                        source: 'Operating Income',
                        target: 'Net Income',
                        value: flowOpToNet,
                        lineStyle: { color: 'gradient', opacity: 0.4 } // Green -> Green
                    });
                }

                // 4. Flow to Net Income from Other Income (if hasOtherIncome)
                if (hasOtherIncome && otherIncome > 0) {
                    const remainingNetNeeded = netIncome - flowOpToNet;
                    if (remainingNetNeeded > 0) {
                        links.push({
                            source: 'Other Income',
                            target: 'Net Income',
                            value: remainingNetNeeded,
                            lineStyle: { color: 'gradient', opacity: 0.4 }
                        });
                    }
                }
            }
        }

        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: isDark ? '#27272a' : '#f4f4f5',
                borderColor: isDark ? '#3f3f46' : '#e4e4e7',
                textStyle: { color: isDark ? '#fafafa' : '#18181b', fontSize: 12 },
                formatter: (params: any) => {
                    const val = params.value
                    const formatted = formatCompactNumber(val)

                    if (params.dataType === 'edge') {
                        return `<b>${params.data.source}</b> → <b>${params.data.target}</b><br/>${formatted} ${currency || ''}`
                    }

                    // Node Logic
                    if (params.dataType === 'node') {
                        const name = params.name

                        // % of Revenue
                        const pctOfRev = revenue ? (val / revenue) * 100 : 0
                        const pctString = pctOfRev.toFixed(1) + '%'

                        // Growth
                        let growthStr = ''
                        if (previousData) {
                            const prevVal = getValueByName(previousData, name, derivedPrev)
                            if (prevVal) {
                                const growth = ((val - prevVal) / prevVal) * 100
                                const color = growth >= 0 ? '#22c55e' : '#ef4444' // Green/Red
                                const sign = growth >= 0 ? '+' : ''
                                const label = comparisonMode === 'yoy' ? 'vs Last Year' : 'vs Last Qtr'
                                growthStr = `<br/><span style="color:${color}; font-size: 11px;">${sign}${growth.toFixed(1)}% ${label}</span>`
                            }
                        }

                        return `
                            <div style="min-width: 120px;">
                                <div style="font-weight: bold; margin-bottom: 2px;">${name}</div>
                                <div style="font-size: 14px;">${formatted} ${currency || ''}</div>
                                <div style="font-size: 11px; opacity: 0.7; margin-top: 1px;">${pctString} of Revenue</div>
                                ${growthStr}
                            </div>
                        `
                    }
                    return ''
                }
            },
            series: [
                {
                    type: 'sankey',
                    emphasis: { focus: 'adjacency' },
                    nodeAlign: 'left',
                    data: nodes,
                    links: links,
                    lineStyle: {
                        color: 'gradient',
                        curveness: 0.5
                    },
                    label: {
                        color: isDark ? '#a1a1aa' : '#71717a',
                        fontSize: 12,
                        formatter: '{b}'
                    },
                    itemStyle: {
                        borderWidth: 0
                    },
                    breadcrumb: { show: false }, // Typically for treemap, but just in case
                    top: '10%',
                    bottom: '10%',
                    left: '5%',
                    right: '5%'
                }
            ]
        }
    }, [data, isDark])

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Revenue Flow
                </h3>
            </div>

            <div className="w-full h-[500px] bg-muted/20 border border-border/50 rounded-xl p-4 relative">
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    theme={isDark ? 'dark' : 'light'}
                    notMerge={true}
                />
            </div>
        </div>
    )
}
