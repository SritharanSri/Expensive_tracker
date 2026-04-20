"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { COUNTRIES, CurrencyConfig } from "@/lib/currency";
import {
  fetchTransactions, saveTransaction,
  fetchBudgets, saveBudget, deleteBudget,
  fetchSavingsGoals, saveSavingsGoal,
  fetchFinancialGoals, saveFinancialGoal, updateFinancialGoal, deleteFinancialGoal,
  saveUserProfile, updateBudgetSpent,
  fetchCategories, saveCategory, removeCategory, removeTransaction, updateTransaction as updateTxFirestore,
} from "@/lib/firestore";

export type Screen =
  | "dashboard" | "add-expense" | "budget" | "reports"
  | "savings" | "settings" | "assistant" | "planner" | "goals"
  | "signin" | "signup" | "profile";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string; // hex color for initials avatar
  joinedDate: string;
  hiddenCategoryIds?: string[];
}

export type TransactionType = "income" | "expense" | "investment";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string; // Category ID
  date: Date;
  type: TransactionType;
  linkedIncomeCategoryId?: string; // ID of the income category that funded this
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  isSystem?: boolean;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  icon: string;
}

export interface SavingGoal {
  id: string;
  category: string;
  target: number;
  current: number;
  icon: string;
}

export type GoalStatus = "on_track" | "at_risk" | "not_feasible" | "completed";

export interface FinancialGoal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  timeline: "6months" | "12months" | "18months" | "custom";
  targetDate: string;       // ISO date string
  status: GoalStatus;
  aiApproved: boolean;
  aiInsight: string;        // Latest AI coach message
  commitmentMode: boolean;
  priority: number;         // 1 = highest priority
  monthlyRequired: number;  // Auto-computed
  conflicts: string[];      // Names of conflicting goals
  createdAt: string;        // ISO date string
}

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: Date;
  icon: string;
  color: string;
  unread: boolean;
}

import { TRANSLATIONS, TranslationKey, Language } from "@/lib/translations";
import { CATEGORIES } from "@/lib/data";

export interface AppContextType {
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  toggleTheme: () => void;
  isPremium: boolean;
  setIsPremium: (val: boolean) => void;
  currentScreen: string;
  setScreen: (screen: string) => void;
  
  // Localization
  country: string;
  setCountry: (code: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  currencyConfig: CurrencyConfig;
  t: (key: TranslationKey) => string;

  // Financial Data
  balance: number;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  categories: Category[];
  addCategory: (cat: Omit<Category, "id">) => void;
  deleteCategory: (id: string) => void;
  
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, "id" | "spent">) => void;
  deleteBudget: (budgetId: string) => void;
  savingsGoals: SavingGoal[];
  addSavingsGoal: (goal: Omit<SavingGoal, "id" | "current">) => void;

  // Smart Financial Goals
  financialGoals: FinancialGoal[];
  addFinancialGoal: (goal: Omit<FinancialGoal, "id" | "createdAt" | "conflicts" | "aiInsight">) => void;
  updateFinancialGoalItem: (id: string, updates: Partial<FinancialGoal>) => void;
  deleteFinancialGoalItem: (id: string) => void;
  contributeToGoal: (id: string, amount: number, linkedIncomeCategoryId?: string) => void;
  editingFinancialGoal: FinancialGoal | null;
  setEditingFinancialGoal: (goal: FinancialGoal | null) => void;

  // Notifications
  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, "id" | "time" | "unread">) => void;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;

  // UI State
  sheetOpen: boolean;
  setSheetOpen: (val: boolean) => void;

  // Automation
  automationEnabled: boolean;
  toggleAutomation: () => void;
  simulateSms: () => void;

  // Auth
  isAuthenticated: boolean;
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  updateProfile: (data: Partial<Omit<UserProfile, "id" | "joinedDate">>) => void;

  // Premium Gating
  showPremiumModal: boolean;
  setShowPremiumModal: (val: boolean) => void;
  premiumModalMessage: string;
  triggerPremiumModal: (msg: string) => void;
  lockedFeatureClicks: number;
  trackPremiumClick: () => void;
  aiQueryCount: number;
  incrementAiQuery: () => void;

  // AI Tool Usage (Mic + Scan shared counter)
  aiToolUsageCount: number;
  isAiToolLocked: boolean;
  incrementAiToolUsage: () => void;

  // Navigation State
  addExpenseInitialMode: "manual" | "voice" | "scan";
  setAddExpenseInitialMode: (mode: "manual" | "voice" | "scan") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // All three are initialised with server-safe defaults so SSR HTML
  // matches the first client render (avoiding hydration mismatch).
  // After mount we read localStorage once and update as needed.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentScreen, setCurrentScreen] = useState<string>("signin");

  useEffect(() => {
    const session = localStorage.getItem("et_session");
    const savedUser = localStorage.getItem("et_user");
    if (session) {
      setIsAuthenticated(true);
      setCurrentScreen("dashboard");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);

          // Restore all data from localStorage so data survives refresh instantly
          const uid = parsedUser.id;
          const cachedTxs = localStorage.getItem(`et_txs_${uid}`);
          const cachedBudgets = localStorage.getItem(`et_budgets_${uid}`);
          const cachedGoals = localStorage.getItem(`et_goals_${uid}`);
          const cachedNotifs = localStorage.getItem(`et_notifs_${uid}`);
          if (cachedTxs) {
            const parsed = JSON.parse(cachedTxs);
            setTransactions(parsed.map((t: Record<string, unknown>) => ({ ...t, date: new Date(t.date as string) })));
          }
          if (cachedBudgets) setBudgets(JSON.parse(cachedBudgets));
          if (cachedGoals) setSavingsGoals(JSON.parse(cachedGoals));
          if (cachedNotifs) {
            const parsed = JSON.parse(cachedNotifs);
            setNotifications(parsed.map((n: Record<string, unknown>) => ({ ...n, time: new Date(n.time as string) })));
          }
        } catch {}
      }
    }
  }, []);

  const [isDark, setIsDark] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Sync isPremium with localStorage per user
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`et_premium_${user.id}`);
      if (saved !== null) setIsPremium(saved === "true");
      else setIsPremium(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`et_premium_${user.id}`, isPremium.toString());
    }
  }, [isPremium, user?.id]);

  const [country, setCountry] = useState("LK");
  const [language, setLanguage] = useState("English");
  const [automationEnabled, setAutomationEnabled] = useState(false);

  // Persistence for automation (Smart SMS Tracking)
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`et_automation_${user.id}`);
      if (saved !== null) setAutomationEnabled(saved === "true");
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`et_automation_${user.id}`, automationEnabled.toString());
    }
  }, [automationEnabled, user?.id]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingGoal[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingFinancialGoal, setEditingFinancialGoal] = useState<FinancialGoal | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const updateProfile = useCallback((data: Partial<Omit<UserProfile, "id" | "joinedDate">>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem("et_user", JSON.stringify(updated));
      const storedStr = localStorage.getItem("et_credentials");
      if (storedStr) {
        const stored = JSON.parse(storedStr);
        stored.profile = updated;
        localStorage.setItem("et_credentials", JSON.stringify(stored));
      }
      saveUserProfile(updated.id, updated).catch(console.error);
      return updated;
    });
  }, []);

  // Premium Access State
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalMessage, setPremiumModalMessage] = useState("");
  const [lockedFeatureClicks, setLockedFeatureClicks] = useState(0);

  const triggerPremiumModal = useCallback((msg: string) => {
    setPremiumModalMessage(msg);
    setShowPremiumModal(true);
  }, []);

  const [aiQueryCount, setAiQueryCount] = useState(0);

  // Sync AI Query count with localStorage and handle daily reset
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`et_ai_queries_${user.id}`);
      const lastDate = localStorage.getItem(`et_ai_queries_date_${user.id}`);
      const today = new Date().toDateString();

      if (lastDate !== today) {
        setAiQueryCount(0);
        localStorage.setItem(`et_ai_queries_date_${user.id}`, today);
        localStorage.setItem(`et_ai_queries_${user.id}`, "0");
      } else if (saved) {
        setAiQueryCount(parseInt(saved, 10));
      }
    }
  }, [user?.id]);

  const incrementAiQuery = useCallback(() => {
    if (isPremium) return;
    setAiQueryCount((prev) => {
      const newVal = prev + 1;
      if (user?.id) {
        localStorage.setItem(`et_ai_queries_${user.id}`, newVal.toString());
      }
      return newVal;
    });
  }, [isPremium, user?.id]);

  // AI Tool Usage (Voice + Scan shared counter — lifetime limit of 3)
  const [aiToolUsageCount, setAiToolUsageCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`et_ai_tool_usage_${user.id}`);
      if (saved) setAiToolUsageCount(parseInt(saved, 10));
      else setAiToolUsageCount(0);
    }
  }, [user?.id]);

  const isAiToolLocked = useMemo(() => !isPremium && aiToolUsageCount >= 3, [isPremium, aiToolUsageCount]);

  const incrementAiToolUsage = useCallback(() => {
    if (isPremium) return;
    setAiToolUsageCount((prev) => {
      const newVal = prev + 1;
      if (user?.id) {
        localStorage.setItem(`et_ai_tool_usage_${user.id}`, newVal.toString());
      }
      return newVal;
    });
  }, [isPremium, user?.id]);

  const [addExpenseInitialMode, setAddExpenseInitialMode] = useState<"manual" | "voice" | "scan">("manual");

  const trackPremiumClick = useCallback(() => {
    if (isPremium) return;
    setLockedFeatureClicks((prev) => {
      const newVal = prev + 1;
      if (newVal >= 3) {
        setPremiumModalMessage("You are actively using premium features. Upgrade recommended for better control.");
        setShowPremiumModal(true);
        return 0; // reset after triggering
      }
      return newVal;
    });
  }, [isPremium]);

  // Load data from Firestore when user authenticates
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;

    async function loadUserData() {
      const uid = user!.id;
      const [txs, buds, goals, fGoals, userCats] = await Promise.all([
        fetchTransactions(uid),
        fetchBudgets(uid),
        fetchSavingsGoals(uid),
        fetchFinancialGoals(uid),
        fetchCategories(uid),
      ]);
      if (cancelled) return;

      // Merge system categories with user custom categories
      const hiddenIds = user?.hiddenCategoryIds || [];
      const allCats = [
        ...CATEGORIES
          .filter(c => !hiddenIds.includes(c.id))
          .map(c => ({ 
            ...c, 
            type: (c.id === "salary" || c.id === "freelance" || c.id === "investment") ? "income" : "expense", 
            isSystem: true 
          } as Category)), 
        ...userCats
      ];
      setCategories(allCats);
      setHiddenCategoryIds(hiddenIds);

      setTransactions(txs);

      // Recompute spent for each budget from actual transactions
      const spendByCategory: Record<string, number> = {};
      txs.forEach(tx => {
        if (tx.type === "expense") {
          spendByCategory[tx.category.toLowerCase()] =
            (spendByCategory[tx.category.toLowerCase()] || 0) + tx.amount;
        }
      });
      const recomputed = buds.map(b => ({
        ...b,
        spent: spendByCategory[b.category.toLowerCase()] ?? b.spent,
      }));
      setBudgets(recomputed);

      setSavingsGoals(goals);
      setFinancialGoals(fGoals);
    }

    loadUserData();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // Persist data to localStorage so it survives page refresh
  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(`et_txs_${user.id}`, JSON.stringify(transactions));
  }, [transactions, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(`et_budgets_${user.id}`, JSON.stringify(budgets));
  }, [budgets, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(`et_goals_${user.id}`, JSON.stringify(savingsGoals));
  }, [savingsGoals, user?.id]);
  
  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(`et_fGoals_${user.id}`, JSON.stringify(financialGoals));
  }, [financialGoals, user?.id]);

  const currencyConfig = useMemo(() => {
    const found = COUNTRIES[country as keyof typeof COUNTRIES];
    return found?.currency || COUNTRIES.LK.currency;
  }, [country]);

  const balance = useMemo(() => {
    return transactions.reduce((acc, tx) => (tx.type === "income") ? acc + tx.amount : acc - tx.amount, 0);
  }, [transactions]);


  const addCategory = useCallback((cat: Omit<Category, "id">) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const newCat = { ...cat, id: tempId, isSystem: false };
    setCategories(prev => [...prev, newCat]);

    if (user) {
      saveCategory(user.id, cat)
        .then(id => setCategories(prev => prev.map(c => c.id === tempId ? { ...c, id } : c)))
        .catch(console.error);
    }
  }, [user]);

  const deleteCategory = useCallback((id: string) => {
    const catToDelete = categories.find(c => c.id === id);
    if (!catToDelete) return;

    if (catToDelete.isSystem) {
      setHiddenCategoryIds(prev => {
        const updated = [...prev, id];
        if (user) {
          updateProfile({ hiddenCategoryIds: updated });
        }
        return updated;
      });
      setCategories(prev => prev.filter(c => c.id !== id));
    } else {
      setCategories(prev => prev.filter(c => c.id !== id));
      if (user) removeCategory(user.id, id).catch(console.error);
    }
  }, [user, categories, updateProfile]);

  const addNotification = useCallback((notif: Omit<AppNotification, "id" | "time" | "unread">) => {
    const newNotif: AppNotification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      time: new Date(),
      unread: true,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const newTx = { ...tx, id: tempId };
    setTransactions((prev) => [newTx, ...prev]);

    if (tx.type === "expense") {
      addNotification({
        title: "Expense Added",
        desc: `${tx.title} — ${tx.amount}`,
        icon: "💸",
        color: "#EF4444",
      });

      // Update matching budget spent
      setBudgets((prev) =>
        prev.map((b) => {
          if (b.category.toLowerCase() === tx.category.toLowerCase()) {
            const newSpent = b.spent + tx.amount;
            if (user) updateBudgetSpent(user.id, b.id, newSpent).catch(console.error);
            return { ...b, spent: newSpent };
          }
          return b;
        })
      );

      // Budget threshold notifications (fire only when threshold is first crossed)
      budgets.forEach(b => {
        if (b.category.toLowerCase() === tx.category.toLowerCase()) {
          const newSpent = b.spent + tx.amount;
          const catName = CATEGORIES.find(c => c.id === b.category)?.name ?? b.category;
          if (newSpent > b.limit && b.spent <= b.limit) {
            addNotification({ title: "Budget Alert", desc: `${catName} budget exceeded!`, icon: "🚨", color: "#EF4444" });
          } else if (b.limit > 0 && newSpent / b.limit >= 0.8 && b.spent / b.limit < 0.8) {
            addNotification({ title: "Budget Warning", desc: `${catName} is 80% used`, icon: "⚠️", color: "#F59E0B" });
          }
        }
      });
    } else {
      addNotification({
        title: "Income Received",
        desc: `${tx.title} — +${tx.amount}`,
        icon: "💰",
        color: "#10B981",
      });
    }

    if (user) {
      saveTransaction(user.id, tx)
        .then((firestoreId) => {
          setTransactions((prev) =>
            prev.map((t) => (t.id === tempId ? { ...t, id: firestoreId } : t))
          );
        })
        .catch(console.error);
    }
  }, [user, budgets, addNotification]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    const updatedTx = { ...oldTx, ...updates } as Transaction;
    setTransactions(prev => prev.map(t => t.id === id ? updatedTx : t));

    // Update budgets if amount or category or type changed
    const typeChanged = updates.type && updates.type !== oldTx.type;
    const amountChanged = updates.amount !== undefined && updates.amount !== oldTx.amount;
    const categoryChanged = updates.category !== undefined && updates.category !== oldTx.category;

    if (typeChanged || amountChanged || categoryChanged) {
      setBudgets(prev => prev.map(b => {
        let newSpent = b.spent;
        
        // Handle old transaction removal from budget
        if (oldTx.type === "expense" && b.category.toLowerCase() === oldTx.category.toLowerCase()) {
          newSpent -= oldTx.amount;
        }

        // Handle new transaction addition to budget
        if (updatedTx.type === "expense" && b.category.toLowerCase() === updatedTx.category.toLowerCase()) {
          newSpent += updatedTx.amount;
        }

        if (newSpent !== b.spent) {
          if (user) updateBudgetSpent(user.id, b.id, newSpent).catch(console.error);
          return { ...b, spent: newSpent };
        }
        return b;
      }));
    }

    if (user) {
      updateTxFirestore(user.id, id, updates).catch(console.error);
    }
  }, [user, transactions]);

  const removeTx = useCallback((id: string) => {
    const txToRemove = transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    if (txToRemove && txToRemove.type === "expense") {
      setBudgets(prev => prev.map(b => {
        if (b.category.toLowerCase() === txToRemove.category.toLowerCase()) {
          const newSpent = Math.max(0, b.spent - txToRemove.amount);
          if (user) updateBudgetSpent(user.id, b.id, newSpent).catch(console.error);
          return { ...b, spent: newSpent };
        }
        return b;
      }));
    }

    if (user) removeTransaction(user.id, id).catch(console.error);
  }, [user, transactions]);

  const addBudget = useCallback((budget: Omit<Budget, "id" | "spent">) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const newBudget: Budget = { ...budget, id: tempId, spent: 0 };
    setBudgets((prev) => [...prev, newBudget]);
    const catName = CATEGORIES.find(c => c.id === budget.category)?.name ?? budget.category;
    addNotification({
      title: "Budget Created",
      desc: `${catName} budget set`,
      icon: budget.icon,
      color: "#6366F1",
    });
    if (user) {
      saveBudget(user.id, { ...budget, spent: 0 })
        .then((firestoreId) => {
          setBudgets((prev) => prev.map((b) => b.id === tempId ? { ...b, id: firestoreId } : b));
        })
        .catch(console.error);
    }
  }, [user, addNotification]);

  const deleteBudgetItem = useCallback((budgetId: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    if (user) {
      deleteBudget(user.id, budgetId).catch(console.error);
    }
  }, [user]);

  const addFinancialGoal = useCallback((goal: Omit<FinancialGoal, "id" | "createdAt" | "conflicts" | "aiInsight">) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const newGoal: FinancialGoal = {
      ...goal,
      id: tempId,
      createdAt: new Date().toISOString(),
      conflicts: [],
      aiInsight: "",
    };
    setFinancialGoals((prev) => [...prev, newGoal]);
    addNotification({
      title: "Goal Created 🎯",
      desc: `${goal.icon} ${goal.name} — ${goal.aiApproved ? "AI Approved!" : "Tracking started"}`,
      icon: goal.icon,
      color: "#6366F1",
    });
    if (user) {
      saveFinancialGoal(user.id, { ...newGoal })
        .then((firestoreId) => {
          setFinancialGoals((prev) => prev.map((g) => g.id === tempId ? { ...g, id: firestoreId } : g));
        })
        .catch(console.error);
    }
  }, [user, addNotification]);

  const updateFinancialGoalItem = useCallback(async (id: string, updates: Partial<FinancialGoal>) => {
    if (!user) return;
    try {
      await updateFinancialGoal(user.id, id, updates);
      setFinancialGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  }, [user]);

  const deleteFinancialGoalItem = useCallback((id: string) => {
    const goalToDelete = financialGoals.find(g => g.id === id);
    
    if (goalToDelete && goalToDelete.currentAmount > 0) {
      addTransaction({
        title: `Refund: ${goalToDelete.name}`,
        amount: goalToDelete.currentAmount,
        category: "other",
        type: "income",
        date: new Date(),
        note: `Funds returned from deleted goal: ${goalToDelete.name}`
      });
    }

    setFinancialGoals((prev) => prev.filter((g) => g.id !== id));
    if (user) {
      deleteFinancialGoal(user.id, id).catch(console.error);
    }
  }, [user, financialGoals, addTransaction]);

  const contributeToGoal = useCallback((id: string, amount: number, linkedIncomeCategoryId?: string) => {
    let goalName = "Goal Contribution";
    setFinancialGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        goalName = g.name;
        const newAmount = Math.min(g.currentAmount + amount, g.targetAmount);
        const completed = newAmount >= g.targetAmount;
        const updated = { ...g, currentAmount: newAmount, status: completed ? ("completed" as GoalStatus) : g.status };
        if (user) updateFinancialGoal(user.id, id, { currentAmount: newAmount, status: updated.status }).catch(console.error);
        return updated;
      })
    );
    // Add transaction to deduct from balance
    addTransaction({
      title: `Contributed to ${goalName}`,
      amount: amount,
      category: "other", // category ID for contributions
      type: "expense",
      linkedIncomeCategoryId,
      date: new Date(),
      note: "Smart Goal Contribution",
    });
  }, [user, addTransaction]);

  const addSavingsGoal = useCallback((goal: Omit<SavingGoal, "id" | "current">) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const newGoal: SavingGoal = { ...goal, id: tempId, current: 0 };
    setSavingsGoals((prev) => [...prev, newGoal]);
    addNotification({
      title: "Savings Goal Created",
      desc: `${goal.icon} ${goal.category} goal created`,
      icon: goal.icon,
      color: "#6366F1",
    });
    if (user) {
      saveSavingsGoal(user.id, { ...goal, current: 0 })
        .then((firestoreId) => {
          setSavingsGoals((prev) => prev.map((g) => g.id === tempId ? { ...g, id: firestoreId } : g));
        })
        .catch(console.error);
    }
  }, [user, addNotification]);

  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    localStorage.setItem(`et_notifs_${uid}`, JSON.stringify(notifications));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, user]);

  const simulateSms = useCallback(() => {
    if (!automationEnabled) return;
    const smsTxs = [
      { title: "Netflix Subscription", amount: 499, category: "entertainment", type: "expense" as const, date: new Date() },
      { title: "Zomato Order", amount: 850, category: "food", type: "expense" as const, date: new Date() },
      { title: "Salary Credit", amount: 75000, category: "salary", type: "income" as const, date: new Date() },
    ];
    const randomTx = smsTxs[Math.floor(Math.random() * smsTxs.length)];
    addTransaction(randomTx);
    addNotification({
      id: Date.now().toString(),
      title: "Bank SMS Tracked",
      desc: `Auto-tracked: ${randomTx.title}`,
      time: new Date(),
      icon: "zap",
      color: "text-indigo-500",
      unread: true
    });
  }, [automationEnabled, addTransaction, addNotification]);

  const toggleAutomation = useCallback(() => {
    setAutomationEnabled(prev => !prev);
  }, []);

  const setScreen = useCallback((screen: string) => {
    setCurrentScreen(screen);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Demo account — always works if password is "demo"
    if (email.toLowerCase() === "demo@spendly.app") {
      if (password !== "demo") {
        return { success: false, error: "Invalid password for demo account" };
      }
      const demoUser: UserProfile = {
        id: "demo_" + Math.random().toString(36).substring(2, 10),
        name: "Alex Morgan",
        email: "demo@spendly.app",
        phone: "+1 (555) 010-2030",
        bio: "Finance enthusiast tracking every penny.",
        avatar: "#6366F1",
        joinedDate: "January 2026",
      };
      setUser(demoUser);
      setIsAuthenticated(true);
      setCurrentScreen("dashboard");
      localStorage.setItem("et_session", "1");
      localStorage.setItem("et_user", JSON.stringify(demoUser));
      return { success: true };
    }

    // Check stored credentials with hashing
    const storedStr = localStorage.getItem("et_credentials");
    if (storedStr) {
      try {
        const stored = JSON.parse(storedStr);
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        if (stored.email === email && stored.password === hashHex) {
          const userProfile: UserProfile = stored.profile;
          setUser(userProfile);
          setIsAuthenticated(true);
          setCurrentScreen("dashboard");
          localStorage.setItem("et_session", "1");
          localStorage.setItem("et_user", JSON.stringify(userProfile));
          return { success: true };
        }
      } catch (err) {
        localStorage.removeItem("et_credentials");
      }
    }
    return { success: false, error: "Invalid email or password" };
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const storedStr = localStorage.getItem("et_credentials");
    if (storedStr) {
      try {
        const stored = JSON.parse(storedStr);
        if (stored.email === email) {
          return { success: false, error: "An account with this email already exists" };
        }
      } catch (err) {
        localStorage.removeItem("et_credentials");
      }
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const newUser: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatar: "#6366F1",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
    localStorage.setItem("et_credentials", JSON.stringify({ email: email.trim().toLowerCase(), password: hashHex, profile: newUser }));
    localStorage.setItem("et_session", "1");
    localStorage.setItem("et_user", JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
    setCurrentScreen("dashboard");
    return { success: true };
  }, []);

  const resetPassword = useCallback(async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const storedStr = localStorage.getItem("et_credentials");
    if (!storedStr) return { success: false, error: "No account found in local storage" };
    
    try {
      const stored = JSON.parse(storedStr);
      if (stored.email !== email.trim().toLowerCase()) {
        return { success: false, error: "Email address not found" };
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(newPassword);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      stored.password = hashHex;
      localStorage.setItem("et_credentials", JSON.stringify(stored));
      return { success: true };
    } catch (err) {
      return { success: false, error: "Failed to reset password" };
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("et_session");
    if (user?.id) {
      localStorage.removeItem(`et_txs_${user.id}`);
      localStorage.removeItem(`et_budgets_${user.id}`);
      localStorage.removeItem(`et_goals_${user.id}`);
      localStorage.removeItem(`et_notifs_${user.id}`);
    }
    setNotifications([]);
    setIsAuthenticated(false);
    setUser(null);
    setTransactions([]);
    setBudgets([]);
    setSavingsGoals([]);
    setFinancialGoals([]);
    setCurrentScreen("signin");
  }, [user]);


  const t = useCallback((key: TranslationKey) => {
    const lang = (language as Language) || "English";
    return TRANSLATIONS[lang][key] || TRANSLATIONS.English[key];
  }, [language]);

  return (
    <AppContext.Provider
      value={{
        isDark,
        setIsDark,
        toggleTheme,
        isPremium,
        setIsPremium,
        currentScreen,
        setScreen,
        country,
        setCountry,
        language,
        setLanguage,
        currencyConfig,
        t,
        balance,
        transactions,
        addTransaction,
        updateTransaction,
        removeTransaction: removeTx,
        editingTransaction,
        setEditingTransaction,
        categories,
        addCategory,
        deleteCategory,
        budgets,
        addBudget,
        deleteBudget: deleteBudgetItem,
        savingsGoals,
        addSavingsGoal,
        financialGoals,
        addFinancialGoal,
        updateFinancialGoalItem,
        deleteFinancialGoalItem,
        contributeToGoal,
        editingFinancialGoal,
        setEditingFinancialGoal,
        notifications,
        addNotification,
        markAllNotificationsRead,
        markNotificationRead,
        sheetOpen,
        setSheetOpen,
        automationEnabled,
        toggleAutomation,
        simulateSms,
        isAuthenticated,
        user,
        signIn,
        signUp,
        resetPassword,
        signOut,
        updateProfile,

        showPremiumModal,
        setShowPremiumModal,
        premiumModalMessage,
        triggerPremiumModal,
        lockedFeatureClicks,
        trackPremiumClick,
        aiQueryCount,
        incrementAiQuery,

        aiToolUsageCount,
        isAiToolLocked,
        incrementAiToolUsage,

        addExpenseInitialMode,
        setAddExpenseInitialMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
