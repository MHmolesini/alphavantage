
import { AppLayout } from "@/components/layout/app-layout"
import { PointsDashboard } from "@/components/positions/points-dashboard"
import { getSymbolPoints } from "@/app/actions/financials"

interface PointsPageProps {
    params: Promise<{
        symbol: string
    }>
}

export default async function PointsPage(props: PointsPageProps) {
    const params = await props.params
    const { symbol } = params

    // Fetch ranking data
    const pointsData = await getSymbolPoints(symbol)

    return (
        <AppLayout>
            <PointsDashboard
                symbol={symbol}
                pointsData={pointsData}
            />
        </AppLayout>
    )
}
