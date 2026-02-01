"use client"

import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'
import { useMediaQuery } from "@/hooks/use-media-query"

interface MetricHistogramProps {
    data: any[]
    concept: string
    base: string
    highlightDetails?: {
        value: number
        period: string
        symbol: string
    } | null // Optional explicit details to highlight
}

export function MetricHistogram({ data, concept, base, highlightDetails }: MetricHistogramProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const isMobile = useMediaQuery("(max-width: 768px)")

    const option = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                title: {
                    text: 'No data available',
                    left: 'center',
                    top: 'center',
                    textStyle: { color: isDark ? '#a1a1aa' : '#71717a' }
                }
            }
        }

        // 1. Extract Values and Latest Value
        // Sort by date descending to find latest
        const sortedData = [...data].sort((a, b) => {
            if (a.fiscalDateEnding && b.fiscalDateEnding) {
                return b.fiscalDateEnding.localeCompare(a.fiscalDateEnding)
            }
            return b.period_quarter.localeCompare(a.period_quarter)
        })

        const values = sortedData.map(d => d.value).filter(v => typeof v === 'number' && !isNaN(v))
        if (values.length === 0) return {}

        const latestValue = values[0] // First item is latest due to sort

        // 2. Determine Range
        const min = Math.min(...values)
        const max = Math.max(...values)

        // 3. Binning Strategy
        // If all values are same (variance 0)
        if (min === max) {
            return {
                backgroundColor: 'transparent',
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: [formatAxisValue(min)] },
                yAxis: { type: 'value' },
                series: [{
                    type: 'bar',
                    data: [{
                        value: values.length,
                        itemStyle: { color: '#f59e0b' } // Highlight single bin
                    }],
                    name: 'Count'
                }]
            }
        }

        const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)) * 2) // Heuristic
        const range = max - min
        // Add tiny epsilon to correct floating point issues at edges
        const step = range / binCount

        // Initialize bins
        const bins = new Array(binCount).fill(0)
        const binEdges = new Array(binCount + 1).fill(0).map((_, i) => min + i * step)

        // Count frequencies
        values.forEach(v => {
            let binIndex = Math.floor((v - min) / step)
            if (binIndex >= binCount) binIndex = binCount - 1 // Handle max value
            bins[binIndex]++
        })

        // Calculate Cumulative Percentages
        const totalCount = values.length
        let runningSum = 0
        const cumulativePercentages = bins.map(count => {
            runningSum += count
            return (runningSum / totalCount) * 100
        })

        // Find bin for latest value or explicit highlight
        let targetValue = latestValue
        let isExplicitHighlight = false

        if (highlightDetails) {
            targetValue = highlightDetails.value
            isExplicitHighlight = true
        }

        let latestBinIndex = -1
        if (targetValue !== undefined) {
            latestBinIndex = Math.floor((targetValue - min) / step)
            if (latestBinIndex >= binCount) latestBinIndex = binCount - 1
            if (latestBinIndex < 0) latestBinIndex = -1
            if (targetValue < min) latestBinIndex = 0
        }

        // Format Series Data with styles
        const seriesData = bins.map((count, index) => {
            const isCurrent = index === latestBinIndex
            return {
                value: count,
                itemStyle: isCurrent ? {
                    color: '#f59e0b', // Solid Amber for highlight (No border)
                } : {
                    // Default Premium Gray/Slate
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#71717a' }, // Zinc-500
                            { offset: 1, color: 'rgba(113, 113, 122, 0.3)' }
                        ]
                    }
                }
            }
        })

        // Labels (Ranges)
        const categories = bins.map((_, i) => {
            const start = binEdges[i]
            const end = binEdges[i + 1]
            return `${formatAxisValue(start)} - ${formatAxisValue(end)}`
        })

        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: isDark ? '#27272a' : '#f4f4f5',
                borderColor: isDark ? '#3f3f46' : '#e4e4e7',
                textStyle: {
                    color: isDark ? '#fafafa' : '#18181b',
                    fontSize: 12
                },
                axisPointer: { type: 'shadow' },
                formatter: (params: any[]) => {
                    // params is array because we have multiple series
                    const barParam = params.find((p: any) => p.seriesName === 'Frequency');
                    const lineParam = params.find((p: any) => p.seriesName === 'cumulative');

                    if (!barParam) return '';

                    const isLatestBin = barParam.dataIndex === latestBinIndex
                    const cumValue = lineParam ? lineParam.value.toFixed(1) : '0';

                    let highlightContent = ''
                    if (isLatestBin) {
                        if (isExplicitHighlight && highlightDetails) {
                            highlightContent = `
                                <div class="mt-2 pt-2 border-t border-gray-600/30">
                                    <div class="text-amber-500 font-bold text-xs mb-1">My Account Position</div>
                                    <div class="flex flex-col gap-1 text-[10px]">
                                        <div class="flex justify-between gap-4">
                                             <span class="text-muted-foreground">Account:</span>
                                             <span class="font-medium font-mono">${highlightDetails.symbol}</span>
                                        </div>
                                        <div class="flex justify-between gap-4">
                                             <span class="text-muted-foreground">Quarter:</span>
                                             <span class="font-medium font-mono">${highlightDetails.period}</span>
                                        </div>
                                        <div class="flex justify-between gap-4">
                                             <span class="text-muted-foreground">Value:</span>
                                             <span class="font-bold text-foreground font-mono">${formatAxisValue(highlightDetails.value)}</span>
                                        </div>
                                    </div>
                                </div>
                             `
                        } else {
                            highlightContent = `<div class="text-xs text-amber-500 font-bold mt-1">Current Value Range</div>`
                        }
                    }

                    return `
                        <div class="font-medium mb-1">${barParam.name}</div>
                        <div class="text-xs text-muted-foreground space-y-1">
                            <div class="flex justify-between items-center gap-4">
                                <span>Frequency:</span>
                                <span class="text-foreground font-bold">${barParam.value}</span>
                            </div>
                            <div class="flex justify-between items-center gap-4">
                                <span>Cumulative:</span>
                                <span class="text-blue-500 font-bold">${cumValue}%</span>
                            </div>
                        </div>
                        ${highlightContent}
                    `
                }
            },
            grid: {
                left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true
            },
            xAxis: {
                type: 'category',
                data: categories,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    color: isDark ? '#71717a' : '#a1a1aa',
                    fontSize: 10,
                    interval: 'auto',
                    hideOverlap: true,
                    rotate: 45,
                    formatter: (value: string) => value
                }
            },
            yAxis: [
                {
                    type: 'value',
                    splitLine: {
                        show: true,
                        lineStyle: { color: isDark ? '#27272a' : '#f4f4f5', type: 'dashed' }
                    },
                    axisLabel: {
                        color: isDark ? '#71717a' : '#a1a1aa',
                        fontSize: 10
                    }
                },
                {
                    type: 'value',
                    min: 0,
                    max: 100,
                    splitLine: { show: false },
                    axisLabel: {
                        color: isDark ? '#71717a' : '#a1a1aa',
                        fontSize: 10,
                        formatter: '{value}%'
                    }
                }
            ],
            series: [
                {
                    name: 'Frequency',
                    type: 'bar',
                    data: seriesData,
                    itemStyle: {
                        borderRadius: [4, 4, 0, 0]
                    },
                    barMaxWidth: 90
                },
                {
                    name: 'cumulative',
                    type: 'line',
                    yAxisIndex: 1, // Use secondary axis
                    data: cumulativePercentages,
                    symbol: 'circle',
                    symbolSize: 6,
                    itemStyle: {
                        color: '#3b82f6', // Blue-500
                        borderColor: isDark ? '#000' : '#fff',
                        borderWidth: 2
                    },
                    lineStyle: {
                        width: 2,
                        type: 'dashed'
                    },
                    smooth: true
                }
            ],
            animationEasing: 'elasticOut',
            animationDelayUpdate: (idx: number) => idx * 5
        }
    }, [data, concept, isDark, isMobile, highlightDetails])

    return (
        <div className="w-full h-[400px] p-4 bg-muted/20 border border-border/50 rounded-xl relative">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{concept} Distribution</h3>
            </div>
            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                theme={isDark ? 'dark' : 'light'}
                notMerge={true}
            />
        </div>
    )
}

function formatAxisValue(val: number) {
    if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(2)}B`
    if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(2)}M`
    if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(2)}K`
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 })
}
