"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FinancialsChartProps {
    data: any[]
    selectedConcepts: string[]
}

const colors = [
    "#93c5fd", // blue-300
    "#fdba74", // orange-300
    "#86efac", // green-300
    "#fca5a5", // red-300
    "#d8b4fe", // purple-300
    "#f0abfc", // fuchsia-300
]

export function FinancialsChart({ data, selectedConcepts }: FinancialsChartProps) {
    if (!data || data.length === 0 || selectedConcepts.length === 0) {
        return (
            <Card className="h-[400px] flex items-center justify-center text-muted-foreground border-dashed">
                Select metrics from the table below to visualize them
            </Card>
        )
    }

    // Reorder data to be chronological (oldest to newest) for the chart
    // processData in dashboard already returns periods distinct, but we mapped them.
    // However, chart usually reads left-to-right as old-to-new.
    // The previous code had `const chartPeriods = [...periods].reverse()` in the dashboard.
    // So 'data' coming in here is already reversed (oldest first) if dashboard logic holds.
    // Let's verify dashboard logic: "const chartPeriods = [...periods].reverse()"
    // periods are sorted DESC (newest first). reverse() makes them ASC (oldest first).
    // So data is Old -> New.
    // BarChart renders in order of data array. So Left = Old, Right = New. Correct.

    return (
        <Card className="w-full shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Financial Trends</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                            <XAxis
                                dataKey="period"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => {
                                    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`
                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                                    return value
                                }}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                                labelStyle={{ color: "hsl(var(--foreground))", marginBottom: "0.5rem" }}
                                formatter={(value: any) => {
                                    if (typeof value !== "number") return [value, ""]
                                    if (value >= 1000000000) return [`${(value / 1000000000).toFixed(2)}B`, ""]
                                    if (value >= 1000000) return [`${(value / 1000000).toFixed(2)}M`, ""]
                                    if (value >= 1000) return [`${(value / 1000).toFixed(2)}K`, ""]
                                    return [value, ""] // Fallback for small numbers
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: "20px" }} />
                            {selectedConcepts.map((concept, index) => (
                                <Bar
                                    key={concept}
                                    dataKey={concept}
                                    fill={colors[index % colors.length]}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={60}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
