"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { Bell, Settings, Check } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";

function timeAgo(date: Date, now: number): string {
  const diffMs = now - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(date).toLocaleDateString();
}

interface TopBarProps {
  title?: string;
  subtitle?: string;
  showNotification?: boolean;
  showSettings?: boolean;
  rightAction?: React.ReactNode;
}

export function TopBar({ title, subtitle, showNotification = false, showSettings = false, rightAction }: TopBarProps) {
  const { isDark, setScreen, notifications, markAllNotificationsRead, markNotificationRead } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    setNow(Date.now());
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between px-5 pt-4 pb-2"
      >
        <div>
          {subtitle && (
            <p className={cn("text-xs font-medium uppercase tracking-widest mb-0.5", isDark ? "text-slate-500" : "text-slate-400")}>
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className={cn("text-[22px] font-bold leading-tight", isDark ? "text-white" : "text-slate-900")}>
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rightAction}
          {showNotification && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNotifs(true)}
              className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center relative",
                isDark ? "bg-slate-800 text-slate-300" : "bg-white text-slate-600 shadow-card"
              )}
            >
              <Bell size={18} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </motion.button>
          )}
          {showSettings && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setScreen("settings")}
              className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center",
                isDark ? "bg-slate-800 text-slate-300" : "bg-white text-slate-600 shadow-card"
              )}
            >
              <Settings size={18} strokeWidth={1.8} />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Notifications Panel */}
      <BottomSheet open={showNotifs} onClose={() => setShowNotifs(false)} isDark={isDark} title="Notifications" subtitle={`${unreadCount} unread`}>
        {/* Mark All Read */}
        {unreadCount > 0 && (
          <div className="px-5 pb-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={markAllNotificationsRead}
              className={cn(
                "w-full py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
                isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"
              )}
            >
              <Check size={13} strokeWidth={2.5} />
              Mark all as read
            </motion.button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 px-5">
            <Bell size={28} className={isDark ? "text-slate-600" : "text-slate-300"} />
            <p className={cn("text-sm font-medium", isDark ? "text-slate-500" : "text-slate-400")}>No notifications yet</p>
            <p className={cn("text-xs text-center", isDark ? "text-slate-600" : "text-slate-300")}>Notifications will appear here when you add expenses, set budgets, or reach milestones.</p>
          </div>
        ) : (
          <div className={cn("divide-y", isDark ? "divide-white/[0.04]" : "divide-slate-100")}>
            {notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
                onClick={() => markNotificationRead(notif.id)}
                className={cn(
                  "flex items-start gap-3.5 px-5 py-4 transition-colors cursor-pointer",
                  notif.unread
                    ? isDark ? "bg-indigo-500/[0.04]" : "bg-indigo-50/50"
                    : isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"
                )}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 mt-0.5"
                  style={{ background: `${notif.color}18` }}
                >
                  {notif.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("font-semibold text-sm", isDark ? "text-white" : "text-slate-800")}>
                      {notif.title}
                    </p>
                    {notif.unread && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                  </div>
                  <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
                    {notif.desc}
                  </p>
                  <p className={cn("text-[10px] mt-1", isDark ? "text-slate-600" : "text-slate-300")}>
                    {isMounted ? timeAgo(notif.time, now) : "..."}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <div className="h-8" />
      </BottomSheet>
    </>
  );
}

