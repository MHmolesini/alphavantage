
import { AppLayout } from "@/components/layout/app-layout"
import { PointsDashboard } from "@/components/positions/points-dashboard"
import { getSymbolPoints } from "@/app/actions/financials"

interface PointsPageProps {
    params: Promise<{
        symbol: string
    }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PointsPage(props: PointsPageProps) {
    const params = await props.params
    const searchParams = await props.searchParams
    const { symbol } = params

    // Parse rolling period from query string, default to 1
    const rolling = searchParams.rolling ? parseInt(searchParams.rolling as string) : 1

    // Fetch ranking data
    const pointsData = await getSymbolPoints(symbol, rolling)

    return (
        <AppLayout>
            <PointsDashboard
                symbol={symbol}
                pointsData={pointsData}
                currentRolling={rolling}
            />
        </AppLayout>
    )
}
