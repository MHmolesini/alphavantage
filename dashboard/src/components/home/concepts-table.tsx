import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const concepts = [
    {
        term: "Earnings Per Share (EPS)",
        definition: "Net income divided by the number of outstanding shares of common stock.",
        category: "Profitability",
    },
    {
        term: "Price-to-Earnings (P/E)",
        definition: "The ratio for valuing a company that measures its current share price relative to its per-share earnings.",
        category: "Valuation",
    },
    {
        term: "Return on Equity (ROE)",
        definition: "A measure of financial performance calculated by dividing net income by shareholders' equity.",
        category: "Profitability",
    },
    {
        term: "Debt-to-Equity (D/E)",
        definition: "A ratio used to evaluate a company's financial leverage and is calculated by dividing a company’s total liabilities by its shareholder equity.",
        category: "Leverage",
    },
    {
        term: "Current Ratio",
        definition: "A liquidity ratio that measures a company's ability to pay short-term obligations or those due within one year.",
        category: "Liquidity",
    },
]

export function ConceptsTable() {
    return (
        <div className="rounded-md border">
            <Table>
                <TableCaption>A list of key financial concepts and their definitions.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Term</TableHead>
                        <TableHead>Definition</TableHead>
                        <TableHead className="w-[150px]">Category</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {concepts.map((concept) => (
                        <TableRow key={concept.term}>
                            <TableCell className="font-medium">{concept.term}</TableCell>
                            <TableCell>{concept.definition}</TableCell>
                            <TableCell>{concept.category}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
