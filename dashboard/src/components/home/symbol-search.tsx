"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSymbols } from "@/app/actions/financials"
import { Combobox } from "@/components/ui/combobox"

export function SymbolSearch() {
    const router = useRouter()
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
            router.push(`/analysis/${value}`)
        }
    }

    return (
        <div className="w-full max-w-sm">
            <Combobox
                items={symbols}
                placeholder="Search symbol (e.g. HSY)..."
                onSelect={handleSelect}
            />
        </div>
    )
}
