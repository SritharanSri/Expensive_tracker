"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/currency";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/Cards";
import { CATEGORIES } from "@/lib/data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Crown, Info, Sparkles, Check } from "lucide-react";

export function ReportsScreen() {
  const { isDark, isPremium, currencyConfig, t, transactions, categories } = useApp();
  const [period, setPeriod] = useState<"6M" | "3M" | "1M">("3M");
  const [activePie, setActivePie] = useState<number | null>(null);

  // Derive Monthly Data from real transactions
  const monthlyData = useMemo(() => {
    const data: Record<string, { month: string; income: number; expense: number }> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Last 4 months for the chart
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = months[d.getMonth()];
      data[m] = { month: m, income: 0, expense: 0 };
    }

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const m = months[d.getMonth()];
      if (data[m]) {
        if (tx.type === "income") data[m].income += tx.amount;
        else data[m].expense += tx.amount;
      }
    });

    return Object.values(data);
  }, [transactions]);

  // Derive Pie Data from real transactions
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    const expenseTxs = transactions.filter(t => t.type === "expense" || t.type === "investment");
    expenseTxs.forEach((tx) => {
      counts[tx.category] = (counts[tx.category] || 0) + tx.amount;
    });

    return Object.entries(counts).map(([catId, value]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat?.name || "Other",
        value,
        color: cat?.color || "#94A3B8"
      };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  // Income Source Data
  const sourceData = useMemo(() => {
    const sources: Record<string, { id: string; name: string; color: string; total: number; spent: number }> = {};
    
    // Get all income categories (potential sources)
    categories.filter(c => c.type === "income").forEach(c => {
      sources[c.id] = { id: c.id, name: c.name, color: c.color, total: 0, spent: 0 };
    });

    transactions.forEach(tx => {
      if (tx.type === "income" && sources[tx.category]) {
        sources[tx.category].total += tx.amount;
      }
      if ((tx.type === "expense" || tx.type === "investment") && tx.linkedIncomeCategoryId && sources[tx.linkedIncomeCategoryId]) {
        sources[tx.linkedIncomeCategoryId].spent += tx.amount;
      }
    });

    return Object.values(sources).filter(s => s.total > 0 || s.spent > 0);
  }, [transactions, categories]);

  const totalIncome = transactions.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const savings = totalIncome - totalExpense;

  const STATS = [
    { label: t("income"), value: totalIncome, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: t("expense"), value: totalExpense, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: t("nav_savings"), value: savings, icon: DollarSign, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  const pieTotal = pieData.reduce((a, b) => a + b.value, 0);

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
      <TopBar title={t("nav_reports")} subtitle="Financial Health" />

      {/* Stats Cluster */}
      <div className="flex gap-3 px-5 mt-2 overflow-x-auto pb-4 no-scrollbar">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "flex-shrink-0 min-w-[140px] p-4 rounded-[28px] border",
              isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm"
            )}
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.bg)}>
              <s.icon size={18} className={s.color} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{s.label}</p>
            <p className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-900")}>
              {formatCurrency(s.value, currencyConfig)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Income vs Expense Chart */}
      <div className="mx-5 mb-6">
        <GlassCard isDark={isDark} className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className={cn("font-black text-sm uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-500")}>Cash Flow</h3>
            <div className={cn("flex rounded-xl p-1", isDark ? "bg-slate-800" : "bg-slate-100")}>
              {["1M", "3M", "6M"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all",
                    period === p ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={4}>
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: isDark ? "#475569" : "#94A3B8" }} 
              />
              <Tooltip 
                cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", radius: 8 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className={cn("p-3 rounded-2xl border backdrop-blur-xl shadow-2xl", isDark ? "bg-slate-900/90 border-white/10" : "bg-white/90 border-slate-200")}>
                        <p className="text-xs font-black mb-2 uppercase tracking-widest">{payload[0].payload.month}</p>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-emerald-500">{t("income")}: {formatCurrency(payload[0].value as number, currencyConfig)}</p>
                          <p className="text-[10px] font-bold text-rose-500">{t("expense")}: {formatCurrency(payload[1].value as number, currencyConfig)}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={16} />
              <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Premium Insight Card */}
      <div className="mx-5 mb-6">
        <div className={cn(
          "p-5 rounded-[32px] relative overflow-hidden transition-all border-2",
          isPremium 
            ? "bg-slate-900 border-indigo-500/30" 
            : "bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 grayscale"
        )}>
          {!isPremium && (
            <div className="absolute inset-0 bg-white/20 dark:bg-slate-900/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
              <Crown className="text-amber-500 mb-2" fill="currentColor" size={24} />
              <h4 className="font-black text-sm uppercase tracking-widest mb-1">AI Prediction Locked</h4>
              <p className="text-[10px] text-slate-500 font-bold max-w-[200px]">Upgrade to Premium to see your projected spending patterns.</p>
            </div>
          )}
          <div className="relative z-0">
             <div className="flex items-center gap-2 mb-4">
               <Sparkles size={16} className="text-indigo-400" />
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{t("dash_ai_prediction")}</span>
             </div>
             <div className="flex items-end justify-between">
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Estimated Spending</p>
                   <p className={cn("text-2xl font-black", isDark ? "text-white" : "text-slate-900")}>
                    {formatCurrency(totalExpense / 4 * 1.15, currencyConfig)}
                   </p>
                </div>
                <div className="text-right">
                   <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-1 rounded-full mb-1">
                      <TrendingUp size={10} className="text-amber-500" />
                      <span className="text-amber-500 text-[8px] font-black uppercase">+15% vs Avg</span>
                   </div>
                   <p className="text-[8px] font-bold text-slate-500">Based on recent travel</p>
                </div>
             </div>
          </div>
        </div>
      </div>


      {/* Income Source Tracking (Multiple Sources) */}
      <div className="mx-5 mb-10">
        <h3 className={cn("font-black text-sm uppercase tracking-widest mb-4 px-1", isDark ? "text-slate-400" : "text-slate-500")}>Source Efficiency</h3>
        <div className="space-y-4">
          {sourceData.length > 0 ? sourceData.map((source) => {
            const percent = Math.min(Math.round((source.spent / source.total) * 100), 100);
            return (
              <GlassCard key={source.id} isDark={isDark} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: `${source.color}20`, color: source.color }}>
                      {categories.find(c => c.id === source.id)?.icon || "💰"}
                    </div>
                    <div>
                      <p className={cn("text-xs font-black", isDark ? "text-white" : "text-slate-900")}>{source.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Received: {formatCurrency(source.total, currencyConfig)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-black", percent > 80 ? "text-rose-500" : "text-indigo-500")}>{percent}% Spent</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className={cn("w-full h-2 rounded-full overflow-hidden", isDark ? "bg-white/5" : "bg-slate-100")}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: source.color }}
                  />
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                   <div className="flex items-center gap-1">
                      <TrendingDown size={12} className="text-rose-500" />
                      <span className="text-[10px] font-bold text-slate-500">Expensed: {formatCurrency(source.spent, currencyConfig)}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <Check size={12} className="text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500">Available: {formatCurrency(source.total - source.spent, currencyConfig)}</span>
                   </div>
                </div>
              </GlassCard>
            );
          }) : (
            <div className="text-center py-8 opacity-40">No income sources found yet.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
