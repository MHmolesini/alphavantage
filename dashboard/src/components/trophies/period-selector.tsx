"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Calendar } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface PeriodSelectorProps {
    periods: string[]
    currentPeriod?: string
}

export function PeriodSelector({ periods, currentPeriod }: PeriodSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Parse current selection from URL
    const selectedPeriods = currentPeriod ? currentPeriod.split(",") : []

    const handleSelect = (period: string) => {
        let newSelection = [...selectedPeriods]

        if (period === "all") {
            // Select only latest (clear param)
            newSelection = []
            const params = new URLSearchParams(searchParams.toString())
            params.delete("period")
            router.push(`?${params.toString()}`, { scroll: false })
            setOpen(false)
            return
        }

        if (newSelection.includes(period)) {
            newSelection = newSelection.filter(p => p !== period)
        } else {
            newSelection.push(period)
        }

        const params = new URLSearchParams(searchParams.toString())
        if (newSelection.length > 0) {
            params.set("period", newSelection.join(","))
        } else {
            params.delete("period")
        }
        router.push(`?${params.toString()}`, { scroll: false })
        // Keep open for multiple selection
    }

    const displayText = selectedPeriods.length > 0
        ? `${selectedPeriods.length} Selected`
        : "Latest Quarter"

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-[180px] justify-between h-9 text-xs border-border/50 transition-all duration-200",
                        open && "rounded-b-none border-b-0 bg-secondary/50"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 opacity-70" />
                        <span>{displayText}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[180px] p-0 border border-border/50 rounded-b-xl rounded-t-none border-t-0 shadow-xl bg-background/95 backdrop-blur-md"
                align="start"
                sideOffset={0}
            >
                <Command className="bg-transparent text-foreground">
                    <CommandInput
                        placeholder="Search period..."
                        className="h-9 text-xs border-b border-border/40 bg-transparent"
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <CommandEmpty className="py-2 text-xs text-muted-foreground font-light text-center">
                            No period found.
                        </CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="latest"
                                onSelect={() => handleSelect("all")}
                                className={cn(
                                    "cursor-pointer rounded-lg px-2 py-1.5 my-0.5 text-xs transition-colors duration-200",
                                    selectedPeriods.length === 0 ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                                )}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-3 w-3 shrink-0 transition-opacity",
                                        selectedPeriods.length === 0 ? "opacity-100 text-primary" : "opacity-0"
                                    )}
                                />
                                <span className="font-medium tracking-wide">Latest Quarter (Default)</span>
                            </CommandItem>
                            {periods.map((period) => {
                                const isSelected = selectedPeriods.includes(period)
                                return (
                                    <CommandItem
                                        key={period}
                                        value={period}
                                        onSelect={() => handleSelect(period)}
                                        className={cn(
                                            "cursor-pointer rounded-lg px-2 py-1.5 my-0.5 text-xs transition-colors duration-200",
                                            isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "mr-2 flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border border-primary/30",
                                            isSelected ? "bg-primary text-primary-foreground border-primary" : "opacity-50 [&_svg]:invisible"
                                        )}>
                                            <Check className={cn("h-3 w-3")} />
                                        </div>
                                        <span className="font-medium tracking-wide">{period}</span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
