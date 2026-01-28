
import bigquery from "./src/lib/bigquery"

async function checkIncomeRanking() {
    const query = `
    SELECT symbol, concept, ranking, period_quarter
    FROM \`development.base\`
    WHERE base = 'income_statements'
      AND ranking > 0
    LIMIT 10
  `
    try {
        const [rows] = await bigquery.query({ query })
        if (rows.length === 0) {
            console.log("No rows found with ranking > 0 for base 'income_statements'")
        } else {
            console.log("Found non-zero ranking data for income_statements:", rows)
        }
    } catch (error) {
        console.error("Error:", error)
    }
}

checkIncomeRanking()
