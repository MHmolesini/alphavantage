import { BigQuery } from "@google-cloud/bigquery"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const bigquery = new BigQuery()

async function checkSymbol() {
    try {
        const query = `
        SELECT DISTINCT symbol 
        FROM \`development.base\`
        WHERE symbol LIKE 'AAP%' OR symbol LIKE 'aap%'
        LIMIT 10
    `
        const [rows] = await bigquery.query({ query })
        console.log("Symbols found:", rows)
    } catch (error) {
        console.error("Error:", error)
    }
}

checkSymbol()
