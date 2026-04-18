"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import dynamic from "next/dynamic";
const BalanceCard = dynamic(() => import("./BalanceCard").then(mod => mod.BalanceCard), { ssr: false, loading: () => <div className="h-48 w-full bg-slate-800/20 animate-pulse rounded-[32px] mx-5 mt-6 mb-8" /> });
const TransactionList = dynamic(() => import("./TransactionList").then(mod => mod.TransactionList), { loading: () => <div className="h-64 mt-4 w-full bg-slate-100/50 animate-pulse rounded-t-3xl" /> });
const BudgetSummary = dynamic(() => import("./BudgetSummary").then(mod => mod.BudgetSummary), { loading: () => <div className="h-40 w-full px-5 flex gap-4 overflow-hidden"><div className="w-1/2 h-full bg-slate-800/10 animate-pulse rounded-[28px]"></div></div> });
import { cn, formatCompact } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { CircularRing } from "@/components/ui/Progress";

const QUICK_STATS = [
  {
    label: "Savings Rate",
    value: 46,
    gradient: ["#10B981", "#34D399"] as [string, string],
    display: "46%",
    sub: "this month",
    id: "savings-qs",
  },
  {
    label: "Budget Used",
    value: 71,
    gradient: ["#F59E0B", "#FBBF24"] as [string, string],
    display: "71%",
    sub: "of total",
    id: "budget-qs",
  },
  {
    label: "Net Worth",
    value: 82,
    gradient: ["#4F46E5", "#6366F1"] as [string, string],
    display: "+8.2%",
    sub: "growth",
    id: "net-qs",
  },
];

import { Sparkles, ArrowRight, BrainCircuit, TrendingDown, Plus, Mic, Crown, Lock, ScanLine, MessageSquare, Target } from "lucide-react";
import { GlassCard } from "@/components/ui/Cards";
import { formatCurrency } from "@/lib/currency";
import { CATEGORIES } from "@/lib/data";

export function Dashboard() {
  const { isDark, isPremium, setScreen, balance, currencyConfig, t, language, transactions, budgets, addTransaction, addNotification, triggerPremiumModal, aiToolUsageCount, aiQueryCount, financialGoals, setAddExpenseInitialMode } = useApp();
  const [isMounted, setIsMounted] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    setIsMounted(true);
    setToday(new Date().toLocaleDateString(language === "Tamil" ? "ta-IN" : "en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }));
  }, [language]);


  // Compute top spending category from real transactions
  const catSpend: Record<string, number> = {};
  transactions.filter(tx => tx.type === "expense").forEach(tx => {
    catSpend[tx.category] = (catSpend[tx.category] || 0) + tx.amount;
  });
  const topCatId = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topCatName = topCatId ? (CATEGORIES.find(c => c.id === topCatId)?.name ?? topCatId) : "—";

  // Compute total budget left
  const totalBudgetLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalBudgetSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const budgetLeft = Math.max(0, totalBudgetLimit - totalBudgetSpent);

  if (!isMounted) return null;

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "min-h-screen pb-36",
        isDark ? "bg-[#0B1120]" : "bg-[#F8FAFC]"
      ) }
    >
      <TopBar
        subtitle={today}
        title={t("dash_title")}
        showNotification
        showSettings
      />

      {/* AI Insight Card (Premium / Free variants) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-6"
      >
        <GlassCard
          isDark={isDark}
          className={cn(
            "p-4 border-l-4",
            isPremium ? "border-amber-400 bg-amber-400/5" : "border-indigo-500 bg-indigo-500/5"
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0",
              isPremium ? "bg-amber-400/10 text-amber-400" : "bg-indigo-500/10 text-indigo-500"
            )}>
              {isPremium ? <BrainCircuit size={20} /> : <Sparkles size={20} />}
            </div>
            <div className="flex-1">
              <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-slate-500")}>
                {isPremium ? t("dash_ai_prediction") : t("dash_insight_title")}
              </h4>
              <p className={cn("text-sm font-semibold leading-tight", isDark ? "text-white" : "text-slate-800")}>
                {!isMounted ? "..." : isPremium 
                  ? `At your current rate, you'll save ${currencyConfig.symbol}${formatCompact(12400)} more than last month. Keep it up!` 
                  : `You've spent more on Food this week. Try to save ${currencyConfig.symbol}500 more!`}
              </p>
            </div>
            <button 
              onClick={() => {
                if (isPremium) setScreen("assistant");
                else triggerPremiumModal("The AI Assistant provides deep financial analysis and personalized coaching. Unlock it with Premium.");
              }}
              className={cn("p-2 rounded-xl", isDark ? "bg-white/5" : "bg-slate-100")}
            >
              {isPremium ? <ArrowRight size={16} className={isDark ? "text-slate-400" : "text-slate-600"} /> : <Crown size={16} className="text-amber-500" />}
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Free Plan Usage Card (non-premium only) */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="px-5 mb-6"
        >
          <div className={cn(
            "rounded-[28px] overflow-hidden border",
            isDark ? "bg-slate-900/80 border-white/[0.08]" : "bg-white/80 border-slate-100",
            "backdrop-blur-xl"
          )}>
            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <p className={cn("text-xs font-black", isDark ? "text-white" : "text-slate-800")}>Free Plan</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Usage Limits</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => triggerPremiumModal("Upgrade to Premium for unlimited AI features, no ads, and advanced analytics.")}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm shadow-amber-500/20 flex items-center gap-1"
              >
                <Crown size={10} /> Upgrade
              </motion.button>
            </div>

            {/* Usage Meters */}
            <div className="px-5 pb-4 space-y-3">
              {[
                {
                  icon: <Mic size={14} className="text-indigo-400" />,
                  label: "Voice & Scanner",
                  used: aiToolUsageCount,
                  total: 3,
                  color: "#6366F1",
                  gradient: "from-indigo-500 to-violet-500",
                },
                {
                  icon: <MessageSquare size={14} className="text-emerald-400" />,
                  label: "AI Chat Queries",
                  used: aiQueryCount,
                  total: 3,
                  color: "#10B981",
                  gradient: "from-emerald-500 to-teal-500",
                },
                {
                  icon: <Target size={14} className="text-amber-400" />,
                  label: "Smart Goals",
                  used: financialGoals.length,
                  total: 2,
                  color: "#F59E0B",
                  gradient: "from-amber-500 to-orange-500",
                },
              ].map((meter) => {
                const pct = Math.min(100, (meter.used / meter.total) * 100);
                const isMaxed = meter.used >= meter.total;
                return (
                  <div key={meter.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", isDark ? "bg-white/5" : "bg-slate-50")}>
                          {meter.icon}
                        </div>
                        <span className={cn("text-[11px] font-bold", isDark ? "text-slate-300" : "text-slate-600")}>{meter.label}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black",
                        isMaxed ? "text-rose-500" : isDark ? "text-slate-400" : "text-slate-500"
                      )}>
                        {isMaxed ? (
                          <span className="flex items-center gap-1"><Lock size={9} /> Limit reached</span>
                        ) : (
                          `${meter.used} / ${meter.total}`
                        )}
                      </span>
                    </div>
                    <div className={cn("w-full h-1.5 rounded-full overflow-hidden", isDark ? "bg-white/5" : "bg-slate-100")}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r",
                          isMaxed ? "from-rose-500 to-red-500" : meter.gradient
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Premium teaser */}
            <div className={cn(
              "px-5 py-3 border-t flex items-center justify-between",
              isDark ? "border-white/[0.05] bg-amber-500/[0.03]" : "border-slate-100 bg-amber-50/50"
            )}>
              <p className="text-[10px] font-bold text-amber-600/80">
                <Crown size={10} className="inline mr-1 text-amber-500" />
                Premium = Unlimited everything + No ads
              </p>
              <ArrowRight size={12} className="text-amber-500" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Balance Hero Card */}
      <BalanceCard isDark={isDark} />

      {/* Quick Actions / Stats */}
      <div className="grid grid-cols-2 gap-3 px-5 mt-6">
        <GlassCard
          isDark={isDark}
          className="p-4 flex flex-col gap-2"
          onClick={() => setScreen("reports")}
        >
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <TrendingDown size={18} />
          </div>
          <div>
            <p className={cn("text-[10px] font-bold uppercase text-slate-500")}>{t("top_category")}</p>
            <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-slate-800")}>{topCatName}</p>
          </div>
        </GlassCard>
        
        <GlassCard
          isDark={isDark}
          className="p-4 flex flex-col gap-2"
          onClick={() => setScreen("budget")}
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <p className={cn("text-[10px] font-bold uppercase text-slate-500")}>{t("budget_left")}</p>
            <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-slate-800")}>
              {formatCurrency(budgetLeft, currencyConfig)}
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Budget Summary Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between px-6 mb-4">
          <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-slate-800")}>{t("active_budgets")}</h3>
          <button onClick={() => setScreen("budget")} className="text-indigo-500 text-xs font-bold">{t("dash_view_all")}</button>
        </div>
        <BudgetSummary isDark={isDark} />
      </div>

      {/* Transaction List */}
      <div className="mt-8">
        <div className="flex items-center justify-between px-6 mb-4">
          <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-slate-800")}>{t("dash_recent")}</h3>
        </div>
        <TransactionList isDark={isDark} />
      </div>

      {/* Quick Voice Add FAB (navigates to Voice section of Add Expense) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setAddExpenseInitialMode("voice");
          setScreen("add-expense");
        }}
        className={cn(
          "fixed bottom-28 right-6 w-14 h-14 rounded-full shadow-2xl shadow-indigo-500/20 flex items-center justify-center z-50 border-4 transition-all cursor-pointer bg-indigo-600 text-white",
          isDark ? "border-slate-900" : "border-slate-50"
        )}
      >
        <Mic size={26} strokeWidth={2.5} />
      </motion.button>
    </motion.div>
  );
}
