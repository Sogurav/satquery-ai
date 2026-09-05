"use client";

import React from "react";
import { Layers, Calendar, CheckCircle2, RefreshCw } from "lucide-react";

interface ImagePreviewProps {
  imageUrls: string[];
  mode: "single" | "comparison";
  dates: string[];
  onReset: () => void;
}

export function ImagePreview({ imageUrls, mode, dates, onReset }: ImagePreviewProps) {
  if (!imageUrls || imageUrls.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
            Fetched Satellite Imagery (Sentinel-2 L2A)
          </h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Change Selection</span>
        </button>
      </div>

      {mode === "single" || imageUrls.length === 1 ? (
        // Single Image Mode
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 group">
          <img
            src={imageUrls[0]}
            alt="Sentinel-2 Satellite Observation"
            className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-slate-950/80 backdrop-blur-md text-[11px] font-mono text-slate-200 border border-white/10 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-sky-400" />
            <span>Date: {dates[0] || "Acquired"}</span>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-slate-300">
            10m Ground Resolution
          </div>
        </div>
      ) : (
        // Comparison Mode (Side-by-Side)
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* T1 Baseline Image */}
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 group">
            <img
              src={imageUrls[0]}
              alt="T1 Satellite Baseline"
              className="w-full h-56 object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-2 left-2 px-2 py-1 rounded bg-slate-950/80 backdrop-blur-md text-[11px] font-mono text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-sky-400" />
              <span>T1 (Baseline): {dates[0]}</span>
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-slate-300">
              Sentinel-2 L2A
            </div>
          </div>

          {/* T2 Observation Image */}
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 group">
            <img
              src={imageUrls[1]}
              alt="T2 Satellite Observation"
              className="w-full h-56 object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-2 left-2 px-2 py-1 rounded bg-slate-950/80 backdrop-blur-md text-[11px] font-mono text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-indigo-400" />
              <span>T2 (Comparison): {dates[1]}</span>
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-slate-300">
              Sentinel-2 L2A
            </div>
          </div>
        </div>
      )}

      {/* Verification metadata bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-sky-400" />
          <span>True Color (RGB B04, B03, B02)</span>
        </span>
        <span className="text-emerald-400">Atmospherically Corrected (BOA)</span>
      </div>
    </div>
  );
}
