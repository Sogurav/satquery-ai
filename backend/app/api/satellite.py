import logging
from typing import List, Tuple

import requests
from fastapi import APIRouter, HTTPException, status

from app.db.supabase import supabase
from app.models.satellite import FetchImageRequest, FetchImageResponse
from app.services.sentinel import fetch_satellite_image
from app.services.storage import upload_image_to_storage

logger = logging.getLogger("satquery.api.satellite")

router = APIRouter(prefix="/api", tags=["satellite"])


def _fetch_upload_and_record(
    bbox: List[float],
    requested_date: str,
) -> Tuple[str, str, str]:
    """
    Fetch a satellite image for a requested date, upload it to
    Supabase Storage, and record the actual Sentinel-2 acquisition
    date in the Supabase images table.

    Returns:
        (image_url, image_id, actual_acquisition_date)
    """

    try:
        result = fetch_satellite_image(
            bbox=bbox,
            start_date=requested_date,
            end_date=requested_date,
        )

        image_bytes = result.image_bytes
        actual_acquisition_date = result.acquisition_date

    except ValueError as err:
        logger.warning(
            "No usable imagery found for requested date %s: %s",
            requested_date,
            str(err),
        )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No usable satellite imagery was found for the "
                "requested date or the following 30 days."
            ),
        )

    except requests.HTTPError as err:
        upstream_status = (
            err.response.status_code
            if err.response is not None
            else 502
        )

        logger.error(
            "Upstream satellite provider HTTP error %s for date %s",
            upstream_status,
            requested_date,
        )

        if upstream_status in (401, 403):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "Upstream satellite service authentication failed."
                ),
            )

        if upstream_status == 400:
            error_message = (
                "Upstream satellite service rejected request parameters."
            )

            try:
                err_data = err.response.json()

                if isinstance(err_data, dict) and "error" in err_data:
                    err_info = err_data["error"]

                    if (
                        isinstance(err_info, dict)
                        and "message" in err_info
                    ):
                        error_message = (
                            f"Satellite service error: "
                            f"{err_info['message']}"
                        )

            except Exception:
                pass

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message,
            )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Upstream satellite service returned "
                f"error status {upstream_status}."
            ),
        )

    except requests.Timeout:
        logger.error(
            "Upstream satellite provider request timed out "
            "for date %s",
            requested_date,
        )

        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=(
                "Upstream satellite service request timed out."
            ),
        )

    except requests.RequestException as err:
        logger.error(
            "Network error while connecting to satellite provider: %s",
            type(err).__name__,
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Failed to connect to upstream satellite service."
            ),
        )

    except Exception as err:
        logger.error(
            "Unexpected error in satellite image fetch: %s",
            type(err).__name__,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "An unexpected error occurred while fetching "
                "the satellite image."
            ),
        )

    try:
        image_url = upload_image_to_storage(image_bytes)

    except Exception as err:
        logger.error(
            "Storage upload error: %s",
            type(err).__name__,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Failed to upload satellite image to cloud storage."
            ),
        )

    try:
        record = {
            "bbox": bbox,
            "capture_date": actual_acquisition_date,
            "image_url": image_url,
            "source": "sentinel-hub",
        }

        response = (
            supabase
            .table("images")
            .insert(record)
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                "Database insert did not return created row data"
            )

        image_id = str(response.data[0]["id"])

    except Exception as err:
        logger.error(
            "Database insert error: %s",
            type(err).__name__,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Failed to record image metadata in database."
            ),
        )

    logger.info(
        "Satellite image stored successfully. "
        "Requested date: %s, actual acquisition date: %s",
        requested_date,
        actual_acquisition_date,
    )

    return (
        image_url,
        image_id,
        actual_acquisition_date,
    )


@router.post(
    "/fetch-image",
    response_model=FetchImageResponse,
    summary="Fetch satellite images",
    description=(
        "Fetch Sentinel-2 satellite imagery for a given bounding "
        "box and date(s). Supports single mode (1 date) and "
        "comparison mode (2 dates). The response includes both "
        "the requested dates and the actual Sentinel-2 acquisition "
        "dates returned by the Catalog API."
    ),
    responses={
        200: {
            "description": (
                "Satellite imagery successfully fetched and recorded."
            )
        },
        400: {
            "description": (
                "Invalid bounding box, date format, or upstream request."
            )
        },
        404: {
            "description": (
                "No usable satellite imagery was found."
            )
        },
        422: {
            "description": "Validation error in request payload."
        },
        500: {
            "description": (
                "Storage upload or database insertion failure."
            )
        },
        502: {
            "description": (
                "Upstream satellite service error or authentication failure."
            )
        },
        504: {
            "description": (
                "Upstream satellite service timed out."
            )
        },
    },
)
def fetch_image(
    request: FetchImageRequest,
) -> FetchImageResponse:

    image_urls: List[str] = []
    image_ids: List[str] = []
    requested_dates: List[str] = []
    actual_acquisition_dates: List[str] = []

    for requested_date in request.dates:
        (
            url,
            image_id,
            actual_acquisition_date,
        ) = _fetch_upload_and_record(
            bbox=request.bbox,
            requested_date=requested_date,
        )

        image_urls.append(url)
        image_ids.append(image_id)
        requested_dates.append(requested_date)
        actual_acquisition_dates.append(actual_acquisition_date)

    return FetchImageResponse(
        image_urls=image_urls,
        image_ids=image_ids,
        requested_dates=requested_dates,
        actual_acquisition_dates=actual_acquisition_dates,
    )
