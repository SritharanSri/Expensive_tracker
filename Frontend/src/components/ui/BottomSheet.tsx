"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  fullHeight?: boolean;
}

export function BottomSheet({ open, onClose, isDark, title, subtitle, children, fullHeight }: BottomSheetProps) {
  const { setSheetOpen } = useApp();

  useEffect(() => {
    if (open) {
      setSheetOpen(true);
      return () => setSheetOpen(false);
    }
  }, [open, setSheetOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto rounded-t-[28px] overflow-hidden",
              fullHeight ? "max-h-[90vh]" : "max-h-[80vh]",
              isDark
                ? "bg-[#0F172A] border-t border-white/[0.08]"
                : "bg-white border-t border-slate-100"
            )}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-white/20" : "bg-slate-200")} />
            </div>

            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-center justify-between px-5 pb-3 pt-1">
                <div>
                  {subtitle && (
                    <p className={cn("text-xs font-medium uppercase tracking-widest mb-0.5", isDark ? "text-slate-500" : "text-slate-400")}>
                      {subtitle}
                    </p>
                  )}
                  {title && (
                    <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-slate-900")}>
                      {title}
                    </h2>
                  )}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                  )}
                >
                  <X size={16} strokeWidth={2.5} />
                </motion.button>
              </div>
            )}

            {/* Content */}
            <div className={cn("overflow-y-auto pb-safe overscroll-contain no-scrollbar", fullHeight ? "max-h-[calc(90vh-80px)]" : "max-h-[calc(80vh-80px)]")}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
