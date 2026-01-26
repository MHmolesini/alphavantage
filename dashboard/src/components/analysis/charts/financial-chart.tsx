"use client"

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ChartData = {
    label: string // e.g., "2024" or "Q3 2024"
    value: number
}

interface FinancialChartProps {
    title: string
    description?: string
    data: ChartData[]
    dataKey?: string
    color?: string
}

export function FinancialChart({
    title,
    description,
    data,
    dataKey = "value",
    color = "#2563eb", // Default blue
}: FinancialChartProps) {

    if (!data || data.length === 0) {
        return (
            <Card className="col-span-1">
                <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
                <CardContent>No data to visualize</CardContent>
            </Card>
        )
    }

    // Calculate compact format for Y axis
    const formatYAxis = (value: number) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(value)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="label"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatYAxis}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        {label}
                                                    </span>
                                                    <span className="font-bold text-muted-foreground">
                                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payload[0].value as number)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Bar
                            dataKey={dataKey}
                            fill={color}
                            radius={[4, 4, 0, 0]}
                            className="fill-primary"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
