import { NextRequest, NextResponse } from "next/server";

// Sample high-res Earth Observation images for mock responses
const SATELLITE_SAMPLES = {
  t1: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80", // Verdant lush landscape
  t2: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80", // Drier / developed land landscape
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bbox, dates, mode } = body;

    // Server-side validation per TRD Section 6 Item #7
    if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
      return NextResponse.json(
        { error: "Invalid bounding box. Expected [minLon, minLat, maxLon, maxLat]." },
        { status: 400 }
      );
    }

    const [minLon, minLat, maxLon, maxLat] = bbox;
    if (
      typeof minLon !== "number" ||
      typeof minLat !== "number" ||
      typeof maxLon !== "number" ||
      typeof maxLat !== "number" ||
      minLon < -180 ||
      maxLon > 180 ||
      minLat < -90 ||
      maxLat > 90 ||
      minLon >= maxLon ||
      minLat >= maxLat
    ) {
      return NextResponse.json(
        { error: "Bounding box coordinates out of valid geographic ranges." },
        { status: 400 }
      );
    }

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: "At least one acquisition date must be provided." },
        { status: 400 }
      );
    }

    // Simulate Sentinel Hub Processing API latency (~1 second)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Response structure per APP_FLOW.md Section 3
    if (mode === "comparison" && dates.length >= 2) {
      return NextResponse.json({
        success: true,
        image_urls: [SATELLITE_SAMPLES.t1, SATELLITE_SAMPLES.t2],
        image_ids: [`sentinel2_${Date.now()}_t1`, `sentinel2_${Date.now()}_t2`],
        metadata: {
          satellite: "Sentinel-2 L2A (Copernicus)",
          cloud_coverage: "< 5%",
          resolution_meters: 10,
          dates: dates,
          bbox: bbox,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        image_urls: [SATELLITE_SAMPLES.t1],
        image_ids: [`sentinel2_${Date.now()}_single`],
        metadata: {
          satellite: "Sentinel-2 L2A (Copernicus)",
          cloud_coverage: "< 5%",
          resolution_meters: 10,
          dates: [dates[0]],
          bbox: bbox,
        },
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal error processing satellite imagery request." },
      { status: 500 }
    );
  }
}
