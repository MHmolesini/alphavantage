import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, CreditCard, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function KPICards() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 
        This section is currently hidden/placeholder as we don't have aggregated market data yet.
        Future: Fetch from a 'market_overview' table.
      */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Market Status</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Open</div>
                    <p className="text-xs text-muted-foreground">Market is currently open</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Data Source</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">BigQuery</div>
                    <p className="text-xs text-muted-foreground">Connected to development.base</p>
                </CardContent>
            </Card>
        </div>
    )
}
