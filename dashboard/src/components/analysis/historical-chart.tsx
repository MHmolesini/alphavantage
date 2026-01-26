
"use client"

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent } from "@/components/ui/card"

interface HistoricalData {
    period: string
    value: number
}

interface HistoricalChartProps {
    data: HistoricalData[]
    metricName: string
}

export function HistoricalChart({ data, metricName }: HistoricalChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center border rounded-lg bg-muted/10">
                <p className="text-muted-foreground text-sm">Select a metric to view historical data</p>
            </div>
        )
    }

    // Calculate average
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const average = total / data.length

    // Sort data by period (assuming period is in a sortable format like YYYY QX or similar, but let's rely on the order passed or reverse it if needed)
    // The data passed should be sorted chronologically (oldest to newest) for the chart.

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="font-semibold">
                        {new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(payload[0].value)}
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="border shadow-none bg-transparent mt-8">
            <CardContent className="p-0 pt-4">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-medium text-lg">{metricName} <span className="text-muted-foreground font-normal text-sm ml-2">(Last {data.length} Quarters)</span></h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-primary rounded-[1px]"></div>
                            <span>Value</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-0 border-t border-dashed border-foreground/50"></div>
                            <span>Average: {average.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="period"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                minTickGap={30}
                            />
                            <YAxis
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(value)}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <ReferenceLine y={average} stroke="currentColor" strokeDasharray="4 4" strokeOpacity={0.5} />
                            <Bar
                                dataKey="value"
                                fill="currentColor"
                                radius={[2, 2, 0, 0]}
                                className="fill-primary"
                                maxBarSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
