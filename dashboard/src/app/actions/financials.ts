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

export async function getSymbolPoints(symbol: string) {
  console.log(`[getSymbolPoints] Fetching for ${symbol}`);
  const query = `
    WITH CleanData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        -- Remove suffixes like _var_1, _var_4, _acum, _ttm to group by main concept
        REGEXP_REPLACE(concept, r'(_var_\\d+|_acum|_ttm|_var_acum_\\d+)$', '') as normalized_concept,
        ranking
      FROM \`development.base\`
      WHERE ranking IS NOT NULL
        AND period_quarter IS NOT NULL
        AND ranking > 0
    ),
    AggregatedData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        normalized_concept as concept, 
        SUM(ranking) as total_ranking
      FROM CleanData
      GROUP BY 1, 2, 3, 4
    ),
    RankedData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        concept, 
        total_ranking as ranking,
        RANK() OVER (PARTITION BY base, concept, period_quarter ORDER BY total_ranking DESC) as position_rank
      FROM AggregatedData
    )
    SELECT 
      symbol, base, period_quarter, concept, ranking, position_rank
    FROM RankedData
    WHERE symbol = @symbol
    ORDER BY period_quarter DESC
  `

  try {
    const [rows] = await bigquery.query({
      query,
      params: { symbol },
    })
    console.log(`[getSymbolPoints] Found ${rows.length} rows`);
    return rows;
  } catch (error) {
    console.error("BigQuery Error (getSymbolPoints):", error)
    return []
  }
}
