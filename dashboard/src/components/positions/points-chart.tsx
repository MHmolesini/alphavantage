"use client"

import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'

interface PointsChartProps {
    data: any[]
    selectedConcepts: string[]
}

export function PointsChart({ data, selectedConcepts }: PointsChartProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    // Generate stable color based on string
    const stringToColorIndex = (str: string) => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash)
        }
        return Math.abs(hash)
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

        const series: any[] = []

        selectedConcepts.forEach((concept, index) => {
            const colorIndex = stringToColorIndex(concept) % colors.length
            const colorSet = colors[colorIndex]

            // Bar Series for Points (Left Axis)
            series.push({
                name: `${concept}`,
                type: 'bar',
                barMaxWidth: 12,
                yAxisIndex: 0, // Left Axis
                itemStyle: {
                    borderRadius: [4, 4, 0, 0],
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: colorSet[0] }, // Full color
                            { offset: 1, color: colorSet[1] }  // Faded
                        ]
                    }
                },
                data: data.map(d => d[`${concept}_points`]),
                tooltip: {
                    valueFormatter: (value: number) => value ? `${value} pts` : ''
                },
                animationDelay: (idx: number) => idx * 10 + index * 100
            })

            // Line Series for Rank (Right Axis)
            series.push({
                name: `${concept} (Rank)`,
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                yAxisIndex: 1, // Right Axis
                lineStyle: {
                    width: 2,
                    color: colorSet[0], // Solid color matching the bar
                    opacity: 0.8
                },
                itemStyle: {
                    color: isDark ? '#000' : '#fff', // Hollow center look
                    borderColor: colorSet[0],
                    borderWidth: 2
                },
                data: data.map(d => d[`${concept}_rank`]),
                tooltip: {
                    valueFormatter: (value: number) => value ? `#${value}` : ''
                }
            })
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
                axisPointer: { type: 'cross' }
            },
            legend: {
                data: selectedConcepts.map(c => [`${c}`, `${c} (Rank)`]).flat(), // Show both in legend? Maybe just concept name + implied? Let's show all for clarity or filter.
                // Actually showing duplicate legend items might be cluttered. 
                // Let's try to just show the Concept Name once, but ECharts maps legend to series name.
                // We'll leave it detailed for now or the user can hide one.
                show: false, // Hiding legend to look cleaner as requested "elegante"? Or maybe bottom.
                // Let's keep it visible but maybe simplified manually? No, keeping standard behavior data-binding is safer.
                bottom: 0,
                textStyle: { color: isDark ? '#a1a1aa' : '#71717a' },
                itemWidth: 12, itemHeight: 12
            },
            grid: {
                left: '2%', right: '4%', bottom: '10%', top: '10%', containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: true,
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
                {
                    type: 'value',
                    name: 'Points',
                    position: 'left',
                    splitLine: {
                        show: true,
                        lineStyle: { color: isDark ? '#27272a' : '#f4f4f5', type: 'dashed' }
                    },
                    axisLabel: { color: isDark ? '#71717a' : '#a1a1aa', fontSize: 10 },
                    axisLine: { show: false }
                },
                {
                    type: 'value',
                    name: 'Rank',
                    position: 'right',
                    alignTicks: true,
                    inverse: true, // Rank 1 at top
                    min: 1, // Ranks start at 1
                    splitLine: { show: false }, // Avoid grid mess
                    axisLabel: {
                        color: isDark ? '#71717a' : '#a1a1aa',
                        fontSize: 10,
                        formatter: '#{value}'
                    },
                    axisLine: { show: false }
                }
            ],
            series: series,
            animationEasing: 'elasticOut',
            animationDelayUpdate: (idx: number) => idx * 5
        }
    }, [data, selectedConcepts, isDark])

    return (
        <div className="w-full h-[400px] p-4 bg-muted/20 border border-border/50 rounded-xl">
            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                theme={isDark ? 'dark' : 'light'}
                notMerge={true}
            />
        </div>
    )
}
