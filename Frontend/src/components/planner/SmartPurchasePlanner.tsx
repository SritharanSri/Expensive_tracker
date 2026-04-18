"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/currency";
import { TopBar } from "@/components/layout/TopBar";
import {
  ShoppingCart,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Lightbulb,
  Calendar,
  Zap,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Shield,
  BarChart3,
  Wallet,
  RefreshCw,
  Crown,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Suggestion {
  type: "reduce_expense" | "adjust_budget" | "saving_goal";
  title: string;
  detail: string;
  impact: number;
  daysEarlier: number;
}
interface SavingPlan {
  monthlyTarget: number;
  dailyTarget: number;
  weeksToGoal: number;
  achievableBy: string;
}
interface PlannerAnalysis {
  verdict: "safe" | "risky" | "not_recommended";
  verdictReason: string;
  monthsToAfford: number;
  daysToAfford: number;
  monthlySavingNeeded: number;
  dailySavingNeeded: number;
  balanceAfterPurchase: number;
  willGoBelowZero: boolean;
  affectedBudgets: string[];
  budgetConflictMessage: string;
  suggestions: Suggestion[];
  savingPlan: SavingPlan;
  riskWarnings: string[];
  positiveSignals: string[];
  confidenceScore: number;
}

type Timeline = "asap" | "1month" | "3months" | "6months";

const TIMELINE_LABELS: Record<Timeline, string> = {
  asap: "ASAP",
  "1month": "1 Month",
  "3months": "3 Months",
  "6months": "6 Months",
};

const SUGGESTION_ICON = {
  reduce_expense: TrendingDown,
  adjust_budget: Target,
  saving_goal: Sparkles,
};
const SUGGESTION_COLOR = {
  reduce_expense: "text-rose-400 bg-rose-400/10",
  adjust_budget: "text-amber-400 bg-amber-400/10",
  saving_goal: "text-indigo-400 bg-indigo-400/10",
};

// ── Gradient progress bar ──────────────────────────────────────────────────────
function GradientBar({
  value,
  max,
  gradient,
  glow,
  glowColor,
}: {
  value: number;
  max: number;
  gradient: string;
  glow?: boolean;
  glowColor?: string;
}) {
  const pct = Math.min(100, (value / Math.max(max, 1)) * 100);
  return (
    <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full", gradient)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={glow ? { boxShadow: `0 0 10px ${glowColor ?? "#6366F1"}` } : {}}
      />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────────
export function SmartPurchasePlanner() {
  const { isDark, transactions, budgets, currencyConfig, isPremium, triggerPremiumModal, trackPremiumClick } = useApp();

  // ── Form state ──
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [timeline, setTimeline] = useState<Timeline>("3months");

  // ── Result state ──
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PlannerAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"verdict" | "plan" | "suggestions">("verdict");

  // ── Derived financial snapshot ──
  const snapshot = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyIncome = thisMonth.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
    const monthlyExpenses = thisMonth.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
    const balance = transactions.reduce((a, t) => (t.type === "income" ? a + t.amount : a - t.amount), 0);
    const monthlySavings = monthlyIncome - monthlyExpenses;

    return {
      balance,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      budgets: budgets.map((b) => ({
        category: b.category,
        limit: b.limit,
        spent: b.spent,
      })),
      currencySymbol: currencyConfig.symbol,
      currencyCode: currencyConfig.code,
    };
  }, [transactions, budgets, currencyConfig]);

  // ── Analyze ──
  const analyze = useCallback(async () => {
    if (!itemName.trim() || !itemPrice || isNaN(Number(itemPrice))) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/smart-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: itemName.trim(),
          itemPrice: Number(itemPrice),
          timeline,
          financialSnapshot: snapshot,
          isPremium,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setAnalysis(data.analysis);
      setActiveTab("verdict");
    } catch (e) {
      setError((e as Error).message || "Analysis failed. Check your API key.");
    } finally {
      setLoading(false);
    }
  }, [itemName, itemPrice, timeline, snapshot]);

  // ── Verdict styling ──
  const verdictStyle = analysis
    ? {
        safe: {
          bg: "from-emerald-500/20 to-emerald-500/5",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          icon: CheckCircle2,
          label: "Safe to Buy",
          glow: "#10B981",
          barGrad: "bg-gradient-to-r from-emerald-400 to-teal-400",
        },
        risky: {
          bg: "from-amber-500/20 to-amber-500/5",
          border: "border-amber-500/30",
          text: "text-amber-400",
          icon: AlertTriangle,
          label: "Risky",
          glow: "#F59E0B",
          barGrad: "bg-gradient-to-r from-amber-400 to-orange-400",
        },
        not_recommended: {
          bg: "from-rose-500/20 to-rose-500/5",
          border: "border-rose-500/30",
          text: "text-rose-400",
          icon: Shield,
          label: "Not Recommended",
          glow: "#EF4444",
          barGrad: "bg-gradient-to-r from-rose-400 to-red-400",
        },
      }[analysis.verdict]
    : null;

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
      <TopBar title="Smart Planner" subtitle="AI Purchase Advisor" />

      {/* ── Hero Banner ── */}
      <div className="mx-5 mb-6">
        <div
          className="relative rounded-[32px] overflow-hidden p-6"
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)",
          }}
        >
          {/* Glow orbs */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #818cf8, transparent)" }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-15 blur-2xl"
            style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />

          <div className="relative z-10 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/20">
              <Brain size={28} className="text-indigo-200" />
            </div>
            <div>
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">
                AI-Powered
              </p>
              <h2 className="text-white text-xl font-black leading-tight mb-2">
                Smart Purchase<br />Planner
              </h2>
              <p className="text-indigo-200/80 text-xs font-medium leading-relaxed">
                Enter any purchase. I'll analyze your finances and tell you exactly when and how to buy it.
              </p>
            </div>
          </div>

          {/* Quick snapshot pills */}
          <div className="relative z-10 flex gap-2 mt-4 flex-wrap">
            <span className="bg-white/10 border border-white/15 text-white/80 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
              💰 Balance: {formatCurrency(snapshot.balance, currencyConfig)}
            </span>
            <span className="bg-white/10 border border-white/15 text-white/80 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
              📈 Income: {formatCurrency(snapshot.monthlyIncome, currencyConfig)}/mo
            </span>
            <span className="bg-white/10 border border-white/15 text-white/80 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
              🎯 {budgets.length} Budgets
            </span>
          </div>
        </div>
      </div>

      {/* ── Input Form ── */}
      <div className="mx-5 mb-6 space-y-4">
        {/* Item Name */}
        <div
          className={cn(
            "rounded-3xl border p-4",
            isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm"
          )}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <ShoppingCart size={10} />
            What do you want to buy?
          </p>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. MacBook Pro, iPhone 15, Bike..."
            className={cn(
              "w-full text-base font-bold bg-transparent outline-none placeholder:font-normal",
              isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"
            )}
          />
        </div>

        {/* Price */}
        <div
          className={cn(
            "rounded-3xl border p-4",
            isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm"
          )}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <Wallet size={10} />
            Purchase Price
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-slate-400">
              {currencyConfig.symbol}
            </span>
            <input
              type="number"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="0"
              className={cn(
                "w-full text-3xl font-black bg-transparent outline-none placeholder:font-normal",
                isDark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-300"
              )}
            />
          </div>
        </div>

        {/* Timeline */}
        <div
          className={cn(
            "rounded-3xl border p-4",
            isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm"
          )}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <Calendar size={10} />
            Target Timeline
          </p>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(TIMELINE_LABELS) as Timeline[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeline(t)}
                className={cn(
                  "py-2.5 rounded-2xl text-[11px] font-black transition-all border",
                  timeline === t
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : isDark
                    ? "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                )}
              >
                {TIMELINE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Analyze Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={analyze}
          disabled={loading || !itemName.trim() || !itemPrice}
          className={cn(
            "w-full py-5 rounded-3xl font-black text-white text-base flex items-center justify-center gap-3 transition-all",
            loading || !itemName.trim() || !itemPrice
              ? "opacity-50 cursor-not-allowed bg-indigo-600"
              : "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60"
          )}
        >
          {loading ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Brain size={20} />
              Analyze Purchase
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3"
          >
            <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
            <p className="text-rose-400 text-xs font-semibold">{error}</p>
          </motion.div>
        )}
      </div>

      {/* ── Analysis Results ── */}
      <AnimatePresence>
        {analysis && verdictStyle && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-5 space-y-4"
          >
            {/* ── Verdict Card ── */}
            <div
              className={cn(
                "rounded-[32px] border p-6 bg-gradient-to-br",
                verdictStyle.bg,
                verdictStyle.border
              )}
              style={{ boxShadow: `0 0 40px ${verdictStyle.glow}22` }}
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${verdictStyle.glow}20` }}
                >
                  <verdictStyle.icon size={26} className={verdictStyle.text} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    AI Verdict
                  </p>
                  <h3 className={cn("text-xl font-black mb-1", verdictStyle.text)}>
                    {verdictStyle.label}
                  </h3>
                  <p className={cn("text-sm font-medium leading-relaxed", isDark ? "text-slate-300" : "text-slate-600")}>
                    {analysis.verdictReason}
                  </p>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-500">AI Confidence</span>
                  <span className={cn("text-[10px] font-black", verdictStyle.text)}>
                    {analysis.confidenceScore}%
                  </span>
                </div>
                <GradientBar
                  value={analysis.confidenceScore}
                  max={100}
                  gradient={verdictStyle.barGrad}
                  glow
                  glowColor={verdictStyle.glow}
                />
              </div>

              {/* Key metrics row */}
              <div className="grid grid-cols-3 gap-3">
                <div className={cn("rounded-2xl p-3 text-center", isDark ? "bg-white/5" : "bg-white/60")}>
                  <Clock size={16} className="mx-auto mb-1 text-indigo-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Months Away</p>
                  <p className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-900")}>
                    {analysis.monthsToAfford === 0 ? "Now!" : `${analysis.monthsToAfford}mo`}
                  </p>
                </div>
                <div className={cn("rounded-2xl p-3 text-center", isDark ? "bg-white/5" : "bg-white/60")}>
                  <Wallet size={16} className="mx-auto mb-1 text-emerald-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase">After Buy</p>
                  <p className={cn(
                    "text-lg font-black",
                    analysis.willGoBelowZero ? "text-rose-400" : isDark ? "text-white" : "text-slate-900"
                  )}>
                    {analysis.willGoBelowZero
                      ? "Negative!"
                      : formatCurrency(analysis.balanceAfterPurchase, currencyConfig)}
                  </p>
                </div>
                <div className={cn("rounded-2xl p-3 text-center", isDark ? "bg-white/5" : "bg-white/60")}>
                  <BarChart3 size={16} className="mx-auto mb-1 text-amber-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Save/Mo</p>
                  <p className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-900")}>
                    {formatCurrency(analysis.monthlySavingNeeded, currencyConfig)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Tab Nav ── */}
            <div
              className={cn(
                "flex rounded-2xl p-1",
                isDark ? "bg-slate-900/60 border border-white/[0.08]" : "bg-white border border-slate-100"
              )}
            >
              {(["verdict", "plan", "suggestions"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all",
                    activeTab === tab
                      ? "bg-indigo-600 text-white shadow-md"
                      : isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                  )}
                >
                  {tab === "verdict" ? "📊 Analysis" : tab === "plan" ? "🎯 Plan" : "💡 Tips"}
                </button>
              ))}
            </div>

            {/* ── Tab Content ── */}
            <AnimatePresence mode="wait">
              {/* ANALYSIS TAB */}
              {activeTab === "verdict" && (
                <motion.div
                  key="verdict"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {/* Budget Impact */}
                  {analysis.affectedBudgets.length > 0 && (
                    <div
                      className={cn(
                        "rounded-3xl border p-5",
                        isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <AlertTriangle size={16} className="text-amber-400" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-amber-400">
                          Budget Conflicts
                        </p>
                      </div>
                      <p className={cn("text-sm font-medium mb-3 leading-relaxed", isDark ? "text-slate-300" : "text-slate-600")}>
                        {analysis.budgetConflictMessage}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.affectedBudgets.map((b) => (
                          <span
                            key={b}
                            className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold capitalize"
                          >
                            ⚠ {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Warnings */}
                  {analysis.riskWarnings.length > 0 && (
                    <div
                      className={cn(
                        "rounded-3xl border p-5",
                        isDark ? "bg-slate-900/60 border-rose-500/20" : "bg-white border-rose-100 shadow-sm"
                      )}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-3">
                        🚨 Risk Warnings
                      </p>
                      <div className="space-y-2">
                        {analysis.riskWarnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-rose-400 mt-0.5">•</span>
                            <p className={cn("text-sm font-medium", isDark ? "text-slate-300" : "text-slate-600")}>{w}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Positive Signals */}
                  {analysis.positiveSignals.length > 0 && (
                    <div
                      className={cn(
                        "rounded-3xl border p-5",
                        isDark ? "bg-slate-900/60 border-emerald-500/20" : "bg-white border-emerald-100 shadow-sm"
                      )}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3">
                        ✅ Positive Signals
                      </p>
                      <div className="space-y-2">
                        {analysis.positiveSignals.map((s, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <p className={cn("text-sm font-medium", isDark ? "text-slate-300" : "text-slate-600")}>{s}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Balance Impact Visual */}
                  <div
                    className={cn(
                      "rounded-3xl border p-5",
                      isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm"
                    )}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
                      💸 Balance Impact
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={cn("text-xs font-bold", isDark ? "text-slate-400" : "text-slate-600")}>
                          Current Balance
                        </span>
                        <span className="text-sm font-black text-emerald-400">
                          {formatCurrency(snapshot.balance, currencyConfig)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={cn("text-xs font-bold", isDark ? "text-slate-400" : "text-slate-600")}>
                          Purchase Cost
                        </span>
                        <span className="text-sm font-black text-rose-400">
                          − {formatCurrency(Number(itemPrice), currencyConfig)}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "h-px",
                          isDark ? "bg-white/10" : "bg-slate-100"
                        )}
                      />
                      <div className="flex justify-between items-center">
                        <span className={cn("text-xs font-black uppercase tracking-wide", isDark ? "text-white" : "text-slate-900")}>
                          Remaining Balance
                        </span>
                        <span
                          className={cn(
                            "text-base font-black",
                            analysis.willGoBelowZero ? "text-rose-400" : "text-emerald-400"
                          )}
                        >
                          {formatCurrency(analysis.balanceAfterPurchase, currencyConfig)}
                          {analysis.willGoBelowZero && " ⚠"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <GradientBar
                        value={Math.max(0, analysis.balanceAfterPurchase)}
                        max={snapshot.balance}
                        gradient={analysis.willGoBelowZero
                          ? "bg-gradient-to-r from-rose-500 to-red-400"
                          : "bg-gradient-to-r from-emerald-500 to-teal-400"}
                        glow
                        glowColor={analysis.willGoBelowZero ? "#EF4444" : "#10B981"}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SAVINGS PLAN TAB */}
              {activeTab === "plan" && (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4 relative"
                >
                  {!isPremium && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[6px] rounded-[32px]">
                      <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/40">
                          <Crown size={32} className="text-white" />
                        </div>
                        <h3 className={cn("text-lg font-black mb-2", isDark ? "text-white" : "text-slate-900")}>Pro Plan Required</h3>
                        <p className={cn("text-sm font-medium mb-5", isDark ? "text-slate-300" : "text-slate-600")}>
                          Unlock the Deep AI Forecasting engine and get exact savings timelines.
                        </p>
                        <button
                          onClick={() => {
                            trackPremiumClick();
                            triggerPremiumModal("Unlock Smart Timelines and full AI Forecasting.");
                          }}
                          className="px-6 py-3 rounded-2xl bg-amber-500 text-white font-black shadow-lg shadow-amber-500/30 w-full"
                        >
                          Unlock Premium
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Plan hero */}
                  <div
                    className="rounded-[32px] p-6 relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #059669 100%)",
                    }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-20 blur-2xl rounded-full"
                      style={{ background: "radial-gradient(circle, #34d399, transparent)" }} />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Target size={18} className="text-emerald-300" />
                        <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest">
                          Your Savings Plan
                        </p>
                      </div>
                      <p className="text-white text-2xl font-black mb-1">
                        {itemName}
                      </p>
                      <p className="text-emerald-200/80 text-sm font-bold mb-5">
                        {formatCurrency(Number(itemPrice), currencyConfig)} goal
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            label: "Monthly Target",
                            value: formatCurrency(analysis.savingPlan.monthlyTarget, currencyConfig),
                            icon: Calendar,
                          },
                          {
                            label: "Daily Target",
                            value: formatCurrency(analysis.savingPlan.dailyTarget, currencyConfig),
                            icon: Zap,
                          },
                          {
                            label: "Weeks to Goal",
                            value: `${analysis.savingPlan.weeksToGoal} weeks`,
                            icon: Clock,
                          },
                          {
                            label: "Achievable By",
                            value: analysis.savingPlan.achievableBy,
                            icon: TrendingUp,
                          },
                        ].map(({ label, value, icon: Icon }) => (
                          <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                            <Icon size={14} className="text-emerald-300 mb-1.5" />
                            <p className="text-emerald-200/70 text-[9px] font-black uppercase tracking-wide mb-0.5">
                              {label}
                            </p>
                            <p className="text-white font-black text-sm">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Progress timeline */}
                  <div
                    className={cn(
                      "rounded-3xl border p-5",
                      isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm"
                    )}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
                      ⏳ Road to {itemName}
                    </p>

                    {/* Simple mile-marker timeline */}
                    <div className="relative">
                      {[
                        { label: "Today", sub: "Start saving", done: true, val: 0 },
                        {
                          label: `Month 1`,
                          sub: `+${formatCurrency(analysis.savingPlan.monthlyTarget, currencyConfig)}`,
                          done: false,
                          val: Math.min(100, (analysis.savingPlan.monthlyTarget / Number(itemPrice)) * 100),
                        },
                        {
                          label: analysis.savingPlan.achievableBy,
                          sub: "Purchase ready 🎉",
                          done: false,
                          val: 100,
                        },
                      ].map((step, i, arr) => (
                        <div key={i} className="flex items-start gap-3 mb-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 text-xs font-black",
                                step.done
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : isDark
                                  ? "bg-slate-800 border-white/10 text-slate-500"
                                  : "bg-slate-100 border-slate-200 text-slate-400"
                              )}
                            >
                              {step.done ? "✓" : i + 1}
                            </div>
                            {i < arr.length - 1 && (
                              <div className={cn("w-0.5 h-8 mt-1", isDark ? "bg-white/10" : "bg-slate-200")} />
                            )}
                          </div>
                          <div className="pt-1.5">
                            <p className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-900")}>
                              {step.label}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">{step.sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Overall progress */}
                    <div className="mt-2">
                      <GradientBar
                        value={snapshot.balance > Number(itemPrice) ? Number(itemPrice) : snapshot.balance}
                        max={Number(itemPrice)}
                        gradient="bg-gradient-to-r from-indigo-500 to-violet-500"
                        glow
                        glowColor="#6366F1"
                      />
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-slate-500 font-bold">
                          Current: {formatCurrency(Math.min(snapshot.balance, Number(itemPrice)), currencyConfig)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          Goal: {formatCurrency(Number(itemPrice), currencyConfig)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SUGGESTIONS TAB */}
              {activeTab === "suggestions" && (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4 relative"
                >
                  {!isPremium && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[6px] rounded-[32px] mt-4">
                      <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/40">
                          <Crown size={32} className="text-white" />
                        </div>
                        <h3 className={cn("text-lg font-black mb-2", isDark ? "text-white" : "text-slate-900")}>Pro Plan Required</h3>
                        <p className={cn("text-sm font-medium mb-5", isDark ? "text-slate-300" : "text-slate-600")}>
                          Unlock precise AI suggestions to hit your goals exponentially faster.
                        </p>
                        <button
                          onClick={() => {
                            trackPremiumClick();
                            triggerPremiumModal("Unlock personalized AI tips and strategy generation.");
                          }}
                          className="px-6 py-3 rounded-2xl bg-amber-500 text-white font-black shadow-lg shadow-amber-500/30 w-full"
                        >
                          Unlock Premium
                        </button>
                      </div>
                    </div>
                  )}

                  <p className={cn("text-xs font-bold px-1", isDark ? "text-slate-400" : "text-slate-500")}>
                    Follow these AI tips to reach your goal faster 🚀
                  </p>

                  <div className="space-y-3">
                    {/* Hardcoded fake blur items for free users so they see the effect even though real array is empty */}
                    {!isPremium && [1, 2, 3].map((_, i) => (
                      <div key={`fake-${i}`} className={cn("rounded-3xl p-5 border", isDark ? "bg-slate-900/40 border-white/[0.08]" : "bg-white border-slate-100")}>
                        <div className="h-4 w-3/4 bg-slate-500/20 rounded mb-2"></div>
                        <div className="h-3 w-1/2 bg-slate-500/20 rounded"></div>
                      </div>
                    ))}

                    {isPremium && analysis.suggestions.length === 0 && (
                      <div className={cn("rounded-3xl border p-10 text-center", isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100")}>
                        <p className={cn("text-sm font-bold", isDark ? "text-slate-400" : "text-slate-500")}>Your current plan is already highly optimized!</p>
                      </div>
                    )}
                    {isPremium && analysis.suggestions.map((sug, i) => {
                    const Icon = SUGGESTION_ICON[sug.type];
                    const colorClass = SUGGESTION_COLOR[sug.type];
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "rounded-3xl border p-5",
                          isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0", colorClass)}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-900")}>
                                {sug.title}
                              </h4>
                              {sug.daysEarlier > 0 && (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0">
                                  -{sug.daysEarlier}d
                                </span>
                              )}
                            </div>
                            <p className={cn("text-xs font-medium leading-relaxed mb-3", isDark ? "text-slate-400" : "text-slate-600")}>
                              {sug.detail}
                            </p>
                            {sug.impact > 0 && (
                              <div className="flex items-center gap-2">
                                <Lightbulb size={12} className="text-amber-400" />
                                <span className="text-[11px] font-bold text-amber-400">
                                  Saves {formatCurrency(sug.impact, currencyConfig)}/month
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  </div>

                  {/* Re-analyze CTA */}
                  <button
                    onClick={() => { setAnalysis(null); setItemName(""); setItemPrice(""); }}
                    className={cn(
                      "w-full py-4 rounded-3xl border text-sm font-black flex items-center justify-center gap-2 transition-all",
                      isDark
                        ? "border-white/10 text-slate-400 hover:bg-white/5"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <ChevronRight size={16} className="rotate-180" />
                    Plan Another Purchase
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!analysis && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-5 mt-2"
        >
          <div
            className={cn(
              "rounded-3xl border p-8 text-center",
              isDark ? "bg-slate-900/40 border-white/[0.06]" : "bg-white/60 border-slate-100"
            )}
          >
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
              <Brain size={32} className="text-indigo-400" />
            </div>
            <h3 className={cn("text-base font-black mb-2", isDark ? "text-white" : "text-slate-900")}>
              Tell me what you want to buy
            </h3>
            <p className={cn("text-xs font-medium leading-relaxed max-w-[260px] mx-auto", isDark ? "text-slate-500" : "text-slate-400")}>
              I'll analyze your spending patterns, income, and budgets to give you a precise affordability verdict.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
