"use client";

import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { Check, Crown, Zap, ShieldCheck, BarChart3, MessageSquare, X, Infinity as InfinityIcon, BrainCircuit, Target, Loader2, Mic, ScanLine } from "lucide-react";
import { formatCurrency, getConvertedPremiumPrice } from "@/lib/currency";
import { useState } from "react";
import { PlayPaymentMock } from "@/components/ui/PlayPaymentMock";
import { initiatePlayPurchase } from "@/lib/billing";

export function PremiumUpgrade({ onClose }: { onClose: () => void }) {
  const { isDark, setIsPremium, premiumModalMessage, currencyConfig } = useApp();

  const premiumPrice = getConvertedPremiumPrice(currencyConfig.code);

  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    
    // 1. Try real Play Billing if in TWA
    const details = {
      id: `spendly_premium_${Date.now()}`,
      total: {
        label: "Spendly Premium Subscription",
        amount: { currency: currencyConfig.code, value: premiumPrice.toFixed(2) },
      },
    };

    const result = await initiatePlayPurchase(details);
    
    if (result && result.success) {
      setIsPremium(true);
      setIsProcessing(false);
      onClose();
      return;
    }

    // 2. Fallback to high-fidelity Simulation UI for demo/web
    setIsProcessing(false);
    setIsSimulationOpen(true);
  };

  const handleSimulationSuccess = () => {
    setIsPremium(true);
    // Modal will be closed by PlayPaymentMock internal timer + callback
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={cn(
          "relative w-full max-w-[400px] rounded-[36px] overflow-hidden shadow-2xl",
          isDark ? "bg-[#0b1021] border border-white/10" : "bg-white"
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-black/20 text-white/70 hover:bg-black/40 hover:text-white transition-all z-20"
        >
          <X size={20} />
        </button>

        {/* Hero Section */}
        <div className="relative pt-12 pb-8 flex flex-col items-center justify-center px-8 text-center bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950">
          <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <div className="absolute -top-24 -right-12 w-48 h-48 bg-amber-500/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/30 blur-2xl rounded-full" />

          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-20 h-20 bg-gradient-to-br from-amber-300 to-amber-600 rounded-3xl flex items-center justify-center mb-5 shadow-lg shadow-amber-500/40 relative z-10"
          >
            <div className="absolute inset-[2px] bg-[#0b1021] rounded-[22px] flex items-center justify-center">
              <Crown size={38} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
            </div>
          </motion.div>
          
          <h2 className="text-[26px] font-black text-white tracking-tight uppercase relative z-10 drop-shadow-lg">
            Spendly <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Premium</span>
          </h2>
          
          {premiumModalMessage ? (
            <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm relative z-10">
              <p className="text-amber-200 text-xs font-bold leading-relaxed">
                {premiumModalMessage}
              </p>
            </div>
          ) : (
            <p className="text-indigo-200 text-xs font-medium mt-2 opacity-90 relative z-10">
              Unlock the Ultimate Financial AI Engine.
            </p>
          )}
        </div>

        {/* Comparison Section */}
        <div className="p-6 relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          
          <div className="grid grid-cols-5 font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4 px-2">
            <div className="col-span-3">Features</div>
            <div className="col-span-1 text-center">Free</div>
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 col-span-1 text-center">Pro</div>
          </div>

          <div className="space-y-4 px-2 mb-8">
            {[
              { icon: Mic, label: "AI Voice & Scanner", free: "3 uses", pro: <InfinityIcon size={14} className="mx-auto text-amber-500" /> },
              { icon: Target, label: "Smart Goals limit", free: "2", pro: <InfinityIcon size={14} className="mx-auto text-amber-500" /> },
              { icon: BrainCircuit, label: "AI 'What-If' Simulation", free: "-", pro: <Check size={14} className="mx-auto text-amber-500" /> },
              { icon: BarChart3, label: "Advanced Purchase Planner", free: "Basic", pro: "Full" },
              { icon: Zap, label: "Priority AI Analytics", free: "-", pro: <Check size={14} className="mx-auto text-amber-500" /> },
              { icon: ShieldCheck, label: "Exclusive Themes", free: "-", pro: "All" },
              { icon: ShieldCheck, label: "Ad-Free Experience", free: "Ads", pro: <Check size={14} className="mx-auto text-amber-500" /> },
            ].map((f, i) => (
              <div key={i} className="grid grid-cols-5 items-center">
                <div className="col-span-3 flex items-center gap-2">
                  <f.icon size={14} className={isDark ? "text-slate-400" : "text-slate-500"} />
                  <span className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-slate-700")}>{f.label}</span>
                </div>
                <div className={cn("col-span-1 text-center text-xs font-semibold", isDark ? "text-slate-500" : "text-slate-400")}>{f.free}</div>
                <div className="col-span-1 text-center text-xs font-black text-amber-500">{f.pro}</div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleUpgrade}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-white font-black text-lg shadow-[0_0_30px_rgba(245,158,11,0.3)] relative overflow-hidden group"
          >
            <span className="relative z-10 tracking-widest uppercase text-sm drop-shadow-md flex items-center justify-center gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Connecting...
                </>
              ) : (
                <>
                  Upgrade Now <span className="opacity-70 font-medium">•</span> {formatCurrency(premiumPrice, currencyConfig)}/mo
                </>
              )}
            </span>
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }}
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]"
            />
          </motion.button>
          
          <p className="text-center text-[10px] font-medium text-slate-500 mt-4">
            Secure payment · Cancel anytime.
          </p>
        </div>
      </motion.div>

      <PlayPaymentMock
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        onSuccess={handleSimulationSuccess}
        isDark={isDark}
        productName="Spendly Premium"
        price={`${formatCurrency(premiumPrice, currencyConfig)}/mo`}
      />
    </motion.div>
  );
}
