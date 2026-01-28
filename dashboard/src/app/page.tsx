"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { SymbolSearch } from "@/components/search/symbol-search"
import { ScatterScaleChart } from "@/components/dashboard/scatter-scale-chart"
import { getDashboardMetrics } from "@/app/actions/financials"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [selectedBase, setSelectedBase] = useState("profitability")
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
      try {
        // Map 'income', 'balance', 'cash' to db base names if needed
        let dbBase = selectedBase
        if (selectedBase === 'income') dbBase = 'income_statements'
        if (selectedBase === 'balance') dbBase = 'balance_sheet'
        if (selectedBase === 'cash') dbBase = 'cash_flow'

        const res = await getDashboardMetrics(selectedSymbol, dbBase)
        setData(res)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [selectedSymbol, selectedBase])

  return (
    <AppLayout symbol={selectedSymbol || undefined}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <section className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Financial Analysis Dashboard
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Deep dive into balance sheets, income statements, and key financial ratios.
          </p>
          <div className="w-full max-w-sm space-y-2 mx-auto">
            <SymbolSearch onSelect={setSelectedSymbol} />
          </div>
        </section>

        {selectedSymbol && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-light tracking-tight">{selectedSymbol} <span className="text-muted-foreground">Points & Rankings</span></h2>
            </div>

            <Tabs defaultValue="profitability" value={selectedBase} onValueChange={setSelectedBase} className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-muted/20 p-1 group/list h-auto">
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

              <div className="mt-8 border border-border/50 rounded-xl p-6 bg-muted/10 min-h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : data.length > 0 ? (
                  <ScatterScaleChart data={data} base={selectedBase} selectedSymbol={selectedSymbol!} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No ranking data found for {selectedSymbol} in {selectedBase}.
                  </div>
                )}
              </div>
            </Tabs>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
