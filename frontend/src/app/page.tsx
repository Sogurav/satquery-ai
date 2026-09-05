"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AnalysisMode } from "@/components/ModeToggle";
import { MapPicker } from "@/components/MapPicker";
import { ImagePreview } from "@/components/ImagePreview";
import {
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  Send,
  HelpCircle,
} from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState<AnalysisMode>("single");
  const [selectedBbox, setSelectedBbox] = useState<[number, number, number, number]>([
    77.1025, 28.55, 77.25, 28.7, // Default Delhi NCR bounds
  ]);
  const [dateT1, setDateT1] = useState<string>("2024-03-01");
  const [dateT2, setDateT2] = useState<string>("2025-03-01");

  // Satellite Imagery Fetch States
  const [isFetchingImage, setIsFetchingImage] = useState(false);
  const [fetchedImages, setFetchedImages] = useState<string[]>([]);
  const [fetchedImageIds, setFetchedImageIds] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Query State (Prepared for Phase 2)
  const [queryText, setQueryText] = useState("");

  const handleFetchImage = async () => {
    setIsFetchingImage(true);
    setFetchError(null);

    const dates = mode === "single" ? [dateT1] : [dateT1, dateT2];

    try {
      const response = await fetch("/api/fetch-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bbox: selectedBbox,
          dates,
          mode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch satellite imagery.");
      }

      setFetchedImages(data.image_urls || []);
      setFetchedImageIds(data.image_ids || []);
    } catch (err: any) {
      setFetchError(
        err.message || "No satellite data available for this area/date — try a different selection."
      );
    } finally {
      setIsFetchingImage(false);
    }
  };

  const handleResetImages = () => {
    setFetchedImages([]);
    setFetchedImageIds([]);
    setFetchError(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19] text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Navigation Bar */}
      <Navbar mode={mode} onModeChange={setMode} />

      {/* Persistent Selection Bar (Shneiderman Rule #8: Reduce short-term memory load) */}
      <div className="border-b border-white/5 bg-slate-950/70 px-4 py-2 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 text-sky-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                BBox:{" "}
                <span className="text-slate-200 font-semibold">
                  [{selectedBbox.map((n) => n.toFixed(3)).join(", ")}]
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-indigo-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {mode === "single" ? (
                  <>
                    Date: <span className="text-slate-200">{dateT1}</span>
                  </>
                ) : (
                  <>
                    T1: <span className="text-slate-200">{dateT1}</span> → T2:{" "}
                    <span className="text-slate-200">{dateT2}</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-400">
              <Layers className="w-3.5 h-3.5" />
              <span>
                Mode: <span className="text-slate-200 uppercase">{mode}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sentinel Hub Sentinel-2 L2A API Connected</span>
          </div>
        </div>
      </div>

      {/* Main Content Workspace Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Map & Preview Column (8 cols) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          {/* Interactive Map Picker */}
          <div className="min-h-[460px] flex flex-col">
            <MapPicker bbox={selectedBbox} onBboxChange={setSelectedBbox} />
          </div>

          {/* Satellite Image Preview (Rendered once images are fetched) */}
          {fetchedImages.length > 0 && (
            <ImagePreview
              imageUrls={fetchedImages}
              mode={mode}
              dates={mode === "single" ? [dateT1] : [dateT1, dateT2]}
              onReset={handleResetImages}
            />
          )}
        </section>

        {/* Right / Controls & Query Panel (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          {/* Controls Panel */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-semibold text-slate-100">
                  Acquisition Settings
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono bg-slate-800/60 px-2 py-0.5 rounded">
                Sentinel-2
              </span>
            </div>

            {/* Date Pickers */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {mode === "single" ? "Acquisition Date" : "Baseline Date (T1)"}
                </label>
                <input
                  type="date"
                  value={dateT1}
                  onChange={(e) => setDateT1(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                />
              </div>

              {mode === "comparison" && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Comparison Date (T2)
                  </label>
                  <input
                    type="date"
                    value={dateT2}
                    onChange={(e) => setDateT2(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Fetch Error Display per Golden Rule #5 */}
            {fetchError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{fetchError}</span>
              </div>
            )}

            {/* Fetch Image Button */}
            <button
              type="button"
              id="fetch-image-btn"
              onClick={handleFetchImage}
              disabled={isFetchingImage}
              className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isFetchingImage
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-600/25 active:scale-[0.99]"
              }`}
            >
              {isFetchingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Requesting Sentinel Hub API...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>
                    {fetchedImages.length > 0 ? "Re-Fetch Imagery" : "Fetch Satellite Imagery"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Natural Language Query Panel (Prepared for Phase 2) */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-100">
                  Natural Language Query
                </h2>
              </div>
              <span className="text-[10px] text-indigo-300 font-mono bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
                RS-LLaVA Pipeline
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ask plain-language questions about land cover, vegetation index, urban growth, or hydrological changes.
            </p>

            <div className="relative">
              <textarea
                rows={3}
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder={
                  mode === "single"
                    ? "e.g. Describe the major land cover types visible in this image."
                    : "e.g. What percentage of vegetation changed between T1 and T2?"
                }
                disabled={fetchedImages.length === 0}
                className={`w-full rounded-xl p-3 text-xs border focus:outline-none transition-all ${
                  fetchedImages.length === 0
                    ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-slate-900/90 border-slate-700/80 text-slate-200 focus:ring-1 focus:ring-sky-500"
                }`}
              />
              {fetchedImages.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-xl backdrop-blur-[1px]">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Fetch satellite imagery first to enable analysis
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              id="ask-query-btn"
              disabled={fetchedImages.length === 0 || !queryText.trim()}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Ask AI (Phase 2 Sync Point)</span>
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
