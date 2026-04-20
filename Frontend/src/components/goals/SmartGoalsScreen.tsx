"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { type FinancialGoal, type GoalStatus } from "@/context/AppContext";
import { formatCurrency } from "@/lib/currency";
import { TopBar } from "@/components/layout/TopBar";
import { CircularRing } from "@/components/ui/Progress";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  Target, Plus, Brain, Flame, CheckCircle2, AlertTriangle, XCircle,
  Trophy, Zap, TrendingUp, TrendingDown, Lightbulb, Calendar, Lock,
  Unlock, Trash2, DollarSign, ChevronDown, ChevronUp, Sparkles,
  ArrowRight, RefreshCw, Clock, BarChart3, Crown,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────
const GOAL_ICONS = ["🎯","💻","📱","🚗","🏠","✈️","🎓","💍","🏋️","🎮","📷","🎵","🏖️","🛒","⌚","🎁","🧳","🛡️","💰","🚀"];
const TIMELINES = [
  { id: "6months",  label: "6 Months",  months: 6  },
  { id: "12months", label: "1 Year",    months: 12 },
  { id: "18months", label: "18 Months", months: 18 },
  { id: "custom",   label: "Custom",    months: 0  },
] as const;

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2; glow: string; grad: [string,string] }> = {
  on_track:     { label: "On Track",     color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25", icon: CheckCircle2, glow: "#10B981", grad: ["#10B981","#34D399"] },
  at_risk:      { label: "At Risk",      color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/25",   icon: AlertTriangle, glow: "#F59E0B", grad: ["#F59E0B","#FBBF24"] },
  not_feasible: { label: "Not Feasible", color: "text-rose-400",    bg: "bg-rose-400/10",    border: "border-rose-400/25",    icon: XCircle,      glow: "#EF4444", grad: ["#EF4444","#F87171"] },
  completed:    { label: "Completed 🎉", color: "text-indigo-400",  bg: "bg-indigo-400/10",  border: "border-indigo-400/25",  icon: Trophy,       glow: "#6366F1", grad: ["#6366F1","#818CF8"] },
};

// ── Utility: compute goal status from live financial data ─────────────────────
function computeStatus(goal: FinancialGoal, monthlySavings: number): GoalStatus {
  if (goal.currentAmount >= goal.targetAmount) return "completed";
  const remaining  = goal.targetAmount - goal.currentAmount;
  const targetDate = new Date(goal.targetDate);
  const now        = new Date();
  const monthsLeft = Math.max(0.1, (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  const required   = remaining / monthsLeft;
  if (monthlySavings >= required)          return "on_track";
  if (monthlySavings >= required * 0.7)    return "at_risk";
  return "not_feasible";
}

function daysToGoal(goal: FinancialGoal, monthlySavings: number): number {
  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0 || monthlySavings <= 0) return 0;
  return Math.ceil((remaining / monthlySavings) * 30.44);
}

function monthlyRequired(goal: FinancialGoal): number {
  const remaining  = goal.targetAmount - goal.currentAmount;
  const targetDate = new Date(goal.targetDate);
  const monthsLeft = Math.max(0.1, (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44));
  return remaining / monthsLeft;
}

// ── Circular progress with emoji ──────────────────────────────────────────────
function GoalRing({ goal, pct, status }: { goal: FinancialGoal; pct: number; status: GoalStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <CircularRing value={pct} size={72} strokeWidth={6} gradient={cfg.grad} trackColor="rgba(255,255,255,0.05)" id={goal.id}>
      <span className="text-2xl">{goal.icon}</span>
    </CircularRing>
  );
}

// ── Coach Banner ───────────────────────────────────────────────────────────────
function CoachBanner({ message, loading, isDark }: { message: string; loading: boolean; isDark: boolean }) {
  return (
    <div className={cn(
      "mx-5 mb-5 p-4 rounded-3xl border flex items-start gap-3",
      isDark ? "bg-gradient-to-r from-indigo-950/80 to-violet-950/60 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"
    )}>
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
        <Brain size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">AI Coach</p>
        {loading ? (
          <div className="flex items-center gap-2">
            <RefreshCw size={12} className="text-indigo-400 animate-spin" />
            <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>Analyzing your goals...</span>
          </div>
        ) : (
          <p className={cn("text-sm font-medium leading-relaxed", isDark ? "text-slate-200" : "text-slate-700")}>
            {message || "Tell your AI coach about your financial dreams. Create a goal to get started! 🌟"}
          </p>
        )}
      </div>
    </div>
  );
}

// ── What-If Sheet ─────────────────────────────────────────────────────────────
function WhatIfSheet({
  open, onClose, goal, monthlySavings, currencyConfig, isDark,
}: {
  open: boolean; onClose: () => void;
  goal: FinancialGoal | null;
  monthlySavings: number;
  currencyConfig: { symbol: string; code: string; locale: string };
  isDark: boolean;
}) {
  const [expRed, setExpRed] = useState("");
  const [incInc, setIncInc] = useState("");
  const [simResult, setSimResult] = useState<{ newMonthsToGoal: number; daysSaved: number; newStatus: GoalStatus; insight: string; recommendation: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    if (!goal) return;
    setLoading(true);
    setSimResult(null);
    try {
      const res = await fetch("/api/goals-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "whatif",
          goals: [{ name: goal.name, icon: goal.icon, targetAmount: goal.targetAmount, currentAmount: goal.currentAmount, targetDate: goal.targetDate, monthlyRequired: monthlyRequired(goal), status: goal.status, commitmentMode: goal.commitmentMode, priority: goal.priority }],
          financialCtx: { balance: 0, monthlyIncome: 0, monthlyExpenses: 0, monthlySavings, currencySymbol: currencyConfig.symbol, currencyCode: currencyConfig.code, budgets: [] },
          expenseReduction: Number(expRed) || 0,
          incomeIncrease: Number(incInc) || 0,
          targetGoalName: goal.name,
        }),
      });
      const data = await res.json();
      if (data.success) setSimResult(data.simulation);
    } catch { /* silently fail */ }
    setLoading(false);
  };

  if (!goal) return null;

  return (
    <BottomSheet open={open} onClose={onClose} isDark={isDark} title="What-If Simulator" subtitle="Test scenarios for your goal" fullHeight>
      <div className="px-5 pb-10 space-y-5">
        <div className={cn("p-4 rounded-3xl border", isDark ? "bg-indigo-500/5 border-indigo-500/15" : "bg-indigo-50 border-indigo-100")}>
          <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">Goal</p>
          <p className={cn("text-base font-black", isDark ? "text-white" : "text-slate-900")}>{goal.icon} {goal.name}</p>
          <p className="text-xs text-slate-500 mt-1">Remaining: {formatCurrency(goal.targetAmount - goal.currentAmount, currencyConfig)}</p>
        </div>

        {[
          { label: "💸 Monthly Expense Reduction", val: expRed, set: setExpRed, icon: TrendingDown },
          { label: "💰 Monthly Income Increase",   val: incInc, set: setIncInc, icon: TrendingUp  },
        ].map(({ label, val, set, icon: Icon }) => (
          <div key={label} className={cn("p-4 rounded-3xl border", isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm")}>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-3 flex items-center gap-1.5">
              <Icon size={10} /> {label}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-400">{currencyConfig.symbol}</span>
              <input type="number" value={val} onChange={(e) => set(e.target.value)} placeholder="0"
                className={cn("w-full text-2xl font-black bg-transparent outline-none placeholder:font-normal",
                  isDark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-300")} />
            </div>
          </div>
        ))}

        <motion.button whileTap={{ scale: 0.97 }} onClick={simulate} disabled={loading}
          className="w-full py-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30">
          {loading ? <><RefreshCw size={16} className="animate-spin" />Simulating...</> : <><Zap size={16} />Run Simulation</>}
        </motion.button>

        <AnimatePresence>
          {simResult && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={cn("rounded-3xl border p-5", isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm")}>
              <p className="text-[10px] font-black uppercase text-slate-500 mb-4">📊 Simulation Results</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "New Timeline",  value: `${simResult.newMonthsToGoal} months`, icon: Clock },
                  { label: "Days Saved",    value: `${simResult.daysSaved > 0 ? "-" : ""}${Math.abs(simResult.daysSaved)} days`, icon: Zap },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className={cn("rounded-2xl p-3 text-center", isDark ? "bg-white/5" : "bg-slate-50")}>
                    <Icon size={14} className="mx-auto mb-1 text-indigo-400" />
                    <p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">{label}</p>
                    <p className={cn("font-black text-base", isDark ? "text-white" : "text-slate-900")}>{value}</p>
                  </div>
                ))}
              </div>
              <p className={cn("text-sm font-medium mb-2 leading-relaxed", isDark ? "text-slate-300" : "text-slate-600")}>{simResult.insight}</p>
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Lightbulb size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-medium text-emerald-400">{simResult.recommendation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BottomSheet>
  );
}

// ── New Goal Sheet ─────────────────────────────────────────────────────────────
function GoalFormSheet({
  open, onClose, isDark, currencyConfig, monthlySavings, onAdd, onUpdate, editingGoal
}: {
  open: boolean; onClose: () => void; isDark: boolean;
  currencyConfig: { symbol: string; code: string; locale: string };
  monthlySavings: number;
  onAdd: (goal: Omit<FinancialGoal, "id" | "createdAt" | "conflicts" | "aiInsight">) => void;
  onUpdate: (id: string, updates: Partial<FinancialGoal>) => void;
  editingGoal: FinancialGoal | null;
}) {
  const [name, setName]       = useState("");
  const [icon, setIcon]       = useState("🎯");
  const [amount, setAmount]   = useState("");
  const [timeline, setTimeline] = useState<FinancialGoal["timeline"]>("6months");
  const [customDate, setCustomDate] = useState("");
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (editingGoal) {
      setName(editingGoal.name);
      setIcon(editingGoal.icon);
      setAmount(editingGoal.targetAmount.toString());
      setTimeline(editingGoal.timeline);
      setCustomDate(editingGoal.timeline === "custom" ? editingGoal.targetDate || "" : "");
    } else {
      setName("");
      setIcon("🎯");
      setAmount("");
      setTimeline("6months");
      setCustomDate("");
    }
  }, [editingGoal, open]);

  const computeTargetDate = (): string => {
    const now = new Date();
    if (timeline === "custom" && customDate) return customDate;
    const months = TIMELINES.find(t => t.id === timeline)?.months ?? 6;
    now.setMonth(now.getMonth() + months);
    return now.toISOString().split("T")[0];
  };

  const handleSave = async () => {
    if (!name.trim() || !amount || isNaN(Number(amount))) return;
    setSaving(true);
    const targetDate = computeTargetDate();
    const target = Number(amount);
    const remaining = target - (editingGoal?.currentAmount || 0); 
    const tDate = new Date(targetDate);
    const monthsLeft = Math.max(0.1, (tDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44));
    const reqPerMonth = remaining / monthsLeft;
    const aiApproved = monthlySavings >= reqPerMonth;
    const status: GoalStatus = aiApproved ? "on_track" : monthlySavings >= reqPerMonth * 0.7 ? "at_risk" : "not_feasible";

    if (editingGoal) {
      onUpdate(editingGoal.id, {
        name: name.trim(), icon, targetAmount: target,
        timeline, targetDate, status, aiApproved, monthlyRequired: reqPerMonth,
      });
    } else {
      onAdd({
        name: name.trim(), icon, targetAmount: target, currentAmount: 0,
        timeline, targetDate, status, aiApproved, commitmentMode: false,
        priority: 999, monthlyRequired: reqPerMonth,
      });
    }

    setTimeout(() => {
      setSaving(false); onClose();
    }, 800);
  };

  const previewMonths = useMemo(() => {
    if (!amount || !timeline) return null;
    const t = TIMELINES.find(t => t.id === timeline);
    const months = t?.months || 0;
    if (months <= 0 || !monthlySavings || monthlySavings <= 0) return null;
    const needed = Number(amount) / months;
    const feasible = monthlySavings >= needed;
    return { needed, feasible };
  }, [amount, timeline, monthlySavings]);

  return (
    <BottomSheet open={open} onClose={onClose} isDark={isDark} title="Create Smart Goal" subtitle="AI will monitor and guide you" fullHeight>
      <div className="px-5 pb-10 space-y-4">
        {/* Name + Icon */}
        <div className={cn("p-4 rounded-3xl border", isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm")}>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-3">Goal Name</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Laptop, Trip to Japan, New Phone..."
            className={cn("w-full text-base font-bold bg-transparent outline-none placeholder:font-normal mb-4",
              isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400")} />
          <div className="grid grid-cols-10 gap-1.5">
            {GOAL_ICONS.map((e) => (
              <button key={e} onClick={() => setIcon(e)}
                className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all",
                  icon === e ? "bg-indigo-600 scale-110 shadow-md" : isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200")}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className={cn("p-4 rounded-3xl border", isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm")}>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Target Amount</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-slate-400">{currencyConfig.symbol}</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
              className={cn("w-full text-3xl font-black bg-transparent outline-none placeholder:font-normal",
                isDark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-300")} />
          </div>
        </div>

        {/* Timeline */}
        <div className={cn("p-4 rounded-3xl border", isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white border-slate-100 shadow-sm")}>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-3">Timeline</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {TIMELINES.map((t) => (
              <button key={t.id} onClick={() => setTimeline(t.id as FinancialGoal["timeline"])}
                className={cn("py-2.5 rounded-2xl text-[11px] font-black transition-all border",
                  timeline === t.id ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                    : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500")}>
                {t.label}
              </button>
            ))}
          </div>
          {timeline === "custom" && (
            <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)}
              className={cn("w-full p-3 rounded-2xl border text-sm font-medium outline-none",
                isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900")}
              min={new Date().toISOString().split("T")[0]} />
          )}
        </div>

        {/* AI Preview */}
        {previewMonths && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={cn("p-4 rounded-3xl border flex items-center gap-3",
              previewMonths.feasible
                ? isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"
                : isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-100")}>
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
              previewMonths.feasible ? "bg-emerald-500/10" : "bg-amber-500/10")}>
              {previewMonths.feasible ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-amber-400" />}
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase", previewMonths.feasible ? "text-emerald-400" : "text-amber-400")}>
                {previewMonths.feasible ? "✅ AI Approved — Feasible!" : "⚠️ Needs More Savings"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Requires {formatCurrency(previewMonths.needed, currencyConfig)}/mo · You save {formatCurrency(monthlySavings, currencyConfig)}/mo
              </p>
            </div>
          </motion.div>
        )}

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving || !name.trim() || !amount}
          className={cn("w-full py-5 rounded-3xl font-black text-white text-base flex items-center justify-center gap-2 transition-all shadow-lg",
            saving || !name.trim() || !amount ? "opacity-50 cursor-not-allowed bg-indigo-600"
              : "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-500/30")}>
          {saving ? <><RefreshCw size={18} className="animate-spin" />Saving...</> : <><Sparkles size={18} />{editingGoal ? "Update Goal" : "Create Smart Goal"}<ArrowRight size={16} /></>}
        </motion.button>
      </div>
    </BottomSheet>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({
  goal, monthlySavings, currencyConfig, isDark, isPremium,
  onUpdate, onDelete, onContribute, onWhatIf, onEdit, triggerPremiumModal, trackPremiumClick,
}: {
  goal: FinancialGoal;
  monthlySavings: number;
  currencyConfig: { symbol: string; code: string; locale: string };
  isDark: boolean;
  isPremium: boolean;
  onUpdate: (id: string, updates: Partial<FinancialGoal>) => void;
  onDelete: (id: string) => void;
  onContribute: (id: string, amount: number, linkedId?: string) => void;
  onWhatIf: (goal: FinancialGoal) => void;
  onEdit: (goal: FinancialGoal) => void;
  triggerPremiumModal: (msg: string) => void;
  trackPremiumClick: () => void;
}) {
  const { categories } = useApp();
  const [expanded, setExpanded]     = useState(false);
  const [contribute, setContribute] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const incomeCategories = categories.filter(c => c.type === "income");

  const status   = computeStatus(goal, monthlySavings);
  const pct      = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  const req      = monthlyRequired(goal);
  const days     = daysToGoal(goal, monthlySavings);
  const cfg      = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
      <div className={cn(
        "rounded-3xl border-2 overflow-hidden transition-all",
        isDark ? "bg-slate-900/70 backdrop-blur-sm" : "bg-white shadow-sm",
        expanded ? cfg.border : "border-transparent",
        goal.commitmentMode && "border-amber-500/40",
      )} style={expanded ? { boxShadow: `0 0 30px ${cfg.glow}18` } : {}}>

        {/* Commitment badge */}
        {goal.commitmentMode && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center gap-1.5">
            <Flame size={12} className="text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Commitment Mode Active</span>
          </div>
        )}

        {/* Header tap area */}
        <button className="w-full p-4 text-left" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-4">
            <GoalRing goal={goal} pct={pct} status={status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-900")}>{goal.name}</h4>
                {goal.aiApproved && (
                  <span className="bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0">
                    ✓ AI Approved
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black", cfg.bg, cfg.border, cfg.color)}>
                  <StatusIcon size={10} />
                  {cfg.label}
                </div>
                <span className={cn("text-xs font-black", isDark ? "text-slate-300" : "text-slate-700")}>
                  {pct}%
                </span>
              </div>
              <div className="mt-2 w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${cfg.grad[0]}, ${cfg.grad[1]})`, boxShadow: `0 0 8px ${cfg.glow}60` }}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-500 font-bold">{formatCurrency(goal.currentAmount, currencyConfig)}</span>
                <span className={cn("text-[10px] font-black", isDark ? "text-slate-400" : "text-slate-600")}>{formatCurrency(goal.targetAmount, currencyConfig)}</span>
              </div>
            </div>
            <div className={cn("ml-1 transition-transform duration-200", expanded ? "rotate-180" : "")}>
              <ChevronDown size={18} className="text-slate-500" />
            </div>
          </div>
        </button>

        {/* Expanded body */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-4 pb-4 space-y-3">
                <div className={cn("h-px", isDark ? "bg-white/5" : "bg-slate-100")} />

                {/* Key stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Save/Mo", value: formatCurrency(req, currencyConfig), icon: DollarSign, color: "text-indigo-400" },
                    { label: "Days Left", value: days > 0 ? `${days}d` : "Done!", icon: Clock, color: "text-amber-400" },
                    { label: "Progress", value: `${pct}%`, icon: BarChart3, color: cfg.color },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className={cn("rounded-2xl p-2.5 text-center", isDark ? "bg-white/5" : "bg-slate-50")}>
                      <Icon size={12} className={cn("mx-auto mb-1", color)} />
                      <p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">{label}</p>
                      <p className={cn("font-black text-xs", isDark ? "text-white" : "text-slate-900")}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* AI Insight */}
                {goal.aiInsight && (
                  <div className={cn("flex items-start gap-2 p-3 rounded-2xl", isDark ? "bg-indigo-500/5 border border-indigo-500/15" : "bg-indigo-50 border border-indigo-100")}>
                    <Brain size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-indigo-400 font-medium">{goal.aiInsight}</p>
                  </div>
                )}

                {/* Contribute */}
                <div className={cn("p-4 rounded-3xl", isDark ? "bg-white/[0.03] border border-white/[0.06]" : "bg-slate-50 border border-slate-100")}>
                  <p className="text-[9px] font-black uppercase text-slate-500 mb-3">Funding Source & Amount</p>
                  
                  {/* Source Picker */}
                  <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
                    {incomeCategories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedSourceId(cat.id === selectedSourceId ? null : cat.id)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-2xl border transition-all flex-shrink-0",
                          selectedSourceId === cat.id
                            ? (isDark ? "bg-indigo-500/20 border-indigo-500/40" : "bg-indigo-50 border-indigo-100 shadow-sm")
                            : (isDark ? "bg-white/5 border-transparent" : "bg-white border-transparent")
                        )}
                      >
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          {cat.icon}
                        </div>
                        <span className={cn("text-[10px] font-bold", isDark ? "text-white" : "text-slate-900")}>
                          {cat.name}
                        </span>
                        {selectedSourceId === cat.id && <CheckCircle2 size={10} className="text-indigo-500" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-400">{currencyConfig.symbol}</span>
                      <input type="number" value={contribute} onChange={(e) => setContribute(e.target.value)} placeholder="Amount"
                        className={cn("w-full text-sm font-bold bg-transparent outline-none placeholder:font-normal",
                          isDark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-400")} />
                    </div>
                    <button 
                      onClick={() => { 
                        if (contribute && Number(contribute) > 0) { 
                          onContribute(goal.id, Number(contribute), selectedSourceId || undefined); 
                          setContribute(""); 
                        } 
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-white text-[11px] font-black flex-shrink-0 transition-all active:scale-95",
                        contribute && Number(contribute) > 0 ? "bg-indigo-600 shadow-lg shadow-indigo-500/30" : "bg-slate-500 opacity-40 cursor-not-allowed"
                      )}
                    >
                      Add Cash
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => {
                      if (isPremium) onWhatIf(goal);
                      else {
                        trackPremiumClick();
                        triggerPremiumModal("AI What-If Simulations are reserved for Premium members.");
                      }
                    }}
                    className={cn("py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all",
                      isPremium
                        ? isDark ? "bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20" : "bg-violet-50 border-violet-200 text-violet-600"
                        : isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-amber-50 border-amber-200 text-amber-600")}>
                    {isPremium ? <Zap size={12} /> : <Crown size={12} />}
                    {isPremium ? "What-If" : "Pro Only"}
                  </button>
                  <button onClick={() => onEdit(goal)}
                    className={cn("py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all",
                      isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500")}>
                    <Plus size={12} className="rotate-45" /> Edit Details
                  </button>
                  <button onClick={() => onUpdate(goal.id, { commitmentMode: !goal.commitmentMode })}
                    className={cn("py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all",
                      goal.commitmentMode
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500")}>
                    {goal.commitmentMode ? <Flame size={12} /> : <Unlock size={12} />}
                    {goal.commitmentMode ? "Committed 🔥" : "Commit"}
                  </button>
                </div>

                {/* Delete */}
                {confirmDel ? (
                  <div className="flex gap-2">
                    <button onClick={() => { onDelete(goal.id); setConfirmDel(false); }}
                      className="flex-1 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-black">✓ Confirm</button>
                    <button onClick={() => setConfirmDel(false)}
                      className={cn("flex-1 py-2.5 rounded-2xl text-xs font-black border", isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500")}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDel(true)}
                    className={cn("w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all",
                      isDark ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20" : "bg-rose-50 border-rose-200 text-rose-500")}>
                    <Trash2 size={12} /> Delete Goal
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export function SmartGoalsScreen() {
  const {
    isDark, isPremium, currencyConfig, transactions, budgets,
    financialGoals, addFinancialGoal, updateFinancialGoalItem,
    deleteFinancialGoalItem, contributeToGoal, addNotification,
    triggerPremiumModal, trackPremiumClick,
    editingFinancialGoal, setEditingFinancialGoal
  } = useApp();

  const [showNewGoal, setShowNewGoal]         = useState(false);
  const [whatIfGoal, setWhatIfGoal]           = useState<FinancialGoal | null>(null);
  const [coachMsg, setCoachMsg]               = useState("");
  const [coachLoading, setCoachLoading]       = useState(false);
  const hasLoadedCoach                        = useRef(false);

  // ── Derived financial snapshot ────────────────
  const snapshot = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyIncome   = thisMonth.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
    const monthlyExpenses = thisMonth.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0);
    const balance         = transactions.reduce((a, t) => t.type === "income" ? a + t.amount : a - t.amount, 0);
    return { balance, monthlyIncome, monthlyExpenses, monthlySavings: monthlyIncome - monthlyExpenses };
  }, [transactions]);

  // ── Conflict detection ───────────────────────
  const totalRequired   = financialGoals.reduce((a, g) => a + monthlyRequired(g), 0);
  const hasConflict     = financialGoals.length > 1 && snapshot.monthlySavings > 0 && totalRequired > snapshot.monthlySavings;
  const overflowAmount  = Math.max(0, totalRequired - snapshot.monthlySavings);

  // ── Load AI coach message on mount ───────────
  const loadCoach = useCallback(async () => {
    if (financialGoals.length === 0) { setCoachMsg(""); return; }
    setCoachLoading(true);
    try {
      const res = await fetch("/api/goals-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "coach",
          goals: financialGoals.map(g => ({
            name: g.name, icon: g.icon,
            targetAmount: g.targetAmount, currentAmount: g.currentAmount,
            targetDate: g.targetDate, monthlyRequired: monthlyRequired(g),
            status: computeStatus(g, snapshot.monthlySavings),
            commitmentMode: g.commitmentMode, priority: g.priority,
          })),
          financialCtx: {
            ...snapshot,
            currencySymbol: currencyConfig.symbol,
            currencyCode: currencyConfig.code,
            budgets: budgets.map(b => ({ category: b.category, limit: b.limit, spent: b.spent })),
          },
        }),
      });
      const data = await res.json();
      if (data.success) setCoachMsg(data.message);
    } catch { /* ignore */ }
    setCoachLoading(false);
  }, [financialGoals.length, snapshot.monthlySavings, currencyConfig, budgets]); // eslint-disable-line

  useEffect(() => {
    if (!hasLoadedCoach.current && financialGoals.length > 0) {
      hasLoadedCoach.current = true;
      loadCoach();
    }
  }, [financialGoals.length, loadCoach]);

  // ── Premium gate: max 2 goals for free ───────
  const canAddGoal = isPremium || financialGoals.length < 2;

  // ── Summary stats ─────────────────────────────
  const onTrackCount = financialGoals.filter(g => computeStatus(g, snapshot.monthlySavings) === "on_track").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={cn("min-h-screen pb-36", isDark ? "bg-[#0B1120]" : "bg-[#F8FAFC]")}>
      <TopBar title="Smart Goals" subtitle="AI Financial Intelligence" />

      {/* ── Hero ── */}
      <div className="mx-5 mb-5">
        <div className="rounded-[32px] overflow-hidden relative p-6"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)" }}>
          <div className="absolute top-0 right-0 w-48 h-48 opacity-15 blur-3xl rounded-full"
            style={{ background: "radial-gradient(circle, #818cf8, transparent)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Target size={22} className="text-indigo-300" />
              </div>
              <div>
                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">AI-Powered</p>
                <h2 className="text-white font-black text-lg">Smart Goals Engine</h2>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Goals", value: financialGoals.length, color: "text-white" },
                { label: "On Track",    value: onTrackCount, color: "text-emerald-400" },
                { label: "Monthly Free", value: formatCurrency(Math.max(0, snapshot.monthlySavings - totalRequired), currencyConfig, true), color: snapshot.monthlySavings > totalRequired ? "text-emerald-400" : "text-rose-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/10 rounded-2xl p-2 border border-white/10 text-center flex flex-col justify-center min-w-0">
                  <p className={cn("font-black text-[13px] truncate px-1", color)}>{value}</p>
                  <p className="text-white/50 text-[8px] font-bold uppercase mt-0.5 truncate">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Coach ── */}
      <CoachBanner message={coachMsg} loading={coachLoading} isDark={isDark} />

      {/* ── Conflict Warning ── */}
      {hasConflict && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mx-5 mb-5 p-4 rounded-3xl border bg-amber-500/10 border-amber-500/25 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-amber-400 mb-0.5">Goal Conflict Detected 🚨</p>
            <p className={cn("text-xs font-medium", isDark ? "text-slate-300" : "text-slate-600")}>
              Your goals need {formatCurrency(totalRequired, currencyConfig)}/mo but you save {formatCurrency(snapshot.monthlySavings, currencyConfig)}/mo.
              Shortfall: {formatCurrency(overflowAmount, currencyConfig)}/mo.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Goals Header ── */}
      <div className="mx-5 mb-4 flex items-center justify-between">
        <h3 className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-800")}>
          My Goals <span className="text-slate-500 text-sm font-bold">({financialGoals.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          {financialGoals.length > 0 && (
            <button onClick={loadCoach} className={cn("w-8 h-8 rounded-xl flex items-center justify-center",
              isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
              <RefreshCw size={14} className={coachLoading ? "animate-spin" : ""} />
            </button>
          )}
          <button onClick={() => {
              if (canAddGoal) setShowNewGoal(true);
              else {
                trackPremiumClick();
                triggerPremiumModal("Premium unlocks unlimited goals. Manage all your dreams in one place.");
              }
            }}
            className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all",
              canAddGoal
                ? "bg-indigo-600 text-white shadow-indigo-500/30"
                : "bg-amber-500 text-white shadow-amber-500/30")}>
            {canAddGoal ? <Plus size={20} strokeWidth={2.5} /> : <Crown size={16} />}
          </button>
        </div>
      </div>

      {/* ── Free limit notice ── */}
      {!isPremium && financialGoals.length >= 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mx-5 mb-4 p-3 rounded-2xl border bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 flex items-center gap-3">
          <Sparkles size={16} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-black text-amber-400">Free Plan: 2 Goals Max</p>
            <p className="text-[10px] text-slate-500">Upgrade to Premium for unlimited goals + AI simulations</p>
          </div>
          <ArrowRight size={14} className="text-amber-400 flex-shrink-0" />
        </motion.div>
      )}

      {/* ── Goals List ── */}
      <div className="mx-5 space-y-4">
        <AnimatePresence>
          {financialGoals.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={cn("rounded-3xl border p-10 text-center", isDark ? "bg-slate-900/40 border-white/[0.06]" : "bg-white/60 border-slate-100")}>
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-indigo-400" />
              </div>
              <h3 className={cn("text-base font-black mb-2", isDark ? "text-white" : "text-slate-900")}>No goals yet</h3>
              <p className={cn("text-xs font-medium leading-relaxed mb-5 max-w-[220px] mx-auto", isDark ? "text-slate-500" : "text-slate-400")}>
                Create your first financial goal. The AI will monitor it 24/7 and guide you to success.
              </p>
              <button onClick={() => setShowNewGoal(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black shadow-lg shadow-indigo-500/30 flex items-center gap-2 mx-auto">
                <Plus size={14} /> Create First Goal
              </button>
            </motion.div>
          )}

          {financialGoals
            .slice()
            .sort((a, b) => a.priority - b.priority)
            .map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                monthlySavings={snapshot.monthlySavings}
                currencyConfig={currencyConfig}
                isDark={isDark}
                isPremium={isPremium}
                onUpdate={updateFinancialGoalItem}
                onDelete={deleteFinancialGoalItem}
                onContribute={contributeToGoal}
                onWhatIf={(g) => { setWhatIfGoal(g); }}
                onEdit={(g) => { setEditingFinancialGoal(g); setShowNewGoal(true); }}
                triggerPremiumModal={triggerPremiumModal}
                trackPremiumClick={trackPremiumClick}
              />
            ))}
        </AnimatePresence>
      </div>

      {/* ── Sheets ── */}
      <GoalFormSheet
        open={showNewGoal}
        onClose={() => { setShowNewGoal(false); setEditingFinancialGoal(null); }}
        isDark={isDark}
        currencyConfig={currencyConfig}
        monthlySavings={snapshot.monthlySavings}
        onAdd={addFinancialGoal}
        onUpdate={updateFinancialGoalItem}
        editingGoal={editingFinancialGoal}
      />
      <WhatIfSheet
        open={!!whatIfGoal}
        onClose={() => setWhatIfGoal(null)}
        goal={whatIfGoal}
        monthlySavings={snapshot.monthlySavings}
        currencyConfig={currencyConfig}
        isDark={isDark}
      />
    </motion.div>
  );
}
