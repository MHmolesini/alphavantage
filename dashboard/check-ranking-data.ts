
import bigquery from "./src/lib/bigquery"

async function checkRankingData() {
    const query = `
    SELECT symbol, base, period_quarter, concept, ranking, report_type
    FROM \`development.base\`
    WHERE base = 'income_statements'
      AND concept = 'totalRevenue'
      AND symbol = 'AAPL'
      AND period_quarter IS NOT NULL
    ORDER BY period_quarter DESC
    LIMIT 10
  `
    try {
        const [rows] = await bigquery.query({ query })
        console.log("Ranking Data for AAPL totalRevenue:", rows)
    } catch (error) {
        console.error("Error:", error)
    }
}

checkRankingData()
