"use client"

import { useState, useEffect, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { SymbolSearch } from "@/components/search/symbol-search"
import { MetricHistogram } from "@/components/dashboard/metric-histogram"
import { getFinancials } from "@/app/actions/financials"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, TrendingUp, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [selectedBase, setSelectedBase] = useState("profitability")
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

  useEffect(() => {
    if (!selectedSymbol) return

    const fetchData = async () => {
      setIsLoading(true)
      setData([])
      setSelectedConcept(null)
      try {
        let dbBase = selectedBase
        if (selectedBase === 'income') dbBase = 'income_statements'
        if (selectedBase === 'balance') dbBase = 'balance_sheet'
        if (selectedBase === 'cash') dbBase = 'cash_flow'

        const res = await getFinancials(selectedSymbol, dbBase)
        setData(res)

        // Auto-select first concept if available
        if (res && res.length > 0) {
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

  const concepts = useMemo(() => {
    if (!data || data.length === 0) return []
    return Array.from(new Set(data.map(item => item.concept))).sort()
  }, [data])

  const chartData = useMemo(() => {
    if (!selectedConcept || !data) return []
    return data.filter(item => item.concept === selectedConcept)
  }, [data, selectedConcept])

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
                      {isLoading ? (
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
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : selectedConcept ? (
                    <div className="space-y-6">
                      <MetricHistogram
                        data={chartData}
                        concept={selectedConcept}
                        base={selectedBase}
                      />

                      {/* Optional: Add a simple table below? Or just logic explanation */}
                      <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                        <h4 className="text-sm font-medium mb-2 opacity-70">About {selectedConcept}</h4>
                        <p className="text-xs text-muted-foreground">
                          Distribution of {selectedConcept} values for {selectedSymbol}. Data sourced from {selectedBase} statements.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                      <BarChart3 className="h-12 w-12 opacity-20" />
                      <p>Select a concept to view historical data</p>
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
