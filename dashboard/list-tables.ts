import { BigQuery } from "@google-cloud/bigquery"
import dotenv from "dotenv"
import path from "path"

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const bigquery = new BigQuery()

async function listTables() {
    try {
        const [datasets] = await bigquery.getDatasets()
        console.log("Datasets found:", datasets.length)

        for (const dataset of datasets) {
            console.log(`Dataset: ${dataset.id}`)
            const [tables] = await dataset.getTables()
            for (const table of tables) {
                console.log(`  - Table: ${table.id}`)
                // Optional: Get schema for one table to check columns
                // const [metadata] = await table.getMetadata()
                // console.log(JSON.stringify(metadata.schema, null, 2))
            }
        }
    } catch (error) {
        console.error("Error listing tables:", error)
    }
}

listTables()
