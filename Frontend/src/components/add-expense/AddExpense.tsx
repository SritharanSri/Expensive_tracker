"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { CATEGORIES } from "@/lib/data";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/Cards";
import { BillScanner } from "./BillScanner";
import { TranslationKey } from "@/lib/translations";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  CalendarDays,
  AlignLeft,
  Keyboard,
  ScanLine,
  Sparkles,
  Mic,
  Crown,
  Lock,
  HandCoins,
  Coins,
  TrendingUp,
} from "lucide-react";
import { CategorySelector } from "@/components/ui/CategorySelector";

type TxType = "expense" | "income" | "investment";
type EntryMode = "manual" | "scan" | "voice";

const NUMPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export function AddExpense() {
  const { 
    isDark, setScreen, currencyConfig, t, 
    addTransaction, updateTransaction, language, 
    isPremium, aiToolUsageCount, isAiToolLocked, 
    incrementAiToolUsage, triggerPremiumModal, 
    addExpenseInitialMode, setAddExpenseInitialMode,
    editingTransaction, setEditingTransaction
  } = useApp();
  const [entryMode, setEntryMode] = useState<EntryMode>(addExpenseInitialMode);

  const [txType, setTxType] = useState<TxType>(editingTransaction?.type || "expense");
  const [amount, setAmount] = useState(editingTransaction?.amount.toString() || "0");
  const [selectedCatId, setSelectedCatId] = useState<string>(editingTransaction?.category || "");
  const [linkedSourceId, setLinkedSourceId] = useState<string>(editingTransaction?.linkedIncomeCategoryId || "");
  const [note, setNote] = useState(editingTransaction?.note || editingTransaction?.title || "");
  const [selectedDate, setSelectedDate] = useState<Date>(editingTransaction?.date || new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Robustly sync editingTransaction downstream if it populates late
  useEffect(() => {
    if (editingTransaction) {
      setTxType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setSelectedCatId(editingTransaction.category);
      setLinkedSourceId(editingTransaction.linkedIncomeCategoryId || "");
      setNote(editingTransaction.note || editingTransaction.title || "");
      setSelectedDate(editingTransaction.date ? (editingTransaction.date instanceof Date ? editingTransaction.date : new Date(editingTransaction.date)) : new Date());
    }
  }, [editingTransaction]);

  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const handleVoiceToggle = () => {
    if (isListening) return;

    // Check usage gate
    if (isAiToolLocked) {
      triggerPremiumModal("You've used all 3 free AI tool uses (Voice + Scanner). Upgrade to Premium for unlimited access & no ads.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice entry is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    const langMap: Record<string, string> = {
      "Sinhala": "si-LK",
      "Tamil": "ta-LK",
      "Hindi": "hi-IN",
      "Spanish": "es-ES",
      "German": "de-DE",
      "French": "fr-FR"
    };
    recognition.lang = langMap[language] || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceText("");
    };
    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setVoiceText(text);
      setIsListening(false);
      setIsProcessingVoice(true);
      try {
        const res = await fetch("/api/voice-entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (data.success) {
          setTxType(data.data.type);
          setAmount(data.data.amount.toString());
          setNote(data.data.title);
          const cat = CATEGORIES.find(c => c.id === data.data.category);
          if (cat) setSelectedCatId(cat.id);
          
          // Count successful usage
          incrementAiToolUsage();
          
          // Switch tab after a very brief delay to show completion
          setTimeout(() => setEntryMode("manual"), 600);
        } else {
          setVoiceText("I couldn't understand that perfectly. Please try speaking like 'Fuel 1500' or 'Lunch 250'.");
          console.error("AI Error:", data.message);
        }
      } catch (err) {
        setVoiceText("Communication error. Please check your internet or configuration.");
        console.error("Voice Fetch Error:", err);
      }
      setIsProcessingVoice(false);
    };
    recognition.onerror = (event: any) => { 
      setIsListening(false); 
      setIsProcessingVoice(false);
      console.error("Speech Recognition Error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please enable it in your browser settings.");
      }
    };
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  // Auto-start voice if entered via FAB
  const autoStarted = useRef(false);
  useEffect(() => {
    if (addExpenseInitialMode === "voice" && !autoStarted.current) {
      autoStarted.current = true;
      // Auto-start is disabled for security/permissions. Voice must be triggered by a direct user tap.
      setAddExpenseInitialMode("manual");
    } else if (addExpenseInitialMode !== "manual") {
      setAddExpenseInitialMode("manual");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addExpenseInitialMode]);

  // Clean up editing state on unmount is removed because it causes issues in React Strict Mode.
  // Instead, the state is cleared on specific navigation actions and after successful submits.

  function handleNumpad(key: string) {
    if (key === "⌫") {
      setAmount((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
      return;
    }
    if (key === "." && amount.includes(".")) return;
    const parts = amount.includes(".") ? amount.split(".") : [amount, ""];
    if (parts[1] && parts[1].length >= 2) return;
    setAmount((prev) => (prev === "0" && key !== "." ? key : prev + key));
  }

  function handleSubmit() {
    if (isSaving || parseFloat(amount) <= 0) return;
    
    setIsSaving(true);
    
    const txData = {
      title: note || (txType === "expense" ? "Misc Expense" : "Misc Income"),
      amount: parseFloat(amount),
      category: selectedCatId || (txType === "income" ? "salary" : "other"),
      type: txType,
      linkedIncomeCategoryId: (txType === "expense") ? linkedSourceId : undefined,
      date: selectedDate,
      note: note
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, txData);
    } else {
      addTransaction(txData);
    }
    
    // Redirect after animation
    setTimeout(() => {
      setIsSaving(false);
      setEditingTransaction(null);
      setScreen("dashboard");
    }, 1500);
  }

  const isIncome = txType === "income";

  return (
    <motion.div
      key="add-expense"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "min-h-screen pb-36",
        isDark ? "bg-gradient-to-b from-[#0B1120] to-[#0F172A]" : "bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]"
      )}
    >
      <TopBar title={t("add_title")} />

      {/* ── Entry Mode Tabs ── */}
      <div className="mx-5 mt-2">
        <div className={cn("flex rounded-2xl p-1 gap-1", isDark ? "bg-slate-800" : "bg-slate-100")}>
          {([
          {id: "manual" as EntryMode, label: "Manual", icon: Keyboard },
            { id: "voice" as EntryMode, label: "Voice", icon: Mic },
            { id: "scan" as EntryMode, label: "Scan AI", icon: ScanLine },
          ]).map(({ id, label, icon: Icon }) => {
            const active = entryMode === id;
            const remaining = 3 - aiToolUsageCount;
            const showBadge = !isPremium && (id === "voice" || id === "scan") && remaining > 0 && remaining <= 3;
            const showLock = !isPremium && (id === "voice" || id === "scan") && remaining <= 0;
            return (
              <motion.button
                key={id}
                onClick={() => setEntryMode(id)}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 relative"
                style={
                  active
                    ? { background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#fff", boxShadow: "0 2px 12px rgba(99,102,241,0.35)" }
                    : undefined
                }
              >
                {showLock ? (
                  <Lock size={14} strokeWidth={2.3} className={active ? "text-white" : isDark ? "text-amber-500" : "text-amber-500"} />
                ) : (
                  <Icon size={14} strokeWidth={2.3} className={active ? "text-white" : isDark ? "text-slate-500" : "text-slate-400"} />
                )}
                <span className={active ? "text-white" : isDark ? "text-slate-500" : "text-slate-400"}>
                  {label}
                </span>
                {showBadge && (
                  <span className={cn(
                    "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[9px] font-black flex items-center justify-center",
                    active ? "bg-amber-400 text-slate-900" : "bg-amber-500/20 text-amber-500"
                  )}>
                    {remaining}
                  </span>
                )}
                {showLock && (
                  <span className={cn(
                    "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[9px] font-black flex items-center justify-center bg-amber-500 text-white"
                  )}>
                    <Crown size={10} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Animated content ── */}
      <AnimatePresence mode="wait">
        {entryMode === "scan" && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
            className="px-5 mt-4"
          >
            <BillScanner isDark={isDark} onSaved={() => setScreen("dashboard")} />
          </motion.div>
        )}

        {entryMode === "voice" && (
          <motion.div
            key="voice"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="px-5 mt-10 flex flex-col items-center"
          >
            {/* Usage Indicator */}
            {!isPremium && (
              <div className="w-full mb-6 px-4 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">AI Tool Uses</span>
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider",
                  isAiToolLocked ? "text-amber-500" : "text-indigo-400"
                )}>
                  {isAiToolLocked ? "Limit reached" : `${3 - aiToolUsageCount} / 3 remaining`}
                </span>
              </div>
            )}

            {typeof window !== "undefined" && !window.isSecureContext && (
              <div className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-wider text-center">
                ⚠️ Secure Connection Required: Use HTTPS for Voice
              </div>
            )}

            <p className={cn("text-center mb-8 font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
              Tap the microphone and say something like:<br/>
              <span className={cn("italic font-bold block mt-2 whitespace-nowrap", isDark ? "text-indigo-400" : "text-indigo-600")}>
                "Fuel paid 1500 rupees"
              </span>
              <span className={cn("italic font-bold block mt-1 whitespace-nowrap", isDark ? "text-emerald-400" : "text-emerald-600")}>
                "Today income is 7500 rupees"
              </span>
            </p>

            <div className="relative mb-8 mt-4">
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 blur-xl"
                />
              )}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleVoiceToggle}
                disabled={isProcessingVoice}
                className={cn(
                  "relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-xl",
                  isListening
                    ? "bg-indigo-600 text-white shadow-indigo-500/40"
                    : isProcessingVoice 
                    ? "bg-indigo-400 text-white shadow-indigo-500/20"
                    : isDark ? "bg-slate-800 text-slate-300 border border-white/5" : "bg-white text-slate-600 border border-slate-100"
                )}
              >
                {isProcessingVoice ? (
                  <Sparkles size={40} className="animate-pulse" />
                ) : (
                  <Mic size={40} className={isListening ? "animate-pulse" : ""} />
                )}
              </motion.button>
            </div>

            <div className={cn("min-h-[4rem] px-6 py-4 rounded-3xl border w-full flex items-center justify-center text-center",
                isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
              <p className={cn("font-bold text-sm", isDark ? "text-white" : "text-slate-800", isProcessingVoice && "animate-pulse")}>
                {isListening ? "Listening..." : isProcessingVoice ? "Processing Intelligence..." : voiceText || "Tap to start speaking"}
              </p>
            </div>
          </motion.div>
        )}

        {entryMode === "manual" && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.28 }}
          >

      {/* Type Toggle (expense / income) */}
      <div className="mx-5 mt-4">
        <div className={cn(
          "flex rounded-2xl p-1 gap-1",
          isDark ? "bg-slate-800" : "bg-slate-100"
        )}>
          {(["expense", "income"] as TxType[]).map((typeOption) => (
            <motion.button
              key={typeOption}
              onClick={() => { setTxType(typeOption); setSelectedCatId(""); }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all duration-200 flex flex-col items-center justify-center gap-1",
                txType === typeOption
                  ? "text-white shadow-lg"
                  : isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              )}
              style={
                txType === typeOption
                  ? {
                      background:
                        typeOption === "expense"
                          ? "linear-gradient(135deg, #EF4444, #FB7185)"
                          : "linear-gradient(135deg, #10B981, #34D399)",
                      boxShadow: typeOption === "expense" 
                        ? "0 4px 12px -4px #EF444460"
                        : "0 4px 12px -4px #10B98160"
                    }
                  : undefined
              }
              whileTap={{ scale: 0.97 }}
            >
              {typeOption === "expense" ? (
                <ArrowDownLeft size={14} strokeWidth={2.5} />
              ) : typeOption === "income" ? (
                <ArrowUpRight size={14} strokeWidth={2.5} />
              ) : (
                <TrendingUp size={14} strokeWidth={2.5} />
              )}
              {typeOption}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Amount Display */}
      <div className="text-center py-8 px-5">
        <motion.div
          key={txType}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-baseline justify-center gap-2"
        >
          <span className={cn("text-3xl font-light", isDark ? "text-slate-400" : "text-slate-400")}>{currencyConfig.symbol}</span>
          <motion.span
            key={amount}
            className={cn(
              "text-6xl font-bold tracking-tight",
              isIncome
                ? "text-emerald-500"
                : isDark
                ? "text-white"
                : "text-slate-900"
            )}
          >
            {amount}
          </motion.span>
        </motion.div>
        <p className={cn("text-sm mt-1", isDark ? "text-slate-500" : "text-slate-400")}>
          {t("enter_amount")}
        </p>
      </div>

      {/* Details Card */}
      <GlassCard isDark={isDark} className="mx-5 mb-4" animate={false}>
        <div className="p-4 space-y-0">
          {/* Category Selector */}
          <div className="p-2 pt-4">
            <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2 mb-2 block", isDark ? "text-slate-500" : "text-slate-400")}>
              Select Category
            </label>
            <CategorySelector
              type={txType === "income" ? "income" : "expense"}
              selectedId={selectedCatId}
              onSelect={setSelectedCatId}
              isDark={isDark}
            />
          </div>

          {(txType === "expense" || txType === "investment") && (
            <div className="p-2 pb-4">
              <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2 mb-2 block", isDark ? "text-indigo-400/80" : "text-indigo-600/80")}>
                Which income source funds this?
                <span className="ml-1 opacity-50 font-medium normal-case">(Optional)</span>
              </label>
              <CategorySelector
                type="income"
                selectedId={linkedSourceId}
                onSelect={setLinkedSourceId}
                isDark={isDark}
              />
            </div>
          )}

          {/* Divider */}
          <div className={cn("mx-3 h-px", isDark ? "bg-white/[0.06]" : "bg-slate-100")} />

          {/* Date */}
          <div 
            className="flex items-center gap-3 p-3 cursor-pointer active:opacity-60 transition-opacity relative"
            onClick={() => dateInputRef.current?.showPicker()}
          >
            <input 
              ref={dateInputRef}
              type="date" 
              className="absolute inset-0 opacity-0 pointer-events-none"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(new Date(e.target.value));
              }}
            />
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isDark ? "bg-slate-700" : "bg-slate-100"
            )}>
              <CalendarDays size={18} className={isDark ? "text-slate-400" : "text-slate-500"} />
            </div>
            <div className="flex-1">
              <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>{t("date")}</p>
              <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-slate-800")}>
                {selectedDate.toDateString() === new Date().toDateString() ? "Today, " : ""}
                {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md", isDark ? "bg-white/10 text-slate-400" : "bg-slate-100 text-slate-500")}>
              Change
            </div>
          </div>

          {/* Divider */}
          <div className={cn("mx-3 h-px", isDark ? "bg-white/[0.06]" : "bg-slate-100")} />

          {/* Note */}
          <div className="flex flex-col p-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isDark ? "bg-slate-700" : "bg-slate-100"
              )}>
                <AlignLeft size={18} className={isDark ? "text-slate-400" : "text-slate-500"} />
              </div>
              <input
                type="text"
                value={note}
                onChange={(e) => {
                  const val = e.target.value;
                  setNote(val);
                  // Simple AI Categorization Mock
                  if (val.toLowerCase().includes("kfc") || val.toLowerCase().includes("food") || val.toLowerCase().includes("lunch")) {
                    setSelectedCatId("food");
                  } else if (val.toLowerCase().includes("uber") || val.toLowerCase().includes("fuel") || val.toLowerCase().includes("petrol")) {
                    setSelectedCatId("transport");
                  }
                }}
                placeholder={t("note")}
                className={cn(
                  "flex-1 bg-transparent outline-none text-sm font-medium placeholder:font-normal",
                  isDark
                    ? "text-white placeholder:text-slate-600"
                    : "text-slate-800 placeholder:text-slate-400"
                )}
              />
            </div>
            
            {/* AI Suggestion Chip */}
            <AnimatePresence>
              {(note.toLowerCase().includes("kfc") || note.toLowerCase().includes("uber")) && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="mt-2 ml-12"
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                    <Sparkles size={10} className="text-indigo-500" />
                    <span className="text-[10px] font-black uppercase text-indigo-500">AI: Auto-categorized</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </GlassCard>

      {/* Quick Amount Chips */}
      <div className="mx-5 mb-4 flex gap-2">
        {["100", "500", "1000"].map((amt) => (
          <motion.button
            key={amt}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAmount(amt)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all",
              amount === amt
                ? "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/30"
                : isDark ? "bg-slate-800 border-white/10 text-slate-400" : "bg-white border-slate-200 text-slate-500"
            )}
          >
            {currencyConfig.symbol}{amt}
          </motion.button>
        ))}
      </div>

      {/* Numpad */}
      <div className="mx-5 grid grid-cols-3 gap-2 mb-5">
        {NUMPAD.map((key) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleNumpad(key)}
            className={cn(
              "h-14 rounded-2xl text-xl font-black flex items-center justify-center transition-colors",
              key === "⌫"
                ? isDark
                  ? "bg-rose-500/10 text-rose-400"
                  : "bg-rose-50 text-rose-500"
                : isDark
                ? "bg-slate-800 text-white hover:bg-slate-700"
                : "bg-white text-slate-800 shadow-sm hover:bg-slate-50 border border-slate-100"
            )}
          >
            {key}
          </motion.button>
        ))}
      </div>

      {/* Submit Button */}
      <div className="mx-5">
        <motion.button
          onClick={handleSubmit}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all duration-300",
            parseFloat(amount) <= 0 && "opacity-60"
          )}
          style={{
            background: isIncome
              ? "linear-gradient(135deg, #10B981 0%, #34D399 100%)"
              : "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
            boxShadow: isIncome
              ? "0 4px 20px rgba(16,185,129,0.4)"
              : "0 4px 20px rgba(99,102,241,0.4)",
          }}
        >
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
                <span>{t("saved")}</span>
              </motion.div>
            ) : (
              <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {editingTransaction ? "Update Transaction" : (txType === "expense" ? t("save_expense") : t("save_income"))}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
