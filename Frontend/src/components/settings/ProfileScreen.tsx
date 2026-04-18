"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { GlassCard } from "@/components/ui/Cards";
import {
  User, Mail, Phone, FileText, Lock, Eye, EyeOff,
  ChevronLeft, ChevronRight, Check, Shield, Camera,
  Trash2, AlertTriangle,
} from "lucide-react";

const AVATAR_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444",
  "#F59E0B", "#10B981", "#0EA5E9", "#14B8A6",
];

export function ProfileScreen() {
  const { isDark, user, updateProfile, signOut, setScreen, isPremium } = useApp();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarColor, setAvatarColor] = useState(user?.avatar || "#6366F1");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const initials = name.trim()
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  function handleSave() {
    updateProfile({ name: name.trim(), phone: phone.trim(), bio: bio.trim(), avatar: avatarColor });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2200);
  }

  function handleChangePw() {
    setPwError("");
    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields are required"); return; }
    if (newPw.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    setPwSuccess(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => { setPwSuccess(false); setShowChangePw(false); }, 2000);
  }

  const sectionLabel = (text: string) => (
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">{text}</p>
  );

  const divider = (
    <div className={cn("mx-5 h-px", isDark ? "bg-white/[0.05]" : "bg-slate-100")} />
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3 }}
      className={cn("min-h-screen pb-32", isDark ? "bg-[#0B1120]" : "bg-[#F8FAFC]")}
    >
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setScreen("settings")}
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0",
            isDark ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-700"
          )}
        >
          <ChevronLeft size={20} />
        </motion.button>
        <div className="flex-1">
          <h1 className={cn("text-[22px] font-bold leading-tight", isDark ? "text-white" : "text-slate-900")}>
            Profile
          </h1>
          <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
            Manage your account
          </p>
        </div>
        {isPremium && (
          <div className="bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-400/30">
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">Premium</span>
          </div>
        )}
      </div>

      {/* Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center py-6 px-5"
      >
        <div className="relative">
          <div
            className="w-24 h-24 rounded-[24px] flex items-center justify-center text-3xl font-black text-white shadow-2xl"
            style={{ backgroundColor: avatarColor, boxShadow: `0 12px 40px ${avatarColor}60` }}
          >
            {initials}
          </div>
          <button className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-[10px] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Camera size={14} className="text-white" />
          </button>
        </div>

        <p className={cn("font-black text-lg mt-4 leading-tight", isDark ? "text-white" : "text-slate-900")}>
          {user?.name || "Your Name"}
        </p>
        <p className={cn("text-sm", isDark ? "text-slate-500" : "text-slate-400")}>{user?.email}</p>

        {/* Color picker */}
        <div className="flex gap-2.5 mt-4">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setAvatarColor(color)}
              className="w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-95"
              style={{
                backgroundColor: color,
                outline: avatarColor === color ? `3px solid ${color}` : "none",
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Personal Info */}
      <div className="px-5 mb-6">
        {sectionLabel("Personal Info")}
        <GlassCard isDark={isDark} className="overflow-hidden" animate={false}>
          {/* Name */}
          <div className={cn("flex items-center gap-3.5 px-5 py-4", isDark ? "border-b border-white/[0.05]" : "border-b border-slate-100")}>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-indigo-500" />
            </div>
            <div className="flex-1">
              <p className={cn("text-[10px] font-bold uppercase mb-0.5", isDark ? "text-slate-500" : "text-slate-400")}>Full Name</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(
                  "bg-transparent text-sm font-semibold outline-none w-full placeholder:font-normal",
                  isDark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"
                )}
                placeholder="Enter your name"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className={cn("flex items-center gap-3.5 px-5 py-4", isDark ? "border-b border-white/[0.05]" : "border-b border-slate-100")}>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-sky-500" />
            </div>
            <div className="flex-1">
              <p className={cn("text-[10px] font-bold uppercase mb-0.5", isDark ? "text-slate-500" : "text-slate-400")}>Email Address</p>
              <p className={cn("text-sm font-semibold", isDark ? "text-slate-300" : "text-slate-700")}>{user?.email}</p>
            </div>
            <span className={cn("text-[9px] font-black uppercase px-2 py-1 rounded-lg flex-shrink-0", isDark ? "bg-emerald-500/10 text-emerald-500" : "bg-emerald-50 text-emerald-600")}>
              Verified
            </span>
          </div>

          {/* Phone */}
          <div className={cn("flex items-center gap-3.5 px-5 py-4", isDark ? "border-b border-white/[0.05]" : "border-b border-slate-100")}>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className={cn("text-[10px] font-bold uppercase mb-0.5", isDark ? "text-slate-500" : "text-slate-400")}>Phone Number</p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={cn(
                  "bg-transparent text-sm font-semibold outline-none w-full placeholder:font-normal",
                  isDark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"
                )}
                placeholder="Add phone number"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="flex items-start gap-3.5 px-5 py-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText size={16} className="text-amber-500" />
            </div>
            <div className="flex-1">
              <p className={cn("text-[10px] font-bold uppercase mb-0.5", isDark ? "text-slate-500" : "text-slate-400")}>About Me</p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className={cn(
                  "bg-transparent text-sm font-semibold outline-none w-full resize-none placeholder:font-normal",
                  isDark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"
                )}
                placeholder="Tell something about yourself..."
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Security */}
      <div className="px-5 mb-6">
        {sectionLabel("Security")}
        <GlassCard isDark={isDark} className="overflow-hidden" animate={false}>
          <button
            onClick={() => setShowChangePw(!showChangePw)}
            className={cn(
              "w-full flex items-center gap-3.5 px-5 py-4 transition-colors",
              isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/80"
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
              <Lock size={16} className="text-rose-500" />
            </div>
            <p className={cn("flex-1 text-left text-sm font-semibold", isDark ? "text-white" : "text-slate-800")}>
              Change Password
            </p>
            <ChevronRight
              size={16}
              className={cn(
                "flex-shrink-0 transition-transform duration-200",
                isDark ? "text-slate-600" : "text-slate-300",
                showChangePw && "rotate-90"
              )}
            />
          </button>

          <AnimatePresence>
            {showChangePw && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className={cn("px-5 pb-5 pt-2 space-y-3 border-t", isDark ? "border-white/[0.05]" : "border-slate-100")}>
                  {(["Current Password", "New Password", "Confirm New Password"] as const).map((label, i) => (
                    <div key={label}>
                      <p className={cn("text-[10px] font-bold uppercase mb-1.5", isDark ? "text-slate-500" : "text-slate-400")}>{label}</p>
                      <div className={cn(
                        "flex items-center gap-2 px-3.5 py-3 rounded-xl border",
                        isDark ? "bg-slate-800/60 border-white/[0.06]" : "bg-slate-50 border-slate-200"
                      )}>
                        <input
                          type={showPw ? "text" : "password"}
                          value={i === 0 ? currentPw : i === 1 ? newPw : confirmPw}
                          onChange={(e) => {
                            if (i === 0) setCurrentPw(e.target.value);
                            else if (i === 1) setNewPw(e.target.value);
                            else setConfirmPw(e.target.value);
                          }}
                          placeholder="••••••••"
                          className={cn(
                            "flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal",
                            isDark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"
                          )}
                        />
                        {i === 2 && (
                          <button onClick={() => setShowPw(!showPw)} className="p-0.5">
                            {showPw
                              ? <EyeOff size={14} className={isDark ? "text-slate-500" : "text-slate-400"} />
                              : <Eye size={14} className={isDark ? "text-slate-500" : "text-slate-400"} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <AnimatePresence>
                    {pwError && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-xs text-rose-500 font-semibold">
                        {pwError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleChangePw}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold text-sm text-white transition-all",
                      pwSuccess
                        ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                        : "bg-indigo-600 shadow-lg shadow-indigo-500/30"
                    )}
                  >
                    {pwSuccess ? "✓ Password Updated!" : "Update Password"}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Account Info */}
      <div className="px-5 mb-6">
        {sectionLabel("Account")}
        <GlassCard isDark={isDark} className="p-4" animate={false}>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-500 flex-shrink-0" />
            <p className={cn("text-xs font-semibold", isDark ? "text-slate-400" : "text-slate-500")}>
              Member since {user?.joinedDate || "—"}
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Danger Zone */}
      <div className="px-5 mb-8">
        {sectionLabel("Danger Zone")}
        <GlassCard isDark={isDark} className="overflow-hidden" animate={false}>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={cn(
              "w-full flex items-center gap-3.5 px-5 py-4 transition-colors",
              isDark ? "hover:bg-rose-500/5" : "hover:bg-rose-50/80"
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
              <Trash2 size={16} className="text-rose-500" />
            </div>
            <p className="flex-1 text-left text-sm font-semibold text-rose-500">Delete Account</p>
            <ChevronRight size={16} className="text-rose-400" />
          </button>
        </GlassCard>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "w-full max-w-[400px] rounded-[28px] p-6 border",
                isDark ? "bg-[#0F172A] border-white/10" : "bg-white border-slate-100"
              )}
            >
              <div className="flex flex-col items-center text-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-rose-500" />
                </div>
                <div>
                  <p className={cn("font-black text-lg", isDark ? "text-white" : "text-slate-900")}>Delete Account?</p>
                  <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
                    This action is permanent and cannot be undone. All your data will be lost.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={cn("flex-1 py-3.5 rounded-2xl font-bold text-sm", isDark ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700")}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { signOut(); setShowDeleteConfirm(false); }}
                  className="flex-1 py-3.5 rounded-2xl bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-500/30"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-6 max-w-[430px] mx-auto"
        style={{
          background: isDark
            ? "linear-gradient(to top, #0B1120 55%, transparent)"
            : "linear-gradient(to top, #F8FAFC 55%, transparent)",
        }}
      >
        <motion.button
          onClick={handleSave}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
          style={{
            background: savedSuccess
              ? "linear-gradient(135deg, #10B981, #34D399)"
              : "linear-gradient(135deg, #4F46E5, #6366F1)",
            boxShadow: savedSuccess
              ? "0 6px 24px rgba(16,185,129,0.40)"
              : "0 6px 24px rgba(99,102,241,0.45)",
          }}
        >
          {savedSuccess ? (
            <motion.div key="saved" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
              <Check size={18} strokeWidth={2.5} />
              Profile Saved!
            </motion.div>
          ) : (
            "Save Changes"
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
