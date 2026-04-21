"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export function SignInScreen() {
  const { isDark, signIn, setScreen } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"signin" | "forgot-password" | "forgot-password-code">("signin");
  const [resetSent, setResetSent] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { resetPassword } = useApp();

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Invalid credentials");
    }
  }

  function fillDemo() {
    setEmail("demo@spendly.app");
    setPassword("demo");
    setError("");
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    setError("");
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1000));
    
    // Validate if user exists (we do this safely since it's a local app)
    const storedStr = localStorage.getItem("et_credentials");
    if (!storedStr || JSON.parse(storedStr).email !== email.trim().toLowerCase()) {
      setError("No account found with that email address.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setView("forgot-password-code");
  }

  async function handleVerifyAndReset() {
    if (code !== "123456") {
      setError("Invalid verification code. Please use the test code: 123456");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await resetPassword(email.trim(), newPassword);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Failed to reset password");
    } else {
      // Success! Sign them in automatically.
      await signIn(email.trim(), newPassword);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("min-h-screen flex flex-col relative overflow-hidden", isDark ? "bg-[#0B1120]" : "bg-[#F8FAFC]")}
    >
      {/* Background blobs */}
      <div className="absolute top-0 left-0 right-0 h-80 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -top-12 right-0 w-56 h-56 rounded-full bg-violet-500/15 blur-3xl" />
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col px-6 pt-16 pb-10 relative z-10 max-w-[430px] mx-auto w-full">
        {/* Logo + Title */}
        <motion.div
          key={view}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center mb-5 shadow-2xl shadow-indigo-500/40">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className={cn("text-[32px] font-black leading-tight tracking-tight", isDark ? "text-white" : "text-slate-900")}>
            {view === "signin" ? "Welcome back 👋" : "Reset Password"}
          </h1>
          <p className={cn("text-sm mt-1.5 font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
            {view === "signin" ? "Sign in to your Spendly account" : "Enter your email to receive a reset link"}
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="space-y-4"
        >
          {/* Email */}
          <div>
            <label className={cn("text-[10px] font-black uppercase tracking-wider mb-2 block", isDark ? "text-slate-400" : "text-slate-500")}>
              Email Address
            </label>
            <div className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all",
              isDark
                ? "bg-slate-800/60 border-white/[0.08] focus-within:border-indigo-500/50 focus-within:bg-slate-800"
                : "bg-white border-slate-200 shadow-sm focus-within:border-indigo-400"
            )}>
              <Mail size={17} className={isDark ? "text-slate-500" : "text-slate-400"} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                placeholder="alex@example.com"
                autoComplete="email"
                className={cn(
                  "flex-1 bg-transparent outline-none text-sm font-medium placeholder:font-normal",
                  isDark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"
                )}
              />
            </div>
          </div>

          {/* Password - only show in signin view */}
          <AnimatePresence>
            {view === "signin" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-4"
              >
                <div>
                  <label className={cn("text-[10px] font-black uppercase tracking-wider mb-2 block top-4 relative", isDark ? "text-slate-400" : "text-slate-500")}>
                    Password
                  </label>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all mt-4",
                    isDark
                      ? "bg-slate-800/60 border-white/[0.08] focus-within:border-indigo-500/50 focus-within:bg-slate-800"
                      : "bg-white border-slate-200 shadow-sm focus-within:border-indigo-400"
                  )}>
                    <Lock size={17} className={isDark ? "text-slate-500" : "text-slate-400"} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={cn(
                        "flex-1 bg-transparent outline-none text-sm font-medium placeholder:font-normal",
                        isDark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"
                      )}
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="p-1">
                      {showPassword
                        ? <EyeOff size={16} className={isDark ? "text-slate-500" : "text-slate-400"} />
                        : <Eye size={16} className={isDark ? "text-slate-500" : "text-slate-400"} />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end -mt-1">
                  <button 
                    onClick={() => { setView("forgot-password"); setError(""); setResetSent(false); }}
                    className="text-xs font-bold text-indigo-500 py-1"
                  >
                    Forgot Password?
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verification Code + New Password Fields (Forgot Password Code view) */}
          <AnimatePresence>
            {view === "forgot-password-code" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-4"
              >
                <div>
                  <label className={cn("text-[10px] font-black uppercase tracking-wider mb-2 block top-4 relative", isDark ? "text-slate-400" : "text-slate-500")}>
                    Verification Code
                  </label>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all mt-4",
                    isDark ? "bg-slate-800/60 border-white/[0.08] focus-within:border-indigo-500/50" : "bg-white border-slate-200 shadow-sm focus-within:border-indigo-400"
                  )}>
                    <Lock size={17} className={isDark ? "text-slate-500" : "text-slate-400"} />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter test code: 123456"
                      className={cn(
                        "flex-1 bg-transparent outline-none text-sm font-medium",
                        isDark ? "text-white" : "text-slate-800"
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className={cn("text-[10px] font-black uppercase tracking-wider mb-2 block top-4 relative", isDark ? "text-slate-400" : "text-slate-500")}>
                    New Password
                  </label>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all mt-4",
                    isDark ? "bg-slate-800/60 border-white/[0.08] focus-within:border-indigo-500/50" : "bg-white border-slate-200 shadow-sm focus-within:border-indigo-400"
                  )}>
                    <Lock size={17} className={isDark ? "text-slate-500" : "text-slate-400"} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyAndReset()}
                      placeholder="••••••••"
                      className={cn(
                        "flex-1 bg-transparent outline-none text-sm font-medium",
                        isDark ? "text-white" : "text-slate-800"
                      )}
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="p-1">
                      {showPassword
                        ? <EyeOff size={16} className={isDark ? "text-slate-500" : "text-slate-400"} />
                        : <Eye size={16} className={isDark ? "text-slate-500" : "text-slate-400"} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

          <AnimatePresence>
            {view === "forgot-password-code" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-semibold text-emerald-500 text-center py-3 px-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20"
              >
                For this local demo, your test reset code is: <strong>123456</strong>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <motion.button
            onClick={view === "signin" ? handleSignIn : view === "forgot-password" ? handleResetPassword : handleVerifyAndReset}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full py-4 mt-2 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
              boxShadow: "0 6px 24px rgba(99,102,241,0.45)",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <span>{view === "signin" ? "Sign In" : view === "forgot-password" ? "Send Reset Link" : "Set New Password"}</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Divider / Back link */}
        <AnimatePresence mode="wait">
          {view === "signin" ? (
            <motion.div key="signin-bottom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-3 my-6">
                <div className={cn("flex-1 h-px", isDark ? "bg-white/[0.08]" : "bg-slate-200")} />
                <span className={cn("text-xs font-medium", isDark ? "text-slate-600" : "text-slate-400")}>or</span>
                <div className={cn("flex-1 h-px", isDark ? "bg-white/[0.08]" : "bg-slate-200")} />
              </div>

              {/* Demo Account */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                onClick={fillDemo}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all",
                  isDark
                    ? "bg-slate-800/40 border-white/[0.07] text-slate-300 hover:bg-slate-800/60"
                    : "bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50"
                )}
              >
                <Sparkles size={16} className="text-indigo-400" />
                Try Demo Account
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="forgot-bottom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <div className="flex justify-center mt-6">
                 <button
                   onClick={() => { setView("signin"); setError(""); setResetSent(false); }}
                   className={cn("text-sm font-bold", isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800")}
                 >
                   Back to Sign In
                 </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign Up link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex items-center justify-center gap-1.5 mt-8"
        >
          <p className={cn("text-sm", isDark ? "text-slate-500" : "text-slate-400")}>
            Don&apos;t have an account?
          </p>
          <button
            onClick={() => setScreen("signup")}
            className="text-sm font-bold text-indigo-500"
          >
            Create Account
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
