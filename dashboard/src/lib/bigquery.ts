import { BigQuery } from "@google-cloud/bigquery"
import path from "path"
import fs from "fs"

// Determine the path to the credentials file
// Assuming the app runs in 'dashboard' and the file is in 'alphavantage' (parent dir)
const credentialsPath = path.resolve(process.cwd(), "account_service.json")

let options: any = {
    projectId: "alphavantage-482820", // Matches the project_id in the json
    location: "US", // Explicitly setting location to defaults to avoid 'Cannot parse as CloudRegion' if inference fails
}

// Prioritize Environment Variables (Vercel / Production)
const projectId = process.env.GOOGLE_PROJECT_ID || process.env.GCP_PROJECT_ID;
if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && projectId) {
    console.log("Initializing BigQuery with ENV VARS");
    console.log("Project ID:", projectId);
    console.log("Client Email:", `...${process.env.GOOGLE_CLIENT_EMAIL.slice(-25)}`); // Log last part to check for spaces/typos
    console.log("Private Key Length:", process.env.GOOGLE_PRIVATE_KEY.length);

    options.credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL.trim(), // Added trim() just in case
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        project_id: projectId,
    }
    options.projectId = projectId
}
// Fallback to local file (Development)
else if (fs.existsSync(credentialsPath)) {
    try {
        const keyFileContent = fs.readFileSync(credentialsPath, "utf-8")
        const credentials = JSON.parse(keyFileContent)
        options.credentials = credentials
    } catch (e) {
        console.error("Error reading BigQuery credentials:", e)
    }
} else {
    console.warn("BigQuery credentials not found. Set GOOGLE_CLIENT_EMAIL/PRIVATE_KEY/PROJECT_ID env vars or provide account_service.json")
}

const bigquery = new BigQuery(options)

export default bigquery
