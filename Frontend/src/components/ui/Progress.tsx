"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  gradient?: string;
  bgColor?: string;
  height?: string;
  glow?: boolean;
  glowColor?: string;
  animate?: boolean;
  exceeded?: boolean;
}

export function ProgressBar({
  value,
  className,
  gradient = "from-indigo-600 to-indigo-400",
  bgColor = "bg-slate-100",
  height = "h-2.5",
  glow = false,
  glowColor,
  animate = true,
  exceeded = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full rounded-full overflow-hidden", bgColor, height, className)}>
      <motion.div
        className={cn(
          "h-full rounded-full bg-gradient-to-r",
          exceeded ? "from-rose-500 to-rose-400" : gradient,
          glow && "progress-bar-glow"
        )}
        initial={animate ? { width: 0 } : { width: `${pct}%` }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        style={glow && glowColor ? { boxShadow: `0 0 10px ${glowColor}80` } : undefined}
      />
    </div>
  );
}

// Circular SVG progress ring
interface CircularRingProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  gradient?: [string, string]; // [startColor, endColor]
  trackColor?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

export function CircularRing({
  value,
  size = 120,
  strokeWidth = 10,
  gradient = ["#4F46E5", "#6366F1"],
  trackColor = "rgba(99,102,241,0.15)",
  children,
  className,
  id = "ring",
}: CircularRingProps) {
  const pct = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const gradId = `grad-${id}`;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="ring-progress">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
