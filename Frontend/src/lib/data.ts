export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
}

export interface Budget {
  id: string;
  category: string;
  categoryIcon: string;
  allocated: number;
  spent: number;
  color: string;
  gradient: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  icon: string;
  gradient: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: "food", name: "Food & Dining", icon: "🍔", color: "#F59E0B", gradient: "from-amber-500 to-amber-400" },
  { id: "transport", name: "Transport", icon: "🚗", color: "#6366F1", gradient: "from-indigo-600 to-indigo-500" },
  { id: "shopping", name: "Shopping", icon: "🛍️", color: "#EC4899", gradient: "from-pink-500 to-pink-400" },
  { id: "health", name: "Healthcare", icon: "❤️", color: "#10B981", gradient: "from-emerald-500 to-emerald-400" },
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "#8B5CF6", gradient: "from-violet-500 to-violet-400" },
  { id: "utilities", name: "Utilities", icon: "💡", color: "#0EA5E9", gradient: "from-sky-500 to-sky-400" },
  { id: "education", name: "Education", icon: "📚", color: "#14B8A6", gradient: "from-teal-500 to-teal-400" },
  { id: "salary", name: "Salary", icon: "💼", color: "#10B981", gradient: "from-emerald-500 to-emerald-400" },
  { id: "investment", name: "Investment", icon: "📈", color: "#6366F1", gradient: "from-indigo-600 to-indigo-400" },
  { id: "freelance", name: "Freelance", icon: "💻", color: "#F59E0B", gradient: "from-amber-500 to-amber-400" },
  { id: "rent", name: "Rent/Housing", icon: "🏠", color: "#EF4444", gradient: "from-rose-500 to-rose-400" },
  { id: "other", name: "Other", icon: "✨", color: "#94A3B8", gradient: "from-slate-400 to-slate-300" },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "1", title: "Spotify Premium", amount: 9.99, type: "expense", category: "entertainment", date: new Date(2026, 3, 12) },
  { id: "2", title: "Monthly Salary", amount: 5800, type: "income", category: "salary", date: new Date(2026, 3, 11) },
  { id: "3", title: "Grocery Store", amount: 84.50, type: "expense", category: "food", date: new Date(2026, 3, 11) },
  { id: "4", title: "Uber Ride", amount: 12.30, type: "expense", category: "transport", date: new Date(2026, 3, 10) },
  { id: "5", title: "Freelance Project", amount: 1200, type: "income", category: "freelance", date: new Date(2026, 3, 9) },
  { id: "6", title: "Netflix", amount: 15.99, type: "expense", category: "entertainment", date: new Date(2026, 3, 8) },
  { id: "7", title: "Gym Membership", amount: 49.00, type: "expense", category: "health", date: new Date(2026, 3, 7) },
  { id: "8", title: "Amazon Shopping", amount: 127.45, type: "expense", category: "shopping", date: new Date(2026, 3, 6) },
  { id: "9", title: "Electric Bill", amount: 78.20, type: "expense", category: "utilities", date: new Date(2026, 3, 5) },
  { id: "10", title: "Dividend Income", amount: 340, type: "income", category: "investment", date: new Date(2026, 3, 4) },
  { id: "11", title: "Restaurant Dinner", amount: 62.00, type: "expense", category: "food", date: new Date(2026, 3, 3) },
  { id: "12", title: "Online Course", amount: 29.99, type: "expense", category: "education", date: new Date(2026, 3, 2) },
];

export const MOCK_BUDGETS: Budget[] = [
  { id: "1", category: "Food & Dining", categoryIcon: "🍔", allocated: 600, spent: 420, color: "#F59E0B", gradient: "from-amber-500 to-amber-400" },
  { id: "2", category: "Transport", categoryIcon: "🚗", allocated: 200, spent: 165, color: "#6366F1", gradient: "from-indigo-600 to-indigo-500" },
  { id: "3", category: "Shopping", categoryIcon: "🛍️", allocated: 300, spent: 340, color: "#EC4899", gradient: "from-pink-500 to-pink-400" },
  { id: "4", category: "Entertainment", categoryIcon: "🎬", allocated: 150, spent: 75, color: "#8B5CF6", gradient: "from-violet-500 to-violet-400" },
  { id: "5", category: "Healthcare", categoryIcon: "❤️", allocated: 200, spent: 49, color: "#10B981", gradient: "from-emerald-500 to-emerald-400" },
  { id: "6", category: "Utilities", categoryIcon: "💡", allocated: 120, spent: 78, color: "#0EA5E9", gradient: "from-sky-500 to-sky-400" },
];

export const MOCK_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: "1",
    title: "Dream Vacation",
    targetAmount: 5000,
    currentAmount: 3200,
    targetDate: new Date(2026, 8, 1),
    icon: "✈️",
    gradient: "from-indigo-600 to-violet-500",
    color: "#6366F1",
  },
  {
    id: "2",
    title: "New MacBook Pro",
    targetAmount: 2499,
    currentAmount: 1800,
    targetDate: new Date(2026, 5, 1),
    icon: "💻",
    gradient: "from-sky-500 to-indigo-500",
    color: "#0EA5E9",
  },
  {
    id: "3",
    title: "Emergency Fund",
    targetAmount: 10000,
    currentAmount: 6500,
    targetDate: new Date(2026, 11, 31),
    icon: "🛡️",
    gradient: "from-emerald-500 to-teal-400",
    color: "#10B981",
  },
  {
    id: "4",
    title: "New Car",
    targetAmount: 25000,
    currentAmount: 8000,
    targetDate: new Date(2027, 6, 1),
    icon: "🚗",
    gradient: "from-amber-500 to-orange-400",
    color: "#F59E0B",
  },
];

export const MONTHLY_DATA = [
  { month: "Nov", income: 6200, expense: 3400 },
  { month: "Dec", income: 7100, expense: 4200 },
  { month: "Jan", income: 5900, expense: 3800 },
  { month: "Feb", income: 6400, expense: 3100 },
  { month: "Mar", income: 6800, expense: 4000 },
  { month: "Apr", income: 7340, expense: 3920 },
];

export const PIE_DATA = [
  { name: "Food", value: 420, color: "#F59E0B" },
  { name: "Transport", value: 165, color: "#6366F1" },
  { name: "Shopping", value: 340, color: "#EC4899" },
  { name: "Entertainment", value: 75, color: "#8B5CF6" },
  { name: "Health", value: 49, color: "#10B981" },
  { name: "Utilities", value: 78, color: "#0EA5E9" },
  { name: "Education", value: 30, color: "#14B8A6" },
];
