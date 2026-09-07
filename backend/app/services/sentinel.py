import json
import os
from dataclasses import dataclass
from datetime import date, timedelta

import requests
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("SENTINEL_HUB_CLIENT_ID")
CLIENT_SECRET = os.getenv("SENTINEL_HUB_CLIENT_SECRET")

TOKEN_URL = (
    "https://services.sentinel-hub.com/"
    "auth/realms/main/protocol/openid-connect/token"
)

PROCESS_URL = "https://services.sentinel-hub.com/process/v1"

CATALOG_URL = (
    "https://services.sentinel-hub.com/"
    "api/v1/catalog/1.0.0/search"
)


@dataclass
class SatelliteImageResult:
    image_bytes: bytes
    acquisition_date: str


def get_access_token() -> str:
    """Get an OAuth access token from Planet/Sentinel Hub."""

    response = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
        timeout=30,
    )

    response.raise_for_status()

    return response.json()["access_token"]


def _find_scene_date(
    access_token: str,
    bbox: list[float],
    start_date: date,
    end_date: date,
) -> str | None:
    """
    Search Sentinel Hub Catalog for a Sentinel-2 L2A scene.

    Returns the actual acquisition date of the first available
    scene, or None if no scene exists in the requested period.
    """

    catalog_request = {
        "bbox": bbox,
        "datetime": (
            f"{start_date.isoformat()}T00:00:00Z/"
            f"{end_date.isoformat()}T23:59:59Z"
        ),
        "collections": ["sentinel-2-l2a"],
        "limit": 1,
    }

    response = requests.post(
        CATALOG_URL,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json=catalog_request,
        timeout=60,
    )

    response.raise_for_status()

    data = response.json()
    features = data.get("features", [])

    if not features:
        return None

    properties = features[0].get("properties", {})
    acquisition_datetime = properties.get("datetime")

    if not acquisition_datetime:
        return None

    # Sentinel Hub returns an ISO timestamp such as:
    # 2024-03-04T05:21:34Z
    # We only need the acquisition calendar date.
    return acquisition_datetime[:10]


def _fetch_image_for_scene(
    access_token: str,
    bbox: list[float],
    acquisition_date: str,
) -> bytes:
    """Fetch a Sentinel-2 RGB image for one actual acquisition date."""

    request_json = {
        "input": {
            "bounds": {
                "properties": {
                    "crs": (
                        "http://www.opengis.net/def/crs/"
                        "OGC/1.3/CRS84"
                    )
                },
                "bbox": bbox,
            },
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": (
                                f"{acquisition_date}"
                                "T00:00:00Z"
                            ),
                            "to": (
                                f"{acquisition_date}"
                                "T23:59:59Z"
                            ),
                        }
                    },
                }
            ],
        },
        "output": {
            "width": 512,
            "height": 512,
            "responses": [
                {
                    "identifier": "default",
                    "format": {
                        "type": "image/png",
                    },
                }
            ],
        },
    }

    evalscript = """
//VERSION=3

function setup() {
    return {
        input: ["B02", "B03", "B04"],
        output: {
            bands: 3,
            sampleType: "AUTO"
        }
    };
}

function evaluatePixel(sample) {
    return [
        2.5 * sample.B04,
        2.5 * sample.B03,
        2.5 * sample.B02
    ];
}
"""

    response = requests.post(
        PROCESS_URL,
        headers={
            "Authorization": f"Bearer {access_token}",
        },
        files={
            "request": (
                None,
                json.dumps(request_json),
                "application/json",
            ),
            "evalscript": (
                None,
                evalscript,
                "text/plain",
            ),
        },
        timeout=120,
    )

    response.raise_for_status()

    return response.content


def _is_usable_image(image: bytes) -> bool:
    """
    Check whether Sentinel Hub returned a usable image.

    Very small PNG responses can occur when no usable imagery
    is available for the selected scene/date.
    """

    return len(image) >= 5000


def fetch_satellite_image(
    bbox: list[float],
    start_date: str,
    end_date: str,
) -> SatelliteImageResult:
    """
    Find and fetch a real Sentinel-2 acquisition.

    The requested date/range is searched first.

    If no scene is available for a single requested day,
    the following 30 days are searched.

    The returned acquisition_date is always the actual
    Sentinel-2 scene date found by the Catalog API.
    """

    access_token = get_access_token()

    requested_start = date.fromisoformat(start_date)
    requested_end = date.fromisoformat(end_date)

    search_ranges = [
        (requested_start, requested_end)
    ]

    # For a single requested day, search the following
    # 30 days if no scene exists on the exact day.
    if requested_start == requested_end:
        fallback_end = requested_start + timedelta(days=30)
        search_ranges.append(
            (requested_start, fallback_end)
        )

    for search_start, search_end in search_ranges:
        scene_date = _find_scene_date(
            access_token=access_token,
            bbox=bbox,
            start_date=search_start,
            end_date=search_end,
        )

        if not scene_date:
            continue

        image = _fetch_image_for_scene(
            access_token=access_token,
            bbox=bbox,
            acquisition_date=scene_date,
        )

        if _is_usable_image(image):
            return SatelliteImageResult(
                image_bytes=image,
                acquisition_date=scene_date,
            )

    raise ValueError(
        "No usable Sentinel-2 imagery was found for the "
        "requested date range or the following 30 days."
    )