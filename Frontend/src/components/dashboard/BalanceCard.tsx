"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GradientCard } from "@/components/ui/Cards";
import { CircularRing } from "@/components/ui/Progress";
import { formatCurrency } from "@/lib/currency";
import { TrendingUp, TrendingDown, Eye, EyeOff, Crown } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function BalanceCard({ isDark }: { isDark: boolean }) {
  const { balance, currencyConfig, isPremium, transactions, t } = useApp();
  const [hidden, setHidden] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const monthlyIncome = transactions
    .filter(t => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
    
  const monthlyExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const spentPercent = monthlyIncome > 0 ? Math.round((monthlyExpense / monthlyIncome) * 100) : 0;

  // Prevent hydration mismatch by returning a placeholder or null until mounted
  if (!isMounted) return <div className="mx-5 h-[180px] rounded-[28px] bg-slate-800 animate-pulse" />;

  return (
    <div className="relative">
      <GradientCard
        gradient="from-[#1E3A8A] via-[#3730A3] to-[#4F46E5]"
        className="mx-5 p-6 shadow-2xl relative"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                {t("dash_balance")}
              </p>
              {isPremium && (
                <div className="flex items-center gap-1 bg-amber-400/20 px-1.5 py-0.5 rounded-full border border-amber-400/30">
                  <Crown size={8} className="text-amber-400" />
                  <span className="text-[8px] font-bold text-amber-400 uppercase">{t("dash_premium_badge")}</span>
                </div>
              )}
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex items-baseline gap-1"
            >
              <span className="text-white text-4xl font-bold tracking-tight">
                {hidden ? "••••••" : formatCurrency(balance, currencyConfig)}
              </span>
            </motion.div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                <TrendingUp size={10} className="text-emerald-400" />
                <span className="text-emerald-400 text-[10px] font-bold">+12.5%</span>
              </div>
              <span className="text-white/40 text-[10px] font-medium">{t("dash_vs_last_month")}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setHidden((h) => !h)}
              className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10"
            >
              {hidden ? (
                <EyeOff size={18} className="text-white/70" />
              ) : (
                <Eye size={18} className="text-white/70" />
              )}
            </motion.button>

            <CircularRing
              value={spentPercent}
              size={64}
              strokeWidth={5}
              gradient={["#10B981", "#34D399"]}
              trackColor="rgba(255,255,255,0.1)"
              id="balance-ring"
            >
              <div className="text-center">
                <span className="text-white text-[10px] font-black block leading-none">{spentPercent}%</span>
              </div>
            </CircularRing>
          </div>
        </div>

        {/* Info Row */}
        <div className="flex gap-2">
          <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/5">
            <p className="text-white/50 text-[10px] uppercase font-bold mb-1">{t("dash_monthly_income")}</p>
            <p className="text-white font-bold text-sm">{formatCurrency(monthlyIncome, currencyConfig)}</p>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/5">
            <p className="text-white/50 text-[10px] uppercase font-bold mb-1">{t("dash_spent_so_far")}</p>
            <p className="text-white font-bold text-sm">{formatCurrency(monthlyExpense, currencyConfig)}</p>
          </div>
        </div>
      </GradientCard>
    </div>
  );
}
