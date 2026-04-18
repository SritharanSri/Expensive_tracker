"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CATEGORIES, Category } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import {
  Camera,
  ImagePlus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  ChevronDown,
  CalendarDays,
  AlignLeft,
  ArrowDownLeft,
  Check,
  Lock,
  Crown,
} from "lucide-react";

interface ExtractedData {
  merchant: string;
  amount: string;
  category: string;
  date: string;
  items: string[];
  confidence: number;
}

interface BillScannerProps {
  isDark: boolean;
  onSaved: () => void;
}

type ScanStep = "idle" | "preview" | "scanning" | "done" | "error";

const SCAN_STEPS = [
  { label: "Detecting merchant & logo", icon: "🏪", duration: 700 },
  { label: "Reading amounts & totals", icon: "💰", duration: 800 },
  { label: "Identifying line items", icon: "📋", duration: 600 },
  { label: "Categorizing expense", icon: "🏷️", duration: 500 },
  { label: "Finalizing extraction", icon: "✨", duration: 400 },
];

// Mock OCR responses simulating an AI receipt parser
const MOCK_RESULTS: ExtractedData[] = [
  {
    merchant: "Whole Foods Market",
    amount: "84.50",
    category: "food",
    date: "Apr 12, 2026",
    items: ["Organic Avocados ×3 — $5.97", "Almond Milk — $4.99", "Sourdough Bread — $6.50", "Mixed Greens — $8.99", "Misc Groceries — $58.05"],
    confidence: 97,
  },
  {
    merchant: "Amazon",
    amount: "127.45",
    category: "shopping",
    date: "Apr 11, 2026",
    items: ["USB-C Cable ×2 — $19.90", "Desk Lamp — $45.99", "Notebook Set — $12.99", "Phone Stand — $15.99", "Misc — $32.58"],
    confidence: 94,
  },
  {
    merchant: "Shell Gas Station",
    amount: "62.30",
    category: "transport",
    date: "Apr 12, 2026",
    items: ["Unleaded 87 — 15.2 gal @ $4.10 = $62.30"],
    confidence: 99,
  },
  {
    merchant: "Cheesecake Factory",
    amount: "89.70",
    category: "food",
    date: "Apr 10, 2026",
    items: ["Chicken Madeira — $24.95", "Pasta Carbonara — $21.50", "Avocado Toast — $14.95", "Drinks ×2 — $16.00", "Tip — $12.30"],
    confidence: 96,
  },
];

export function BillScanner({ isDark, onSaved }: BillScannerProps) {
  const { addTransaction, currencyConfig, isPremium, aiToolUsageCount, isAiToolLocked, incrementAiToolUsage, triggerPremiumModal } = useApp();
  const [scanStep, setScanStep] = useState<ScanStep>("idle");
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [editedAmount, setEditedAmount] = useState("");
  const [editedNote, setEditedNote] = useState("");
  const [selectedCat, setSelectedCat] = useState<Category>(CATEGORIES[0]);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setErrorMsg("Please select an image or PDF file");
      return;
    }
    fileRef.current = file;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanStep("preview");
    setErrorMsg(null);
  }, []);

  const triggerAction = useCallback((action: "camera" | "gallery" | "drop", file?: File) => {
    if (action === "camera") {
      cameraInputRef.current?.click();
      return;
    }
    if (action === "gallery") {
      fileInputRef.current?.click();
      return;
    }
    if (action === "drop" && file) {
      handleFile(file);
    }
  }, [handleFile]);

  const requestAction = useCallback((action: "camera" | "gallery" | "drop", file?: File) => {
    if (isPremium) {
      triggerAction(action, file);
      return;
    }
    if (isAiToolLocked) {
      triggerPremiumModal("You've used all 3 free AI tool uses (Voice + Scanner). Upgrade to Premium for unlimited access & no ads.");
      return;
    }
    triggerAction(action, file);
  }, [isPremium, isAiToolLocked, triggerAction, triggerPremiumModal]);

  const startScan = useCallback(async () => {
    if (!fileRef.current) return;
    setScanStep("scanning");
    setCurrentStepIdx(0);
    setErrorMsg(null);

    try {
      // Show progress steps
      for (let i = 0; i < SCAN_STEPS.length; i++) {
        setCurrentStepIdx(i);
        await new Promise((r) => setTimeout(r, SCAN_STEPS[i].duration));
      }

      // Send file to scan-receipt API
      const formData = new FormData();
      formData.append("image", fileRef.current);

      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `API error: ${response.status}`);
      }

      const { data } = await response.json();
      if (!data) throw new Error("No data returned from API");

      const result: ExtractedData = data;
      const cat = CATEGORIES.find((c) => c.id === result.category) ?? CATEGORIES[0];

      setExtracted(result);
      setEditedAmount(result.amount);
      setEditedNote(result.merchant);
      setSelectedCat(cat);
      setScanStep("done");

      // Count successful usage
      incrementAiToolUsage();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to scan receipt";
      setErrorMsg(message);
      setScanStep("error");
    }
  }, [incrementAiToolUsage]);

  const reset = useCallback(() => {
    setScanStep("idle");
    setPreviewUrl(null);
    setExtracted(null);
    setEditedAmount("");
    setEditedNote("");
    setCurrentStepIdx(0);
    setErrorMsg(null);
    fileRef.current = null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleSave() {
    if (!extracted) return;
    addTransaction({
      title: editedNote || extracted.merchant,
      amount: parseFloat(editedAmount) || 0,
      category: selectedCat.id,
      type: "expense",
      date: new Date(),
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      reset();
      onSaved();
    }, 1200);
  }

  return (
    <div className="space-y-4">
      {/* Idle — Upload options */}
      <AnimatePresence mode="wait">
        {scanStep === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Drag & drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) requestAction("drop", file);
              }}
              className={cn(
                "relative rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-10 px-6 text-center transition-colors",
                isDark
                  ? "border-indigo-500/30 bg-indigo-500/[0.04] hover:border-indigo-500/50 hover:bg-indigo-500/[0.07]"
                  : "border-indigo-300/50 bg-indigo-50/60 hover:border-indigo-400/60 hover:bg-indigo-50"
              )}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}
              >
                <Sparkles size={28} className="text-white" />
              </div>
              <div>
                <p className={cn("font-bold text-base", isDark ? "text-white" : "text-slate-800")}>
                  AI Receipt Scanner
                </p>
                <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
                  {isAiToolLocked && !isPremium
                    ? "Upgrade to Premium to continue scanning"
                    : "Drag & drop a receipt image or choose below"}
                </p>
              </div>

              {/* Usage indicator inside drop zone */}
              {!isPremium && (
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full",
                    isAiToolLocked
                      ? "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  )}>
                    {isAiToolLocked ? ("⚡ Upgrade to Premium") : `${3 - aiToolUsageCount} / 3 uses left`}
                  </span>
                </div>
              )}

              {/* Supported formats */}
              <div className="flex items-center gap-2">
                {["JPG", "PNG", "HEIC", "PDF"].map((fmt) => (
                  <span
                    key={fmt}
                    className={cn(
                      "text-[10px] font-semibold px-2 py-1 rounded-lg",
                      isDark ? "bg-slate-800 text-slate-400" : "bg-white text-slate-500 shadow-sm"
                    )}
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={isAiToolLocked && !isPremium}
                onClick={() => requestAction("camera")}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all",
                  isAiToolLocked && !isPremium
                    ? isDark ? "bg-slate-800/40 border-white/[0.04] opacity-60" : "bg-white/50 border-slate-100 opacity-60"
                    : isDark
                    ? "bg-slate-800/60 border-white/[0.08] hover:bg-slate-700/60"
                    : "bg-white border-slate-100 shadow-card hover:bg-slate-50"
                )}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10">
                  {isAiToolLocked && !isPremium ? <Lock size={20} className="text-amber-500" /> : <Camera size={20} className="text-indigo-500" />}
                </div>
                <div>
                  <p className={cn("font-semibold text-sm", isDark ? "text-white" : "text-slate-800")}>
                    Take Photo
                  </p>
                  <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
                    {isAiToolLocked && !isPremium ? "Premium required" : isPremium ? "Use camera" : `${3 - aiToolUsageCount} uses left`}
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={isAiToolLocked && !isPremium}
                onClick={() => requestAction("gallery")}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all",
                  isAiToolLocked && !isPremium
                    ? isDark ? "bg-slate-800/40 border-white/[0.04] opacity-60" : "bg-white/50 border-slate-100 opacity-60"
                    : isDark
                    ? "bg-slate-800/60 border-white/[0.08] hover:bg-slate-700/60"
                    : "bg-white border-slate-100 shadow-card hover:bg-slate-50"
                )}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10">
                  {isAiToolLocked && !isPremium ? <Lock size={20} className="text-amber-500" /> : <ImagePlus size={20} className="text-violet-500" />}
                </div>
                <div>
                  <p className={cn("font-semibold text-sm", isDark ? "text-white" : "text-slate-800")}>
                    Upload Image
                  </p>
                  <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
                    {isAiToolLocked && !isPremium ? "Premium required" : isPremium ? "From gallery" : `${3 - aiToolUsageCount} uses left`}
                  </p>
                </div>
              </motion.button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {/* Tips */}
            <div className={cn(
              "mt-3 rounded-2xl px-4 py-3 flex items-start gap-3",
              isDark ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-100"
            )}>
              <span className="text-lg mt-0.5">💡</span>
              <div>
                <p className={cn("text-xs font-semibold mb-0.5", isDark ? "text-amber-400" : "text-amber-700")}>
                  Tips for best results
                </p>
                <p className={cn("text-xs leading-relaxed", isDark ? "text-amber-500/80" : "text-amber-600/80")}>
                  Ensure good lighting, keep the receipt flat, and capture all text including totals and merchant name.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Preview state */}
        {scanStep === "preview" && previewUrl && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <div className="relative rounded-3xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full object-cover max-h-64 rounded-3xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-3xl" />
              <button
                onClick={reset}
                className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center"
              >
                <X size={14} className="text-white" />
              </button>
              <div className="absolute bottom-3 left-3">
                <p className="text-white text-sm font-semibold">Receipt ready</p>
                <p className="text-white/70 text-xs">Tap scan to extract details</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={startScan}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.45)",
              }}
            >
              <Sparkles size={18} />
              Scan with AI
            </motion.button>

            <button
              onClick={reset}
              className={cn(
                "w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2",
                isDark ? "text-slate-400 bg-slate-800" : "text-slate-500 bg-slate-100"
              )}
            >
              <RotateCcw size={14} />
              Choose another
            </button>
          </motion.div>
        )}

        {/* Scanning animation */}
        {scanStep === "scanning" && previewUrl && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Image with scan overlay */}
            <div className="relative rounded-3xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Scanning receipt"
                className="w-full object-cover max-h-52 rounded-3xl opacity-60"
              />
              {/* Scan line animation */}
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                style={{ boxShadow: "0 0 12px rgba(99,102,241,0.8)" }}
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              {/* Corner markers */}
              {[
                "top-2 left-2 border-t-2 border-l-2 rounded-tl-xl",
                "top-2 right-2 border-t-2 border-r-2 rounded-tr-xl",
                "bottom-2 left-2 border-b-2 border-l-2 rounded-bl-xl",
                "bottom-2 right-2 border-b-2 border-r-2 rounded-br-xl",
              ].map((cls, i) => (
                <div key={i} className={cn("absolute w-6 h-6 border-indigo-400", cls)} />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn(
                  "px-4 py-2 rounded-xl backdrop-blur-md text-sm font-semibold",
                  "bg-black/50 text-white"
                )}>
                  Analyzing receipt…
                </div>
              </div>
            </div>

            {/* Step progress */}
            <div className={cn(
              "rounded-3xl p-4 space-y-2.5",
              isDark ? "bg-slate-800/60 border border-white/[0.06]" : "bg-white/80 border border-white shadow-card"
            )}>
              <p className={cn("text-xs font-semibold uppercase tracking-widest mb-3", isDark ? "text-slate-500" : "text-slate-400")}>
                AI Processing
              </p>
              {SCAN_STEPS.map((step, i) => {
                const state = i < currentStepIdx ? "done" : i === currentStepIdx ? "active" : "pending";
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-center gap-3"
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0 transition-all duration-300",
                      state === "done"
                        ? "bg-emerald-500/20"
                        : state === "active"
                        ? "bg-indigo-500/20"
                        : isDark ? "bg-slate-700" : "bg-slate-100"
                    )}>
                      {state === "done" ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : state === "active" ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent"
                        />
                      ) : (
                        <span className="text-xs opacity-40">{step.icon}</span>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm transition-colors duration-300",
                      state === "done"
                        ? "text-emerald-500 font-medium"
                        : state === "active"
                        ? isDark ? "text-white font-semibold" : "text-slate-900 font-semibold"
                        : isDark ? "text-slate-600" : "text-slate-300"
                    )}>
                      {step.label}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Done — extracted data form */}
        {scanStep === "done" && extracted && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-3"
          >
            {/* Success badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3",
                isDark
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-emerald-50 border border-emerald-100"
              )}
            >
              <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
              <div className="flex-1">
                <p className={cn("text-sm font-semibold", isDark ? "text-emerald-400" : "text-emerald-700")}>
                  Receipt scanned successfully
                </p>
                <p className={cn("text-xs", isDark ? "text-emerald-600" : "text-emerald-600/70")}>
                  {extracted.confidence}% confidence · Review & confirm below
                </p>
              </div>
              <button onClick={reset} className="flex-shrink-0">
                <RotateCcw size={15} className={isDark ? "text-emerald-600" : "text-emerald-400"} />
              </button>
            </motion.div>

            {/* Extracted amount */}
            <div className={cn(
              "rounded-3xl overflow-hidden border",
              isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white/70 border-white/80",
              "backdrop-blur-xl"
            )}>
              {/* Amount */}
              <div className={cn("flex items-center gap-3.5 px-5 py-4", isDark ? "border-b border-white/[0.05]" : "border-b border-slate-100")}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.1)" }}>
                  <ArrowDownLeft size={18} className="text-rose-500" />
                </div>
                <div className="flex-1">
                  <p className={cn("text-xs mb-0.5", isDark ? "text-slate-500" : "text-slate-400")}>Total Amount</p>
                  <div className="flex items-center gap-1">
                    <span className={cn("text-lg font-light", isDark ? "text-slate-400" : "text-slate-400")}>{currencyConfig.symbol}</span>
                    <input
                      type="number"
                      value={editedAmount}
                      onChange={(e) => setEditedAmount(e.target.value)}
                      className={cn(
                        "text-2xl font-bold bg-transparent outline-none w-full",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Category */}
              <button
                onClick={() => setShowCatPicker(!showCatPicker)}
                className={cn(
                  "w-full flex items-center gap-3.5 px-5 py-3.5 transition-colors",
                  isDark ? "hover:bg-white/[0.03] border-b border-white/[0.05]" : "hover:bg-slate-50 border-b border-slate-100"
                )}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${selectedCat.color}18` }}
                >
                  {selectedCat.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>Category</p>
                  <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-slate-800")}>
                    {selectedCat.name}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={cn(
                    "flex-shrink-0 transition-transform",
                    isDark ? "text-slate-500" : "text-slate-400",
                    showCatPicker && "rotate-180"
                  )}
                />
              </button>

              {/* Cat picker */}
              <AnimatePresence>
                {showCatPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className={cn("px-4 py-3 grid grid-cols-4 gap-2", isDark ? "border-b border-white/[0.05]" : "border-b border-slate-100")}>
                      {CATEGORIES.filter((c) => !["salary", "freelance", "investment"].includes(c.id)).map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => { setSelectedCat(cat); setShowCatPicker(false); }}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all",
                            selectedCat.id === cat.id
                              ? "ring-2"
                              : isDark ? "bg-slate-800/60" : "bg-slate-50"
                          )}
                          style={
                            selectedCat.id === cat.id
                              ? { background: `${cat.color}15`, outline: `2px solid ${cat.color}` }
                              : undefined
                          }
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <span className={cn("text-[10px] font-medium text-center leading-tight", isDark ? "text-slate-400" : "text-slate-600")}>
                            {cat.name.split(" ")[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Date */}
              <div className={cn("flex items-center gap-3.5 px-5 py-3.5", isDark ? "border-b border-white/[0.05]" : "border-b border-slate-100")}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", isDark ? "bg-slate-700" : "bg-slate-100")}>
                  <CalendarDays size={18} className={isDark ? "text-slate-400" : "text-slate-500"} />
                </div>
                <div className="flex-1">
                  <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>Date on Receipt</p>
                  <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-slate-800")}>{extracted.date}</p>
                </div>
              </div>

              {/* Merchant / Note */}
              <div className="flex items-center gap-3.5 px-5 py-3.5">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", isDark ? "bg-slate-700" : "bg-slate-100")}>
                  <AlignLeft size={18} className={isDark ? "text-slate-400" : "text-slate-500"} />
                </div>
                <input
                  type="text"
                  value={editedNote}
                  onChange={(e) => setEditedNote(e.target.value)}
                  placeholder="Merchant / note"
                  className={cn(
                    "flex-1 bg-transparent outline-none text-sm font-semibold placeholder:font-normal",
                    isDark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"
                  )}
                />
              </div>
            </div>

            {/* Line items */}
            {extracted.items.length > 0 && (
              <div className={cn(
                "rounded-3xl p-4 border",
                isDark ? "bg-slate-800/40 border-white/[0.06]" : "bg-slate-50/80 border-slate-100"
              )}>
                <p className={cn("text-xs font-semibold uppercase tracking-widest mb-3", isDark ? "text-slate-500" : "text-slate-400")}>
                  Line Items Detected
                </p>
                <div className="space-y-1.5">
                  {extracted.items.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i + 0.1 }}
                      className="flex items-start gap-2"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: selectedCat.color }}
                      />
                      <p className={cn("text-xs leading-relaxed", isDark ? "text-slate-400" : "text-slate-600")}>
                        {item}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Save button */}
            <motion.button
              onClick={handleSave}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
              }}
            >
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </div>
                    <span>Expense Saved!</span>
                  </motion.div>
                ) : (
                  <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    Confirm &amp; Save Expense
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Error fallback */}
          </motion.div>
        )}

        {scanStep === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "rounded-3xl p-6 flex flex-col items-center gap-3 text-center border",
              isDark ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-100"
            )}
          >
            <AlertCircle size={32} className="text-rose-500" />
            <p className={cn("font-bold", isDark ? "text-white" : "text-slate-800")}>Scan failed</p>
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
              {errorMsg || "Could not extract details from this image. Try a clearer photo with better lighting."}
            </p>
            <button
              onClick={reset}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #EF4444, #FB7185)" }}
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
