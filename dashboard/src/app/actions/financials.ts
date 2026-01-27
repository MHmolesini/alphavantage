"use server"

import bigquery from "@/lib/bigquery"

export type FinancialRecord = {
  symbol: string
  base: string
  report_type: string
  fiscalDateEnding: string
  period_quarter: string
  concept: string
  value: number
  value_ttm: number
  // Add other fields if needed
}

export async function getFinancials(symbol: string, base: string) {
  console.log(`[getFinancials] Fetching for ${symbol} - ${base}`);
  const query = `
    SELECT 
      symbol, base, report_type, fiscalDateEnding, period_quarter, concept, value, value_ttm
    FROM \`development.base\`
    WHERE symbol = @symbol
      AND base = @base
    ORDER BY fiscalDateEnding DESC
    LIMIT 2000
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
    })) as FinancialRecord[]
  } catch (error) {
    console.error("BigQuery Error:", error)
    return []
  }
}

export async function getCompanyMetrics(symbol: string) {
  // Determine what "Overview" means here. maybe just fetch latest profitability?
  // For now, let's just fetch some key profitabilty metrics
  const query = `
    SELECT 
      symbol, base, report_type, fiscalDateEnding, period_quarter, concept, value
    FROM \`development.base\`
    WHERE symbol = @symbol
      AND base = 'profitability'
    ORDER BY fiscalDateEnding DESC
    LIMIT 50
  `
  try {
    const [rows] = await bigquery.query({
      query,
      params: { symbol },
    })
    return rows.map((row: any) => ({
      ...row,
      fiscalDateEnding: row.fiscalDateEnding?.value || row.fiscalDateEnding
    })) as FinancialRecord[]
  } catch (error) {
    return []
  }
}

export async function getSymbols() {
  const query = `
    SELECT DISTINCT symbol
    FROM \`development.base\`
    ORDER BY symbol ASC
  `
  try {
    const [rows] = await bigquery.query({ query })
    return rows.map((row: any) => row.symbol as string)
  } catch (error) {
    console.error("BigQuery Error fetching symbols:", error)
    return []
  }
}
