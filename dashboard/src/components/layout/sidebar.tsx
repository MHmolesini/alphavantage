"use client"

import { LayoutDashboard, FileText, PieChart, Settings, Calculator, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname()
    const params = useParams()
    const symbol = params.symbol as string | undefined

    const sidebarItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        {
            icon: FileText,
            label: "Financials",
            href: symbol ? `/financials/${symbol}` : "/financials",
            disabled: !symbol
        },
        {
            icon: PieChart,
            label: "Analysis",
            href: symbol ? `/analysis/${symbol}` : "/analysis",
            disabled: !symbol
        },
        {
            icon: TrendingUp,
            label: "Market",
            href: symbol ? `/market/${symbol}` : "/market",
            disabled: !symbol
        },
        { icon: Calculator, label: "Tools", href: "/tools" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ]

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Financial Dashboard
                    </h2>
                    <div className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Button
                                key={item.label}
                                variant={pathname.startsWith(item.href) && item.href !== "/" ? "secondary" : (pathname === "/" && item.href === "/" ? "secondary" : "ghost")}
                                className={cn("w-full justify-start", item.disabled && "opacity-50 pointer-events-none")}
                                asChild={!item.disabled}
                            >
                                {item.disabled ? (
                                    <div className="flex items-center">
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.label}
                                    </div>
                                ) : (
                                    <Link href={item.href}>
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.label}
                                    </Link>
                                )}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
