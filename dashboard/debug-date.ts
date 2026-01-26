import { BigQuery } from "@google-cloud/bigquery"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"

const credentialsPath = path.resolve(process.cwd(), "account_service.json")
let options: any = { projectId: "alphavantage-482820", location: "US" }
if (fs.existsSync(credentialsPath)) {
    options.credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"))
}
const bigquery = new BigQuery(options)

async function checkDate() {
    try {
        const query = `
        SELECT fiscalDateEnding
        FROM \`development.base\`
        WHERE symbol = 'AAPL'
        LIMIT 1
    `
        const [rows] = await bigquery.query({ query })
        console.log("Date Row:", rows[0])
        console.log("Type of fiscalDateEnding:", typeof rows[0].fiscalDateEnding)
        console.log("Is instance of Date?", rows[0].fiscalDateEnding instanceof Date)
        console.log("Stringify:", JSON.stringify(rows[0]))
    } catch (error) {
        console.error("Error:", error)
    }
}

checkDate()
