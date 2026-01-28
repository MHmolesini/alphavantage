"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter, useSearchParams } from "next/navigation"
import { Trophy, Medal } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrophyDetailDialogProps {
    symbol: string
    children: React.ReactNode
    summary: {
        gold: number
        silver: number
        bronze: number
    }
}

export function TrophyDetailDialog({ symbol, children, summary }: TrophyDetailDialogProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            const params = new URLSearchParams(searchParams.toString())
            params.delete("show")
            router.push(`?${params.toString()}`, { scroll: false })
        }
    }

    return (
        <Dialog open={true} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-5xl h-[55vh] flex flex-col p-0 gap-0 bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0 text-foreground">
                    <div>
                        <DialogTitle className="text-3xl font-light tracking-tight">{symbol}</DialogTitle>
                        <DialogDescription>Ranking performance detail for the selected period.</DialogDescription>
                    </div>

                    <div className="flex gap-4 mr-8">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-yellow-500/10">
                                <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                            </div>
                            <span className="font-bold text-yellow-700 dark:text-yellow-400">{summary.gold}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-slate-400/10">
                                <Medal className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{summary.silver}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-orange-600/10">
                                <Medal className="h-4 w-4 text-orange-700 dark:text-orange-500" />
                            </div>
                            <span className="font-bold text-orange-700 dark:text-orange-400">{summary.bronze}</span>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    {children}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
