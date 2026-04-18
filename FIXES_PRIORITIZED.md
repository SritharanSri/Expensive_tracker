# Spendly — QA Fixes Prioritized

## 🔴 TIER 1: SECURITY & CRITICAL DATA LOSS (Ship Today)

### Fix #1: Demo Account Password Bypass
**File:** `src/context/AppContext.tsx`  
**Current:** Demo email + any password logs in  
**Fix:** Require "demo" password too or use unique demo ID per session

### Fix #2: Plaintext Password Storage  
**File:** `src/context/AppContext.tsx`  
**Current:** `JSON.stringify({ email, password, ... })`  
**Fix:** Either remove `signUp` (use demo only), or hash with `crypto.subtle.digest("SHA-256")`

### Fix #3: `signOut` Stale Closure
**File:** `src/context/AppContext.tsx`  
**Current:** `const signOut = useCallback(() => { if (user?.id) ... }, [])`  
**Fix:** Change deps to `[user]` so cleanup runs with current user ID

### Fix #4: Unguarded `JSON.parse`
**File:** `src/context/AppContext.tsx`, lines in `signIn` & `signUp`  
**Current:** `const stored = JSON.parse(storedStr);` — can crash  
**Fix:** Wrap in `try/catch`, clear corrupted key on failure

### Fix #5: AI Chat Prompt Injection  
**File:** `src/app/api/ai-chat/route.ts`  
**Current:** `Balance: ${financialContext.balance}` — direct interpolation  
**Fix:** Validate fields are numbers/strings with length limit before using

### Fix #6: AI Chat Zero Validation
**File:** `src/app/api/ai-chat/route.ts`  
**Current:** `messages` forwarded to Groq unchecked  
**Fix:** Validate array length ≤20, each item: `role in ["user","assistant"]`, `content` string max 5000 chars

### Fix #7: All Demo Users Share Firestore
**File:** `src/context/AppContext.tsx`, `signIn()` demo account  
**Current:** All demos use `id: "demo"`  
**Fix:** Use `id: "demo_" + crypto.randomUUID()` or mark as offline-only

### Fix #8: Budget Firestore ID Never Synced
**File:** `src/context/AppContext.tsx`, `addBudget()`  
**Current:** Saves to Firestore but never replaces local random ID  
**Fix:** Add `.then(id => setBudgets(...map to replace temp id))` like `addTransaction` does

### Fix #9: SavingsGoal Firestore ID Never Synced  
**File:** `src/context/AppContext.tsx`, `addSavingsGoal()`  
**Current:** Same as Fix #8  
**Fix:** Add`.then(id => setSavingsGoals(...map))`

---

## 🟠 TIER 2: LOGIC ERRORS (Ship Next 48 Hours)

### Fix #10: Reports Period Selector No-Op
**File:** `src/components/reports/ReportsScreen.tsx`  
**Current:** Always iterates 4 months regardless of `period` state  
**Fix:** Map `period` to count: `{"1M": 1, "3M": 3, "6M": 6}` and use in loop

### Fix #11: Year Boundary Month Collision  
**File:** `src/components/reports/ReportsScreen.tsx`  
**Current:** Uses month names as keys: `data["Jan"]` accumulates across years  
**Fix:** Use `"YYYY-MM"` as key, only convert to display name in render

### Fix #12: Budget Division by Zero
**File:** `src/components/budget/BudgetScreen.tsx`  
**Current:** `const pct = Math.round((budget.spent / budget.limit) * 100)`  
**Fix:** Guard: `const pct = budget.limit > 0 ? ... : 0`

### Fix #13: Duplicate Budget Categories  
**File:** `src/components/budget/BudgetScreen.tsx`, `addBudget` handler  
**Current:** No check for duplicate categories  
**Fix:** `if (budgets.some(b => b.category === selectedCat.id)) { alert("..."); return; }`

### Fix #14: Empty Array Persistence Skipped
**File:** `src/context/AppContext.tsx`, three `useEffect` persistence hooks  
**Current:** `if (!user?.id || transactions.length === 0) return;`  
**Fix:** Remove the `length === 0` guard so empty `[]` is saved (overwrites stale cache)

### Fix #15: Firestore Load Overwrites Fresh Data
**File:** `src/context/AppContext.tsx`, `loadUserData()`  
**Current:** `if (txs.length > 0) setTransactions(txs);` replaces all local data  
**Fix:** Merge: union by ID, sort by date, keep newer timestamps

### Fix #16: AI Chat Returns 200 on Error
**File:** `src/app/api/ai-chat/route.ts`  
**Current:** `catch` block returns `NextResponse.json({...})` with no status  
**Fix:** Return `NextResponse.json({...}, { status: 503 })`

---

## 🟡 TIER 3: UX & MISSING FEATURES (Sprint Next Week)

### Fix #17: No Delete Transactions
**File:** `src/components/dashboard/TransactionList.tsx`  
**Add:** Long-press or swipe handler → call `deleteTransaction(uid, id)` from context

### Fix #18: No Date Picker
**File:** `src/components/add-expense/AddExpense.tsx`  
**Add:** Date input/picker before amount input, store in `newDate` state

### Fix #19: Hardcoded Dashboard Stats  
**File:** `src/components/dashboard/Dashboard.tsx`  
**Replace:** `QUICK_STATS` computed values with actual formulas:
- Savings Rate = `(income - expense) / income * 100` or 0 if no income
- Budget Used = `totalSpent / totalLimit * 100` or 0 if no budget
- Net Worth = `balance` (just show balance)

### Fix #20: ₹ Hardcoded in AI Insights
**File:** `src/components/dashboard/Dashboard.tsx`  
**Current:** `"₹12,400"` and `"₹500"` hardcoded  
**Fix:** Use `formatCurrency(n, currencyConfig)` with calculated amounts from real data

### Fix #21: Notification Shows Raw Amount
**File:** `src/context/AppContext.tsx`, `addTransaction` notification  
**Current:** `desc: \`${tx.title} — ${tx.amount}\``  
**Fix:** Import `formatCurrency`, use `formatCurrency(tx.amount, currencyConfig)` (but need to pass config somehow)

### Fix #22: Settings Notifications Toggle Broken  
**File:** `src/components/settings/SettingsScreen.tsx`  
**Current:** `enabled={true} onChange={() => {}}`  
**Fix:** Add state `notifEnabled`, call `setNotifEnabled(!notifEnabled)` on toggle

---

## 📋 Testing Checklist

- [ ] Auth: Sign in, sign up, sign out work without crashes
- [ ] Data: Add transaction → reload → data persists in localStorage
- [ ] Budget: Create budget with 0 limit → app doesn't crash
- [ ] Reports: Select 1M/3M/6M → chart changes accordingly
- [ ] Year boundary: Add transactions from Jan 2025 + Jan 2026 → chart shows correct split
- [ ] AI Chat: Send 50 messages → verify only last 20 used or error 
- [ ] Delete: (After fix #17) Long-press transaction → verify deletion works & updates budget
- [ ] Notification: Add expense → verify ₹/$ format matches currency setting
- [ ] Duplicate budget: Create "Food", create "Food" → verify error or only one counts

---

## Deployment Plan

1. **Hotfix branch**: Fix Tier 1 (security + data loss), test, ship
2. **Next release**: Tier 2 (logic), full QA, changelog
3. **Polish pass**: Tier 3 (UX features), user feedback

---

Total estimate: **Tier 1** = 3–4 hours, **Tier 2** = 4–5 hours, **Tier 3** = 6–8 hours
