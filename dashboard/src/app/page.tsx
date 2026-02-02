"use client"

import { useState, useEffect, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { SymbolSearch } from "@/components/search/symbol-search"
import { MetricHistogram } from "@/components/dashboard/metric-histogram"
import { MetricSankey } from "@/components/dashboard/metric-sankey"
import { getFinancials, getMarketMetricData, getAvailablePeriods } from "@/app/actions/financials"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Loader2, TrendingUp, BarChart3, Filter, Check, GripHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [selectedBase, setSelectedBase] = useState("profitability")
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)

  // Data State
  const [data, setData] = useState<any[]>([])
  const [marketData, setMarketData] = useState<any[]>([])
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Sankey State
  const [sankeyRawData, setSankeyRawData] = useState<any[]>([])
  const [sankeyPeriods, setSankeyPeriods] = useState<string[]>([])
  const [sankeySelectedPeriod, setSankeySelectedPeriod] = useState<string | null>(null)
  const [sankeyComparisonMode, setSankeyComparisonMode] = useState<"qoq" | "yoy">("qoq")

  const [sankeyData, setSankeyData] = useState<{
    revenue: number,
    costOfRevenue: number,
    grossProfit: number,
    depreciation?: number,
    operatingExpenses?: number,
    sga?: number,
    rAndD?: number,
    incomeTaxExpense?: number,
    netIncome?: number,
    currency?: string,
    previousData?: {
      revenue: number,
      costOfRevenue: number,
      grossProfit: number,
      depreciation: number,
      operatingExpenses: number,
      sga: number,
      rAndD: number,
      incomeTaxExpense: number,
      netIncome: number
    },
    comparisonMode?: "qoq" | "yoy"
  } | null>(null)

  // 1. Fetch Income Data for Sankey (Independent of Filter Base)
  useEffect(() => {
    if (!selectedSymbol) return

    const fetchSankeyData = async () => {
      try {
        const res = await getFinancials(selectedSymbol, 'income_statements')

        // Filter for Quarterly reports only
        const quarterlyData = res.filter((r: any) => r.report_type === 'quarterly' || r.period_quarter.includes('Q') || r.period_quarter.includes('T'))

        const periods = Array.from(new Set(quarterlyData.map((r: any) => r.period_quarter))).sort()

        setSankeyRawData(quarterlyData)
        setSankeyPeriods(periods)

        // Default to latest period
        const latestPeriod = periods[periods.length - 1]
        if (latestPeriod) {
          setSankeySelectedPeriod(latestPeriod)
        }
      } catch (e) {
        console.error("Error fetching sankey data", e)
      }
    }
    fetchSankeyData()
  }, [selectedSymbol])

  // 2. Derive Sankey Data when Period Selected
  useEffect(() => {
    if (!sankeySelectedPeriod || sankeyRawData.length === 0) return

    // Helper to extract data for a specific period
    const getDataForPeriod = (period: string) => {
      const periodData = sankeyRawData.filter((r: any) => r.period_quarter === period)
      if (!periodData.length) return null

      const getValue = (concept: string) => periodData.find((r: any) => r.concept === concept)?.value || 0

      const revenue = getValue('totalRevenue') || getValue('TotalRevenue') || getValue('Total Revenue') || getValue('Sales')
      const cost = getValue('costOfRevenue') || getValue('costOfGoodsAndServicesSold') || getValue('CostOfRevenue') || getValue('Cost of Revenue')
      const gross = getValue('grossProfit') || getValue('GrossProfit') || getValue('Gross Profit')
      const depreciation = getValue('depreciationAndAmortization') || getValue('DepreciationAndAmortization') || getValue('Depreciation')
      const operatingExpenses = getValue('operatingExpenses') || getValue('OperatingExpenses')
      const sga = getValue('sellingGeneralAndAdministrative') || getValue('SellingGeneralAndAdministrative')
      const rAndD = getValue('researchAndDevelopment') || getValue('ResearchAndDevelopment')
      const incomeTaxExpense = getValue('incomeTaxExpense') || getValue('IncomeTaxExpense')
      const netIncome = getValue('netIncome') || getValue('NetIncome')
      const currency = (periodData[0] as any)?.reported_currency || 'USD'

      return {
        revenue,
        costOfRevenue: cost,
        grossProfit: gross,
        depreciation,
        operatingExpenses,
        sga,
        rAndD,
        incomeTaxExpense,
        netIncome,
        currency
      }
    }

    // Current Data
    const current = getDataForPeriod(sankeySelectedPeriod)

    // Previous Data Comparison Logic
    let previous = null

    if (sankeyComparisonMode === 'qoq') {
      // Compare with immediate previous period in the sorted list
      const currentIndex = sankeyPeriods.indexOf(sankeySelectedPeriod)
      if (currentIndex > 0) {
        const prevPeriod = sankeyPeriods[currentIndex - 1]
        previous = getDataForPeriod(prevPeriod)
      }
    } else {
      // YoY: Find same quarter in previous year
      // Format expected: "2024 Q1", "2023 Q4" etc. or "2024-03-31"? 
      // sankeyPeriods comes from 'period_quarter' which seems to be "YYYY QX" or similar based on user context
      // Let's assume standard "YYYY QX" or try to parse year.

      // Regex to parse Year and Quarter
      const match = sankeySelectedPeriod.match(/(\d{4})[^\d]*(Q\d|T\d)/i)
      if (match) {
        const year = parseInt(match[1])
        const quarterPart = match[2] // e.g., "Q1"
        const prevYear = year - 1
        const targetPrevPeriod = sankeyPeriods.find(p => p.includes(prevYear.toString()) && p.includes(quarterPart))

        if (targetPrevPeriod) {
          previous = getDataForPeriod(targetPrevPeriod)
        }
      }
    }

    if (current && current.revenue) {
      setSankeyData({
        ...current,
        previousData: previous || undefined,
        comparisonMode: sankeyComparisonMode
      })
    } else {
      setSankeyData(null)
    }
  }, [sankeySelectedPeriod, sankeyRawData, sankeyPeriods, sankeyComparisonMode])

  // Filters State
  const [scope, setScope] = useState<"me" | "market">("me") // "me" or "market"
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]) // Empty = All

  const BASES = [
    { id: "income", label: "Income" },
    { id: "balance", label: "Balance" },
    { id: "cash", label: "Cash Flow" },
    { id: "profitability", label: "Profitability" },
    { id: "liquidity", label: "Liquidity" },
    { id: "indebtedness", label: "Indebtedness" },
    { id: "management", label: "Management" },
    { id: "assessment", label: "Assessment" }
  ]

  // 1. Fetch Available Periods when Base changes
  useEffect(() => {
    async function fetchPeriods() {
      let dbBase = selectedBase
      if (selectedBase === 'income') dbBase = 'income_statements'
      if (selectedBase === 'balance') dbBase = 'balance_sheet'
      if (selectedBase === 'cash') dbBase = 'cash_flow'
      const periods = await getAvailablePeriods(dbBase)
      setAvailablePeriods(periods)
    }
    fetchPeriods()
  }, [selectedBase])

  // 2. Fetch Data (Symbol Specific)
  useEffect(() => {
    if (!selectedSymbol) return
    const fetchData = async () => {
      setIsLoading(true)
      setData([])
      // Don't reset selectedConcept if previous one exists? Maybe better to reset if base changes.
      // If we switch scope back and forth, we want to keep concept.

      try {
        let dbBase = selectedBase
        if (selectedBase === 'income') dbBase = 'income_statements'
        if (selectedBase === 'balance') dbBase = 'balance_sheet'
        if (selectedBase === 'cash') dbBase = 'cash_flow'

        const res = await getFinancials(selectedSymbol, dbBase)
        setData(res)

        // Only set concept if not already set (or if current one invalid)
        if (res && res.length > 0 && !selectedConcept) {
          const concepts = Array.from(new Set(res.map((r: any) => r.concept)))
          if (concepts.length > 0) {
            setSelectedConcept(concepts[0] as string)
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [selectedSymbol, selectedBase])

  // 3. Fetch Market Data (if Scope is Market)
  useEffect(() => {
    if (scope !== 'market' || !selectedConcept) return

    const fetchMarket = async () => {
      setIsLoading(true)
      try {
        let dbBase = selectedBase
        if (selectedBase === 'income') dbBase = 'income_statements'
        if (selectedBase === 'balance') dbBase = 'balance_sheet'
        if (selectedBase === 'cash') dbBase = 'cash_flow'

        // Fetch for periods
        const res = await getMarketMetricData(dbBase, selectedConcept, selectedPeriods)
        setMarketData(res)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMarket()
  }, [scope, selectedBase, selectedConcept, selectedPeriods])


  const concepts = useMemo(() => {
    if (!data || data.length === 0) return []
    return Array.from(new Set(data.map(item => item.concept))).sort()
  }, [data])


  // Decide which data to use for chart
  const chartData = useMemo(() => {
    if (scope === 'me') {
      if (!selectedConcept || !data) return []
      // Client-side Filter by Period
      let filtered = data.filter(item => item.concept === selectedConcept)
      if (selectedPeriods.length > 0) {
        filtered = filtered.filter(item => selectedPeriods.includes(item.period_quarter))
      }
      return filtered
    } else {
      // Market scope
      return marketData // Already filtered by backend
    }
  }, [scope, data, marketData, selectedConcept, selectedPeriods])

  // Determine Highlight Details
  const highlightDetails = useMemo(() => {
    if (!data || !selectedConcept) return null

    // We need to find the "Target" value to highlight.
    // Case 1: Market Scope -> Highlight My Symbol's latest value in the selected periods.
    // Case 2: Me Scope -> Highlight the latest value in the filtered dataset (to show details in tooltip).

    // In both cases, we are looking for the latest value from "data" (which contains MY data).
    // Note: "marketData" contains EVERYONE'S data, but we highlight MY position.

    let myData = data.filter(d => d.concept === selectedConcept)

    if (selectedPeriods.length > 0) {
      myData = myData.filter(d => selectedPeriods.includes(d.period_quarter))
    }

    // Sort descending by date to get latest
    myData.sort((a, b) => b.fiscalDateEnding.localeCompare(a.fiscalDateEnding))

    if (myData.length > 0) {
      return {
        value: myData[0].value,
        period: myData[0].period_quarter,
        symbol: myData[0].symbol
      }
    }
    return null
  }, [scope, data, selectedConcept, selectedPeriods])


  const togglePeriod = (period: string) => {
    setSelectedPeriods(prev =>
      prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
    )
  }

  return (
    <AppLayout symbol={selectedSymbol || undefined}>
      <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
        {!selectedSymbol ? (
          <section className="flex flex-col items-center justify-center space-y-4 py-20 text-center flex-1">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Financial Analysis Dashboard
            </h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
              Deep dive into balance sheets, income statements, and key financial ratios.
            </p>
            <div className="w-full max-w-sm space-y-2 mx-auto pt-8">
              <SymbolSearch onSelect={setSelectedSymbol} />
            </div>
          </section>
        ) : (
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between flex-shrink-0">
              <h2 className="text-2xl font-light tracking-tight flex items-center gap-2">
                {selectedSymbol} <span className="text-muted-foreground">Analysis</span>
              </h2>
              <div className="w-64">
                <SymbolSearch onSelect={setSelectedSymbol} />
              </div>
            </div>

            <Tabs defaultValue="profitability" value={selectedBase} onValueChange={setSelectedBase} className="w-full flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 bg-muted/20 p-1 group/list h-auto flex-shrink-0">
                {BASES.map(base => (
                  <TabsTrigger
                    key={base.id}
                    value={base.id}
                    className="capitalize transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm group-hover/list:opacity-50 hover:!opacity-100 cursor-pointer"
                  >
                    {base.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-4 flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
                {/* Concept Sidebar */}
                <div className="w-full lg:w-64 flex-shrink-0 border border-border/50 rounded-xl bg-muted/10 overflow-hidden flex flex-col h-[200px] lg:h-full">
                  <div className="p-3 border-b border-border/50 bg-muted/20 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    Concepts
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {isLoading && scope === 'me' ? (
                        Array(5).fill(0).map((_, i) => (
                          <div key={i} className="h-8 bg-muted/20 animate-pulse rounded-md" />
                        ))
                      ) : concepts.length > 0 ? (
                        concepts.map((concept) => (
                          <button
                            key={concept as string}
                            onClick={() => setSelectedConcept(concept as string)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate",
                              selectedConcept === concept
                                ? "bg-background shadow-sm text-foreground font-medium"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                            title={concept as string}
                          >
                            {concept as string}
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground">No concepts found</div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Main Chart Area */}
                <div className="flex-1 border border-border/50 rounded-xl bg-muted/10 p-4 lg:p-6 overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    {/* Filters */}
                    <div className="flex items-center gap-2">
                      {/* Scope Toggle */}
                      <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-border/30">
                        <button
                          onClick={() => setScope('me')}
                          className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            scope === 'me' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          My History
                        </button>
                        <button
                          onClick={() => setScope('market')}
                          className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            scope === 'market' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Market Distribution
                        </button>
                      </div>

                      {/* Periods Filter */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 gap-2 bg-muted/30 border-border/30">
                            <Filter className="h-3 w-3" />
                            <span className="text-xs">
                              {selectedPeriods.length > 0 ? `${selectedPeriods.length} Qtrs` : "All Periods"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search periods..." className="h-8 text-xs" />
                            <CommandList>
                              <CommandEmpty>No periods found.</CommandEmpty>
                              <CommandGroup className="max-h-[300px] overflow-auto">
                                {availablePeriods.map((period) => (
                                  <CommandItem
                                    key={period}
                                    onSelect={() => togglePeriod(period)}
                                    className="text-xs"
                                  >
                                    <div className={cn(
                                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                      selectedPeriods.includes(period)
                                        ? "bg-primary text-primary-foreground"
                                        : "opacity-50 [&_svg]:invisible"
                                    )}>
                                      <Check className={cn("h-4 w-4")} />
                                    </div>
                                    {period}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : selectedConcept ? (
                    <div className="space-y-6">
                      <MetricHistogram
                        data={chartData}
                        concept={selectedConcept}
                        base={selectedBase}
                        highlightDetails={highlightDetails}
                      />

                      <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                        <h4 className="text-sm font-medium mb-2 opacity-70">About {selectedConcept}</h4>
                        <p className="text-xs text-muted-foreground">
                          {scope === 'me'
                            ? `Viewing historical distribution of ${selectedConcept} for ${selectedSymbol}.`
                            : `Viewing market distribution of ${selectedConcept} across all companies. The golden bar highlights ${selectedSymbol}'s position.`
                          }
                        </p>
                      </div>

                      {/* Sankey Chart Section */}
                      {sankeyData && (
                        <div className="space-y-4 pt-4 border-t border-border/40 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium opacity-70">Revenue Flow & Cost Breakdown</h4>

                            {/* Sankey Period Filter & Comparison Toggle */}
                            <div className="flex items-center gap-2">
                              <div className="flex bg-muted/30 border border-border/30 rounded-lg p-0.5 h-7">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn("h-6 px-2 text-[10px] rounded-md", sankeyComparisonMode === 'qoq' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                                  onClick={() => setSankeyComparisonMode("qoq")}
                                >
                                  QoQ
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn("h-6 px-2 text-[10px] rounded-md", sankeyComparisonMode === 'yoy' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                                  onClick={() => setSankeyComparisonMode("yoy")}
                                >
                                  YoY
                                </Button>
                              </div>

                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 gap-2 bg-muted/30 border-border/30 text-xs text-muted-foreground hover:text-foreground">
                                    <Filter className="h-3 w-3" />
                                    <span>{sankeySelectedPeriod || "Select Period"}</span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[150px] p-0" align="end">
                                  <Command>
                                    <CommandInput placeholder="Search..." className="h-8 text-xs" />
                                    <CommandList>
                                      <CommandEmpty>No periods.</CommandEmpty>
                                      <CommandGroup className="max-h-[200px] overflow-auto">
                                        {[...sankeyPeriods].reverse().map((period) => (
                                          <CommandItem
                                            key={period}
                                            onSelect={() => setSankeySelectedPeriod(period)}
                                            className="text-xs"
                                          >
                                            <div className={cn(
                                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm",
                                              sankeySelectedPeriod === period ? "opacity-100" : "opacity-0"
                                            )}>
                                              <Check className="h-3 w-3" />
                                            </div>
                                            {period}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>

                          <MetricSankey data={sankeyData} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-2 opacity-50">
                      <BarChart3 className="h-12 w-12" />
                      <p>Select a concept to view analysis</p>
                    </div>
                  )}
                </div>
              </div>
            </Tabs>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
