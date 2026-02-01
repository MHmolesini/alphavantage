"use client"

import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'
import { useMediaQuery } from "@/hooks/use-media-query"
import { linearRegression, logarithmicRegression, type Point } from '@/lib/regression'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Settings2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricScatterProps {
    data: {
        symbol: string
        x: number
        y: number
        period: string
    }[]
    xName: string
    yName: string
    highlightSymbol?: string
    yScale?: 'log' | 'value'
}

export function MetricScatter({ data, xName, yName, highlightSymbol, yScale = 'value' }: MetricScatterProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const isMobile = useMediaQuery("(max-width: 768px)")

    const [trendlineType, setTrendlineType] = React.useState<'none' | 'linear' | 'log'>('none')

    const option = useMemo(() => {
        if (!data || data.length === 0) return {}

        // --- 1. Data Prep & Trajectory Logic ---
        const symbolGroups: Record<string, typeof data> = {}
        data.forEach(d => {
            if (!symbolGroups[d.symbol]) symbolGroups[d.symbol] = []
            symbolGroups[d.symbol].push(d)
        })

        const highlightTrajectory = highlightSymbol
            ? (symbolGroups[highlightSymbol] || []).sort((a, b) => a.period.localeCompare(b.period))
            : []
        const bgPoints = data.filter(d => d.symbol !== highlightSymbol).map(d => [d.x, d.y, d.symbol, d.period])

        // --- 2. Trendline Calculation ---
        let trendlineData: number[][] = []
        if (trendlineType !== 'none') {
            const points: Point[] = data.map(d => [d.x, d.y])
            const res = trendlineType === 'linear'
                ? linearRegression(points)
                : logarithmicRegression(points)
            trendlineData = res.points
        }

        const series: any[] = []

        // Series 1: Background Scatter (Faint)
        series.push({
            name: 'Market',
            type: 'scatter',
            symbolSize: 6,
            itemStyle: {
                color: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
            },
            data: bgPoints
        })

        // Series 2: Trendline
        if (trendlineType !== 'none' && trendlineData.length > 0) {
            series.push({
                name: 'Trend',
                type: 'line',
                showSymbol: false,
                smooth: true,
                lineStyle: {
                    color: isDark ? '#3b82f6' : '#2563eb',
                    width: 2,
                    type: 'dashed',
                    opacity: 0.7
                },
                data: trendlineData
            })
        }

        // Series 3: Trajectory Line (User History)
        if (highlightTrajectory && highlightTrajectory.length > 1) {
            series.push({
                name: 'Trajectory',
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: {
                    color: '#f59e0b',
                    width: 1,
                    opacity: 0.5
                },
                z: 10,
                data: highlightTrajectory.map(d => [d.x, d.y])
            })
        }

        // Series 4: Trajectory Points (Varying Opacity)
        if (highlightTrajectory && highlightTrajectory.length > 0) {
            const len = highlightTrajectory.length
            const coloredPoints = highlightTrajectory.map((d, i) => {
                const opacity = 0.3 + (0.7 * (i / (len - 1 || 1)))
                return {
                    value: [d.x, d.y, d.symbol, d.period],
                    itemStyle: {
                        color: `rgba(245, 158, 11, ${opacity})`,
                        borderColor: i === len - 1 ? '#fff' : 'transparent',
                        borderWidth: 1,
                        shadowBlur: i === len - 1 ? 10 : 0,
                        shadowColor: '#f59e0b'
                    },
                    symbolSize: i === len - 1 ? 12 : 8
                }
            })
            series.push({
                name: highlightSymbol,
                type: 'scatter',
                z: 11,
                data: coloredPoints
            })
        }

        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: isDark ? '#27272a' : '#f4f4f5',
                borderColor: isDark ? '#3f3f46' : '#e4e4e7',
                textStyle: { color: isDark ? '#fafafa' : '#18181b', fontSize: 12 },
                formatter: (params: any) => {
                    if (params.seriesName === 'Trend') return `${trendlineType === 'linear' ? 'Linear' : 'Log'} Trendline`

                    const d = params.data
                    const values = Array.isArray(d) ? d : d.value
                    if (!values) return ''

                    return `
                        <div class="font-bold mb-1">${values[2] || highlightSymbol}</div>
                        <div class="text-xs text-muted-foreground">
                            <div>${xName}: <span class="text-foreground font-mono">${formatValue(values[0])}</span></div>
                            <div>${yName}: <span class="text-foreground font-mono">${formatValue(values[1])}</span></div>
                            <div class="mt-1 opacity-50 text-[10px]">${values[3] || ''}</div>
                        </div>
                    `
                },
                extraCssText: 'z-index: 50;'
            },
            grid: { left: '10%', right: '10%', bottom: '15%', top: '15%', containLabel: true },
            xAxis: {
                type: 'value',
                name: xName,
                nameLocation: 'middle',
                nameGap: 30,
                splitLine: { show: false },
                axisLabel: {
                    formatter: (val: number) => formatAxisValue(val),
                    color: isDark ? '#71717a' : '#a1a1aa',
                    fontSize: 10
                },
                axisLine: { lineStyle: { color: isDark ? '#3f3f46' : '#e4e4e7' } },
                scale: true
            },
            yAxis: {
                type: yScale,
                name: yName,
                nameLocation: 'middle',
                nameGap: 50,
                splitLine: {
                    show: true,
                    lineStyle: { color: isDark ? '#27272a' : '#f4f4f5', type: 'dashed' }
                },
                axisLabel: {
                    formatter: (val: number) => formatAxisValue(val),
                    color: isDark ? '#71717a' : '#a1a1aa',
                    fontSize: 10
                },
                scale: true,
                logBase: 10
            },
            series
        }
    }, [data, xName, yName, isDark, highlightSymbol, yScale, trendlineType])

    return (
        <div className="w-full flex flex-col gap-4">
            {/* Header: Title & Options Outside */}
            <div className="flex items-center justify-between">
                <div>
                    {/* Can put a title here if I pass it down or extract it,
                         but page.tsx already renders a title above MetricScatter?
                         Wait, page.tsx renders "Correlation Analysis ... Comparing X vs Y".
                         MetricScatter previously rendered a border with a title INSIDE.
                         User wants "Filter outside".
                         If I move filter outside, I should probably keep the chart Frame clean.
                         Or simple: Just render the Options Row here.
                     */}
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2 bg-muted/20 border-border/50 hover:bg-muted/30">
                            <Settings2 className="h-4 w-4" />
                            <span className="text-xs">Overlay Options</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="end">
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-muted-foreground px-2 mb-2">Trendlines</h4>

                                <div
                                    className={cn("flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-muted/50 text-sm", trendlineType === 'none' && "bg-muted/50")}
                                    onClick={() => setTrendlineType('none')}
                                >
                                    <span>None</span>
                                    {trendlineType === 'none' && <Check className="h-4 w-4" />}
                                </div>
                                <div
                                    className={cn("flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-muted/50 text-sm", trendlineType === 'linear' && "bg-muted/50")}
                                    onClick={() => setTrendlineType('linear')}
                                >
                                    <span>Linear</span>
                                    {trendlineType === 'linear' && <Check className="h-4 w-4" />}
                                </div>
                                <div
                                    className={cn("flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-muted/50 text-sm", trendlineType === 'log' && "bg-muted/50")}
                                    onClick={() => setTrendlineType('log')}
                                >
                                    <span>Logarithmic</span>
                                    {trendlineType === 'log' && <Check className="h-4 w-4" />}
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="w-full h-[450px] bg-muted/10 border border-border/30 rounded-xl p-4 relative">
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

function formatValue(val: number) {
    if (val === undefined || val === null) return "-"
    if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(2)}B`
    if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(2)}M`
    if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(2)}K`
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatAxisValue(val: number) {
    if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(0)}B`
    if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(0)}M`
    if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(0)}K`
    return val.toString()
}
