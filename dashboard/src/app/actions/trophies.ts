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

    // 1. Fetch all periods to calculate rolling window
    const allPeriods = await getTrophiesPeriods()

    if (allPeriods.length === 0) {
        return []
    }

    // 2. Determine target periods
    let targetPeriods: string[] = []

    // Parse all selected periods (Multi-Select support)
    const selectedPeriods = period ? period.split(",") : [allPeriods[0]]
    const latestSelected = selectedPeriods[0] // Assuming sorted desc in UI, or we can sort them

    if (safeRolling > 1) {
        // Rolling Mode: Score is based on the window ending at the LATEST selected period
        // Medals will be based on the selected periods (summed)
        const anchorIndex = allPeriods.indexOf(latestSelected)
        if (anchorIndex !== -1) {
            targetPeriods = allPeriods.slice(anchorIndex, anchorIndex + safeRolling)
        } else {
            targetPeriods = [latestSelected]
        }
    } else {
        // Standard Mode (Ranking 1): Score AND Medals are based on the explicitly selected set
        targetPeriods = selectedPeriods
    }

    // Ensure we don't pass empty arrays if something goes wrong
    if (targetPeriods.length === 0) targetPeriods = [allPeriods[0]]
    if (selectedPeriods.length === 0) selectedPeriods.push(allPeriods[0])

    console.log(`[getTrophiesData] Rolling: ${safeRolling}, Selected: ${selectedPeriods.join(', ')}, ScoreTargets: ${targetPeriods.join(', ')}`)

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
    -- Data for the SELECTED period(s) (for Medals)
    AnchorAggregated AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        normalized_concept as concept, 
        SUM(ranking) as total_ranking
      FROM CleanData
      WHERE period_quarter IN UNNEST(@selectedPeriods)
      GROUP BY 1, 2, 3, 4
    ),
    -- Data for the ROLLING window (for Score)
    RollingData AS (
      SELECT 
        symbol, 
        ranking
      FROM CleanData
      WHERE period_quarter IN UNNEST(@targetPeriods)
    ),
    -- Rank calculation for EACH selected period
    RankedData AS (
      SELECT 
        symbol, 
        base, 
        period_quarter, 
        concept, 
        total_ranking,
        RANK() OVER (PARTITION BY base, concept, period_quarter ORDER BY total_ranking DESC) as position_rank
      FROM AnchorAggregated
    ),
    -- Total score calculation for ROLLING window (or selected set if rolling=1)
    SymbolScores AS (
      SELECT 
        symbol, 
        SUM(ranking) as total_score
      FROM RollingData
      GROUP BY 1
    )
    SELECT 
      r.symbol,
      -- Medals: Sum of positions 1, 2, 3 across ALL selected periods
      COUNTIF(r.position_rank = 1) as gold,
      COUNTIF(r.position_rank = 2) as silver,
      COUNTIF(r.position_rank = 3) as bronze,
      -- Score: From the calculated window
      ANY_VALUE(s.total_score) as total_score
    FROM RankedData r
    JOIN SymbolScores s ON r.symbol = s.symbol
    WHERE r.position_rank <= 3
    GROUP BY r.symbol
    ORDER BY total_score DESC, gold DESC, silver DESC, bronze DESC, r.symbol ASC
  `

    try {
        const [rows] = await bigquery.query({
            query,
            params: { targetPeriods, selectedPeriods },
        });
        return rows as TrophyData[];
    } catch (error) {
        console.error("BigQuery Error in getTrophiesData:", error);
        return [];
    }
}
