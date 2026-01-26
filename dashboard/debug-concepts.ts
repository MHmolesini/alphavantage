import bigquery from "./src/lib/bigquery"

async function checkConcepts() {
    try {
        const query = `
        SELECT base, concept, COUNT(*) as count
        FROM \`development.base\`
        WHERE symbol = 'AAPL' 
          AND base IN ('profitability', 'indebtedness')
        GROUP BY base, concept
        ORDER BY base, count DESC
    `
        const [rows] = await bigquery.query({ query })
        console.log("Available Concepts:", rows)
    } catch (error) {
        console.error("Error:", error)
    }
}

checkConcepts()
