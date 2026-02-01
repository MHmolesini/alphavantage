"use client"

import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'
import { useMediaQuery } from "@/hooks/use-media-query"

interface MetricHistogramProps {
    data: any[]
    concept: string
    base: string
}

export function MetricHistogram({ data, concept, base }: MetricHistogramProps) {
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
            // Assuming period_quarter is like "2023 T4" or "2023-12-31" or similar comparable string
            // Better to use fiscalDateEnding if available for strict sorting
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

        // Find bin for latest value
        let latestBinIndex = Math.floor((latestValue - min) / step)
        if (latestBinIndex >= binCount) latestBinIndex = binCount - 1

        // Format Series Data with styles
        const seriesData = bins.map((count, index) => {
            const isCurrent = index === latestBinIndex
            return {
                value: count,
                itemStyle: isCurrent ? {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#f59e0b' }, // Amber-500 for highlight
                            { offset: 1, color: 'rgba(245, 158, 11, 0.2)' }
                        ]
                    },
                    borderWidth: 2,
                    borderColor: '#f59e0b'
                } : {
                    // Default Blue
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#3b82f6' },
                            { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
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
                    const p = params[0];
                    const isLatestBin = p.dataIndex === latestBinIndex
                    return `
                        <div class="font-medium">${p.name}</div>
                        <div class="text-xs text-muted-foreground mt-1">
                            Count: <span class="text-foreground font-bold">${p.value}</span>
                        </div>
                        ${isLatestBin ? '<div class="text-xs text-amber-500 font-bold mt-1">Current Value Range</div>' : ''}
                    `
                }
            },
            grid: {
                left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true
            },
            xAxis: {
                type: 'category',
                data: categories,
                name: 'Value Range',
                nameLocation: 'middle',
                nameGap: 30,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    color: isDark ? '#71717a' : '#a1a1aa',
                    fontSize: 10,
                    interval: 'auto',
                    hideOverlap: true,
                    rotate: 45,
                    formatter: (value: string) => {
                        const parts = value.split(' - ')
                        // On very small screens, showing just the start might be cleaner,
                        // but with rotation and auto-interval, full range is usually ok.
                        return value
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: 'Frequency',
                splitLine: {
                    show: true,
                    lineStyle: { color: isDark ? '#27272a' : '#f4f4f5', type: 'dashed' }
                },
                axisLabel: {
                    color: isDark ? '#71717a' : '#a1a1aa',
                    fontSize: 10
                }
            },
            series: [
                {
                    name: 'Frequency',
                    type: 'bar',
                    data: seriesData, // Use the styled data objects
                    itemStyle: {
                        borderRadius: [4, 4, 0, 0]
                        // Color is now handled per-item in seriesData
                    },
                    barMaxWidth: 90 // Wider bars for histogram look
                }
            ],
            animationEasing: 'elasticOut',
            animationDelayUpdate: (idx: number) => idx * 5
        }
    }, [data, concept, isDark, isMobile])

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
