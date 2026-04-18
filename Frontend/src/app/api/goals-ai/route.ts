import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { buildRateLimiter } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const checkRateLimit = buildRateLimiter({ limit: 10, windowMs: 60 * 1000 });

const GoalSnapshotSchema = z.object({
  name: z.string().max(100),
  icon: z.string().max(10),
  targetAmount: z.number().nonnegative().max(1000000000),
  currentAmount: z.number().nonnegative().max(1000000000),
  targetDate: z.string(),
  monthlyRequired: z.number().nonnegative(),
  status: z.string().max(50),
  commitmentMode: z.boolean(),
  priority: z.number().int().nonnegative()
});

const FinancialCtxSchema = z.object({
  balance: z.number(),
  monthlyIncome: z.number().nonnegative(),
  monthlyExpenses: z.number().nonnegative(),
  monthlySavings: z.number(),
  currencySymbol: z.string().max(5),
  currencyCode: z.string().max(5),
  budgets: z.array(z.object({
    category: z.string().max(50),
    limit: z.number().nonnegative(),
    spent: z.number().nonnegative(),
  })).max(50)
});

const RequestBodySchema = z.object({
  mode: z.enum(["coach", "conflicts", "whatif", "impact"]),
  goals: z.array(GoalSnapshotSchema).max(20),
  financialCtx: FinancialCtxSchema,
  expenseReduction: z.number().optional(),
  incomeIncrease: z.number().optional(),
  targetGoalName: z.string().max(100).optional(),
  changedBudgetCategory: z.string().max(50).optional(),
  changedBudgetAmount: z.number().optional(),
  newExpense: z.object({
    title: z.string().max(100),
    amount: z.number(),
    category: z.string().max(50)
  }).optional()
});

const MODEL = "gemini-2.5-flash-lite";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResponse = checkRateLimit(ip);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const parsedData = RequestBodySchema.parse(body);
    const { mode, goals, financialCtx } = parsedData;
    const { currencySymbol: sym, currencyCode: cc } = financialCtx;

    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { temperature: 0.5, maxOutputTokens: 800 },
    });

    let prompt = "";

    if (mode === "coach") {
      // Personalized coaching message for all goals
      const goalsDesc = goals.map(g =>
        `  • ${g.icon} ${g.name}: ${sym}${g.currentAmount.toFixed(0)} / ${sym}${g.targetAmount.toFixed(0)} (${g.status}, needs ${sym}${g.monthlyRequired.toFixed(0)}/mo)`
      ).join("\n");

      prompt = `You are Spendly's AI Financial Coach. Generate a SHORT, personalized coaching message (2-3 sentences max) based on this data.

User's financial snapshot:
- Balance: ${sym}${financialCtx.balance.toFixed(2)} ${cc}
- Monthly Income: ${sym}${financialCtx.monthlyIncome.toFixed(2)}
- Monthly Expenses: ${sym}${financialCtx.monthlyExpenses.toFixed(2)}
- Monthly Savings: ${sym}${financialCtx.monthlySavings.toFixed(2)}

Active Goals:
${goalsDesc || "  • No active goals"}

Rules:
- Be warm, motivating, and specific
- Use emojis naturally (1-2 max)
- Reference actual goal names or amounts
- If savings are negative, still be constructive
- Respond ONLY with the coaching message, no JSON, no labels`;

      const result = await model.generateContent(prompt);
      return NextResponse.json({ success: true, message: result.response.text().trim() });
    }

    if (mode === "conflicts") {
      // Detect conflicts between multiple goals
      const totalRequired = goals.reduce((a, g) => a + g.monthlyRequired, 0);
      const goalsDesc = goals.map((g, i) =>
        `${i + 1}. ${g.icon} ${g.name}: needs ${sym}${g.monthlyRequired.toFixed(0)}/mo, priority ${g.priority}`
      ).join("\n");

      prompt = `You are a financial conflict analyzer. Analyze these goals and return ONLY valid JSON.

User's monthly savings capacity: ${sym}${financialCtx.monthlySavings.toFixed(2)} ${cc}
Total monthly required for all goals: ${sym}${totalRequired.toFixed(2)}

Goals:
${goalsDesc}

Return this exact JSON structure:
{
  "hasConflict": boolean,
  "severity": "none" | "minor" | "major",
  "message": "short conflict summary (1 sentence)",
  "priorityAdvice": "which goal to focus on (1 sentence)",
  "goalDelays": [{ "goalName": "string", "delayDays": number }]
}`;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim().replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
      return NextResponse.json({ success: true, conflicts: JSON.parse(text) });
    }

    if (mode === "whatif") {
      const { expenseReduction = 0, incomeIncrease = 0, targetGoalName } = parsedData;
      const newSavings = financialCtx.monthlySavings + expenseReduction + incomeIncrease;
      const targetGoal = goals.find(g => g.name === targetGoalName) ?? goals[0];

      prompt = `You are a financial simulator. Analyze this what-if scenario and return ONLY valid JSON.

Current situation:
- Monthly savings: ${sym}${financialCtx.monthlySavings.toFixed(2)} ${cc}
- Expense reduction applied: ${sym}${expenseReduction.toFixed(2)}/mo
- Income increase applied: ${sym}${incomeIncrease.toFixed(2)}/mo
- New monthly savings: ${sym}${newSavings.toFixed(2)}

Target goal: ${targetGoal?.name ?? "Goal"} — needs ${sym}${(targetGoal?.targetAmount - targetGoal?.currentAmount).toFixed(2)} more
Current monthly required: ${sym}${targetGoal?.monthlyRequired.toFixed(2)}/mo

Return this exact JSON:
{
  "newMonthsToGoal": number,
  "daysSaved": number,
  "newStatus": "on_track" | "at_risk" | "not_feasible",
  "feasible": boolean,
  "insight": "1 sentence impact summary",
  "recommendation": "1 actionable sentence"
}`;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim().replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
      return NextResponse.json({ success: true, simulation: JSON.parse(text) });
    }

    if (mode === "impact") {
      const { newExpense, changedBudgetCategory, changedBudgetAmount } = parsedData;
      const impactDesc = newExpense
        ? `New expense: ${newExpense.title} — ${sym}${newExpense.amount} (${newExpense.category})`
        : `Budget change: ${changedBudgetCategory} changed to ${sym}${changedBudgetAmount}`;

      const goalsDesc = goals.map(g =>
        `  • ${g.name}: needs ${sym}${g.monthlyRequired.toFixed(0)}/mo (${g.status})`
      ).join("\n");

      prompt = `You are a financial impact analyzer. Analyze how a financial change affects user goals. Return ONLY valid JSON.

Change: ${impactDesc}
Current monthly savings: ${sym}${financialCtx.monthlySavings.toFixed(2)}

Active Goals:
${goalsDesc}

Return this exact JSON:
{
  "affected": boolean,
  "alertMessage": "short alert message (1 sentence, mention goal name and days delay)",
  "delayDays": number,
  "affectedGoals": ["goalName1", "goalName2"]
}`;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim().replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
      return NextResponse.json({ success: true, impact: JSON.parse(text) });
    }

    return NextResponse.json({ success: false, error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}
