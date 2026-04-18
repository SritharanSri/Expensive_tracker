"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/currency";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/Cards";
import { CircularRing } from "@/components/ui/Progress";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Trophy, Plus, BrainCircuit } from "lucide-react";

export function SavingsScreen() {
  const { isDark, savingsGoals, addSavingsGoal, isPremium, currencyConfig } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalIcon, setNewGoalIcon] = useState("✨");

  const totalSaved = savingsGoals.reduce((a, b) => a + b.current, 0);
  const totalTarget = savingsGoals.reduce((a, b) => a + b.target, 0);
  const totalPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

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
      <TopBar title="Savings Goals" subtitle="Wealth Building" />

      {/* Hero Summary */}
      <div className="mx-5 mb-8">
        <div className="p-6 rounded-[32px] bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/20 relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-6">
            <CircularRing
              value={totalPct}
              size={90}
              strokeWidth={10}
              gradient={["#92400E", "#B45309"]}
              trackColor="rgba(255,255,255,0.2)"
              id="savings-hero"
            >
              <Trophy size={24} className="text-amber-900" />
            </CircularRing>
            <div>
              <p className="text-amber-900/60 text-[10px] font-black uppercase tracking-widest mb-1">Total Savings</p>
              <p className="text-amber-900 text-3xl font-black">{formatCurrency(totalSaved, currencyConfig)}</p>
              <p className="text-amber-900/60 text-xs font-bold mt-1">
                {totalPct}% of {formatCurrency(totalTarget, currencyConfig)} goal
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        </div>
      </div>

      {/* Goal Cards */}
      <div className="mx-5 mb-4 flex items-center justify-between">
        <h3 className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-800")}>Your Goals</h3>
        <button 
          onClick={() => setShowAddGoal(true)}
          className="w-10 h-10 rounded-full bg-amber-500 text-amber-950 flex items-center justify-center shadow-lg shadow-amber-500/30"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="mx-5 space-y-4">
        {savingsGoals.map((goal) => {
          const pct = Math.round((goal.current / goal.target) * 100);
          const isSelected = selected === goal.id;

          return (
            <motion.div
              key={goal.id}
              onClick={() => setSelected(isSelected ? null : goal.id)}
            >
              <GlassCard
                isDark={isDark}
                className={cn(
                  "p-5 transition-all border-2",
                  isSelected ? "border-amber-500/30 bg-amber-500/[0.02]" : "border-transparent"
                )}
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-3xl">
                    {goal.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn("font-black text-sm", isDark ? "text-white" : "text-slate-800")}>{goal.category}</h4>
                      <span className="text-xs font-black text-amber-500">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                       <span className={cn("text-[10px] font-bold", isDark ? "text-slate-500" : "text-slate-400")}>
                        {formatCurrency(goal.current, currencyConfig)}
                       </span>
                       <span className={cn("text-[10px] font-black", isDark ? "text-slate-300" : "text-slate-600")}>
                        Target {formatCurrency(goal.target, currencyConfig)}
                       </span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                           <BrainCircuit size={14} className="text-indigo-400" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">AI Goal Analyzer</span>
                        </div>
                        
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500">Estimated Completion</span>
                              <span className={cn("text-xs font-black", isPremium ? "text-emerald-500" : "text-slate-400")}>
                                {isPremium ? "Aug 2026 (4 mos)" : "🔒 Premium Only"}
                              </span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500">Monthly Deposit Required</span>
                              <span className={cn("text-xs font-black", isPremium ? "text-indigo-500" : "text-slate-400")}>
                                {isPremium ? formatCurrency((goal.target - goal.current) / 4, currencyConfig) : "🔒 Premium Only"}
                              </span>
                           </div>
                        </div>

                        {!isPremium && (
                          <button className="w-full mt-4 py-2 rounded-xl bg-amber-500 shadow-lg text-amber-950 text-[10px] font-black uppercase tracking-widest">
                            Upgrade to Unlock AI Projections
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <BottomSheet open={showAddGoal} onClose={() => setShowAddGoal(false)} isDark={isDark} title="Wealth Target" subtitle="Define your next milestone">
         <div className="px-5 pb-10 space-y-6">
           <div className="p-4 rounded-3xl bg-amber-50 dark:bg-white/5 border border-amber-100 dark:border-white/5">
              <p className="text-[10px] font-black uppercase text-amber-600 mb-2">Goal Name</p>
              <input
                type="text"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="New Home / Tesla / Vacation"
                className={cn(
                  "bg-transparent text-xl font-black outline-none w-full mb-3 placeholder:font-normal",
                  isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"
                )}
              />
              <div className="flex gap-2 flex-wrap">
                {["✈️", "🏠", "🚗", "💻", "💎", "🎓", "🛡️", "✨"].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setNewGoalIcon(emoji)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all",
                      newGoalIcon === emoji
                        ? "bg-amber-500 scale-110"
                        : "bg-white dark:bg-white/5"
                    )}
                  >{emoji}</button>
                ))}
              </div>
           </div>
           <div className="p-4 rounded-3xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Target Amount</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-400">{currencyConfig.symbol}</span>
                <input
                  type="number"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  placeholder="50,000"
                  className={cn(
                    "bg-transparent text-3xl font-black outline-none w-full",
                    isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-300"
                  )}
                />
              </div>
           </div>
           <button 
             onClick={() => {
               if (!newGoalName.trim() || !newGoalTarget) return;
               addSavingsGoal({ category: newGoalName.trim(), target: parseFloat(newGoalTarget), icon: newGoalIcon });
               setGoalSaved(true);
               setTimeout(() => {
                 setGoalSaved(false);
                 setShowAddGoal(false);
                 setNewGoalName("");
                 setNewGoalTarget("");
                 setNewGoalIcon("✨");
               }, 1200);
             }}
             className="w-full py-5 rounded-3xl bg-amber-500 text-amber-950 font-black text-lg shadow-xl shadow-amber-500/30"
           >
             {goalSaved ? "Goal Established!" : "Launch Goal"}
           </button>
         </div>
      </BottomSheet>
    </motion.div>
  );
}
