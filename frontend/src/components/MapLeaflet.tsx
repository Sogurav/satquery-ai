"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";

export interface MapLeafletProps {
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  onBboxChange: (bbox: [number, number, number, number]) => void;
}

export default function MapLeaflet({ bbox, onBboxChange }: MapLeafletProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const [activeTile, setActiveTile] = useState<"satellite" | "dark">("satellite");
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Convert bbox [minLon, minLat, maxLon, maxLat] to Leaflet LatLngBoundsExpression
  const getBounds = (b: [number, number, number, number]): L.LatLngBoundsExpression => [
    [b[1], b[0]], // [southWestLat, southWestLon]
    [b[3], b[2]], // [northEastLat, northEastLon]
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map centered on bounding box center
    const centerLat = (bbox[1] + bbox[3]) / 2;
    const centerLon = (bbox[0] + bbox[2]) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLon],
      zoom: 12,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Default tile layer: Esri World Imagery (Satellite)
    const esriSatellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        maxZoom: 18,
      }
    );

    esriSatellite.addTo(map);
    tileLayerRef.current = esriSatellite;

    // Create initial Bounding Box Rectangle
    const rectangle = L.rectangle(getBounds(bbox), {
      color: "#0284C7", // Sky blue
      weight: 2,
      fillColor: "#38BDF8",
      fillOpacity: 0.25,
      dashArray: "4, 6",
    }).addTo(map);

    rectangleRef.current = rectangle;

    // Click on map to re-center bounding box to clicked point
    map.on("click", (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const width = 0.12; // Approx 12-14km AOI
      const height = 0.10;

      const newBbox: [number, number, number, number] = [
        parseFloat((lng - width / 2).toFixed(4)),
        parseFloat((lat - height / 2).toFixed(4)),
        parseFloat((lng + width / 2).toFixed(4)),
        parseFloat((lat + height / 2).toFixed(4)),
      ];

      rectangle.setBounds(getBounds(newBbox));
      onBboxChange(newBbox);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update rectangle when external bbox changes (e.g. from preset buttons)
  useEffect(() => {
    if (rectangleRef.current && mapInstanceRef.current) {
      const bounds = getBounds(bbox);
      rectangleRef.current.setBounds(bounds);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [bbox]);

  // Handle tile switch (Satellite vs Dark Matter)
  const switchTiles = (type: "satellite" | "dark") => {
    if (!mapInstanceRef.current) return;
    setActiveTile(type);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    if (type === "satellite") {
      tileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Esri World Imagery" }
      ).addTo(mapInstanceRef.current);
    } else {
      tileLayerRef.current = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { attribution: "&copy; OpenStreetMap &copy; CARTO" }
      ).addTo(mapInstanceRef.current);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px]">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px] z-0" />

      {/* Floating Tile Layer Switcher */}
      <div className="absolute top-3 right-3 z-10 flex items-center bg-slate-950/85 backdrop-blur-md rounded-lg p-1 border border-slate-700/70 shadow-lg text-xs">
        <button
          type="button"
          onClick={() => switchTiles("satellite")}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            activeTile === "satellite"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Satellite
        </button>
        <button
          type="button"
          onClick={() => switchTiles("dark")}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            activeTile === "dark"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Carto Dark
        </button>
      </div>

      {/* Floating Tip Banner */}
      <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 backdrop-blur-md text-[11px] text-slate-300 shadow-lg flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
        <span>Click anywhere on the map to relocate the Sentinel-2 Bounding Box</span>
      </div>
    </div>
  );
}
