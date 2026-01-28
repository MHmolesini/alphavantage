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

export async function getSymbolPoints(symbol: string, rollingPeriod: number = 1) {
  console.log(`[getSymbolPoints] Fetching for ${symbol} with rolling period ${rollingPeriod}`);

  // Safe integer check for rolling period to prevent SQL injection if passed indirectly
  const safeRolling = [1, 4, 8, 12].includes(Number(rollingPeriod)) ? Number(rollingPeriod) : 1
  const predecessors = safeRolling - 1

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
    RollingData AS (
      SELECT 
        *,
        SUM(total_ranking) OVER (
          PARTITION BY symbol, base, concept 
          ORDER BY period_quarter 
          ROWS BETWEEN ${predecessors} PRECEDING AND CURRENT ROW
        ) as rolling_ranking
      FROM AggregatedData
    ),
    RankedData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        concept, 
        rolling_ranking as ranking,
        RANK() OVER (PARTITION BY base, concept, period_quarter ORDER BY rolling_ranking DESC) as position_rank
      FROM RollingData
    )
    SELECT 
      symbol, base, period_quarter, concept, ranking, position_rank
    FROM RankedData
    WHERE symbol = @symbol
    ORDER BY period_quarter DESC
    LIMIT 20000
  `

  try {
    const [rows] = await bigquery.query({
      query,
      params: { symbol },
    });
    return rows;
  } catch (error) {
    console.error("BigQuery Error:", error);
    return [];
  }
}

export async function getConceptRankings(base: string, concept: string, rollingPeriod: number = 1) {
  console.log(`[getConceptRankings] Fetching for ${base} - ${concept} with rolling ${rollingPeriod}`);

  const safeRolling = [1, 4, 8, 12].includes(Number(rollingPeriod)) ? Number(rollingPeriod) : 1
  const predecessors = safeRolling - 1

  const query = `
    WITH CleanData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        REGEXP_REPLACE(concept, r'(_var_\\d+|_acum|_ttm|_var_acum_\\d+)$', '') as normalized_concept,
        ranking
      FROM \`development.base\`
      WHERE ranking IS NOT NULL
        AND period_quarter IS NOT NULL
        AND ranking > 0
        AND base = @base
    ),
    AggregatedData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        normalized_concept as concept, 
        SUM(ranking) as total_ranking
      FROM CleanData
      WHERE normalized_concept = @concept
      GROUP BY 1, 2, 3, 4
    ),
    RollingData AS (
      SELECT 
        *,
        SUM(total_ranking) OVER (
          PARTITION BY symbol, base, concept 
          ORDER BY period_quarter 
          ROWS BETWEEN ${predecessors} PRECEDING AND CURRENT ROW
        ) as rolling_ranking
      FROM AggregatedData
    ),
    RankedData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        concept, 
        rolling_ranking as ranking,
        RANK() OVER (PARTITION BY base, concept, period_quarter ORDER BY rolling_ranking DESC) as position_rank
      FROM RollingData
    )
    SELECT 
      symbol, base, period_quarter, concept, ranking, position_rank
    FROM RankedData
    ORDER BY position_rank ASC, period_quarter DESC
    LIMIT 50000
  `


  try {
    const [rows] = await bigquery.query({
      query,
      params: { base, concept },
    });
    return rows;
  } catch (error) {
    console.error("BigQuery Error:", error);
    return [];
  }
}

export async function getCategoryRankings(base: string, rollingPeriod: number = 1) {
  console.log(`[getCategoryRankings] Fetching for ${base} (ALL CONCEPTS) with rolling ${rollingPeriod}`);

  const safeRolling = [1, 4, 8, 12].includes(Number(rollingPeriod)) ? Number(rollingPeriod) : 1
  const predecessors = safeRolling - 1

  const query = `
    WITH CleanData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        ranking
      FROM \`development.base\`
      WHERE ranking IS NOT NULL
        AND period_quarter IS NOT NULL
        AND ranking > 0
        AND base = @base
    ),
    AggregatedData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        'Overall' as concept,
        SUM(ranking) as total_ranking
      FROM CleanData
      GROUP BY 1, 2, 3, 4
    ),
    RollingData AS (
      SELECT 
        *,
        SUM(total_ranking) OVER (
          PARTITION BY symbol, base 
          ORDER BY period_quarter 
          ROWS BETWEEN ${predecessors} PRECEDING AND CURRENT ROW
        ) as rolling_ranking
      FROM AggregatedData
    ),
    RankedData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        concept,
        rolling_ranking as ranking,
        RANK() OVER (PARTITION BY base, period_quarter ORDER BY rolling_ranking DESC) as position_rank
      FROM RollingData
    )
    SELECT 
      symbol, base, period_quarter, concept, ranking, position_rank
    FROM RankedData
    ORDER BY position_rank ASC, period_quarter DESC
    LIMIT 50000
  `

  try {
    const [rows] = await bigquery.query({
      query,
      params: { base },
    });
    return rows;
  } catch (error) {
    console.error("BigQuery Error:", error);
    return [];
  }
}
export async function getGlobalRankings(rollingPeriod: number = 1) {
  console.log(`[getGlobalRankings] Fetching GLOBAL RANKINGS with rolling ${rollingPeriod}`);

  const safeRolling = [1, 4, 8, 12].includes(Number(rollingPeriod)) ? Number(rollingPeriod) : 1
  const predecessors = safeRolling - 1

  const query = `
    WITH CleanData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        ranking
      FROM \`development.base\`
      WHERE ranking IS NOT NULL
        AND period_quarter IS NOT NULL
        AND ranking > 0
    ),
    AggregatedData AS (
      SELECT 
        symbol, 
        period_quarter, 
        'Global' as concept,
        SUM(ranking) as total_ranking
      FROM CleanData
      GROUP BY 1, 2, 3
    ),
    RollingData AS (
      SELECT 
        *,
        SUM(total_ranking) OVER (
          PARTITION BY symbol 
          ORDER BY period_quarter 
          ROWS BETWEEN ${predecessors} PRECEDING AND CURRENT ROW
        ) as rolling_ranking
      FROM AggregatedData
    ),
    RankedData AS (
      SELECT 
        symbol, 
        period_quarter, 
        concept,
        rolling_ranking as ranking,
        RANK() OVER (PARTITION BY period_quarter ORDER BY rolling_ranking DESC) as position_rank
      FROM RollingData
    )
    SELECT 
      symbol, 'global' as base, period_quarter, concept, ranking, position_rank
    FROM RankedData
    ORDER BY position_rank ASC, period_quarter DESC
    LIMIT 50000
  `

  try {
    const [rows] = await bigquery.query({
      query,
    });
    return rows;
  } catch (error) {
    console.error("BigQuery Error:", error);
    return [];
  }
}
