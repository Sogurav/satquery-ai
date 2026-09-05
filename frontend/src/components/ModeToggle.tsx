"use client";

import React, { useState } from "react";
import { Image as ImageIcon, GitCompare, Lock, Layers } from "lucide-react";

export type AnalysisMode = "single" | "comparison";

interface ModeToggleProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex items-center p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 shadow-lg backdrop-blur-md">
      {/* Single Image Mode */}
      <button
        type="button"
        id="mode-toggle-single"
        onClick={() => onModeChange("single")}
        className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
          mode === "single"
            ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
            : "text-slate-300 hover:text-white hover:bg-slate-800/60"
        }`}
      >
        <ImageIcon className="w-4 h-4" />
        <span>Single Image</span>
      </button>

      {/* Comparison Mode */}
      <button
        type="button"
        id="mode-toggle-comparison"
        onClick={() => onModeChange("comparison")}
        className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
          mode === "comparison"
            ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
            : "text-slate-300 hover:text-white hover:bg-slate-800/60"
        }`}
      >
        <GitCompare className="w-4 h-4" />
        <span>Compare Time Periods</span>
      </button>

      {/* Locked Future Feature: Optical + SAR Fusion (per UI_UX_DESIGN.md Section 8) */}
      <div className="relative">
        <button
          type="button"
          id="mode-toggle-sar-fusion"
          disabled
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs md:text-sm font-medium rounded-lg text-slate-500 opacity-60 cursor-not-allowed bg-transparent hover:bg-slate-800/30 transition-all select-none"
        >
          <Layers className="w-4 h-4 text-slate-500" />
          <span>Optical + SAR Fusion</span>
          <Lock className="w-3 h-3 text-amber-400 ml-0.5" />
        </button>

        {/* Informational Roadmap Tooltip */}
        {showTooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-50 w-72 p-3 text-xs rounded-lg bg-slate-950/95 border border-slate-700 shadow-2xl text-slate-200 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-1.5 font-semibold text-sky-400 mb-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Version Roadmap</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Optical + SAR Fusion combines radar (SAR) and optical imagery for deeper analysis, penetrating cloud cover and night conditions.
            </p>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 border-t border-l border-slate-700 rotate-45" />
          </div>
        )}
      </div>
    </div>
  );
}
