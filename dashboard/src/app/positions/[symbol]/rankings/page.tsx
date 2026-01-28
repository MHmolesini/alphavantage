
import { AppLayout } from "@/components/layout/app-layout"
import { RankingsDashboard } from "@/components/rankings/rankings-dashboard"

interface RankingsPageProps {
    params: Promise<{
        symbol: string
    }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function RankingsPage(props: RankingsPageProps) {
    const params = await props.params
    const searchParams = await props.searchParams
    const { symbol } = params

    // Parse rolling period from query string, default to 1
    const rolling = searchParams.rolling ? parseInt(searchParams.rolling as string) : 1

    return (
        <AppLayout>
            <RankingsDashboard
                symbol={symbol}
                currentRolling={rolling}
            />
        </AppLayout>
    )
}
