"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/Cards";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { cn, formatDate } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { CATEGORIES } from "@/lib/data";
import { Transaction } from "@/context/AppContext";
import { ArrowUpRight, ArrowDownLeft, Search, SlidersHorizontal, ReceiptText, Pencil, Trash2, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

function TxRow({ tx, i, isDark, animate = true, isMounted, onClick }: { 
  tx: Transaction; i: number; isDark: boolean; animate?: boolean; isMounted: boolean;
  onClick?: (tx: Transaction) => void;
}) {
  const { categories, currencyConfig } = useApp();
  const cat = categories.find((c) => c.id === tx.category);
  const source = tx.linkedIncomeCategoryId ? categories.find(c => c.id === tx.linkedIncomeCategoryId) : null;
  const isIncome = tx.type === "income";

  return (
    <motion.div
      key={tx.id}
      initial={animate ? { opacity: 0, x: -10 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.04 * i + 0.1, duration: 0.3 }}
      className={cn(
        "flex items-center gap-3.5 px-5 py-3.5 transition-colors active:scale-[0.99] cursor-pointer",
        isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/80"
      )}
      onClick={() => onClick?.(tx)}
    >
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
        style={{ background: `${cat?.color}18` }}
      >
        {cat?.icon || "💸"}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm truncate", isDark ? "text-white" : "text-slate-800")}>
          {tx.title}
        </p>
        <p className={cn("text-xs mt-0.5 flex items-center gap-1", isDark ? "text-slate-500" : "text-slate-400")}>
          {isMounted ? formatDate(tx.date) : "..."} · {cat?.name}
          {source && (
            <span className="flex items-center gap-1">
              · <span className="opacity-40 italic">from</span> 
              <span className={cn("font-bold", isDark ? "text-indigo-400" : "text-indigo-600")}>{source.name}</span>
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <div className={cn("flex items-center gap-0.5 font-bold text-sm", isIncome ? "text-emerald-500" : "text-rose-500")}>
          {isIncome ? <ArrowUpRight size={14} strokeWidth={2.5} /> : <ArrowDownLeft size={14} strokeWidth={2.5} />}
          {formatCurrency(tx.amount, currencyConfig)}
        </div>
      </div>
    </motion.div>
  );
}

export function TransactionList({ isDark }: { isDark: boolean }) {
  const { transactions, currencyConfig, t, categories } = useApp();
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "income" | "expense" | "investment">("all");
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTxForMenu, setSelectedTxForMenu] = useState<Transaction | null>(null);
  const { removeTransaction, setEditingTransaction, setScreen } = useApp();

  const handleEdit = () => {
    if (selectedTxForMenu) {
      setEditingTransaction(selectedTxForMenu);
      setScreen("add-expense");
      setSelectedTxForMenu(null);
      setShowAll(false);
    }
  };

  const handleDelete = () => {
    if (selectedTxForMenu && confirm("Are you sure you want to delete this transaction?")) {
      removeTransaction(selectedTxForMenu.id);
      setSelectedTxForMenu(null);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filtered = (transactions || [])
    .filter((tx) => filter === "all" || tx.type === filter)
    .filter((tx) => !selectedCatId || tx.category === selectedCatId)
    .filter((tx) => tx.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <GlassCard isDark={isDark} className="mx-5 overflow-hidden" delay={0.2}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className={cn("font-bold text-base", isDark ? "text-white" : "text-slate-800")}>
            {t("dash_recent")}
          </h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAll(true)}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors",
              isDark ? "text-indigo-400 bg-indigo-500/10 active:bg-indigo-500/20" : "text-indigo-600 bg-indigo-50 active:bg-indigo-100"
            )}
          >
            {t("dash_see_all")}
          </motion.button>
        </div>

        <div className="divide-y divide-slate-100/50 dark:divide-white/[0.04]">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 px-5">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isDark ? "bg-slate-800" : "bg-slate-100")}>
                <ReceiptText size={22} className={isDark ? "text-slate-500" : "text-slate-400"} />
              </div>
              <div className="text-center">
                <p className={cn("font-bold text-sm", isDark ? "text-white" : "text-slate-800")}>No transactions yet</p>
                <p className={cn("text-xs mt-1", isDark ? "text-slate-500" : "text-slate-400")}>Add your first income or expense to get started</p>
              </div>
            </div>
          ) : (
            transactions.slice(0, 6).map((tx, i) => (
              <TxRow key={tx.id} tx={tx} i={i} isDark={isDark} isMounted={isMounted} onClick={setSelectedTxForMenu} />
            ))
          )}
        </div>
        <div className="h-3" />
      </GlassCard>

      {/* All Transactions Sheet */}
      <BottomSheet open={showAll} onClose={() => setShowAll(false)} isDark={isDark} title={t("dash_recent")} subtitle={t("nav_reports")} fullHeight>
        {/* Search + Filter */}
        <div className="px-5 pb-3 space-y-3">
          <div className={cn("flex items-center gap-2 px-3.5 py-2.5 rounded-2xl", isDark ? "bg-slate-800" : "bg-slate-50")}>
            <Search size={15} className={isDark ? "text-slate-500" : "text-slate-400"} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className={cn(
                "flex-1 bg-transparent outline-none text-sm font-medium placeholder:font-normal",
                isDark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"
              )}
            />
            <SlidersHorizontal size={15} className={isDark ? "text-slate-500" : "text-slate-400"} />
          </div>

          <div className={cn("flex rounded-xl p-0.5 gap-0.5", isDark ? "bg-slate-800" : "bg-slate-100")}>
            {(["all", "income", "expense"] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setSelectedCatId(null); }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200",
                  filter === f
                    ? "text-white bg-indigo-500 shadow-sm"
                    : isDark ? "text-slate-400" : "text-slate-500"
                )}
              >
                {f === "all" ? t("nav_reports") : f}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCatId(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shrink-0",
                !selectedCatId 
                  ? "bg-indigo-500 text-white" 
                  : isDark ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400"
              )}
            >
              All Categories
            </button>
            {categories.filter(c => filter === "all" || c.type === filter).map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id === selectedCatId ? null : cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5",
                  selectedCatId === cat.id
                    ? "text-white"
                    : isDark ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400"
                )}
                style={selectedCatId === cat.id ? { backgroundColor: cat.color } : undefined}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Summary bar */}
        <div className="px-5 pb-3">
          <div className={cn("flex gap-3 p-3 rounded-2xl", isDark ? "bg-slate-800/60" : "bg-slate-50")}>
            <div className="flex-1 text-center">
              <p className="text-emerald-500 text-sm font-bold">
                {formatCurrency(filtered.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0), currencyConfig)}
              </p>
              <p className={cn("text-[10px]", isDark ? "text-slate-500" : "text-slate-400")}>{t("income")}</p>
            </div>
            <div className={cn("w-px", isDark ? "bg-white/[0.06]" : "bg-slate-200")} />
            <div className="flex-1 text-center">
              <p className="text-rose-500 text-sm font-bold">
                {formatCurrency(filtered.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0), currencyConfig)}
              </p>
              <p className={cn("text-[10px]", isDark ? "text-slate-500" : "text-slate-400")}>{t("expense")}</p>
            </div>
            <div className={cn("w-px", isDark ? "bg-white/[0.06]" : "bg-slate-200")} />
            <div className="flex-1 text-center">
              <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-slate-800")}>
                {filtered.length}
              </p>
              <p className={cn("text-[10px]", isDark ? "text-slate-500" : "text-slate-400")}>{t("nav_reports")}</p>
            </div>
          </div>
        </div>

        {/* Transaction list */}
        <div className={cn("divide-y", isDark ? "divide-white/[0.04]" : "divide-slate-100/50")}>
          <AnimatePresence>
            {filtered.length > 0 ? (
              filtered.map((tx, i) => <TxRow key={tx.id} tx={tx} i={i} isDark={isDark} isMounted={isMounted} onClick={setSelectedTxForMenu} />)
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn("text-center py-12 text-sm", isDark ? "text-slate-500" : "text-slate-400")}
              >
                No transactions found
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="h-8" />
      </BottomSheet>

      {/* Transaction Action Menu */}
      <BottomSheet 
        open={!!selectedTxForMenu} 
        onClose={() => setSelectedTxForMenu(null)} 
        isDark={isDark} 
        title="Manage Transaction"
        subtitle={selectedTxForMenu?.title}
      >
        <div className="px-5 pb-8 space-y-3">
          <button 
            onClick={handleEdit}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all",
              isDark ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-slate-50 text-slate-800 hover:bg-slate-100"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Pencil size={18} />
            </div>
            <div className="text-left">
              <p className="text-sm">Edit Transaction</p>
              <p className={cn("text-[10px] font-medium opacity-50", isDark ? "text-slate-400" : "text-slate-500")}>Change amount, date or category</p>
            </div>
          </button>

          <button 
            onClick={handleDelete}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all",
              isDark ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/15" : "bg-rose-50 text-rose-600 hover:bg-rose-100"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Trash2 size={18} />
            </div>
            <div className="text-left">
              <p className="text-sm">Delete Forever</p>
              <p className="text-[10px] font-medium opacity-60">This action cannot be undone</p>
            </div>
          </button>

          <button 
            onClick={() => setSelectedTxForMenu(null)}
            className={cn(
              "w-full flex items-center justify-center gap-2 p-4 rounded-2xl font-bold mt-2",
              isDark ? "text-slate-500" : "text-slate-400"
            )}
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
