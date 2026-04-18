"use client";

import { AnimatePresence } from "framer-motion";
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

export function AppShell() {
  const { currentScreen, isDark, showPremiumModal, setShowPremiumModal } = useApp();

  return (
    <div
      className={cn(
        "relative w-full min-h-screen max-w-[430px] mx-auto overflow-hidden",
        isDark ? "dark" : ""
      )}
    >
      <AnimatePresence mode="wait">
        {currentScreen === "signin" && <SignInScreen key="signin" />}
        {currentScreen === "signup" && <SignUpScreen key="signup" />}
        {currentScreen === "dashboard" && <Dashboard key="dashboard" />}
        {currentScreen === "add-expense" && <AddExpense key="add-expense" />}
        {currentScreen === "budget" && <BudgetScreen key="budget" />}
        {currentScreen === "reports" && <ReportsScreen key="reports" />}
        {currentScreen === "savings" && <SavingsScreen key="savings" />}
        {currentScreen === "settings" && <SettingsScreen key="settings" />}
        {currentScreen === "profile" && <ProfileScreen key="profile" />}
        {currentScreen === "assistant" && <AIAssistant key="assistant" />}
        {currentScreen === "planner" && <SmartPurchasePlanner key="planner" />}
        {currentScreen === "goals" && <SmartGoalsScreen key="goals" />}
      </AnimatePresence>

      <AnimatePresence>
        {showPremiumModal && <PremiumUpgrade onClose={() => setShowPremiumModal(false)} />}
      </AnimatePresence>

      {!NO_NAV_SCREENS.includes(currentScreen) && <BottomNav />}
    </div>
  );
}

