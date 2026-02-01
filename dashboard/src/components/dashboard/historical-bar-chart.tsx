"use client"

import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'
import { useMediaQuery } from "@/hooks/use-media-query"

interface HistoricalBarChartProps {
    data: any[]
    concept: string
    base: string
}

export function HistoricalBarChart({ data, concept, base }: HistoricalBarChartProps) {
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

        // Sort by date ascending
        const sortedData = [...data].sort((a, b) =>
            a.fiscalDateEnding.localeCompare(b.fiscalDateEnding)
        )

        // Filter for specific concept if data contains mix (though usually passed filtered)
        // Assuming data is already filtered for the specific concept

        const dates = sortedData.map(d => d.period_quarter)
        const values = sortedData.map(d => d.value)

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
                valueFormatter: (value: number) => {
                    if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`
                    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`
                    if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(2)}K`
                    return value.toLocaleString()
                }
            },
            grid: {
                left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    color: isDark ? '#71717a' : '#a1a1aa',
                    fontSize: 10,
                    interval: isMobile ? 'auto' : 0,
                    rotate: isMobile ? 45 : 0
                }
            },
            yAxis: {
                type: 'value',
                splitLine: {
                    show: true,
                    lineStyle: { color: isDark ? '#27272a' : '#f4f4f5', type: 'dashed' }
                },
                axisLabel: {
                    color: isDark ? '#71717a' : '#a1a1aa',
                    fontSize: 10,
                    formatter: (value: number) => {
                        if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(0)}B`
                        if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(0)}M`
                        if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(0)}K`
                        return value.toString()
                    }
                }
            },
            series: [
                {
                    name: concept,
                    type: 'bar',
                    data: values,
                    itemStyle: {
                        borderRadius: [4, 4, 0, 0],
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: '#3b82f6' },
                                { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
                            ]
                        }
                    },
                    barMaxWidth: 40
                }
            ],
            animationEasing: 'elasticOut',
            animationDelayUpdate: (idx: number) => idx * 5
        }
    }, [data, concept, isDark, isMobile])

    return (
        <div className="w-full h-[400px] p-4 bg-muted/20 border border-border/50 rounded-xl relative">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{concept}</h3>
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
