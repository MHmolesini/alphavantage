"use server"

import bigquery from "@/lib/bigquery"

export type TrophyData = {
    symbol: string
    gold: number   // Position 1 counts
    silver: number // Position 2 counts
    bronze: number // Position 3 counts
    total_score: number // Weighted score: (G*3 + S*2 + B*1)
}

export async function getTrophiesPeriods() {
    const query = `
    SELECT DISTINCT period_quarter
    FROM \`development.base\`
    WHERE ranking IS NOT NULL
    ORDER BY period_quarter DESC
  `
    try {
        const [rows] = await bigquery.query({ query })
        return rows.map((row: any) => row.period_quarter as string)
    } catch (error) {
        console.error("BigQuery Error fetching periods:", error)
        return []
    }
}

export async function getTrophiesData(rollingPeriod: number = 1, period?: string) {
    console.log(`[getTrophiesData] Fetching with rolling: ${rollingPeriod}, period: ${period || 'LATEST'}`);

    const safeRolling = [1, 4, 8, 12].includes(Number(rollingPeriod)) ? Number(rollingPeriod) : 1
    const predecessors = safeRolling - 1

    // 1. Determine target periods
    let targetPeriods: string[] = []

    if (period) {
        targetPeriods = period.split(",")
    } else {
        const periodQuery = `
        SELECT MAX(period_quarter) as latest_period
        FROM \`development.base\`
        WHERE ranking IS NOT NULL
      `
        try {
            const [rows] = await bigquery.query({ query: periodQuery });
            if (rows[0]?.latest_period) {
                targetPeriods = [rows[0].latest_period]
            }
        } catch (error) {
            console.error("Error fetching latest period:", error);
            return [];
        }
    }

    if (targetPeriods.length === 0) {
        return [];
    }

    const query = `
    WITH CleanData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter,
        -- Remove suffixes to group by main concept
        REGEXP_REPLACE(concept, r'(_var_\\d+|_acum|_ttm|_var_acum_\\d+)$', '') as normalized_concept,
        ranking
      FROM \`development.base\`
      WHERE ranking IS NOT NULL
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
      WHERE period_quarter IN UNNEST(@targetPeriods)
      GROUP BY 1, 2, 3, 4
    ),
    -- We calculate rank PER periodical snapshot first
    RankedData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        concept, 
        total_ranking,
        RANK() OVER (PARTITION BY base, concept, period_quarter ORDER BY total_ranking DESC) as position_rank
      FROM AggregatedData
    ),
    -- Calculate total score for each symbol across ALL concepts/periods (not just podiums)
    SymbolScores AS (
      SELECT 
        symbol, 
        SUM(ranking) as total_score
      FROM CleanData
      WHERE period_quarter IN UNNEST(@targetPeriods)
      GROUP BY 1
    )
    SELECT 
      r.symbol,
      -- Sum the podiums across all selected periods
      COUNTIF(r.position_rank = 1) as gold,
      COUNTIF(r.position_rank = 2) as silver,
      COUNTIF(r.position_rank = 3) as bronze,
      ANY_VALUE(s.total_score) as total_score
    FROM RankedData r
    JOIN SymbolScores s ON r.symbol = s.symbol
    -- No additional WHERE needed as CleanData/AggregatedData already filtered by targetPeriods
    WHERE r.position_rank <= 3
    GROUP BY r.symbol
    ORDER BY total_score DESC, gold DESC, silver DESC, bronze DESC, r.symbol ASC
  `

    try {
        const [rows] = await bigquery.query({
            query,
            params: { targetPeriods },
        });
        return rows as TrophyData[];
    } catch (error) {
        console.error("BigQuery Error in getTrophiesData:", error);
        return [];
    }
}
