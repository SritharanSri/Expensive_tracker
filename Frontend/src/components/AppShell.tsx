"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AddExpense } from "@/components/add-expense/AddExpense";
import { BudgetScreen } from "@/components/budget/BudgetScreen";
import { ReportsScreen } from "@/components/reports/ReportsScreen";
import { SavingsScreen } from "@/components/savings/SavingsScreen";
import { SettingsScreen } from "@/components/settings/SettingsScreen";
import { ProfileScreen } from "@/components/settings/ProfileScreen";
import { AIAssistant } from "@/components/assistant/AIAssistant";
import { SmartPurchasePlanner } from "@/components/planner/SmartPurchasePlanner";
import { SmartGoalsScreen } from "@/components/goals/SmartGoalsScreen";
import { SignInScreen } from "@/components/auth/SignInScreen";
import { SignUpScreen } from "@/components/auth/SignUpScreen";
import { PremiumUpgrade } from "@/components/settings/PremiumUpgrade";
import { cn } from "@/lib/utils";

const NO_NAV_SCREENS = ["signin", "signup", "profile"];
const SWIPE_SCREENS = ["dashboard", "budget", "reports", "goals", "settings"];

export function AppShell() {
  const { currentScreen, setScreen, isDark, showPremiumModal, setShowPremiumModal } = useApp();

  const currentIndex = SWIPE_SCREENS.indexOf(currentScreen);
  const [direction, setDirection] = useState(0); // 1 for forward, -1 for backward
  const prevIndexRef = useRef(currentIndex);

  useEffect(() => {
    if (prevIndexRef.current !== currentIndex && currentIndex !== -1 && prevIndexRef.current !== -1) {
      setDirection(currentIndex > prevIndexRef.current ? 1 : -1);
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  const handleSwipe = (offset: number) => {
    if (currentIndex === -1) return;

    if (offset < -100 && currentIndex < SWIPE_SCREENS.length - 1) {
      // Swipe Left -> Next
      setScreen(SWIPE_SCREENS[currentIndex + 1]);
    } else if (offset > 100 && currentIndex > 0) {
      // Swipe Right -> Previous
      setScreen(SWIPE_SCREENS[currentIndex - 1]);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : direction < 0 ? "-100%" : 0,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : direction < 0 ? "100%" : 0,
      opacity: 0
    })
  };

  return (
    <div
      className={cn(
        "relative w-full h-screen max-w-[430px] mx-auto overflow-hidden",
        isDark ? "dark bg-[#0B1120]" : "bg-[#F8FAFC]"
      )}
    >
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={currentScreen}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.05}
          onDragEnd={(_, info) => handleSwipe(info.offset.x)}
          className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar"
        >
          {currentScreen === "signin" && <SignInScreen />}
          {currentScreen === "signup" && <SignUpScreen />}
          {currentScreen === "dashboard" && <Dashboard />}
          {currentScreen === "add-expense" && <AddExpense />}
          {currentScreen === "budget" && <BudgetScreen />}
          {currentScreen === "reports" && <ReportsScreen />}
          {currentScreen === "savings" && <SavingsScreen />}
          {currentScreen === "settings" && <SettingsScreen />}
          {currentScreen === "profile" && <ProfileScreen />}
          {currentScreen === "assistant" && <AIAssistant />}
          {currentScreen === "planner" && <SmartPurchasePlanner />}
          {currentScreen === "goals" && <SmartGoalsScreen />}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showPremiumModal && <PremiumUpgrade onClose={() => setShowPremiumModal(false)} />}
      </AnimatePresence>

      {!NO_NAV_SCREENS.includes(currentScreen) && <BottomNav />}
    </div>
  );
}

