"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/Cards";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { ProgressBar } from "@/components/ui/Progress";
import { getProgressPercent } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { PieChart } from "lucide-react";
import { CATEGORIES } from "@/lib/data";

export function BudgetSummary({ isDark }: { isDark: boolean }) {
  const { currencyConfig, budgets, setScreen } = useApp();

  const currentMonth = new Date().toLocaleString("en-US", { month: "long" });

  if (budgets.length === 0) {
    return (
      <GlassCard isDark={isDark} className="mx-5" delay={0.3}>
        <div className="flex flex-col items-center gap-3 py-8 px-5">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isDark ? "bg-slate-800" : "bg-slate-100")}>
            <PieChart size={22} className={isDark ? "text-slate-500" : "text-slate-400"} />
          </div>
          <div className="text-center">
            <p className={cn("font-bold text-sm", isDark ? "text-white" : "text-slate-800")}>No budgets yet</p>
            <p className={cn("text-xs mt-1", isDark ? "text-slate-500" : "text-slate-400")}>Set up budgets to track your spending limits</p>
          </div>
          <button
            onClick={() => setScreen("budget")}
            className="mt-1 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/30"
          >
            Create Budget
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard isDark={isDark} className="mx-5" delay={0.3}>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn("font-bold text-base", isDark ? "text-white" : "text-slate-800")}>
            Budget Overview
          </h2>
          <span className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-xl",
            isDark ? "text-indigo-400 bg-indigo-500/10" : "text-indigo-600 bg-indigo-50"
          )}>{currentMonth}</span>
        </div>

        <div className="space-y-4">
          {budgets.slice(0, 3).map((budget, i) => {
            const pct = getProgressPercent(budget.spent, budget.limit);
            const exceeded = budget.spent > budget.limit;

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.35 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{budget.icon}</span>
                    <span className={cn(
                      "text-sm font-medium",
                      isDark ? "text-slate-300" : "text-slate-700"
                    )}>
                      {CATEGORIES.find(c => c.id === budget.category)?.name ?? budget.category}
                    </span>
                    {exceeded && (
                      <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                        Over
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-xs font-semibold",
                      exceeded ? "text-rose-500" : isDark ? "text-slate-300" : "text-slate-700"
                    )}>
                      {formatCurrency(budget.spent, currencyConfig)}
                    </span>
                    <span className={cn(
                      "text-xs",
                      isDark ? "text-slate-500" : "text-slate-400"
                    )}>
                      {" "}/ {formatCurrency(budget.limit, currencyConfig)}
                    </span>
                  </div>
                </div>
                <ProgressBar
                  value={pct}
                  gradient={"from-indigo-500 to-indigo-400"}
                  bgColor={isDark ? "bg-slate-800" : "bg-slate-100"}
                  height="h-2"
                  glow={exceeded}
                  glowColor={exceeded ? "#EF4444" : "#6366F1"}
                  exceeded={exceeded}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
