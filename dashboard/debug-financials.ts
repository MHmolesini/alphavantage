
import { BigQuery } from "@google-cloud/bigquery"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"

// Mimic the setup in src/lib/bigquery.ts
const credentialsPath = path.resolve(process.cwd(), "account_service.json")
let options: any = {
    projectId: "alphavantage-482820",
    location: "US",
}

if (fs.existsSync(credentialsPath)) {
    options.credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"))
}

const bigquery = new BigQuery(options)

async function getFinancials(symbol: string, base: string) {
    console.log(`[getFinancials] Fetching for ${symbol} - ${base}`);
    const query = `
    SELECT 
      symbol, base, report_type, fiscalDateEnding, period_quarter, concept, value
    FROM \`development.base\`
    WHERE symbol = @symbol
      AND base = @base
    ORDER BY fiscalDateEnding DESC
    LIMIT 200
  `

    try {
        const [rows] = await bigquery.query({
            query,
            params: { symbol, base },
        })
        console.log(`[getFinancials] Found ${rows.length} rows`);
        return rows.map((row: any) => ({
            ...row,
            fiscalDateEnding: row.fiscalDateEnding?.value || row.fiscalDateEnding
        }))
    } catch (error) {
        console.error("BigQuery Error:", error)
        return []
    }
}

async function debug() {
    console.log("Debugging AAPL Liquidity...");
    const data = await getFinancials("AAPL", "liquidity");

    console.log("\nFirst 3 rows:");
    console.log(JSON.stringify(data.slice(0, 3), null, 2));

    const concept = "currentRatio";
    const filtered = data.filter(d => d.concept === concept);
    console.log(`\nFound ${filtered.length} rows for concept '${concept}'`);

    if (filtered.length > 0) {
        // Test sorting
        const sorted = filtered.sort((a, b) => {
            const dateA = new Date(a.fiscalDateEnding).getTime();
            const dateB = new Date(b.fiscalDateEnding).getTime();
            console.log(`Comparing ${a.fiscalDateEnding} (${dateA}) vs ${b.fiscalDateEnding} (${dateB})`);
            return dateB - dateA;
        });

        console.log("\nTop 3 sorted by date:");
        console.log(JSON.stringify(sorted.slice(0, 3), null, 2));
    }
}

debug();
