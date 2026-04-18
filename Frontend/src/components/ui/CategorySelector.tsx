"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, Category } from "@/context/AppContext";
import { BottomSheet } from "./BottomSheet";
import { Plus, Check, ChevronRight, Palette, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySelectorProps {
  type: "income" | "expense";
  selectedId?: string;
  onSelect: (categoryId: string) => void;
  isDark: boolean;
}

const PRESET_ICONS = ["💰", "💳", "👔", "💻", "📈", "✨", "🍔", "🚗", "🛍️", "🏠", "💡", "🎬", "❤️", "📚", "✈️", "🎁", "🛡️", "🎮", "🐾", "💪"];
const PRESET_COLORS = [
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#0EA5E9", // Sky
  "#14B8A6", // Teal
  "#F43F5E", // Rose
  "#64748B", // Slate
];

export function CategorySelector({ type, selectedId, onSelect, isDark }: CategorySelectorProps) {
  const { categories, addCategory } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Creation state
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("✨");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const filteredCategories = categories.filter(c => c.type === type);
  const selectedCategory = categories.find(c => c.id === selectedId);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newCat: Omit<Category, "id"> = {
      name: newName.trim(),
      type: type,
      icon: newIcon,
      color: newColor,
    };
    addCategory(newCat);
    setIsCreating(false);
    setNewName("");
    // We don't auto-select here because the ID is generated async, 
    // but the AppContext will handle the state update.
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98]",
          isDark 
            ? "bg-slate-900/50 border-white/10 text-white" 
            : "bg-white border-slate-100 text-slate-900",
          !selectedCategory && (isDark ? "text-slate-500" : "text-slate-400")
        )}
      >
        <div className="flex items-center gap-3">
          {selectedCategory ? (
            <>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg"
                style={{ backgroundColor: `${selectedCategory.color}20`, color: selectedCategory.color }}
              >
                {selectedCategory.icon}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{selectedCategory.name}</p>
                <p className={cn("text-[10px] uppercase tracking-wider opacity-60 font-medium")}>{type}</p>
              </div>
            </>
          ) : (
            <>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border-2 border-dashed", isDark ? "border-white/10" : "border-slate-100")}>
                <Ghost size={18} className="opacity-20" />
              </div>
              <p className="text-sm font-medium">Select Category</p>
            </>
          )}
        </div>
        <ChevronRight size={18} className="opacity-40" />
      </button>

      <BottomSheet
        open={isOpen}
        onClose={() => { setIsOpen(false); setIsCreating(false); }}
        isDark={isDark}
        title={isCreating ? "New Category" : `Select ${type === "income" ? "Source" : "Category"}`}
      >
        <div className="p-5">
          <AnimatePresence mode="wait">
            {!isCreating ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 gap-3"
              >
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { onSelect(cat.id); setIsOpen(false); }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left relative overflow-hidden group",
                      selectedId === cat.id 
                        ? (isDark ? "bg-white/5 border-white/20" : "bg-slate-50 border-slate-200")
                        : (isDark ? "bg-slate-800/40 border-transparent" : "bg-slate-50/50 border-transparent")
                    )}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 z-10"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      {cat.icon}
                    </div>
                    <span className={cn("text-sm font-bold z-10", isDark ? "text-white" : "text-slate-900")}>
                      {cat.name}
                    </span>
                    {selectedId === cat.id && (
                      <Check size={14} className="absolute top-2 right-2 text-indigo-500" />
                    )}
                    <motion.div 
                      className="absolute inset-0 opacity-0 group-active:opacity-10 pointer-events-none"
                      style={{ backgroundColor: cat.color }}
                    />
                  </button>
                ))}
                
                <button
                  onClick={() => setIsCreating(true)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed transition-all text-left",
                    isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-slate-500/10 text-slate-500")}>
                    <Plus size={20} />
                  </div>
                  <span className={cn("text-sm font-bold", isDark ? "text-slate-400" : "text-slate-500")}>Add New</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-6"
              >
                {/* Preview */}
                <div className="flex justify-center">
                  <div 
                    className="w-20 h-20 rounded-[24px] flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/20"
                    style={{ backgroundColor: `${newColor}20`, color: newColor, border: `1px solid ${newColor}40` }}
                  >
                    {newIcon}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-bold uppercase tracking-wider ml-1", isDark ? "text-slate-500" : "text-slate-400")}>
                      Category Name
                    </label>
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Sub Salary, Gaming"
                      className={cn(
                        "w-full p-4 rounded-2xl border bg-transparent font-bold outline-none ring-offset-2 ring-offset-transparent focus:ring-2 focus:ring-indigo-500 transition-all",
                        isDark ? "border-white/10 text-white" : "border-slate-200 text-slate-900"
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-bold uppercase tracking-wider ml-1", isDark ? "text-slate-500" : "text-slate-400")}>
                      Pick an Icon
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_ICONS.map(icon => (
                        <button
                          key={icon}
                          onClick={() => setNewIcon(icon)}
                          className={cn(
                            "h-12 rounded-xl flex items-center justify-center text-xl transition-all",
                            newIcon === icon ? (isDark ? "bg-white/10 scale-110" : "bg-slate-100 scale-110") : "hover:bg-slate-500/5"
                          )}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-bold uppercase tracking-wider ml-1", isDark ? "text-slate-500" : "text-slate-400")}>
                      Pick a Color
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewColor(color)}
                          className={cn(
                            "h-10 rounded-xl flex items-center justify-center transition-all overflow-hidden",
                            newColor === color ? "scale-110 ring-2 ring-offset-2 ring-indigo-500" : "hover:opacity-80"
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {newColor === color && <Check size={16} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className={cn(
                    "w-full p-4 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50",
                    "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                  )}
                >
                  Create Category
                </button>
                
                <button
                  onClick={() => setIsCreating(false)}
                  className={cn("text-sm font-bold opacity-60", isDark ? "text-white" : "text-slate-900")}
                >
                  Go Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BottomSheet>
    </>
  );
}
