"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp, IncomeSource } from "@/context/AppContext";
import { formatCurrency } from "@/lib/currency";
import { BottomSheet } from "./BottomSheet";
import { Check, ChevronRight, Unlink, AlertTriangle } from "lucide-react";

interface IncomeSourcePickerProps {
  selectedId: string;
  onSelect: (incomeTransactionId: string) => void;
  isDark: boolean;
  /** Current expense amount — used to warn if it would exceed remaining */
  expenseAmount?: number;
}

export function IncomeSourcePicker({
  selectedId,
  onSelect,
  isDark,
  expenseAmount = 0,
}: IncomeSourcePickerProps) {
  const { incomeSourcesWithBalance, categories, currencyConfig } = useApp();
  const [isOpen, setIsOpen] = React.useState(false);

  const selected = incomeSourcesWithBalance.find(s => s.id === selectedId);

  function getRemainingCls(remaining: number, amount: number) {
    if (remaining <= 0) return "text-rose-500 bg-rose-500/10";
    const pct = remaining / amount;
    if (pct < 0.2) return "text-amber-500 bg-amber-500/10";
    return "text-emerald-500 bg-emerald-500/10";
  }

  function getCategoryMeta(catId: string) {
    return categories.find(c => c.id === catId);
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98]",
          isDark
            ? "bg-slate-900/50 border-white/10"
            : "bg-white border-slate-100",
          !selected && (isDark ? "text-slate-500" : "text-slate-400")
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {selected ? (() => {
            const cat = getCategoryMeta(selected.category);
            return (
              <>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-lg"
                  style={{
                    backgroundColor: `${cat?.color ?? "#6366F1"}20`,
                    color: cat?.color ?? "#6366F1",
                  }}
                >
                  {cat?.icon ?? "💰"}
                </div>
                <div className="text-left min-w-0">
                  <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-slate-900")}>
                    {selected.title}
                  </p>
                  <span
                    className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-full inline-block mt-0.5",
                      getRemainingCls(selected.remaining, selected.amount)
                    )}
                  >
                    {formatCurrency(selected.remaining, currencyConfig)} remaining
                  </span>
                </div>
              </>
            );
          })() : (
            <>
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border-2 border-dashed shrink-0",
                  isDark ? "border-white/10" : "border-slate-200"
                )}
              >
                <span className="text-base opacity-30">💰</span>
              </div>
              <p className="text-sm font-medium">Select Income Source</p>
            </>
          )}
        </div>
        <ChevronRight size={18} className="opacity-40 shrink-0" />
      </button>

      {/* Overspend warning */}
      <AnimatePresence>
        {selected && expenseAmount > 0 && expenseAmount > selected.remaining && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 mx-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle size={13} className="text-amber-500 shrink-0" />
              <p className="text-[10px] font-bold text-amber-500">
                Expense ({formatCurrency(expenseAmount, currencyConfig)}) exceeds remaining balance ({formatCurrency(selected.remaining, currencyConfig)})
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom sheet picker */}
      <BottomSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        isDark={isDark}
        title="Select Income Source"
      >
        <div className="p-5 space-y-3">
          {/* None option */}
          <button
            onClick={() => { onSelect(""); setIsOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
              selectedId === ""
                ? (isDark ? "bg-white/5 border-white/20" : "bg-slate-50 border-slate-200")
                : (isDark ? "bg-slate-800/40 border-transparent" : "bg-slate-50/50 border-transparent")
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isDark ? "bg-white/5" : "bg-slate-100")}>
              <Unlink size={18} className="opacity-40" />
            </div>
            <div className="flex-1">
              <p className={cn("text-sm font-bold", isDark ? "text-slate-300" : "text-slate-600")}>None / Unlinked</p>
              <p className="text-[10px] text-slate-500 font-medium">Don't associate with a specific income</p>
            </div>
            {selectedId === "" && <Check size={16} className="text-indigo-500 shrink-0" />}
          </button>

          {incomeSourcesWithBalance.length === 0 ? (
            <div className="text-center py-10 opacity-40">
              <p className="text-2xl mb-2">💰</p>
              <p className="text-sm font-bold">No income records yet</p>
              <p className="text-xs text-slate-500 mt-1">Add income transactions first</p>
            </div>
          ) : (
            incomeSourcesWithBalance.map((source) => {
              const cat = getCategoryMeta(source.category);
              const usedAmount = source.amount - source.remaining;
              const usedPct = source.amount > 0 ? Math.min((usedAmount / source.amount) * 100, 100) : 0;
              const chipCls = getRemainingCls(source.remaining, source.amount);
              const isSelected = selectedId === source.id;

              return (
                <button
                  key={source.id}
                  onClick={() => { onSelect(source.id); setIsOpen(false); }}
                  className={cn(
                    "w-full flex flex-col gap-3 p-4 rounded-2xl border transition-all text-left",
                    isSelected
                      ? (isDark ? "bg-white/5 border-white/20" : "bg-slate-50 border-slate-200")
                      : (isDark ? "bg-slate-800/40 border-transparent" : "bg-slate-50/50 border-transparent")
                  )}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${cat?.color ?? "#10B981"}20`, color: cat?.color ?? "#10B981" }}
                    >
                      {cat?.icon ?? "💰"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-black truncate", isDark ? "text-white" : "text-slate-900")}>
                        {source.title}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {new Date(source.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {isSelected && <Check size={16} className="text-indigo-500 shrink-0" />}
                  </div>

                  {/* Progress bar */}
                  <div className={cn("w-full h-1.5 rounded-full overflow-hidden", isDark ? "bg-white/5" : "bg-slate-200")}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${usedPct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat?.color ?? "#10B981" }}
                    />
                  </div>

                  {/* Amount row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                      <span>{formatCurrency(source.amount, currencyConfig)} total</span>
                      <span className="text-rose-500">— {formatCurrency(usedAmount, currencyConfig)} used</span>
                    </div>
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", chipCls)}>
                      {formatCurrency(source.remaining, currencyConfig)} left
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </BottomSheet>
    </>
  );
}
