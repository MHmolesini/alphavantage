"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getSymbols } from "@/app/actions/financials"
import { Combobox } from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

interface SymbolSearchProps {
    className?: string
    variant?: "default" | "header"
}

export function SymbolSearch({ className, variant = "default" }: SymbolSearchProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [symbols, setSymbols] = useState<{ value: string; label: string }[]>([])

    useEffect(() => {
        async function loadSymbols() {
            const symbolsList = await getSymbols()
            const items = symbolsList.map(s => ({ value: s, label: s }))
            setSymbols(items)
        }
        loadSymbols()
    }, [])

    const handleSelect = (value: string) => {
        if (value) {
            // Determine current section
            if (pathname.startsWith("/financials")) {
                router.push(`/financials/${value}`)
            } else if (pathname.startsWith("/analysis")) {
                router.push(`/analysis/${value}`)
            } else if (pathname.startsWith("/market")) {
                router.push(`/market/${value}`)
            } else {
                // Default fallback
                router.push(`/analysis/${value}`)
            }
        }
    }

    return (
        <div className={cn("w-full transition-all duration-300", className)}>
            <Combobox
                items={symbols}
                placeholder={variant === "header" ? "Search..." : "Search symbol (e.g. HSY)..."}
                onSelect={handleSelect}
                className={cn(
                    "w-full",
                    variant === "header" && "h-9 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-0 focus-visible:border-primary/50"
                )}
            />
        </div>
    )
}
