"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { KPICards } from "@/components/home/kpi-cards"
import { SymbolSearch } from "@/components/home/symbol-search"
import { ConceptsTable } from "@/components/home/concepts-table"

export default function Home() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <section className="flex flex-col items-center justify-center space-y-4 py-8 text-center md:py-12 lg:py-24">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Financial Analysis Dashboard
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Deep dive into balance sheets, income statements, and key financial ratios.
          </p>
          <div className="w-full max-w-sm space-y-2 mx-auto">
            <SymbolSearch />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Market Overview</h2>
          <KPICards />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Key Concepts</h2>
          <ConceptsTable />
        </section>
      </div>
    </AppLayout>
  )
}
