"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/currency";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/Cards";
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
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Crown, 
  Sparkles, 
  Check, 
  PieChart as PieIcon, 
  Wallet,
  Target,
  ArrowUpRight
} from "lucide-react";

export function ReportsScreen() {
  const { isDark, isPremium, currencyConfig, t, transactions, categories } = useApp();
  const [period, setPeriod] = useState<"1M" | "3M" | "6M">("3M");
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  // Helper to get number of months based on period
  const monthCount = useMemo(() => {
    if (period === "1M") return 1;
    if (period === "3M") return 3;
    return 6;
  }, [period]);

  // Derive Chart Data with dynamic aggregation (Weekly for 1M, Monthly for 3M/6M)
  const chartData = useMemo(() => {
    const data: Record<string, { label: string; income: number; expense: number; timestamp: number }> = {};
    const now = new Date();

    if (period === "1M") {
      // Weekly breakdown for the current month
      for (let i = 0; i < 4; i++) {
        const label = `Week ${i + 1}`;
        data[label] = { label, income: 0, expense: 0, timestamp: i };
      }

      transactions.forEach((tx) => {
        const d = new Date(tx.date);
        // Check if transaction is in the current month
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          const weekIndex = Math.min(Math.floor((d.getDate() - 1) / 7), 3);
          const label = `Week ${weekIndex + 1}`;
          if (tx.type === "income") data[label].income += tx.amount;
          else if (tx.type === "expense") data[label].expense += tx.amount;
        }
      });
    } else {
      // Monthly breakdown for 3M/6M
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = months[d.getMonth()];
        const year = d.getFullYear();
        const key = `${year}-${d.getMonth()}`;
        data[key] = { label: `${m} ${year}`, income: 0, expense: 0, timestamp: d.getTime() };
      }

      transactions.forEach((tx) => {
        const d = new Date(tx.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (data[key]) {
          if (tx.type === "income") data[key].income += tx.amount;
          else if (tx.type === "expense") data[key].expense += tx.amount;
        }
      });
    }

    return Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
  }, [transactions, monthCount, period]);

  // Period-specific totals
  const periodTransactions = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - monthCount + 1, 1);
    return transactions.filter(tx => new Date(tx.date) >= cutoff);
  }, [transactions, monthCount]);

  const totalIncome = periodTransactions.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const totalExpense = periodTransactions.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  // Pie Data (Category Distribution) for selected period
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    periodTransactions.filter(t => t.type === "expense").forEach((tx) => {
      counts[tx.category] = (counts[tx.category] || 0) + tx.amount;
    });

    return Object.entries(counts).map(([catId, value]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        id: catId,
        name: cat?.name || "Other",
        value,
        color: cat?.color || "#6366F1",
        icon: cat?.icon || "💸"
      };
    }).sort((a, b) => b.value - a.value);
  }, [periodTransactions, categories]);

  const topCategory = pieData[0];

  // AI Prediction based on actual averages
  const avgMonthlyExpense = totalExpense / monthCount;
  const predictedNext = avgMonthlyExpense * 1.05; // 5% buffer

  const STATS = [
    { label: t("income"), value: totalIncome, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: t("expense"), value: totalExpense, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: t("nav_savings"), value: savings, icon: Wallet, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

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
      <TopBar title={t("nav_reports")} subtitle={`${period} Overview`} />

      {/* Period Selector */}
      <div className="flex justify-center mb-6 mt-2">
        <div className={cn("inline-flex rounded-2xl p-1 gap-1", isDark ? "bg-slate-800/50" : "bg-slate-100")}>
          {["1M", "3M", "6M"].map((p) => (
            <motion.button
              key={p}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPeriod(p as any)}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black transition-all duration-300",
                period === p 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
                  : isDark ? "text-slate-500" : "text-slate-400"
              )}
            >
              {p}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Stats Cluster */}
      <div className="flex gap-4 px-5 mb-8 overflow-x-auto pb-4 no-scrollbar">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "flex-shrink-0 min-w-[150px] p-5 rounded-[32px] border",
              isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm"
            )}
          >
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4", s.bg)}>
              <s.icon size={20} className={s.color} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{s.label}</p>
            <p className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-900")}>
              {formatCurrency(s.value, currencyConfig, true)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Cash Flow Chart */}
      <div className="mx-5 mb-8">
        <GlassCard isDark={isDark} className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className={cn("font-black text-sm uppercase tracking-widest", isDark ? "text-white" : "text-slate-900")}>Cash Flow</h3>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Income vs Expenses</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black uppercase text-slate-500">In</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[9px] font-black uppercase text-slate-500">Out</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={6}>
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 800, fill: isDark ? "#475569" : "#94A3B8" }} 
              />
              <Tooltip 
                cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", radius: 12 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className={cn("p-4 rounded-[24px] border backdrop-blur-xl shadow-2xl", isDark ? "bg-slate-900/90 border-white/10" : "bg-white/90 border-slate-200")}>
                        <p className="text-[10px] font-black mb-3 uppercase tracking-widest text-slate-500">{payload[0].payload.label}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-[10px] font-bold text-emerald-500">INCOME</span>
                            <span className="text-xs font-black text-emerald-500">{formatCurrency(payload[0].value as number, currencyConfig, true)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-[10px] font-bold text-rose-500">EXPENSE</span>
                            <span className="text-xs font-black text-rose-500">{formatCurrency(payload[1].value as number, currencyConfig, true)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} barSize={14} />
              <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Category Breakdown (Pie Chart) */}
      <div className="mx-5 mb-8">
        <GlassCard isDark={isDark} className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className={cn("font-black text-sm uppercase tracking-widest", isDark ? "text-white" : "text-slate-900")}>Breakdown</h3>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Expense by Category</p>
            </div>
            <PieIcon size={18} className="text-indigo-400" />
          </div>

          <div className="flex flex-col items-center">
            <div className="w-full h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke="none" 
                        opacity={activePieIndex === null || activePieIndex === index ? 1 : 0.4}
                        className="outline-none"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className={cn("p-3 rounded-2xl border backdrop-blur-xl shadow-xl", isDark ? "bg-slate-900/90 border-white/10" : "bg-white/90 border-slate-200")}>
                            <p className="text-[10px] font-black text-center">{payload[0].name}</p>
                            <p className="text-xs font-black text-center mt-1">{formatCurrency(payload[0].value as number, currencyConfig, true)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Info */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[8px] font-black uppercase text-slate-500">Savings</p>
                <p className={cn("text-lg font-black", savingsRate > 0 ? "text-emerald-500" : "text-rose-500")}>
                  {Math.round(savingsRate)}%
                </p>
              </div>
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 w-full gap-4 mt-6">
              {pieData.slice(0, 4).map((entry) => (
                <div key={entry.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${entry.color}20` }}>
                    <span className="text-sm">{entry.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-[10px] font-black truncate", isDark ? "text-white" : "text-slate-900")}>{entry.name}</p>
                    <p className="text-[9px] font-bold text-slate-500">{Math.round((entry.value / totalExpense) * 100)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Advanced Insights & Prediction */}
      <div className="mx-5 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <GlassCard isDark={isDark} className="p-5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center mb-3">
              <Target size={16} className="text-orange-500" />
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Top Spend</p>
            <p className={cn("text-sm font-black truncate", isDark ? "text-white" : "text-slate-900")}>
              {topCategory?.name || "N/A"}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp size={10} className="text-rose-500" />
              <span className="text-[8px] font-bold text-slate-500">{formatCurrency(topCategory?.value || 0, currencyConfig, true)}</span>
            </div>
          </GlassCard>

          <GlassCard isDark={isDark} className="p-5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
              <Sparkles size={16} className="text-indigo-500" />
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Avg Spend</p>
            <p className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-900")}>
              {formatCurrency(avgMonthlyExpense, currencyConfig, true)}
            </p>
            <p className="text-[8px] font-bold text-slate-500 mt-2">Per Month</p>
          </GlassCard>
        </div>

        {/* Prediction Card */}
        <div className={cn(
          "mt-4 p-6 rounded-[32px] relative overflow-hidden border-2 transition-all duration-500",
          isPremium 
            ? "bg-slate-900 border-indigo-500/30 shadow-2xl shadow-indigo-500/10" 
            : "bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 grayscale"
        )}>
          {!isPremium && (
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/80 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center p-6 text-center">
              <Crown className="text-amber-500 mb-2" fill="currentColor" size={28} />
              <h4 className="font-black text-sm uppercase tracking-widest mb-1">Predictive Analytics</h4>
              <p className="text-[10px] text-slate-500 font-bold max-w-[200px]">Unlock AI-powered spending forecasts with Spendly Premium.</p>
            </div>
          )}
          <div className="relative z-0">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2">
                 <Sparkles size={18} className="text-indigo-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Next Month Projection</span>
               </div>
               <div className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-[8px] font-black tracking-widest uppercase">AI Engine v2.5</div>
             </div>
             
             <div className="flex items-end justify-between">
                <div>
                   <p className="text-[9px] font-black uppercase text-slate-500 mb-2">Estimated Total Outflow</p>
                   <p className={cn("text-3xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                    {formatCurrency(predictedNext, currencyConfig, true)}
                   </p>
                </div>
                <div className="text-right">
                   <div className="flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1.5 rounded-full mb-2">
                      <TrendingUp size={12} className="text-emerald-500" />
                      <span className="text-emerald-500 text-[10px] font-black uppercase">+5% Avg</span>
                   </div>
                   <p className="text-[9px] font-bold text-slate-500 italic">"Plan for upcoming bills"</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Source Efficiency */}
      <div className="mx-5 mb-10">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className={cn("font-black text-xs uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-500")}>Source Utilization</h3>
          <ArrowUpRight size={14} className="text-slate-500" />
        </div>
        
        <div className="space-y-4">
          {/* Group and filter sources with activity */}
          {(() => {
            const sources: Record<string, { id: string; name: string; color: string; total: number; spent: number; icon: string }> = {};
            categories.filter(c => c.type === "income").forEach(c => {
              sources[c.id] = { id: c.id, name: c.name, color: c.color, total: 0, spent: 0, icon: c.icon };
            });
            periodTransactions.forEach(tx => {
              if (tx.type === "income" && sources[tx.category]) sources[tx.category].total += tx.amount;
              if (tx.type === "expense" && tx.linkedIncomeCategoryId && sources[tx.linkedIncomeCategoryId]) {
                sources[tx.linkedIncomeCategoryId].spent += tx.amount;
              }
            });
            
            const activeSources = Object.values(sources).filter(s => s.total > 0 || s.spent > 0);
            
            return activeSources.length > 0 ? activeSources.map((source) => {
              const percent = source.total > 0 ? Math.min(Math.round((source.spent / source.total) * 100), 100) : 0;
              return (
                <GlassCard key={source.id} isDark={isDark} className="p-5 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] scale-150 rotate-12 pointer-events-none">
                    <span className="text-6xl">{source.icon}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg" style={{ background: `${source.color}15`, color: source.color }}>
                        {source.icon}
                      </div>
                      <div>
                        <p className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-900")}>{source.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{formatCurrency(source.total, currencyConfig, true)} Received</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-xs font-black", percent > 85 ? "text-rose-500" : percent > 50 ? "text-amber-500" : "text-emerald-500")}>
                        {percent}% Used
                      </p>
                    </div>
                  </div>
                  
                  <div className={cn("w-full h-2.5 rounded-full overflow-hidden", isDark ? "bg-white/5" : "bg-slate-100")}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full shadow-[0_0_12px_rgba(0,0,0,0.1)]"
                      style={{ backgroundColor: source.color }}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/[0.04]">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{formatCurrency(source.spent, currencyConfig, true)} OUT</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{formatCurrency(source.total - source.spent, currencyConfig, true)} REMAINING</span>
                     </div>
                  </div>
                </GlassCard>
              );
            }) : (
              <div className="text-center py-16 opacity-30">
                <div className="mb-2">📉</div>
                <p className="text-xs font-bold">No linked sources active in this period</p>
              </div>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}
