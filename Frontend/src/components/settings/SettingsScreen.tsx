"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/Cards";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { COUNTRIES } from "@/lib/currency";
import {
  Moon, Sun, Bell, Shield, CreditCard, HelpCircle,
  ChevronRight, Globe, Palette, Download, LogOut,
  User, Star, Check, Globe2, Languages, ShieldCheck, Crown,
  Zap, Bot, Mic, ScanLine, Target, MessageSquare, BarChart3,
  BrainCircuit, Infinity as InfinityIcon, Lock, ClipboardPaste, AlertTriangle, FileText, Sparkles
} from "lucide-react";

interface ToggleProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}

function Toggle({ enabled, onChange, color = "#6366F1" }: ToggleProps) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(!enabled); }}
      className={cn(
        "w-12 h-6 rounded-full relative transition-colors duration-300 cursor-pointer",
        enabled ? "" : "bg-slate-300 dark:bg-slate-700"
      )}
      style={{ backgroundColor: enabled ? color : "" }}
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ x: enabled ? 26 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
    </div>
  );
}

interface SettingRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  isDark: boolean;
  danger?: boolean;
  onClick?: () => void;
}

function SettingRow({ icon, iconBg, label, subtitle, right, isDark, danger, onClick }: SettingRowProps) {
  return (
    <motion.div
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        "w-full flex items-center gap-3.5 px-5 py-3.5 transition-colors",
        isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/80",
        onClick && "cursor-pointer"
      )}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={cn("text-sm font-semibold", danger ? "text-rose-500" : isDark ? "text-white" : "text-slate-800")}>
          {label}
        </p>
        {subtitle && (
          <p className={cn("text-xs mt-0.5 truncate", isDark ? "text-slate-500" : "text-slate-400")}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        {right ?? (
          onClick && <ChevronRight size={16} className={isDark ? "text-slate-600" : "text-slate-300"} />
        )}
      </div>
    </motion.div>
  );
}

export function SettingsScreen() {
  const { 
    isDark, toggleTheme, isPremium, setIsPremium,
    country, setCountry, language, setLanguage,
    currencyConfig, setScreen,
    automationEnabled, toggleAutomation, simulateSms,
    t, user, signOut, triggerPremiumModal, trackPremiumClick,
    aiToolUsageCount, aiQueryCount, financialGoals,
    addTransaction, addNotification
  } = useApp();

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [showSmsPasteSheet, setShowSmsPasteSheet] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [isParsingSms, setIsParsingSms] = useState(false);
  const [extractedSms, setExtractedSms] = useState<any>(null);
  const [smsError, setSmsError] = useState<string | null>(null);

  const handleParseSms = async () => {
    if (!pastedText.trim()) return;
    setIsParsingSms(true);
    setSmsError(null);
    setExtractedSms(null);

    try {
      const res = await fetch("/api/parse-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText }),
      });
      const result = await res.json();
      if (result.success) {
        setExtractedSms(result.data);
      } else {
        setSmsError(result.message || "Failed to parse SMS. Please try again with a clearer bank notification.");
      }
    } catch (err) {
      setSmsError("Network error. Please check your connection.");
    } finally {
      setIsParsingSms(false);
    }
  };

  const handleSaveSmsTransaction = () => {
    if (!extractedSms) return;
    addTransaction({
      title: extractedSms.merchant,
      amount: extractedSms.amount,
      category: extractedSms.category,
      type: extractedSms.type as any,
      date: new Date(),
    });
    // Trigger notification
    addNotification({
      title: "Transaction Saved",
      desc: `Tracked ${extractedSms.merchant} from SMS`,
      icon: "check",
      color: "text-emerald-500"
    });
    setShowSmsPasteSheet(false);
    setExtractedSms(null);
    setPastedText("");
  };

  const sectionClass = cn(
    "rounded-3xl overflow-hidden border",
    isDark ? "bg-slate-900/60 border-white/[0.08]" : "bg-white/70 border-white/80",
    "backdrop-blur-xl"
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "min-h-screen pb-36",
        isDark ? "bg-[#0B1120]" : "bg-[#F8FAFC]"
      )}
    >
      <TopBar title="Settings" />

      {/* Premium Banner */}
      {!isPremium && (
        <div className="mx-5 mb-6">
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => triggerPremiumModal("Unlock the full potential of your financial journey.")}
            className="p-5 rounded-[28px] bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 shadow-lg relative overflow-hidden cursor-pointer"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={20} className="text-white" fill="white" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{t("nav_assistant")}</span>
              </div>
              <h3 className="text-xl font-black text-white leading-tight">{t("settings_premium_unlock")}</h3>
              <p className="text-sm text-amber-100/80 font-medium">{t("settings_premium_sub")}</p>
            </div>
            <div className="absolute top-2 right-4 opacity-20">
              <Crown size={80} className="text-white" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Subscription Management (Only if Premium) */}
      {isPremium && (
        <div className="mx-5 mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">Subscription</p>
          <div className={sectionClass}>
            <SettingRow
              icon={<Crown size={18} className="text-amber-500" />}
              iconBg="rgba(245,158,11,0.1)"
              label="Premium Membership"
              subtitle="Active • Unlimited Access"
              isDark={isDark}
              right={
                <button 
                  onClick={() => setIsPremium(false)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-wider"
                >
                  Cancel
                </button>
              }
            />
          </div>
        </div>
      )}

      {/* Your Plan — Feature Limits (non-premium only) */}
      {!isPremium && (
        <div className="mx-5 mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">Your Plan — Free Tier</p>
          <div className={sectionClass}>
            {/* Feature rows */}
            <div className="px-5 pt-4 pb-2">
              <div className="grid grid-cols-12 mb-3">
                <div className="col-span-6 text-[9px] font-black uppercase tracking-widest text-slate-500">Feature</div>
                <div className="col-span-3 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">Free</div>
                <div className="col-span-3 text-center text-[9px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Premium</div>
              </div>
              <div className="space-y-4">
                {[
                  {
                    icon: <Mic size={13} className="text-indigo-400" />,
                    label: "AI Voice Entry",
                    free: `${Math.max(0, 3 - aiToolUsageCount)} left`,
                    freeMaxed: aiToolUsageCount >= 3,
                    pro: "Unlimited",
                  },
                  {
                    icon: <ScanLine size={13} className="text-violet-400" />,
                    label: "Receipt Scanner",
                    free: "Shared",
                    freeMaxed: aiToolUsageCount >= 3,
                    pro: "Unlimited",
                  },
                  {
                    icon: <MessageSquare size={13} className="text-emerald-400" />,
                    label: "AI Chat Assistant",
                    free: `${Math.max(0, 3 - aiQueryCount)}/day`,
                    freeMaxed: aiQueryCount >= 3,
                    pro: "Unlimited",
                  },
                  {
                    icon: <Target size={13} className="text-amber-400" />,
                    label: "Smart Goals",
                    free: `${financialGoals.length}/2`,
                    freeMaxed: financialGoals.length >= 2,
                    pro: "Unlimited",
                  },
                  {
                    icon: <BrainCircuit size={13} className="text-rose-400" />,
                    label: "What-If Simulator",
                    free: "—",
                    freeMaxed: true,
                    pro: <Check size={12} className="mx-auto text-amber-500" />,
                  },
                  {
                    icon: <BarChart3 size={13} className="text-sky-400" />,
                    label: "Purchase Planner",
                    free: "Basic",
                    freeMaxed: false,
                    pro: "Full AI",
                  },
                  {
                     icon: <Zap size={13} className="text-orange-400" />,
                     label: "Smart SMS Tracking",
                     free: "—",
                     freeMaxed: true,
                     pro: <Check size={12} className="mx-auto text-amber-500" />,
                  },
                  {
                     icon: <Shield size={13} className="text-pink-400" />,
                     label: "Ad-Free Experience",
                     free: "Ads",
                     freeMaxed: true,
                     pro: <Check size={12} className="mx-auto text-amber-500" />,
                  },
                ].map((f, i) => (
                  <div key={i} className="grid grid-cols-12 items-center py-0.5">
                    <div className="col-span-6 flex items-center gap-2">
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0", isDark ? "bg-white/5" : "bg-slate-50")}>
                        {f.icon}
                      </div>
                      <span className={cn("text-[11px] font-semibold truncate", isDark ? "text-slate-300" : "text-slate-600")}>{f.label}</span>
                    </div>
                    <div className="col-span-3 text-center flex items-center justify-center">
                      {typeof f.free === "string" ? (
                        <span className={cn(
                          "text-[10px] font-bold",
                          f.freeMaxed ? "text-rose-500" : isDark ? "text-slate-400" : "text-slate-500"
                        )}>
                          {f.free === "—" ? <Lock size={10} className="text-slate-500 hover:text-slate-400 transition-colors" /> : f.free}
                        </span>
                      ) : f.free}
                    </div>
                    <div className="col-span-3 text-center flex items-center justify-center">
                      {typeof f.pro === "string" ? (
                        <span className="text-[10px] font-black text-amber-500">{f.pro}</span>
                      ) : f.pro}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade button inside section */}
            <div className={cn("mx-5 my-4")}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => triggerPremiumModal("Unlock unlimited AI features, remove all ads, and supercharge your finances.")}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-white text-xs font-black uppercase tracking-widest shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Crown size={14} /> Upgrade to Premium
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Automation Section */}
      <div className="mx-5 mb-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">{t("settings_automation")}</p>
        <div className={sectionClass}>
          <SettingRow
            icon={<Zap size={18} className="text-indigo-500" />}
            iconBg="rgba(99,102,241,0.1)"
            label={t("settings_sms")}
            isDark={isDark}
            right={
              <div className="flex items-center gap-3">
                {!isPremium && (
                  <div className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[8px] font-black text-amber-500">PRO</span>
                  </div>
                )}
                <Toggle 
                  enabled={isPremium && automationEnabled} 
                  onChange={(val) => {
                    if (isPremium) toggleAutomation();
                    else triggerPremiumModal("Smart SMS Tracking automatically extracts expenses from bank notifications. This is a Premium feature.");
                  }} 
                />
              </div>
            }
          />
          <div className="h-px mx-5 bg-slate-200 dark:bg-white/5" />
          <SettingRow
            icon={<Zap size={18} className="text-orange-500" />}
            iconBg="rgba(249,115,22,0.1)"
            label="Smart SMS Parser"
            subtitle="Paste bank text to auto-track"
            isDark={isDark}
            onClick={() => {
              if (isPremium) setShowSmsPasteSheet(true);
              else triggerPremiumModal("Smart SMS Parser extracts expenses from bank notifications. This is a Premium feature.");
            }}
            right={
              <div className="bg-indigo-600/20 px-2 py-0.5 rounded-full border border-indigo-600/30">
                <span className="text-[8px] font-black text-indigo-400 uppercase">New AI</span>
              </div>
            }
          />
          <div className="h-px mx-5 bg-slate-200 dark:bg-white/5" />
          <SettingRow
            icon={<Bot size={18} className="text-emerald-500" />}
            iconBg="rgba(16,185,129,0.1)"
            label={t("settings_sim")}
            subtitle={t("settings_sim_sub")}
            isDark={isDark}
            onClick={simulateSms}
          />
        </div>
      </div>

      {/* Account Section */}
      <div className="mx-5 mb-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">Account & Security</p>
        <div className={sectionClass}>
          <SettingRow
            icon={<User size={18} className="text-indigo-500" />}
            iconBg="rgba(99,102,241,0.1)"
            label={user?.name || "Your Account"}
            subtitle={user?.email || ""}
            isDark={isDark}
            onClick={() => setScreen("profile")}
            right={isPremium ? <div className="bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
              <span className="text-[8px] font-black text-amber-400">PREMIUM</span>
            </div> : <ChevronRight size={16} className={isDark ? "text-slate-600" : "text-slate-300"} />}
          />
          <div className="h-px mx-5 bg-slate-200 dark:bg-white/5" />
          <SettingRow
            icon={<ShieldCheck size={18} className="text-emerald-500" />}
            iconBg="rgba(16,185,129,0.1)"
            label="Security Lock"
            subtitle="Biometric & PIN active"
            isDark={isDark}
          />
        </div>
      </div>

      {/* Localization Section */}
      <div className="mx-5 mb-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">{t("settings_region")}</p>
        <div className={sectionClass}>
          <SettingRow
            icon={<Globe2 size={18} className="text-sky-500" />}
            iconBg="rgba(14,165,233,0.1)"
            label={t("settings_region")}
            subtitle={`${COUNTRIES[country]?.name} (${currencyConfig.code})`}
            isDark={isDark}
            onClick={() => setShowCountryPicker(true)}
          />
          <div className="h-px mx-5 bg-slate-200 dark:bg-white/5" />
          <SettingRow
            icon={<Languages size={18} className="text-violet-500" />}
            iconBg="rgba(139,92,246,0.1)"
            label={t("settings_language")}
            subtitle={language}
            isDark={isDark}
            onClick={() => setShowLanguagePicker(true)}
          />
        </div>
      </div>

      {/* App Preferences */}
      <div className="mx-5 mb-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">{t("nav_settings")}</p>
        <div className={sectionClass}>
          <SettingRow
            icon={isDark ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-500" />}
            iconBg={isDark ? "rgba(99,102,241,0.1)" : "rgba(245,158,11,0.1)"}
            label={t("settings_dark_mode")}
            isDark={isDark}
            right={<Toggle enabled={isDark} onChange={toggleTheme} />}
          />
          <div className="h-px mx-5 bg-slate-200 dark:bg-white/5" />
          <SettingRow
            icon={<Bell size={18} className="text-rose-500" />}
            iconBg="rgba(244,63,94,0.1)"
            label={t("settings_notifications")}
            isDark={isDark}
            right={<Toggle enabled={true} onChange={() => {}} color="#F43F5E" />}
          />
        </div>
      </div>

      {/* Sign Out */}
      <div className="mx-5">
        <button
          onClick={() => setShowSignOut(true)}
          className={cn(
            "w-full py-4 rounded-3xl font-bold text-sm transition-all",
            isDark ? "bg-slate-900 border border-white/5 text-rose-500" : "bg-white border border-slate-200 text-rose-500"
          )}
        >
          {t("settings_sign_out")}
        </button>
      </div>

      {/* Bottom Sheets */}
      <BottomSheet 
        open={showCountryPicker} 
        onClose={() => setShowCountryPicker(false)} 
        isDark={isDark} 
        title="Select Region" 
        subtitle="Dynamic Currency Update"
      >
        <div className="px-5 pb-8 space-y-2">
          {Object.entries(COUNTRIES).map(([code, data]) => (
            <button
              key={code}
              onClick={() => { setCountry(code); setShowCountryPicker(false); }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                country === code 
                  ? "bg-indigo-600 border-indigo-600 text-white" 
                  : isDark ? "bg-slate-800/40 border-white/[0.04] text-white" : "bg-slate-50 border-transparent text-slate-800"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{data.flag}</span>
                <span className="text-sm font-bold">{data.name}</span>
              </div>
              <span className={cn("text-xs font-mono", country === code ? "text-white/70" : "text-slate-500")}>
                {data.currency.code} ({data.currency.symbol})
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={showLanguagePicker}
        onClose={() => setShowLanguagePicker(false)}
        isDark={isDark}
        title="Select Language"
        subtitle="Multilingual Support"
      >
        <div className="px-5 pb-8 space-y-2">
          {["English", "Tamil", "Sinhala", "Hindi", "Spanish", "German", "French"].map((lang) => (
            <button
              key={lang}
              onClick={() => { setLanguage(lang); setShowLanguagePicker(false); }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                language === lang 
                  ? "bg-indigo-600 border-indigo-600 text-white" 
                  : isDark ? "bg-slate-800/40 border-white/[0.04] text-white" : "bg-slate-50 border-transparent text-slate-800"
              )}
            >
              <span className="text-sm font-bold">{lang}</span>
              {language === lang && <Check size={16} />}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={showSmsPasteSheet}
        onClose={() => { if (!isParsingSms) setShowSmsPasteSheet(false); }}
        isDark={isDark}
        title="Smart SMS Parser"
        subtitle="Paste bank alert text"
      >
        <div className="px-5 pb-10">
          {!extractedSms ? (
            <div className="space-y-4">
              <div className={cn(
                "rounded-2xl border p-4",
                isDark ? "bg-slate-900 border-white/10" : "bg-slate-50 border-slate-200"
              )}>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste bank notification here... e.g. 'Your account XX1234 has been debited for LKR 500.00 at Starbucks...'"
                  className="w-full h-32 bg-transparent text-sm resize-none focus:outline-none"
                />
              </div>
              
              {smsError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-rose-500 mt-0.5" />
                  <p className="text-[11px] text-rose-500 font-medium">{smsError}</p>
                </div>
              )}

              <button
                onClick={handleParseSms}
                disabled={!pastedText.trim() || isParsingSms}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                  pastedText.trim() && !isParsingSms
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                )}
              >
                {isParsingSms ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Extract Transaction
                  </>
                )}
              </button>
              
              <div className="flex items-center gap-2 mt-4 px-2">
                 <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Shield size={14} className="text-amber-500" />
                 </div>
                 <p className="text-[10px] text-slate-500 leading-tight">
                    Your data is processed securely via encrypted AI channels and is never stored permanently.
                 </p>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className={cn(
                "p-5 rounded-3xl border",
                isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-100 shadow-sm"
              )}>
                <div className="flex items-center gap-4 mb-5">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-2xl">
                      {extractedSms.type === 'income' ? '💰' : '💳'}
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Detected Transaction</p>
                      <h4 className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-900")}>
                        {extractedSms.merchant}
                      </h4>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center justify-between py-2 border-b border-dashed border-slate-200 dark:border-white/5">
                      <span className="text-xs text-slate-500 font-medium">Amount</span>
                      <span className={cn("text-lg font-black", extractedSms.type === 'income' ? 'text-emerald-500' : 'text-rose-500')}>
                        {extractedSms.currency} {extractedSms.amount.toLocaleString()}
                      </span>
                   </div>
                   <div className="flex items-center justify-between py-2 border-b border-dashed border-slate-200 dark:border-white/5">
                      <span className="text-xs text-slate-500 font-medium">Category</span>
                      <span className={cn("text-xs font-bold px-3 py-1 rounded-full", isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-800")}>
                        {extractedSms.category}
                      </span>
                   </div>
                   <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-slate-500 font-medium">Confidence</span>
                      <div className="flex gap-0.5">
                         {[1, 2, 3, 4, 5].map(s => (
                           <Star key={s} size={10} fill={s <= 4 ? "#F59E0B" : "none"} className="text-amber-500" />
                         ))}
                      </div>
                   </div>
                </div>
                
                <p className="mt-4 text-[10px] text-slate-500 leading-relaxed italic p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                   "{extractedSms.description}"
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setExtractedSms(null)}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs uppercase"
                >
                  Edit Input
                </button>
                <button
                  onClick={handleSaveSmsTransaction}
                  className="flex-[1.5] py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20"
                >
                  Save Transaction
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </BottomSheet>
    </motion.div>
  );
}

