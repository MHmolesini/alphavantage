"use client"

import { Search, Bell, Menu } from "lucide-react"
import { useState } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { SymbolSearch } from "@/components/search/symbol-search"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"

export function Header({ currentSymbol }: { currentSymbol?: string }) {
    const [open, setOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 md:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72">
                            <SheetTitle className="sr-only">Menu</SheetTitle>
                            <Sidebar className="border-none" currentSymbol={currentSymbol} onNavigate={() => setOpen(false)} />
                        </SheetContent>
                    </Sheet>
                </div>
                <div className="mr-4 hidden md:flex">
                    <a className="mr-6 flex items-center space-x-2 font-bold" href="/">
                        LOGO
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        <div className="w-full md:w-[300px] lg:w-[400px]">
                            <SymbolSearch variant="header" />
                        </div>
                    </div>
                    <nav className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <ThemeToggle />
                    </nav>
                </div>
            </div>
        </header>
    )
}
