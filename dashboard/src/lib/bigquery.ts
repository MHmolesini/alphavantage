import { BigQuery } from "@google-cloud/bigquery"
import path from "path"
import fs from "fs"

// Determine the path to the credentials file
// Assuming the app runs in 'dashboard' and the file is in 'alphavantage' (parent dir)
const credentialsPath = path.resolve(process.cwd(), "../account_service.json")

let options: any = {
    projectId: "alphavantage-482820", // Matches the project_id in the json
    location: "US", // Explicitly setting location to defaults to avoid 'Cannot parse as CloudRegion' if inference fails
}

if (fs.existsSync(credentialsPath)) {
    try {
        const keyFileContent = fs.readFileSync(credentialsPath, "utf-8")
        const credentials = JSON.parse(keyFileContent)
        options.credentials = credentials
    } catch (e) {
        console.error("Error reading BigQuery credentials:", e)
    }
} else {
    console.warn("BigQuery credentials file not found at:", credentialsPath)
}

const bigquery = new BigQuery(options)

export default bigquery
