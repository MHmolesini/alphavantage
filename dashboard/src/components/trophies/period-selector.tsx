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

    const handleSelect = (period: string) => {
        setOpen(false)
        const params = new URLSearchParams(searchParams.toString())
        if (period === "all") {
            params.delete("period")
        } else {
            params.set("period", period)
        }
        router.push(`?${params.toString()}`, { scroll: false })
    }

    const displayText = currentPeriod
        ? periods.find(p => p === currentPeriod) || "Select Quarter"
        : "Latest Quarter"

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[180px] justify-between h-9 text-xs"
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 opacity-70" />
                        <span>{displayText}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[180px] p-0 border border-border/50 rounded-xl overflow-hidden shadow-xl bg-background/95 backdrop-blur-md">
                <Command className="bg-transparent text-foreground">
                    <CommandInput
                        placeholder="Search period..."
                        className="h-9 text-xs border-b border-border/40 bg-transparent"
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                        <CommandEmpty className="py-2 text-xs text-muted-foreground font-light text-center">
                            No period found.
                        </CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="latest"
                                onSelect={() => handleSelect("all")}
                                className={cn(
                                    "cursor-pointer rounded-lg px-2 py-1.5 my-0.5 text-xs transition-colors duration-200",
                                    !currentPeriod ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                                )}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-3 w-3 shrink-0 transition-opacity",
                                        !currentPeriod ? "opacity-100 text-primary" : "opacity-0"
                                    )}
                                />
                                <span className="font-medium tracking-wide">Latest Quarter</span>
                            </CommandItem>
                            {periods.map((period) => (
                                <CommandItem
                                    key={period}
                                    value={period}
                                    onSelect={() => handleSelect(period)}
                                    className={cn(
                                        "cursor-pointer rounded-lg px-2 py-1.5 my-0.5 text-xs transition-colors duration-200",
                                        currentPeriod === period ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                                    )}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-3 w-3 shrink-0 transition-opacity",
                                            currentPeriod === period ? "opacity-100 text-primary" : "opacity-0"
                                        )}
                                    />
                                    <span className="font-medium tracking-wide">{period}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
