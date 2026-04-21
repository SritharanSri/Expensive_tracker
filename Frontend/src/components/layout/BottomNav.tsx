"use client";

import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { LayoutDashboard, PlusCircle, Target, BarChart2, Crosshair } from "lucide-react";

export function BottomNav() {
  const { currentScreen, setScreen, isDark, sheetOpen, t, setEditingTransaction } = useApp();

  const NAV_ITEMS = [
    { id: "dashboard"   as const, label: t("nav_dashboard"), icon: LayoutDashboard, isCTA: false },
    { id: "budget"      as const, label: t("nav_budget"),    icon: Target,          isCTA: false },
    { id: "add-expense" as const, label: t("nav_add"),       icon: PlusCircle,      isCTA: true  },
    { id: "reports"     as const, label: t("nav_reports"),   icon: BarChart2,       isCTA: false },
    { id: "goals"       as const, label: "Goals",            icon: Crosshair,       isCTA: false },
  ];

  return (
    <motion.div
      animate={{ y: sheetOpen ? 120 : 0, opacity: sheetOpen ? 0 : 1 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      style={{ pointerEvents: sheetOpen ? "none" : "auto" }}
      className="fixed bottom-6 left-0 right-0 mx-auto w-[calc(100%-3rem)] max-w-[380px] z-50"
    >
      <div
        className={cn(
          "relative flex items-center justify-between px-1 h-16 rounded-full border",
          isDark
            ? "bg-slate-900/90 border-slate-800 backdrop-blur-xl"
            : "bg-white/90 border-slate-200/50 backdrop-blur-xl"
        )}
        style={{
          boxShadow: isDark
            ? "0 10px 40px rgba(0,0,0,0.5)"
            : "0 10px 40px rgba(0,0,0,0.08)",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          if (item.isCTA) {
            return (
              <div key={item.id} className="relative flex flex-col items-center flex-1 h-full justify-center">
                <motion.button
                  onClick={() => {
                    if (item.id === "add-expense") setEditingTransaction(null);
                    setScreen(item.id);
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute -top-7 flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                    boxShadow: "0 8px 20px -4px rgba(99,102,241,0.6)",
                  }}
                >
                  <Icon size={28} strokeWidth={2.5} />
                </motion.button>
              </div>
            );
          }

          return (
            <motion.button
              key={item.id}
              onClick={() => {
                if (item.id === "add-expense") setEditingTransaction(null);
                setScreen(item.id);
              }}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 relative"
            >
              <div className="relative">
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "transition-colors duration-200",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

