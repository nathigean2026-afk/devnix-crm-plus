"use client"

import { cn } from "@/lib/utils"

export function StatCard({ icon: Icon, label, value, sub, color, onClick, active, darkMode = true }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color: string; onClick?: () => void; active?: boolean; darkMode?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{ minWidth: 0 }}
      className={cn(
        "rounded-xl border p-3 flex flex-col gap-2 text-left transition-all w-full overflow-hidden",
        onClick ? "cursor-pointer" : "cursor-default",
        darkMode
          ? active ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/10" : "border-white/8 bg-white/4 hover:border-white/16 hover:bg-white/6"
          : active ? "border-primary/40 bg-primary/5 shadow-sm" : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow",
      )}
    >
      <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0", color)}>
        <Icon className="size-3.5 text-white" />
      </div>
      <div className="min-w-0 w-full">
        <p className={cn("text-lg font-bold leading-none tabular-nums truncate", darkMode ? "text-white" : "text-slate-800")}>{value}</p>
        <p className={cn("text-[10px] mt-1 leading-snug truncate", darkMode ? "text-white/45" : "text-slate-500")}>{label}</p>
        {sub && <p className={cn("text-[9px] mt-0.5 leading-tight truncate", darkMode ? "text-white/25" : "text-slate-400")}>{sub}</p>}
      </div>
    </button>
  )
}
