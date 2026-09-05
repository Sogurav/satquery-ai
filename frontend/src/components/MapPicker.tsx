"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Compass, Sparkles } from "lucide-react";

// Dynamic import with SSR disabled to prevent Leaflet window errors in Next.js
const MapLeaflet = dynamic(() => import("./MapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] flex flex-col items-center justify-center bg-slate-950/60 text-slate-400 gap-3">
      <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-mono">Initializing Leaflet Geospatial Engine...</span>
    </div>
  ),
});

interface MapPickerProps {
  bbox: [number, number, number, number];
  onBboxChange: (bbox: [number, number, number, number]) => void;
}

// Preset regions of interest for fast testing / judging (Golden Rule #2)
const PRESET_LOCATIONS: {
  name: string;
  tag: string;
  bbox: [number, number, number, number];
}[] = [
  {
    name: "Delhi NCR",
    tag: "Urban Expansion",
    bbox: [77.1025, 28.55, 77.25, 28.7],
  },
  {
    name: "Bengaluru",
    tag: "Lake & Green Cover",
    bbox: [77.58, 12.91, 77.72, 13.04],
  },
  {
    name: "Sundarbans",
    tag: "Mangrove Delta",
    bbox: [88.75, 21.8, 89.15, 22.2],
  },
  {
    name: "Joshimath",
    tag: "Terrain Subsidence",
    bbox: [79.52, 30.52, 79.62, 30.6],
  },
];

export function MapPicker({ bbox, onBboxChange }: MapPickerProps) {
  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden glass-panel border border-white/10">
      {/* Top Header & Presets Bar */}
      <div className="p-3.5 border-b border-white/10 bg-slate-900/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-200">
              Area of Interest (AOI)
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Sentinel-2 L2A Processing Bounds
            </p>
          </div>
        </div>

        {/* Preset Location Quick-Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-mono text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" /> Presets:
          </span>
          {PRESET_LOCATIONS.map((loc) => {
            const isSelected =
              Math.abs(bbox[0] - loc.bbox[0]) < 0.01 &&
              Math.abs(bbox[1] - loc.bbox[1]) < 0.01;
            return (
              <button
                key={loc.name}
                type="button"
                onClick={() => onBboxChange(loc.bbox)}
                className={`px-2.5 py-1 text-[11px] rounded-lg transition-all border cursor-pointer ${
                  isSelected
                    ? "bg-sky-600/90 text-white border-sky-400 shadow-sm"
                    : "bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span>{loc.name}</span>
                <span className="text-[9px] text-slate-400 ml-1">({loc.tag})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Leaflet Map Area */}
      <div className="relative flex-1 min-h-[460px] w-full bg-slate-950">
        <MapLeaflet bbox={bbox} onBboxChange={onBboxChange} />
      </div>

      {/* Bottom Coordinate Bar */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-white/5 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-sky-400" />
          <span>Coordinates [minLon, minLat, maxLon, maxLat]:</span>
          <span className="text-sky-300 font-semibold">
            [{bbox.map((n) => n.toFixed(4)).join(", ")}]
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          WGS84 EPSG:4326 Datum
        </div>
      </div>
    </div>
  );
}
