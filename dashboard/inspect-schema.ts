import { BigQuery } from "@google-cloud/bigquery"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const bigquery = new BigQuery()

async function inspectSchema() {
    try {
        const dataset = bigquery.dataset("development")
        const table = dataset.table("base")
        const [metadata] = await table.getMetadata()

        console.log("Schema for development.base:")
        metadata.schema.fields.forEach((field: any) => {
            console.log(`- ${field.name} (${field.type})`)
        })

        // Also fetch one row to see sample values
        const [rows] = await bigquery.query({
            query: `SELECT * FROM \`development.base\` LIMIT 1`
        })
        console.log("\nSample Row:", JSON.stringify(rows[0], null, 2))

    } catch (error) {
        console.error("Error inspecting schema:", error)
    }
}

inspectSchema()
