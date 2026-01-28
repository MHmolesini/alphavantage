
import bigquery from "./src/lib/bigquery"

async function checkNonZero() {
    const query = `
    SELECT symbol, base, period_quarter, concept, ranking, report_type
    FROM \`development.base\`
    WHERE symbol = 'AAPL'
      AND ranking > 0
    LIMIT 10
  `
    try {
        const [rows] = await bigquery.query({ query })
        if (rows.length === 0) {
            console.log("No rows found with ranking > 0 for AAPL")
        } else {
            console.log("Found non-zero ranking data for AAPL:", rows)
        }
    } catch (error) {
        console.error("Error:", error)
    }
}

checkNonZero()
