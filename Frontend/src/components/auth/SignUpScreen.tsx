"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export function SignUpScreen() {
  const { isDark, signUp, setScreen } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms & Privacy Policy");
      return;
    }
    setLoading(true);
    setError("");
    const result = await signUp(name.trim(), email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Something went wrong");
    }
  }

  const fields = [
    {
      label: "Full Name",
      placeholder: "Alex Morgan",
      type: "text",
      value: name,
      onChange: setName,
      icon: User,
      iconColor: "text-indigo-500",
      iconBg: "bg-indigo-500/10",
      autoComplete: "name",
    },
    {
      label: "Email Address",
      placeholder: "alex@example.com",
      type: "email",
      value: email,
      onChange: setEmail,
      icon: Mail,
      iconColor: "text-sky-500",
      iconBg: "bg-sky-500/10",
      autoComplete: "email",
    },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("min-h-screen flex flex-col relative overflow-hidden", isDark ? "bg-[#0B1120]" : "bg-[#F8FAFC]")}
    >
      {/* Background blobs */}
      <div className="absolute top-0 left-0 right-0 h-80 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 right-0 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -top-12 -left-12 w-56 h-56 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col px-6 pt-14 pb-10 relative z-10 max-w-[430px] mx-auto w-full">
        {/* Logo + Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-8"
        >
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center mb-5 shadow-2xl shadow-emerald-500/30">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className={cn("text-[30px] font-black leading-tight tracking-tight", isDark ? "text-white" : "text-slate-900")}>
            Create Account 🚀
          </h1>
          <p className={cn("text-sm mt-1.5 font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
            Start your financial journey today
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          {/* Name & Email */}
          {fields.map(({ label, placeholder, type, value, onChange, icon: Icon, iconColor, iconBg, autoComplete }) => (
            <div key={label}>
              <label className={cn("text-[10px] font-black uppercase tracking-wider mb-2 block", isDark ? "text-slate-400" : "text-slate-500")}>
                {label}
              </label>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all",
                isDark
                  ? "bg-slate-800/60 border-white/[0.08] focus-within:border-indigo-500/50 focus-within:bg-slate-800"
                  : "bg-white border-slate-200 shadow-sm focus-within:border-indigo-400"
              )}>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
                  <Icon size={15} className={iconColor} />
                </div>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  className={cn(
                    "flex-1 bg-transparent outline-none text-sm font-medium placeholder:font-normal",
                    isDark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"
                  )}
                />
              </div>
            </div>
          ))}

          {/* Password */}
          <div>
            <label className={cn("text-[10px] font-black uppercase tracking-wider mb-2 block", isDark ? "text-slate-400" : "text-slate-500")}>
              Password
            </label>
            <div className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all",
              isDark
                ? "bg-slate-800/60 border-white/[0.08] focus-within:border-indigo-500/50"
                : "bg-white border-slate-200 shadow-sm focus-within:border-indigo-400"
            )}>
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                <Lock size={15} className="text-rose-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                autoComplete="new-password"
                className={cn(
                  "flex-1 bg-transparent outline-none text-sm font-medium placeholder:font-normal",
                  isDark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"
                )}
              />
              <button onClick={() => setShowPassword(!showPassword)} className="p-1">
                {showPassword
                  ? <EyeOff size={15} className={isDark ? "text-slate-500" : "text-slate-400"} />
                  : <Eye size={15} className={isDark ? "text-slate-500" : "text-slate-400"} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className={cn("text-[10px] font-black uppercase tracking-wider mb-2 block", isDark ? "text-slate-400" : "text-slate-500")}>
              Confirm Password
            </label>
            <div className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all",
              isDark
                ? "bg-slate-800/60 border-white/[0.08] focus-within:border-indigo-500/50"
                : "bg-white border-slate-200 shadow-sm focus-within:border-indigo-400",
              confirmPassword && confirmPassword === password && "border-emerald-500/50"
            )}>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                {confirmPassword && confirmPassword === password
                  ? <Check size={15} className="text-emerald-500" />
                  : <Lock size={15} className="text-emerald-500" />}
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                placeholder="Re-enter password"
                autoComplete="new-password"
                className={cn(
                  "flex-1 bg-transparent outline-none text-sm font-medium placeholder:font-normal",
                  isDark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"
                )}
              />
            </div>
          </div>

          {/* Terms checkbox */}
          <button
            onClick={() => setAgreed(!agreed)}
            className="flex items-start gap-3 w-full text-left"
          >
            <div className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
              agreed
                ? "bg-indigo-600 border-indigo-600"
                : isDark ? "border-white/20" : "border-slate-300"
            )}>
              {agreed && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
            <p className={cn("text-xs leading-relaxed", isDark ? "text-slate-400" : "text-slate-500")}>
              I agree to the{" "}
              <span className="text-indigo-500 font-semibold">Terms of Service</span>
              {" "}and{" "}
              <span className="text-indigo-500 font-semibold">Privacy Policy</span>
            </p>
          </button>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold text-rose-500 text-center py-2.5 px-4 bg-rose-500/10 rounded-2xl border border-rose-500/20"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Create Account Button */}
          <motion.button
            onClick={handleSignUp}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #10B981 0%, #6366F1 100%)",
              boxShadow: "0 6px 24px rgba(99,102,241,0.40)",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Sign In link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-1.5 mt-8"
        >
          <p className={cn("text-sm", isDark ? "text-slate-500" : "text-slate-400")}>
            Already have an account?
          </p>
          <button
            onClick={() => setScreen("signin")}
            className="text-sm font-bold text-indigo-500"
          >
            Sign In
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
