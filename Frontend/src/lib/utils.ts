import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return (amount / 1000).toFixed(1) + "k";
  }
  return amount.toFixed(2);
}

export function formatDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (e) {
    return "Invalid Date";
  }
}

export function formatMonth(date: Date): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (e) {
    return "Invalid Date";
  }
}

export function getProgressPercent(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

// ── Single source of truth helpers ─────────────────────────────────────────────

/** Returns only real expense transactions — excludes goal contributions and
 *  internal transfers (category === "Transfer" or category === "other" with
 *  a "Smart Goal Contribution" note). Using category "other" alone is too
 *  broad so we check the note prefix instead. */
export function getRealExpenses<T extends { type: string; category: string; note?: string }>(
  txs: T[]
): T[] {
  return txs.filter((tx) => {
    if (tx.type !== "expense") return false;
    // Exclude transfers
    if (tx.category === "Transfer" || tx.category === "transfer") return false;
    // Exclude smart goal contributions
    if (tx.note && tx.note.startsWith("Smart Goal Contribution")) return false;
    return true;
  });
}

/** Time-aware goal status. Compares actual progress % against the expected %
 *  based on how many days have elapsed. Much more accurate than just checking
 *  "can monthly savings cover the required monthly amount". */
export function getGoalStatus(goal: {
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  createdAt?: string;
}): { text: "On Track" | "At Risk" | "Behind" | "Completed"; color: "green" | "yellow" | "red" | "indigo" } {
  if (goal.currentAmount >= goal.targetAmount) {
    return { text: "Completed", color: "indigo" };
  }

  const now = new Date();
  const target = new Date(goal.targetDate);
  // Use createdAt if available, else fall back to 30 days before target as a safe estimate
  const start = goal.createdAt
    ? new Date(goal.createdAt)
    : new Date(target.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalMs = target.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();

  const expectedPct = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0;
  const actualPct = goal.targetAmount > 0
    ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
    : 0;

  if (actualPct >= expectedPct * 0.9) return { text: "On Track", color: "green" };
  if (actualPct >= expectedPct * 0.7) return { text: "At Risk", color: "yellow" };
  return { text: "Behind", color: "red" };
}

/** Computes disposable monthly income after expenses AND goal allocations.
 *  Prevents the double-deduction bug where goal contributions show as expenses. */
export function getMonthlyFree(
  income: number,
  expenses: number,
  goals: { monthlyRequired?: number; monthlyAllocation?: number }[]
): number {
  const goalSum = goals.reduce(
    (sum, g) => sum + (g.monthlyRequired ?? g.monthlyAllocation ?? 0),
    0
  );
  return income - expenses - goalSum;
}

// ── SL Merchant auto-category map ──────────────────────────────────────────────
/** Maps SL merchant name fragments (uppercase) to expense category IDs. */
export const SL_MERCHANT_MAP: Record<string, string> = {
  KEELLS: "food",
  CARGILLS: "food",
  "ARPICO SUPERCENTRE": "food",
  LAUGFS: "food",
  DIALOG: "bills",
  MOBITEL: "bills",
  SLT: "bills",
  HUTCH: "bills",
  AIRTEL: "bills",
  CEYPETCO: "transport",
  IOCL: "transport",
  LANKA: "transport",
  UBER: "transport",
  PICKME: "transport",
  MCDONALDS: "food",
  KFC: "food",
  PIZZA: "food",
  DOMINOS: "food",
};

/** Given a merchant name string, returns the matched category ID or null. */
export function matchSLMerchant(merchantName: string): string | null {
  const upper = merchantName.toUpperCase();
  for (const [key, cat] of Object.entries(SL_MERCHANT_MAP)) {
    if (upper.includes(key)) return cat;
  }
  return null;
}
