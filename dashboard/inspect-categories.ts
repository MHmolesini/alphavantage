import { BigQuery } from "@google-cloud/bigquery"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const bigquery = new BigQuery()

async function inspectCategories() {
    try {
        const query = `
        SELECT base, concept, value, period_quarter
        FROM \`development.base\`
        WHERE base IN ('profitability', 'liquidity', 'indebtedness')
          AND symbol = 'HSY'
        LIMIT 20
    `
        const [rows] = await bigquery.query({ query })
        console.log("Sample Data Categories:", JSON.stringify(rows, null, 2))

        // Also get distinct concepts for each base
        const queryConcepts = `
        SELECT base, concept
        FROM \`development.base\`
        WHERE base IN ('profitability', 'liquidity', 'indebtedness')
        GROUP BY base, concept
        LIMIT 50
    `
        const [rowsConcepts] = await bigquery.query({ query: queryConcepts })
        console.log("Distinct Concepts:", rowsConcepts)

    } catch (error) {
        console.error("Error:", error)
    }
}

inspectCategories()
