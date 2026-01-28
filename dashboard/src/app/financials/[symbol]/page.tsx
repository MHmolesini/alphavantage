
import { getFinancials } from "@/app/actions/financials"
import { AppLayout } from "@/components/layout/app-layout"
import { FinancialsDashboard } from "@/components/financials/financials-dashboard"

interface PageProps {
    params: Promise<{ symbol: string }>
}

export default async function FinancialsPage(props: PageProps) {
    const params = await props.params;
    const { symbol } = params

    const [
        income,
        balance,
        cashFlow,
        profitability,
        liquidity,
        indebtedness,
        management,
        assessment
    ] = await Promise.all([
        getFinancials(symbol, "income_statements"),
        getFinancials(symbol, "balance_sheet"),
        getFinancials(symbol, "cash_flow"),
        getFinancials(symbol, "profitability"),
        getFinancials(symbol, "liquidity"),
        getFinancials(symbol, "indebtedness"),
        getFinancials(symbol, "management"),
        getFinancials(symbol, "assessment"),
    ])

    return (
        <AppLayout>
            <FinancialsDashboard
                symbol={symbol}
                income={income}
                balance={balance}
                cashFlow={cashFlow}
                profitability={profitability}
                liquidity={liquidity}
                indebtedness={indebtedness}
                management={management}
                assessment={assessment}
            />
        </AppLayout>
    )
}
