"use client"

import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'
import { Settings2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface FinancialsChartProps {
    data: any[]
    selectedConcepts: string[]
    variationType?: "none" | "qoq" | "yoy"
}

export function FinancialsChart({ data, selectedConcepts, variationType = 'none' }: FinancialsChartProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    // Chart Configuration State
    const [config, setConfig] = useState({
        showAvg: true,
        showMin: false,
        showMax: false,
        showMedian: false,
        showStdDev: false,
        showTrendline: false,
        movingAverage: 0 // 0 = queries disabled
    })

    // Generate stable color based on string
    const stringToColorIndex = (str: string) => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash)
        }
        return Math.abs(hash)
    }

    // Helper: Standard Deviation
    const calculateStdDev = (values: number[]) => {
        const validValues = values.filter(v => v !== null && v !== undefined)
        if (validValues.length === 0) return { mean: 0, stdDev: 0 }
        const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length
        const variance = validValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validValues.length
        return { mean, stdDev: Math.sqrt(variance) }
    }

    // Helper: Linear Regression (Trendline)
    const calculateTrendline = (values: number[]) => {
        const points = values.map((y, x) => ({ x, y })).filter(p => p.y !== null && p.y !== undefined)
        if (points.length < 2) return []

        const n = points.length
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
        points.forEach(p => {
            sumX += p.x
            sumY += p.y
            sumXY += p.x * p.y
            sumXX += p.x * p.x
        })

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n

        // Return points matching original array length (nulls filled with trend value or skip?)
        // Better to plot trend across the whole X axis
        return values.map((_, x) => slope * x + intercept)
    }

    // Calculate Moving Average
    const calculateMA = (dataPoints: number[], period: number) => {
        const result = []
        for (let i = 0; i < dataPoints.length; i++) {
            if (i < period - 1) {
                result.push(null)
                continue
            }
            let sum = 0
            for (let j = 0; j < period; j++) {
                sum += dataPoints[i - j]
            }
            result.push(sum / period)
        }
        return result
    }

    const option = useMemo(() => {
        if (!data || data.length === 0 || selectedConcepts.length === 0) {
            return {
                title: {
                    text: 'Select concepts to visualize',
                    left: 'center',
                    top: 'center',
                    textStyle: {
                        color: isDark ? '#a1a1aa' : '#71717a',
                        fontWeight: 'lighter',
                        fontSize: 14
                    }
                }
            }
        }

        const periods = data.map(d => d.period)

        // curated qualitative colors for financial lines
        const colors = [
            ['#10b981', 'rgba(16, 185, 129, 0.1)'], // Emerald
            ['#3b82f6', 'rgba(59, 130, 246, 0.1)'], // Blue
            ['#f43f5e', 'rgba(244, 63, 94, 0.1)'],  // Rose
            ['#eab308', 'rgba(234, 179, 8, 0.1)'],  // Yellow
            ['#8b5cf6', 'rgba(139, 92, 246, 0.1)'], // Violet
            ['#06b6d4', 'rgba(6, 182, 212, 0.1)'],  // Cyan
            ['#f97316', 'rgba(249, 115, 22, 0.1)'], // Orange
            ['#6366f1', 'rgba(99, 102, 241, 0.1)'], // Indigo
            ['#84cc16', 'rgba(132, 204, 22, 0.1)'], // Lime
            ['#d946ef', 'rgba(217, 70, 239, 0.1)'], // Fuchsia
        ]


        const series = [] as any[]

        selectedConcepts.forEach((concept, index) => {
            // Use deterministic color based on concept name
            const colorIndex = stringToColorIndex(concept) % colors.length
            const colorSet = colors[colorIndex]

            const conceptData = data.map(d => d[concept])

            // Calculate stats
            const { mean, stdDev } = calculateStdDev(conceptData)

            // Build MarkLines
            const markLineData = []
            if (config.showAvg) markLineData.push({ type: 'average', name: 'Avg' })
            if (config.showMin) markLineData.push({ type: 'min', name: 'Min' })
            if (config.showMax) markLineData.push({ type: 'max', name: 'Max' })
            if (config.showMedian) markLineData.push({ type: 'median', name: 'Median' })

            if (config.showStdDev && stdDev > 0) {
                markLineData.push({
                    yAxis: mean + stdDev,
                    name: '+1σ',
                    label: { formatter: '+1σ', position: 'end' },
                    lineStyle: { type: 'dashed', opacity: 0.4 }
                })
                markLineData.push({
                    yAxis: mean - stdDev,
                    name: '-1σ',
                    label: { formatter: '-1σ', position: 'end' },
                    lineStyle: { type: 'dashed', opacity: 0.4 }
                })
            }

            series.push({
                name: concept,
                type: 'bar',
                barMaxWidth: 12,
                itemStyle: {
                    borderRadius: [4, 4, 0, 0],
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: colorSet[0] }, // Full color at top
                            { offset: 1, color: colorSet[1] }  // Faded color at bottom
                        ]
                    }
                },
                data: conceptData,
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: colorSet[0]
                    }
                },
                animationDelay: (idx: number) => idx * 10 + index * 100,
                markLine: markLineData.length > 0 ? {
                    data: markLineData,
                    symbol: ['none', 'none'],
                    lineStyle: {
                        color: colorSet[0],
                        type: 'dashed',
                        opacity: 0.6,
                        width: 1
                    },
                    label: {
                        show: false,
                    },
                    silent: false
                } : undefined
            })

            // Trendline Series
            if (config.showTrendline) {
                const trendData = calculateTrendline(conceptData)
                series.push({
                    name: `${concept} Trend`,
                    type: 'line',
                    data: trendData,
                    smooth: false,
                    showSymbol: false,
                    itemStyle: {
                        color: colorSet[0] // Correct Legend/Tooltip color
                    },
                    lineStyle: {
                        color: colorSet[0],
                        width: 1,
                        type: 'dashed',
                        opacity: 0.5
                    },
                    tooltip: { show: false }, // Hide from tooltip to avoid clutter
                    z: 5
                })
            }

            // Moving Average Series
            if (config.movingAverage > 1) {
                const maData = calculateMA(conceptData, config.movingAverage)
                series.push({
                    name: `${concept} MA(${config.movingAverage})`,
                    type: 'line',
                    data: maData,
                    smooth: true,
                    showSymbol: false,
                    itemStyle: {
                        color: colorSet[0] // Correct Legend/Tooltip color
                    },
                    lineStyle: {
                        color: colorSet[0], // Same color as bar
                        width: 2,
                        type: 'solid',
                        opacity: 0.8
                    },
                    tooltip: {
                        valueFormatter: (value: number) => value?.toFixed(2)
                    },
                    z: 10 // Above bars
                })
            }

            // Variation Series using Secondary Y-Axis
            if (variationType && variationType !== 'none') {
                const variationData = data.map(d => d[`${concept}_variation`])
                series.push({
                    name: `${concept} (${variationType.toUpperCase()})`,
                    type: 'line',
                    yAxisIndex: 1, // Use secondary axis
                    data: variationData,
                    smooth: true,
                    symbol: 'circle', // Circles as requested
                    symbolSize: 6,
                    itemStyle: {
                        color: colorSet[0],
                        borderColor: isDark ? '#18181b' : '#ffffff',
                        borderWidth: 1.5
                    },
                    lineStyle: {
                        color: colorSet[0],
                        width: 2,
                        type: 'dashed' // Dashed to differentiate from main values
                    },
                    tooltip: {
                        valueFormatter: (value: number) => value ? `${value.toFixed(1)}%` : 'N/A'
                    },
                    z: 20
                })
            }
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
                valueFormatter: (value: number) => value?.toFixed(2), // Format tooltip values
                axisPointer: {
                    type: 'shadow',
                    shadowStyle: {
                        color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            legend: {
                data: selectedConcepts.concat(
                    config.movingAverage > 1 ? selectedConcepts.map(c => `${c} MA(${config.movingAverage})`) : [],
                    (variationType && variationType !== 'none') ? selectedConcepts.map(c => `${c} (${variationType.toUpperCase()})`) : []
                ),
                bottom: 0,
                textStyle: {
                    color: isDark ? '#a1a1aa' : '#71717a'
                },
                itemWidth: 12,
                itemHeight: 12,
                icon: 'roundRect'
            },
            grid: {
                left: '2%',
                right: '4%',
                bottom: '10%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: true, // Bars need gap
                data: periods,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    color: isDark ? '#71717a' : '#a1a1aa',
                    fontSize: 10,
                    margin: 15
                }
            },
            yAxis: [
                // Primary Axis (Values)
                {
                    type: 'value',
                    splitLine: {
                        show: true,
                        lineStyle: {
                            color: isDark ? '#27272a' : '#f4f4f5',
                            type: 'dashed'
                        }
                    },
                    axisLabel: {
                        color: isDark ? '#71717a' : '#a1a1aa',
                        fontSize: 10,
                        formatter: (value: number) => {
                            return new Intl.NumberFormat('en-US', {
                                notation: "compact",
                                compactDisplay: "short"
                            }).format(value)
                        }
                    }
                },
                // Secondary Axis (Variation %)
                {
                    type: 'value',
                    show: (variationType && variationType !== 'none'),
                    splitLine: { show: false },
                    axisLabel: {
                        color: isDark ? '#71717a' : '#a1a1aa',
                        fontSize: 10,
                        formatter: '{value}%'
                    }
                }
            ],
            series: series,
            animationDelayUpdate: (idx: number) => idx * 5
        }
    }, [data, selectedConcepts, isDark, config, variationType])

    return (
        <div className="space-y-4">
            <div className="flex justify-end pr-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 gap-2 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer border-0">
                            <Settings2 className="h-4 w-4" />
                            <span className="text-xs">Overlay Options</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-4 bg-muted/95 backdrop-blur-sm border-white/5 shadow-2xl" align="end">
                        <div className="grid gap-4">
                            <h4 className="font-medium leading-none text-sm text-muted-foreground flex items-center gap-2">
                                <Filter className="h-3 w-3" /> Reference Lines
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center space-x-2 text-sm cursor-pointer group hover:text-foreground transition-colors text-muted-foreground">
                                    <input type="checkbox" className="rounded border-white/10 bg-black/20 text-primary focus:ring-0 focus:ring-offset-0 accent-primary cursor-pointer"
                                        checked={config.showAvg}
                                        onChange={(e) => setConfig(prev => ({ ...prev, showAvg: e.target.checked }))} />
                                    <span>Average</span>
                                </label>
                                <label className="flex items-center space-x-2 text-sm cursor-pointer group hover:text-foreground transition-colors text-muted-foreground">
                                    <input type="checkbox" className="rounded border-white/10 bg-black/20 text-primary focus:ring-0 focus:ring-offset-0 accent-primary cursor-pointer"
                                        checked={config.showMedian}
                                        onChange={(e) => setConfig(prev => ({ ...prev, showMedian: e.target.checked }))} />
                                    <span>Median</span>
                                </label>
                                <label className="flex items-center space-x-2 text-sm cursor-pointer group hover:text-foreground transition-colors text-muted-foreground">
                                    <input type="checkbox" className="rounded border-white/10 bg-black/20 text-primary focus:ring-0 focus:ring-offset-0 accent-primary cursor-pointer"
                                        checked={config.showMin}
                                        onChange={(e) => setConfig(prev => ({ ...prev, showMin: e.target.checked }))} />
                                    <span>Minimum</span>
                                </label>
                                <label className="flex items-center space-x-2 text-sm cursor-pointer group hover:text-foreground transition-colors text-muted-foreground">
                                    <input type="checkbox" className="rounded border-white/10 bg-black/20 text-primary focus:ring-0 focus:ring-offset-0 accent-primary cursor-pointer"
                                        checked={config.showMax}
                                        onChange={(e) => setConfig(prev => ({ ...prev, showMax: e.target.checked }))} />
                                    <span>Maximum</span>
                                </label>
                                <label className="flex items-center space-x-2 text-sm cursor-pointer group hover:text-foreground transition-colors text-muted-foreground">
                                    <input type="checkbox" className="rounded border-white/10 bg-black/20 text-primary focus:ring-0 focus:ring-offset-0 accent-primary cursor-pointer"
                                        checked={config.showStdDev}
                                        onChange={(e) => setConfig(prev => ({ ...prev, showStdDev: e.target.checked }))} />
                                    <span>Std Dev (±1σ)</span>
                                </label>
                                <label className="flex items-center space-x-2 text-sm cursor-pointer group hover:text-foreground transition-colors text-muted-foreground">
                                    <input type="checkbox" className="rounded border-white/10 bg-black/20 text-primary focus:ring-0 focus:ring-offset-0 accent-primary cursor-pointer"
                                        checked={config.showTrendline}
                                        onChange={(e) => setConfig(prev => ({ ...prev, showTrendline: e.target.checked }))} />
                                    <span>Trendline</span>
                                </label>
                            </div>

                            <div className="h-px bg-border/50" />

                            <div className="space-y-3">
                                <h4 className="font-medium leading-none text-sm text-muted-foreground">Moving Average</h4>
                                <div className="flex items-center justify-between gap-4">
                                    <label className="flex items-center space-x-2 text-sm cursor-pointer whitespace-nowrap">
                                        <input type="checkbox" className="rounded border-input text-primary focus:ring-1 focus:ring-primary/20 accent-primary"
                                            checked={config.movingAverage > 0}
                                            onChange={(e) => setConfig(prev => ({ ...prev, movingAverage: e.target.checked ? 4 : 0 }))}
                                        />
                                        <span>Enabled</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="2"
                                            max="20"
                                            className="h-7 w-16 text-xs text-center"
                                            value={config.movingAverage || ''}
                                            disabled={!config.movingAverage}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value)
                                                if (config.movingAverage > 0) {
                                                    setConfig(prev => ({ ...prev, movingAverage: isNaN(val) ? 2 : val }))
                                                }
                                            }}
                                        />
                                        <span className="text-xs text-muted-foreground">Periods</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="w-full h-[300px] sm:h-[400px] p-4 bg-muted/20 border border-border/50 rounded-xl relative group">
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
