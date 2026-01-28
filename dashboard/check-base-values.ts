
import bigquery from "./src/lib/bigquery"

async function checkBaseValues() {
    const query = `
    SELECT DISTINCT base
    FROM \`development.base\`
  `
    try {
        const [rows] = await bigquery.query({ query })
        console.log("Distinct bases:", rows.map((r: any) => r.base))
    } catch (error) {
        console.error("Error:", error)
    }
}

checkBaseValues()
