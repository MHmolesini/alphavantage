import { cn } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

interface MinimalMetricProps {
    label: string
    value: number | string | null | undefined
    unit?: string
    change?: number | null // The calculated change
    changeType?: "percent" | "point" // format as % or just value
    className?: string
}

export function MinimalMetric({ label, value, unit = "", change, changeType = "percent", className }: MinimalMetricProps) {
    const formattedValue = typeof value === 'number'
        ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
        : value || '-'

    let TrendIcon = Minus
    let trendColor = "text-muted-foreground"
    let sign = ""

    if (change !== undefined && change !== null) {
        if (change > 0) {
            TrendIcon = ArrowUpRight
            trendColor = "text-green-500"
            sign = "+"
        } else if (change < 0) {
            TrendIcon = ArrowDownRight
            trendColor = "text-red-500"
            sign = ""
        }
    }

    // Format the change text
    const formattedChange = change !== undefined && change !== null
        ? `${sign}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(change)}${changeType === 'percent' ? '%' : ''}`
        : null


    return (
        <div className={cn("flex flex-col space-y-1 py-3", className)}>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">{label}</span>
            <div className="flex items-end space-x-2">
                <span className="text-2xl font-light tracking-tight text-foreground leading-none">{formattedValue}<span className="text-sm text-muted-foreground ml-1">{unit}</span></span>

                {formattedChange && (
                    <div className={cn("flex items-center text-xs font-medium mb-[2px]", trendColor)}>
                        <TrendIcon className="h-3 w-3 mr-0.5" />
                        {formattedChange}
                    </div>
                )}
            </div>
        </div>
    )
}
