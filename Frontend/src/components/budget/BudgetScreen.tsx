"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/currency";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard, GradientCard } from "@/components/ui/Cards";
import { ProgressBar } from "@/components/ui/Progress";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { AlertTriangle, Plus, TrendingDown, CheckCircle2, Flame, Check, Sparkles, BrainCircuit, Trash2 } from "lucide-react";
import { CATEGORIES, Category } from "@/lib/data";

export function BudgetScreen() {
  const { isDark, budgets, addBudget, deleteBudget, isPremium, currencyConfig, t, triggerPremiumModal } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const expenseCategories = CATEGORIES.filter(c => !["salary", "freelance", "investment"].includes(c.id));
  const [selectedCat, setSelectedCat] = useState<Category>(expenseCategories[0]);

  const totalAllocated = budgets.reduce((a, b) => a + b.limit, 0);
  const totalSpent = budgets.reduce((a, b) => a + b.spent, 0);
  const overallPct = Math.round((totalSpent / (totalAllocated || 1)) * 100);
  const exceededCount = budgets.filter((b) => b.spent > b.limit).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "min-h-screen pb-36",
        isDark ? "bg-[#0B1120]" : "bg-[#F8FAFC]"
      )}
    >
      <TopBar title={t("nav_budget")} subtitle="Monthly Allocation" showNotification />

      {/* Hero Card */}
      <GradientCard
        gradient="from-[#1E3A8A] via-[#3730A3] to-[#4F46E5]"
        className="mx-5 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">
              Total Budget
            </p>
            <p className="text-white text-3xl font-black">{formatCurrency(totalAllocated, currencyConfig)}</p>
            <div className="flex items-center gap-2 mt-2">
              {exceededCount > 0 ? (
                <div className="flex items-center gap-1 bg-rose-500/20 px-2 py-0.5 rounded-full">
                  <Flame size={12} className="text-rose-400" />
                  <span className="text-rose-400 text-[10px] font-bold">{exceededCount} Exceeded</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span className="text-emerald-400 text-[10px] font-bold">On Track</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[10px] font-bold uppercase">{t("budget_left")}</p>
            <p className="text-white font-bold text-lg">{formatCurrency(totalAllocated - totalSpent, currencyConfig)}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <span className="text-white/60 text-xs font-bold uppercase">Overall Spending</span>
            <span className={cn("text-xs font-black", overallPct > 100 ? "text-rose-400" : "text-white")}>{overallPct}%</span>
          </div>
          <ProgressBar
            value={overallPct}
            gradient="from-emerald-400 to-indigo-400"
            bgColor="bg-white/10"
            height="h-3.5"
            exceeded={overallPct > 100}
            glow={overallPct > 90}
            glowColor={overallPct > 100 ? "#F43F5E" : "#10B981"}
          />
        </div>
      </GradientCard>

      {/* AI Suggestions (Premium) */}
      <div className="mx-5 mt-6">
        <GlassCard 
          isDark={isDark} 
          onClick={() => {
            if (!isPremium) {
              triggerPremiumModal("AI Budget Insights analyze your spending patterns across categories to suggest optimal limits. Unlock this with Premium.");
            }
          }}
          className={cn(
            "p-4 border-l-4 transition-all",
            isPremium ? "border-amber-400" : "border-slate-400 opacity-80 cursor-pointer hover:bg-white/[0.03]"
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isPremium ? "bg-amber-400/10 text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
              {isPremium ? <BrainCircuit size={18} /> : <Sparkles size={18} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("text-[10px] font-black uppercase tracking-widest", isPremium ? "text-amber-500" : "text-slate-500")}>{t("dash_insight_title")}</span>
                {!isPremium && (
                  <div className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Premium</span>
                  </div>
                )}
              </div>
              <p className={cn("text-sm font-semibold italic", isDark ? "text-slate-300" : "text-slate-600")}>
                {isPremium 
                  ? "You've been spending less on Transport. I suggest moving ₹2,000 to your 'Shopping' budget for better balance." 
                  : "Tap to unlock AI recommendations and optimize your monthly allocation."}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Categories */}
      <div className="mx-5 mt-8 mb-4 flex items-center justify-between">
        <h3 className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-800")}>{t("category")}</h3>
        <button 
          onClick={() => setShowAddBudget(true)}
          className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="mx-5 space-y-4">
        {budgets.map((budget) => {
          const pct = Math.round((budget.spent / budget.limit) * 100);
          const isExceeded = budget.spent > budget.limit;

          return (
            <motion.div
              key={budget.id}
              onClick={() => setSelected(selected === budget.id ? null : budget.id)}
            >
              <GlassCard
                isDark={isDark}
                className={cn(
                  "p-4 transition-all border-2",
                  isExceeded ? "border-rose-500/20 bg-rose-500/[0.02]" : "border-transparent"
                )}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-2xl">
                    {budget.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn("font-black text-sm", isDark ? "text-white" : "text-slate-800")}>{CATEGORIES.find(c => c.id === budget.category)?.name ?? budget.category}</h4>
                      <div className="text-right">
                        <span className={cn("text-sm font-black", isExceeded ? "text-rose-500" : isDark ? "text-white" : "text-slate-800")}>
                          {formatCurrency(budget.spent, currencyConfig)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold"> / {formatCurrency(budget.limit, currencyConfig)}</span>
                      </div>
                    </div>
                    <ProgressBar 
                      value={pct}
                      gradient={isExceeded ? "from-rose-500 to-rose-400" : "from-indigo-600 to-indigo-400"}
                      bgColor={isDark ? "bg-white/5" : "bg-slate-100"}
                      height="h-2"
                      exceeded={isExceeded}
                      glow={isExceeded}
                      glowColor="#F43F5E"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {selected === budget.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-4 mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Status</p>
                          <p className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-800")}>
                            {isExceeded ? "Over Budget" : "On Track"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Projected End</p>
                          <p className={cn("text-lg font-black text-amber-500")}>
                            {formatCurrency(budget.spent * 1.2, currencyConfig)}
                          </p>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <div className="mt-3">
                        {confirmDelete === budget.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBudget(budget.id);
                                setSelected(null);
                                setConfirmDelete(null);
                              }}
                              className="flex-1 py-3 rounded-2xl bg-rose-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/30"
                            >
                              ✓ Confirm Delete
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                              className={cn(
                                "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border",
                                isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                              )}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(budget.id); }}
                            className={cn(
                              "w-full py-3 rounded-2xl flex items-center justify-center gap-2 border text-xs font-black uppercase tracking-widest transition-all",
                              isDark
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                                : "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100"
                            )}
                          >
                            <Trash2 size={14} />
                            Delete Budget
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isExceeded && (
                  <div className="mt-3 flex items-center gap-2 text-rose-500 animate-pulse">
                    <AlertTriangle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Overspending Alert: Budget Exceeded</span>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <BottomSheet open={showAddBudget} onClose={() => setShowAddBudget(false)} isDark={isDark} title="Custom Allocation" subtitle="Manage your limits">
        <div className="px-5 pb-10 space-y-6">
          <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-white/5 border border-indigo-100 dark:border-white/5">
             <p className="text-[10px] font-black uppercase text-indigo-500 mb-3">{t("category")}</p>
             <div className="grid grid-cols-2 gap-2">
               {expenseCategories.map(cat => (
                 <button
                   key={cat.id}
                   onClick={() => setSelectedCat(cat)}
                   className={cn(
                     "flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-left transition-all",
                     selectedCat.id === cat.id
                       ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-500/30"
                       : isDark
                         ? "bg-white/5 border-white/10 hover:bg-white/10"
                         : "bg-white border-slate-200 hover:bg-slate-50"
                   )}
                 >
                   <span className="text-xl">{cat.icon}</span>
                   <span className={cn(
                     "text-xs font-semibold",
                     selectedCat.id === cat.id ? "text-white" : isDark ? "text-slate-300" : "text-slate-700"
                   )}>{cat.name}</span>
                 </button>
               ))}
             </div>
          </div>
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Monthly Amount</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-400">{currencyConfig.symbol}</span>
              <input
                type="number"
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                placeholder="5,000"
                className={cn(
                  "bg-transparent text-3xl font-black outline-none w-full",
                  isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-300"
                )}
              />
            </div>
          </div>
          <button 
            onClick={() => {
              if (!newBudgetAmount) return;
              addBudget({ category: selectedCat.id, limit: parseFloat(newBudgetAmount), icon: selectedCat.icon });
              setBudgetSaved(true);
              setTimeout(() => {
                setBudgetSaved(false);
                setShowAddBudget(false);
                setNewBudgetAmount("");
                setSelectedCat(expenseCategories[0]);
              }, 1200);
            }}
            className="w-full py-5 rounded-3xl bg-indigo-600 text-white font-black text-lg shadow-xl shadow-indigo-500/30"
          >
            {budgetSaved ? t("saved") : "Set Budget Limit"}
          </button>
        </div>
      </BottomSheet>
    </motion.div>
  );
}
