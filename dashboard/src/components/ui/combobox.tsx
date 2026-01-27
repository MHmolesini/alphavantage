"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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

export interface ComboboxProps {
    items: { value: string; label: string }[]
    placeholder?: string
    emptyText?: string
    onSelect: (value: string) => void
    className?: string
}

export function Combobox({ items, placeholder = "Select...", emptyText = "No item found.", onSelect, className }: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                >
                    {value
                        ? items.find((item) => item.value === value)?.label
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border border-border/50 rounded-xl overflow-hidden shadow-xl bg-background/95 backdrop-blur-md">
                <Command className="bg-transparent text-foreground">
                    <CommandInput
                        placeholder={placeholder}
                        className="h-12 border-b border-border/40 text-sm font-medium bg-transparent"
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                        <CommandEmpty className="py-6 text-sm text-muted-foreground font-light text-center">
                            {emptyText}
                        </CommandEmpty>
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.value}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                        onSelect(item.value) // Pass original casing if needed, but cmdk lowercases
                                    }}
                                    className={cn(
                                        "cursor-pointer rounded-lg px-4 py-3 my-1 text-sm transition-colors duration-200",
                                        "aria-selected:bg-primary/10 aria-selected:text-primary",
                                        "hover:bg-muted/50 data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                                    )}
                                >
                                    <Check
                                        className={cn(
                                            "mr-3 h-4 w-4 shrink-0 transition-opacity",
                                            value === item.value ? "opacity-100 text-primary" : "opacity-0"
                                        )}
                                    />
                                    <span className="font-medium tracking-wide text-foreground/90">{item.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
