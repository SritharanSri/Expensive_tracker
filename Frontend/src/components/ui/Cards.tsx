"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  onClick?: () => void;
  animate?: boolean;
}

export function GradientCard({
  children,
  className,
  gradient = "from-indigo-800 via-indigo-600 to-indigo-500",
  onClick,
  animate = true,
}: GradientCardProps) {
  const Comp = animate ? motion.div : "div";
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
        whileTap: onClick ? { scale: 0.98 } : undefined,
      }
    : {};

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-3xl cursor-default select-none",
        gradient ? `bg-gradient-to-br ${gradient}` : "",
        className
      )}
      {...(motionProps as object)}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Light streak */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </Comp>
  );
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  isDark?: boolean;
  onClick?: () => void;
  animate?: boolean;
  delay?: number;
}

export function GlassCard({
  children,
  className,
  isDark = false,
  onClick,
  animate = true,
  delay = 0,
}: GlassCardProps) {
  const Comp = animate ? motion.div : "div";
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] },
        whileTap: onClick ? { scale: 0.98 } : undefined,
      }
    : {};

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "rounded-3xl backdrop-blur-xl border transition-all duration-300",
        isDark
          ? "bg-slate-900/60 border-white/[0.08] shadow-card-dark"
          : "bg-white/70 border-white/80 shadow-card",
        onClick && "cursor-pointer hover:shadow-lg",
        className
      )}
      {...(motionProps as object)}
    >
      {children}
    </Comp>
  );
}
