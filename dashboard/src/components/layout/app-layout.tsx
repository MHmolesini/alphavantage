"use client"

import { Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export function AppLayout({ children, symbol }: { children: React.ReactNode, symbol?: string }) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="hidden md:block w-64 border-r">
                <Suspense fallback={<div className="w-64 h-full bg-muted/10" />}>
                    <Sidebar className="h-full" currentSymbol={symbol} />
                </Suspense>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header currentSymbol={symbol} />
                <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    )
}
