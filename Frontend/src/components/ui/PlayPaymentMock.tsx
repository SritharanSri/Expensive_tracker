"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { User, ShieldCheck, X, Check, ArrowRight, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";

interface PlayPaymentMockProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDark: boolean;
  productName: string;
  price: string;
}

export function PlayPaymentMock({ isOpen, onClose, onSuccess, isDark, productName, price }: PlayPaymentMockProps) {
  const [step, setStep] = useState<"details" | "processing" | "success">("details");

  useEffect(() => {
    if (!isOpen) setStep("details");
  }, [isOpen]);

  const handleSubscribe = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-[2px]"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[120] max-w-[430px] mx-auto rounded-t-[28px] overflow-hidden",
              isDark ? "bg-[#1C1C1E] text-white" : "bg-white text-slate-900"
            )}
            style={{ boxShadow: "0 -8px 32px rgba(0,0,0,0.2)" }}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-black text-xs">S</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-none">Google Play</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Subscribing to Spendly</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 -mr-2 text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5">
              {step === "details" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Product Details */}
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                        <Smartphone size={24} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base">{productName}</h4>
                        <p className="text-xs text-slate-500 font-medium">Automatic renewal every month</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg">{price}</p>
                      <p className="text-[10px] text-slate-400 line-through">LKR 599.00</p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="w-4" />
                        </div>
                        <span className="text-xs font-bold">Visa •••• 4242</span>
                      </div>
                      <ChevronRight className="text-slate-400" size={14} />
                    </div>
                    <div className="h-px bg-black/5 dark:bg-white/5" />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <User size={12} className="text-slate-500" />
                      </div>
                      <span className="text-xs text-slate-500">demo@spendly.app</span>
                    </div>
                  </div>

                  {/* Policies */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span>Google Play identity verification required for this transaction.</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
                      By clicking Subscribe, you agree to the Google Play Terms of Service. Purchases are automatically billed to your selected method. Cancel in Google Play Subscriptions at any time.
                    </p>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={handleSubscribe}
                    className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    Subscribe
                    <ArrowRight size={16} strokeWidth={3} />
                  </button>
                </motion.div>
              )}

              {step === "processing" && (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent"
                  />
                  <div>
                    <p className="font-bold text-lg">Validating with Google Play</p>
                    <p className="text-sm text-slate-500">Verifying secure payment method...</p>
                  </div>
                </div>
              )}

              {step === "success" && (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center"
                  >
                    <Check size={32} className="text-white" strokeWidth={4} />
                  </motion.div>
                  <div>
                    <p className="font-bold text-lg text-emerald-500">Subscription Rooted!</p>
                    <p className="text-sm text-slate-500">Thank you for joining Spendly Premium.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Safe Area Padding */}
            <div className="h-8" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ChevronRight({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      className={className} 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
