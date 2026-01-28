"use client"

import { LayoutDashboard, FileText, PieChart, Settings, Calculator, TrendingUp, ArrowUpRight, Trophy, Medal, Award } from "lucide-react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Sidebar({ className, currentSymbol }: { className?: string, currentSymbol?: string }) {
    const pathname = usePathname()
    const params = useParams()
    const urlSymbol = params.symbol as string | undefined

    // Use URL symbol if available, otherwise fallback to prop (dashboard state)
    const symbol = urlSymbol || currentSymbol

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Financial Dashboard
                    </h2>
                    <div className="space-y-1">
                        <Button
                            asChild
                            variant={pathname === "/" ? "secondary" : "ghost"}
                            className="w-full justify-start"
                        >
                            <Link href="/">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant={pathname.startsWith("/financials") ? "secondary" : "ghost"}
                            className={cn("w-full justify-start", !symbol && "opacity-50 pointer-events-none")}
                        >
                            <Link href={symbol ? `/financials/${symbol}` : '#'}>
                                <FileText className="mr-2 h-4 w-4" />
                                Financials
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant={pathname.startsWith("/analysis") ? "secondary" : "ghost"}
                            className={cn("w-full justify-start", !symbol && "opacity-50 pointer-events-none")}
                        >
                            <Link href={symbol ? `/analysis/${symbol}` : '#'}>
                                <PieChart className="mr-2 h-4 w-4" />
                                Analysis
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant={pathname.startsWith("/market") ? "secondary" : "ghost"}
                            className={cn("w-full justify-start", !symbol && "opacity-50 pointer-events-none")}
                        >
                            <Link href={symbol ? `/market/${symbol}` : '#'}>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Market
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant={pathname.startsWith("/tools") ? "secondary" : "ghost"}
                            className="w-full justify-start"
                        >
                            <Link href="/tools">
                                <Calculator className="mr-2 h-4 w-4" />
                                Tools
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Positions
                    </h2>
                    <div className="space-y-1">
                        <Button
                            asChild
                            variant={pathname.includes("/points") ? "secondary" : "ghost"}
                            className={cn("w-full justify-start pl-6", !symbol && "opacity-50 pointer-events-none")}
                        >
                            <Link href={symbol ? `/positions/${symbol}/points` : '#'}>
                                <Trophy className="mr-2 h-4 w-4 text-yellow-500/70" />
                                Points
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant={pathname.includes("/rankings") ? "secondary" : "ghost"}
                            className={cn("w-full justify-start pl-6", !symbol && "opacity-50 pointer-events-none")}
                        >
                            <Link href={symbol ? `/positions/${symbol}/rankings` : '#'}>
                                <Medal className="mr-2 h-4 w-4" />
                                Rankings
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant={pathname.includes("/positions/trophies") ? "secondary" : "ghost"}
                            className="w-full justify-start pl-6"
                        >
                            <Link href="/positions/trophies">
                                <Award className="mr-2 h-4 w-4 text-orange-500/70" />
                                Trophies
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="px-3 py-2 mt-auto">
                    <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start"
                    >
                        <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
