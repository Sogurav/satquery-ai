"use client";

import React, { useState } from "react";
import { ModeToggle, AnalysisMode } from "./ModeToggle";
import { Satellite, Globe, FileDown, Lock, ShieldCheck } from "lucide-react";

interface NavbarProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
}

export function Navbar({ mode, onModeChange }: NavbarProps) {
  const [showReportTooltip, setShowReportTooltip] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Project Metadata */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-600/30 border border-sky-400/30">
              <Satellite className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  SatQuery<span className="text-sky-400"> AI</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-800 rounded">
                  v0.1-proto
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                ISRO • SIH26167
              </p>
            </div>
          </div>

          {/* Mobile Right Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 text-xs"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Mode Toggle Segment */}
        <div className="flex justify-center w-full md:w-auto">
          <ModeToggle mode={mode} onModeChange={onModeChange} />
        </div>

        {/* Right Actions & Locked Vision Elements */}
        <div className="hidden md:flex items-center gap-3">
          {/* Multilingual Selector (Locked Feature per UI_UX_DESIGN.md Section 8) */}
          <div className="relative">
            <button
              type="button"
              id="language-selector-btn"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>EN</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-lg bg-slate-950 border border-slate-700/80 shadow-2xl p-1.5 text-xs z-50">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Language
                </div>
                <div className="px-2 py-1.5 rounded bg-sky-950/60 text-sky-300 font-medium flex items-center justify-between">
                  <span>English</span>
                  <span className="text-[10px] text-sky-400">Active</span>
                </div>
                <div className="px-2 py-1.5 rounded text-slate-500 flex items-center justify-between opacity-60 cursor-not-allowed">
                  <span>हिन्दी (Hindi)</span>
                  <Lock className="w-3 h-3 text-amber-400" />
                </div>
                <div className="px-2 py-1.5 rounded text-slate-500 flex items-center justify-between opacity-60 cursor-not-allowed">
                  <span>தமிழ் (Tamil)</span>
                  <Lock className="w-3 h-3 text-amber-400" />
                </div>
              </div>
            )}
          </div>

          {/* Export Report (Locked Feature per UI_UX_DESIGN.md Section 8) */}
          <div className="relative">
            <button
              type="button"
              id="export-report-btn"
              disabled
              onMouseEnter={() => setShowReportTooltip(true)}
              onMouseLeave={() => setShowReportTooltip(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50 text-xs font-medium text-slate-500 opacity-60 cursor-not-allowed select-none"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export PDF</span>
              <Lock className="w-3 h-3 text-amber-400 ml-0.5" />
            </button>

            {showReportTooltip && (
              <div className="absolute right-0 top-full mt-2 z-50 w-60 p-2.5 text-xs rounded-lg bg-slate-950/95 border border-slate-700 shadow-2xl text-slate-200 backdrop-blur-md">
                <div className="flex items-center gap-1 font-semibold text-sky-400 mb-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Locked Feature</span>
                </div>
                <p className="text-slate-300 leading-snug">
                  Automated dossier and PDF export available in production version.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
