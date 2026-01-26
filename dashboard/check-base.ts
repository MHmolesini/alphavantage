import { BigQuery } from "@google-cloud/bigquery"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const bigquery = new BigQuery()

async function checkBaseTypes() {
    try {
        const query = `
        SELECT DISTINCT base 
        FROM \`development.base\`
        LIMIT 100
    `
        const [rows] = await bigquery.query({ query })
        console.log("Distinct base types:", rows.map(r => r.base))
    } catch (error) {
        console.error("Error:", error)
    }
}

checkBaseTypes()
