
import bigquery from "./src/lib/bigquery"

async function checkSchema() {
    const query = `
    SELECT *
    FROM \`development.base\`
    LIMIT 1
  `
    try {
        const [rows] = await bigquery.query({ query })
        if (rows.length > 0) {
            console.log("Columns:", Object.keys(rows[0]))
        } else {
            console.log("No data found")
        }
    } catch (error) {
        console.error("Error:", error)
    }
}

checkSchema()
