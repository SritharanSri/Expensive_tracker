"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  isDark?: boolean;
}

export function Skeleton({ className, isDark }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "rounded-2xl",
        isDark
          ? "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%] animate-shimmer"
          : "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer",
        className
      )}
    />
  );
}

export function SkeletonCard({ isDark }: { isDark?: boolean }) {
  return (
    <div className={cn("rounded-3xl p-5 space-y-3", isDark ? "bg-slate-800/50" : "bg-white/50")}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" isDark={isDark} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-2/3" isDark={isDark} />
          <Skeleton className="h-2 w-1/2" isDark={isDark} />
        </div>
        <Skeleton className="h-4 w-16" isDark={isDark} />
      </div>
    </div>
  );
}
