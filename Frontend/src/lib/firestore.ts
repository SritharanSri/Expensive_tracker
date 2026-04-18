import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import type { Transaction, Budget, SavingGoal, UserProfile, FinancialGoal } from "@/context/AppContext";

// ─── Collection refs ──────────────────────────────────────────────────────────
const txCol = (uid: string) => collection(db, "users", uid, "transactions");
const budgetCol = (uid: string) => collection(db, "users", uid, "budgets");
const goalsCol = (uid: string) => collection(db, "users", uid, "savingsGoals");
const goalsSystemCol = (uid: string) => collection(db, "users", uid, "financialGoals");
const userDoc = (uid: string) => doc(db, "users", uid);

// ─── Financial Goals (Smart Goals System) ────────────────────────────────────
export async function fetchFinancialGoals(uid: string): Promise<FinancialGoal[]> {
  try {
    const snap = await getDocs(goalsSystemCol(uid));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as FinancialGoal));
  } catch {
    return [];
  }
}

export async function saveFinancialGoal(uid: string, goal: Omit<FinancialGoal, "id">): Promise<string> {
  const ref = await addDoc(goalsSystemCol(uid), goal);
  return ref.id;
}

export async function updateFinancialGoal(uid: string, goalId: string, updates: Partial<Omit<FinancialGoal, "id">>): Promise<void> {
  await updateDoc(doc(goalsSystemCol(uid), goalId), updates as Record<string, unknown>);
}

export async function deleteFinancialGoal(uid: string, goalId: string): Promise<void> {
  await deleteDoc(doc(goalsSystemCol(uid), goalId));
}



// ─── Transactions ─────────────────────────────────────────────────────────────
export async function fetchTransactions(uid: string): Promise<Transaction[]> {
  try {
    const q = query(txCol(uid), orderBy("date", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        amount: data.amount,
        category: data.category,
        type: data.type,
        date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
        note: data.note ?? undefined,
      } as Transaction;
    });
  } catch {
    return [];
  }
}

export async function saveTransaction(
  uid: string,
  tx: Omit<Transaction, "id">
): Promise<string> {
  const ref = await addDoc(txCol(uid), {
    title: tx.title,
    amount: tx.amount,
    category: tx.category,
    type: tx.type,
    date: Timestamp.fromDate(tx.date instanceof Date ? tx.date : new Date(tx.date)),
    note: tx.note ?? null,
  });
  return ref.id;
}

export async function removeTransaction(uid: string, txId: string): Promise<void> {
  await deleteDoc(doc(txCol(uid), txId));
}

// ─── Budgets ──────────────────────────────────────────────────────────────────
export async function fetchBudgets(uid: string): Promise<Budget[]> {
  try {
    const snap = await getDocs(budgetCol(uid));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Budget));
  } catch {
    return [];
  }
}

export async function saveBudget(uid: string, budget: Omit<Budget, "id">): Promise<string> {
  const ref = await addDoc(budgetCol(uid), budget);
  return ref.id;
}

export async function updateBudgetSpent(uid: string, budgetId: string, spent: number): Promise<void> {
  await updateDoc(doc(budgetCol(uid), budgetId), { spent });
}

export async function deleteBudget(uid: string, budgetId: string): Promise<void> {
  await deleteDoc(doc(budgetCol(uid), budgetId));
}

// ─── Savings Goals ────────────────────────────────────────────────────────────
export async function fetchSavingsGoals(uid: string): Promise<SavingGoal[]> {
  try {
    const snap = await getDocs(goalsCol(uid));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as SavingGoal));
  } catch {
    return [];
  }
}

export async function saveSavingsGoal(
  uid: string,
  goal: Omit<SavingGoal, "id">
): Promise<string> {
  const ref = await addDoc(goalsCol(uid), goal);
  return ref.id;
}

// ─── User Profile ─────────────────────────────────────────────────────────────
export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  await setDoc(userDoc(uid), { ...profile }, { merge: true });
}
