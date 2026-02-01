"use client"

import { useState, useEffect, useMemo, use } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { SymbolSearch } from "@/components/search/symbol-search"
import { MetricHistogram } from "@/components/dashboard/metric-histogram"
import { MetricScatter } from "@/components/dashboard/metric-scatter"
import { getFinancials, getMarketMetricData, getAvailablePeriods } from "@/app/actions/financials"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Loader2, TrendingUp, BarChart3, Filter, Check, GripHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface AnalysisPageProps {
    params: Promise<{ symbol: string }>
}

export default function AnalysisPage(props: AnalysisPageProps) {
    // Unwrap params using React.use for client component compatibility with async params
    // actually for Next.js 15 client components with async params, we handle it slightly effectively or just trust raw unwrapping isn't trivial in client component root
    // Ideally Page is Server Component calling Client Component.
    // But here we are porting a Client Component Logic directly.
    // The easiest way for a Client Component Page in Next 15 (if "use client" is top) is that props.params is a Promise.
    // We can use `use` from react to unwrap it.

    const params = use(props.params)
    const initialSymbol = params.symbol

    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(initialSymbol)

    // Multi-select State: Array of { base: string, concept: string }
    const [selectedConcepts, setSelectedConcepts] = useState<{ base: string, concept: string }[]>([])
    // Default to one concept if empty? No, let user select.

    // Sidebar State
    const [openBases, setOpenBases] = useState<string[]>(["profitability"])

    const router = useRouter()

    useEffect(() => {
        if (params.symbol) {
            setSelectedSymbol(params.symbol)
            // Reset concepts when symbol changes? Maybe keep them for comparison.
        }
    }, [params.symbol])

    // Data State
    // We need a map of concept -> data[]
    const [dataSet, setDataSet] = useState<Record<string, any[]>>({})
    const [availablePeriods, setAvailablePeriods] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)

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

    // Pre-defined concept lists per base (hardcoded for UI or fetched? Ideally fetched or hardcoded known ones)
    // For now, let's fetch concepts dynamically or use a known list. 
    // The previous implementation used `data` to derive concepts, but that requires fetching data first.
    // Better to have a list of available concepts per base. 
    // We can fetch "Available Concepts" or just fetch all data for a base (heavy?).
    // Let's assume we fetch *available concepts* for a base first using `getAvailablePeriods`? No `getAvailableConcepts`?
    // Let's rely on the user opening an accordion -> we fetch "Available Metrics" for that base.
    // OR: Just hardcode common ones for now as seen in `financials-dashboard.tsx`.
    // Actually, `getFinancials` returns ALL data for a base for a symbol. 
    // So if scope is "me", we can fetch `getFinancials(symbol, base)` and list concepts.
    // If scope is "market", we don't know concepts unless we have a list.
    // Let's use `getFinancials` to populate the sidebar for the *selected symbol*.
    const [sidebarConcepts, setSidebarConcepts] = useState<Record<string, string[]>>({})

    // Fetch Concepts for a Base when opened (if not loaded)
    // Fetch Concepts for Bases when opened (if not loaded)
    useEffect(() => {
        if (!selectedSymbol || openBases.length === 0) return

        const fetchConcepts = async () => {
            for (const baseId of openBases) {
                if (sidebarConcepts[baseId]) continue // Already loaded

                let dbBase = baseId
                if (baseId === 'income') dbBase = 'income_statements'
                if (baseId === 'balance') dbBase = 'balance_sheet'
                if (baseId === 'cash') dbBase = 'cash_flow'

                try {
                    const res = await getFinancials(selectedSymbol, dbBase)
                    const concepts = Array.from(new Set(res.map((r: any) => r.concept))).sort()
                    setSidebarConcepts(prev => ({ ...prev, [baseId]: concepts }))
                } catch (e) {
                    console.error("Error fetching concepts for", baseId, e)
                }
            }
        }
        fetchConcepts()
    }, [selectedSymbol, openBases, sidebarConcepts])

    // Fetch Data for Selected Concepts
    useEffect(() => {
        const fetchSelectedData = async () => {
            // We only fetch if not in dataSet or if params changed (period, scope)
            // Actually, simplest is to loop selectedConcepts and fetch if missing.

            setIsLoading(true)
            const newDataSet = { ...dataSet }
            let hasNew = false

            await Promise.all(selectedConcepts.map(async ({ base, concept }) => {
                const key = `${concept}-${scope}-${selectedPeriods.join(',')}` // Cache key
                // We don't have a cache key in state, just concept key in dataSet.
                // If we change scope/period, we probably need to refetch ALL relevant.

                // Simpler: Just fetch whatever is selected, every time scope/period changes.
                // Optimize later.

                let dbBase = base
                if (base === 'income') dbBase = 'income_statements'
                if (base === 'balance') dbBase = 'balance_sheet'
                if (base === 'cash') dbBase = 'cash_flow'

                try {
                    if (scope === 'me') {
                        // For 'me', we usually fetch the whole base. 
                        // But here we want specific concept data structure.
                        // getFinancials returns ALL concepts for base.
                        // We can filter locally.
                        const wholeBaseData = await getFinancials(selectedSymbol!, dbBase)
                        const conceptData = wholeBaseData.filter((d: any) => d.concept === concept)
                        newDataSet[concept] = conceptData
                    } else {
                        // Market
                        const res = await getMarketMetricData(dbBase, concept, selectedPeriods)
                        newDataSet[concept] = res
                    }
                    hasNew = true
                } catch (e) {
                    console.error(e)
                }
            }))

            if (hasNew) {
                setDataSet(newDataSet)
            }
            setIsLoading(false)
        }

        if (selectedConcepts.length > 0) {
            fetchSelectedData()
        }
    }, [selectedConcepts, scope, selectedPeriods, selectedSymbol])

    // Toggle Concept Selection
    const toggleConcept = (base: string, concept: string) => {
        setSelectedConcepts(prev => {
            const exists = prev.find(p => p.concept === concept)
            if (exists) return prev.filter(p => p.concept !== concept)
            return [...prev, { base, concept }]
        })
    }

    // Determine Charts Data
    const lastSelected = selectedConcepts[selectedConcepts.length - 1]
    const primaryConcept = lastSelected?.concept
    const primaryBase = lastSelected?.base

    const primaryData = primaryConcept ? dataSet[primaryConcept] : []

    // Filter Primary Data for Histogram (Client side period filter if 'me')
    const histogramData = useMemo(() => {
        if (!primaryData) return []
        if (scope === 'me' && selectedPeriods.length > 0) {
            return primaryData.filter(d => selectedPeriods.includes(d.period_quarter))
        }
        return primaryData
    }, [primaryData, scope, selectedPeriods])

    // Dynamic Scatter Data
    const scatterMetricA = selectedConcepts[0]
    const scatterMetricB = selectedConcepts[1]

    const scatterData = useMemo(() => {
        // Condition for Dynamic Scatter: 2 Concepts Selected (Any Scope)
        if (selectedConcepts.length < 2) return []

        const dataA = dataSet[scatterMetricA.concept] || []
        const dataB = dataSet[scatterMetricB.concept] || []

        if (dataA.length === 0 || dataB.length === 0) return []

        // Intersect
        const mapB = new Map<string, number>()
        dataB.forEach((d: any) => mapB.set(`${d.symbol}-${d.period_quarter}`, d.value))

        const points = []
        for (const item of dataA) {
            const valB = mapB.get(`${item.symbol}-${item.period_quarter}`)
            if (valB !== undefined) {
                points.push({
                    symbol: item.symbol,
                    x: item.value,
                    y: valB,
                    period: item.period_quarter
                })
            }
        }
        return points
    }, [selectedConcepts, dataSet, scatterMetricA, scatterMetricB])

    // Highlight for Histogram
    const highlightDetails = useMemo(() => {
        if (!histogramData || histogramData.length === 0) return null
        // Same logic: find 'me' or 'latest'
        let myDetails = histogramData.find(d => d.symbol === selectedSymbol)
        // If multiple periods, find latest
        if (!myDetails && histogramData.length > 0) {
            // sort by date
            const sorted = [...histogramData].sort((a, b) => b.fiscalDateEnding.localeCompare(a.fiscalDateEnding))
            if (scope === 'me') return { value: sorted[0].value, period: sorted[0].period_quarter, symbol: sorted[0].symbol }

            // If market, look for selectedSymbol again just in case valid
            const found = sorted.find(d => d.symbol === selectedSymbol)
            if (found) return { value: found.value, period: found.period_quarter, symbol: found.symbol }
        }
        return myDetails ? { value: myDetails.value, period: myDetails.period_quarter, symbol: myDetails.symbol } : null
    }, [histogramData, selectedSymbol, scope])


    // Helpers
    const togglePeriod = (period: string) => {
        setSelectedPeriods(prev =>
            prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
        )
    }

    // Fetch Available Periods (Initial)
    useEffect(() => {
        async function fetchPeriods() {
            // Fetch for profitability as default? Or generic?
            const periods = await getAvailablePeriods('profitability')
            setAvailablePeriods(periods)
        }
        fetchPeriods()
    }, [])

    return (
        <AppLayout symbol={selectedSymbol || undefined}>
            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                {/* Unified Sidebar */}
                <div className="w-64 border-r border-border/50 bg-muted/10 flex flex-col h-full flex-shrink-0">
                    <div className="p-4 border-b border-border/50">
                        <h2 className="font-semibold tracking-tight">Data Explorer</h2>
                        <p className="text-xs text-muted-foreground">Select metrics to analyze</p>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2">
                            <div className="space-y-1">
                                {BASES.map(base => {
                                    const isOpen = openBases.includes(base.id)
                                    return (
                                        <div key={base.id} className="border-b border-border/40 last:border-0">
                                            <button
                                                onClick={() => {
                                                    setOpenBases(prev =>
                                                        prev.includes(base.id)
                                                            ? prev.filter(id => id !== base.id)
                                                            : [...prev, base.id]
                                                    )
                                                }}
                                                className="flex items-center justify-between w-full p-3 text-sm font-medium hover:bg-muted/30 rounded-md transition-colors"
                                            >
                                                {base.label}
                                                <TrendingUp className={cn("h-3 w-3 transition-transform", isOpen ? "rotate-180" : "")} />
                                            </button>

                                            {isOpen && (
                                                <div className="px-2 pb-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                                    {sidebarConcepts[base.id] ? (
                                                        sidebarConcepts[base.id].map(concept => {
                                                            const isSelected = selectedConcepts.some(c => c.concept === concept)
                                                            return (
                                                                <button
                                                                    key={concept}
                                                                    onClick={() => toggleConcept(base.id, concept)}
                                                                    className={cn(
                                                                        "w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-2",
                                                                        isSelected
                                                                            ? "bg-primary/20 text-primary font-medium"
                                                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                                    )}
                                                                >
                                                                    <div className={cn("w-3 h-3 border rounded-sm flex items-center justify-center", isSelected ? "border-primary bg-primary" : "border-muted-foreground")}>
                                                                        {isSelected && <Check className="h-2 w-2 text-primary-foreground" />}
                                                                    </div>
                                                                    <span className="truncate" title={concept}>{concept}</span>
                                                                </button>
                                                            )
                                                        })
                                                    ) : (
                                                        <div className="px-2 py-2 text-xs text-muted-foreground text-center">Loading...</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-background flex flex-col min-w-0 overflow-y-auto">
                    {/* Header Filters */}
                    <div className="p-6 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-48">
                                <SymbolSearch onSelect={(s) => { router.push(`/analysis/${s}`); setSelectedSymbol(s); }} />
                            </div>

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
                                            {selectedPeriods.length > 0 ? `${selectedPeriods.length} Periods` : "All Periods"}
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

                    <div className="p-6 space-y-8 max-w-6xl mx-auto w-full">
                        {!selectedSymbol ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                <p>Loading data...</p>
                            </div>
                        ) : selectedConcepts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-border/30 rounded-xl bg-muted/5">
                                <div className="p-4 rounded-full bg-muted/20 mb-4">
                                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium">No Metrics Selected</h3>
                                <p className="text-sm text-muted-foreground max-w-sm text-center mt-2">
                                    Select metrics from the sidebar to analyze their distribution and correlations.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* 1. Primary Histogram (Last Selected) */}
                                {primaryConcept && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium flex items-center gap-2">
                                                {primaryConcept}
                                                <span className="px-2 py-0.5 rounded-full bg-muted/40 text-[10px] text-muted-foreground uppercase tracking-wider">{primaryBase}</span>
                                            </h3>
                                        </div>

                                        {isLoading && !dataSet[primaryConcept] ? (
                                            <div className="h-[300px] w-full bg-muted/10 animate-pulse rounded-xl" />
                                        ) : (
                                            <MetricHistogram
                                                data={histogramData}
                                                concept={primaryConcept}
                                                base={primaryBase || ""}
                                                highlightDetails={highlightDetails}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* 2. Dynamic Scatter (If >= 1 Concept) */}

                                {/* Case A: Correlation vs Size (1 Concept) */}
                                {selectedConcepts.length === 1 && scope === 'market' && scatterData.length > 0 && (
                                    <div className="space-y-4 pt-8 border-t border-border/40 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">Correlation Analysis</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Comparing <span className="text-foreground font-medium">{selectedConcepts[0].concept}</span> vs <span className="text-foreground font-medium">Total Revenue (Size)</span>
                                                </p>
                                            </div>
                                        </div>

                                        <MetricScatter
                                            data={scatterData}
                                            xName={selectedConcepts[0].concept}
                                            yName="Total Revenue (Size)"
                                            highlightSymbol={selectedSymbol || ''}
                                            yScale="log"
                                        />

                                        <div className="bg-muted/10 p-4 rounded-lg text-xs text-muted-foreground">
                                            <p>Each point represents a company in the market. The Y-axis (Revenue) uses a logarithmic scale.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Case B: Concept A vs Concept B (2+ Concepts) */}
                                {selectedConcepts.length >= 2 && (
                                    <div className="space-y-4 pt-8 border-t border-border/40 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">Correlation Analysis</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Comparing <span className="text-foreground font-medium">{scatterMetricA.concept}</span> vs <span className="text-foreground font-medium">{scatterMetricB.concept}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <MetricScatter
                                            data={scatterData}
                                            xName={scatterMetricA.concept}
                                            yName={scatterMetricB.concept}
                                            highlightSymbol={selectedSymbol || ''}
                                            yScale="value"
                                        />

                                        <div className="bg-muted/10 p-4 rounded-lg text-xs text-muted-foreground">
                                            <p>Each point represents a company in the market. This chart reveals if there is a relationship between the two selected metrics (Linear Scale).</p>
                                        </div>
                                    </div>
                                )}

                                {(selectedConcepts.length >= 1 && scope === 'me') && (
                                    <div className="p-4 bg-muted/20 border border-border/50 rounded-lg text-sm text-muted-foreground text-center">
                                        Switch to <strong>Market Distribution</strong> to see correlation scatter plots.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
