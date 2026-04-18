"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Send, Sparkles, Bot, User, BrainCircuit, Lock, Crown } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "insight" | "prediction";
}

export function AIAssistant() {
  const { isDark, isPremium, currencyConfig, balance, transactions, t, aiQueryCount, incrementAiQuery, triggerPremiumModal } = useApp();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI financial assistant. How can I help you today?",
      type: "text",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    if (!isPremium && aiQueryCount >= 3) {
      triggerPremiumModal("You've reached your daily AI limit. Premium users get unlimited conversations with the Assistant.");
      return;
    }

    const userMsg = input.trim();
    setInput("");
    const updatedMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      // Build financial context for Groq
      const now = new Date();
      const monthlyTxs = transactions.filter((tx) => {
        const d = new Date(tx.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const income = monthlyTxs
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expenses = monthlyTxs
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      const catSpend: Record<string, number> = {};
      monthlyTxs
        .filter((t) => t.type === "expense")
        .forEach((t) => { catSpend[t.category] = (catSpend[t.category] || 0) + t.amount; });
      const topCategory =
        Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      const apiMessages = updatedMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-12) // last 12 messages for context window
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          financialContext: {
            balance: formatCurrency(balance, currencyConfig),
            currencySymbol: currencyConfig.symbol,
            income: formatCurrency(income, currencyConfig),
            expenses: formatCurrency(expenses, currencyConfig),
            topCategory,
            transactionCount: transactions.length,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev, 
          { 
            role: "assistant", 
            content: data.message || "I'm having trouble connecting right now. Please check if the AI service is correctly configured.", 
            type: "text" 
          }
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.message || data.reply, type: "text" }]);
      incrementAiQuery();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble reaching the server. Please try again later.", type: "text" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const PROMPTS = [
    "Can I spend ₹500?",
    "Predict my balance",
    "Analyze my spikes",
    "Saving tips",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex flex-col h-screen pb-32",
        isDark ? "bg-[#0B1120]" : "bg-[#F8FAFC]"
      )}
    >
      <TopBar title={t("nav_assistant")} showNotification />

      {/* Usage Indicator */}
      {!isPremium && (
        <div className="mx-5 mb-2 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Free Plan Queries</span>
          </div>
          <span className="text-[10px] font-black text-indigo-400">{3 - aiQueryCount} / 3 remaining</span>
        </div>
      )}

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "flex items-end gap-2 max-w-[85%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === "assistant"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              )}
            >
              {msg.role === "assistant" ? <Bot size={18} /> : <User size={18} />}
            </div>
            <div
              className={cn(
                "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                msg.role === "assistant"
                  ? isDark
                    ? "bg-slate-800 text-white"
                    : "bg-white border border-slate-100 shadow-sm text-slate-800"
                  : "bg-indigo-600 text-white"
              )}
            >
              {msg.content}
              {msg.type === "insight" && !isPremium && (
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-indigo-400 font-bold">
                  <Crown size={14} />
                  <span>Premium Feature</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 mr-auto">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              <Bot size={18} />
            </div>
            <div className={cn(
              "px-4 py-3 rounded-2xl flex gap-1",
              isDark ? "bg-slate-800" : "bg-white border border-slate-100"
            )}>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => setInput(p)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold flex-shrink-0 border transition-all",
              isDark
                ? "bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="px-5 mb-6">
        <div className={cn(
          "relative flex items-center rounded-2xl border p-1.5",
          isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200 shadow-sm"
        )}>
          <div className="pl-3 text-indigo-500">
            <BrainCircuit size={20} />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask your assistant..."
            className={cn(
              "flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none",
              isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"
            )}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              input.trim()
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
