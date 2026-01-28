
import bigquery from "./src/lib/bigquery"

async function checkConcepts() {
    const query = `
    SELECT base, concept
    FROM \`development.base\`
    WHERE base IN ('profitability', 'liquidity', 'indebtedness', 'management', 'assessment')
    GROUP BY 1, 2
    ORDER BY 1, 2
  `
    try {
        const [rows] = await bigquery.query({ query })
        const grouped = rows.reduce((acc: any, row: any) => {
            if (!acc[row.base]) acc[row.base] = []
            // Remove suffixes for cleaner list if needed, but let's see raw first
            acc[row.base].push(row.concept)
            return acc
        }, {})

        console.log(JSON.stringify(grouped, null, 2))
    } catch (error) {
        console.error("Error:", error)
    }
}

checkConcepts()
