import { BigQuery } from "@google-cloud/bigquery"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const bigquery = new BigQuery()

async function checkAAPLData() {
    try {
        const query = `
        SELECT base, COUNT(*) as count
        FROM \`development.base\`
        WHERE symbol = 'AAPL'
        GROUP BY base
    `
        const [rows] = await bigquery.query({ query })
        console.log("AAPL Data Distribution:", rows)
    } catch (error) {
        console.error("Error:", error)
    }
}

checkAAPLData()
