import { Trophy, Medal } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrophyCardProps {
    symbol: string
    gold: number
    silver: number
    bronze: number
}

export function TrophyCard({ symbol, gold, silver, bronze }: TrophyCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-3xl font-light tracking-tight">{symbol}</h3>
                    {/* Optional: Add a sparkline or mini chart here if data allows later */}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {/* Gold - Position 1 */}
                    <div className="flex flex-col items-center justify-center space-y-2 p-3 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/5 group-hover:bg-yellow-500/20 transition-colors">
                        <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                            <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                        </div>
                        <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{gold}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">1st Place</span>
                    </div>

                    {/* Silver - Position 2 */}
                    <div className="flex flex-col items-center justify-center space-y-2 p-3 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-800/80 transition-colors">
                        <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-700/50">
                            <Medal className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                        </div>
                        <span className="text-xl font-semibold text-slate-700 dark:text-slate-300">{silver}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">2nd Place</span>
                    </div>

                    {/* Bronze - Position 3 */}
                    <div className="flex flex-col items-center justify-center space-y-2 p-3 rounded-lg bg-orange-100/50 dark:bg-orange-900/10 group-hover:bg-orange-100/80 dark:group-hover:bg-orange-900/20 transition-colors">
                        <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-900/20">
                            <Medal className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                        </div>
                        <span className="text-lg font-medium text-orange-700 dark:text-orange-400">{bronze}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">3rd Place</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                    <span>Total Podiums</span>
                    <span className="font-mono font-medium">{gold + silver + bronze}</span>
                </div>
            </div>

            {/* Gradient Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    )
}
