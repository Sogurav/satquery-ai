from datetime import date, datetime
import re
from typing import List, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


# Backend safety limits for requested areas.
# The frontend may use a smaller 1:1 selection box.
MAX_BBOX_WIDTH_DEGREES = 0.5
MAX_BBOX_HEIGHT_DEGREES = 0.5


class FetchImageRequest(BaseModel):
    bbox: List[float] = Field(
        ...,
        description=(
            "Bounding box coordinates in WGS84: "
            "[min_lon, min_lat, max_lon, max_lat]"
        ),
        examples=[[72.82, 18.92, 72.84, 18.94]],
    )

    dates: List[str] = Field(
        ...,
        description=(
            "List of date strings (YYYY-MM-DD). Single mode requires exactly "
            "1 date, comparison mode requires exactly 2 dates."
        ),
        examples=[["2026-01-01"]],
    )

    mode: Literal["single", "comparison"] = Field(
        default="single",
        description="Image fetching mode. Must be 'single' or 'comparison'.",
        examples=["single"],
    )

    @field_validator("bbox")
    @classmethod
    def validate_bbox(cls, v: List[float]) -> List[float]:
        if not isinstance(v, list) or len(v) != 4:
            raise ValueError(
                "bbox must contain exactly 4 numeric coordinates: "
                "[min_lon, min_lat, max_lon, max_lat]"
            )

        for i, coord in enumerate(v):
            if isinstance(coord, bool) or not isinstance(coord, (int, float)):
                raise ValueError(
                    f"bbox coordinate at index {i} must be a number "
                    "(float or int)"
                )

        min_lon, min_lat, max_lon, max_lat = v

        if not (-180.0 <= min_lon <= 180.0):
            raise ValueError(
                f"min_lon ({min_lon}) must be between -180 and 180 degrees"
            )

        if not (-180.0 <= max_lon <= 180.0):
            raise ValueError(
                f"max_lon ({max_lon}) must be between -180 and 180 degrees"
            )

        if not (-90.0 <= min_lat <= 90.0):
            raise ValueError(
                f"min_lat ({min_lat}) must be between -90 and 90 degrees"
            )

        if not (-90.0 <= max_lat <= 90.0):
            raise ValueError(
                f"max_lat ({max_lat}) must be between -90 and 90 degrees"
            )

        if min_lon >= max_lon:
            raise ValueError(
                f"min_lon ({min_lon}) must be strictly less than max_lon ({max_lon})"
            )

        if min_lat >= max_lat:
            raise ValueError(
                f"min_lat ({min_lat}) must be strictly less than max_lat ({max_lat})"
            )

        bbox_width = max_lon - min_lon
        bbox_height = max_lat - min_lat

        if bbox_width > MAX_BBOX_WIDTH_DEGREES:
            raise ValueError(
                f"Bounding box is too wide. Maximum allowed width is "
                f"{MAX_BBOX_WIDTH_DEGREES} degrees."
            )

        if bbox_height > MAX_BBOX_HEIGHT_DEGREES:
            raise ValueError(
                f"Bounding box is too tall. Maximum allowed height is "
                f"{MAX_BBOX_HEIGHT_DEGREES} degrees."
            )

        return [float(c) for c in v]

    @field_validator("dates")
    @classmethod
    def validate_dates(cls, v: List[str]) -> List[str]:
        if not isinstance(v, list) or len(v) == 0:
            raise ValueError(
                "dates must be a non-empty list of date strings "
                "in YYYY-MM-DD format"
            )

        date_regex = re.compile(r"^\d{4}-\d{2}-\d{2}$")

        for d in v:
            if not isinstance(d, str) or not date_regex.match(d):
                raise ValueError(
                    f"Invalid date format '{d}'. "
                    "Expected YYYY-MM-DD (e.g. '2026-01-01')"
                )

            try:
                parsed_date = datetime.strptime(
                    d, "%Y-%m-%d"
                ).date()
            except ValueError:
                raise ValueError(
                    f"Invalid calendar date '{d}'. "
                    "Please provide a valid date in YYYY-MM-DD format"
                )

            if parsed_date > date.today():
                raise ValueError(
                    f"Date '{d}' cannot be in the future. "
                    "Please provide today's date or an earlier date."
                )

        return v

    @model_validator(mode="after")
    def validate_mode_and_date_counts(self) -> "FetchImageRequest":
        if self.mode == "single":
            if len(self.dates) != 1:
                raise ValueError(
                    "In 'single' mode, 'dates' must contain exactly 1 date: "
                    "[target_date]"
                )

        elif self.mode == "comparison":
            if len(self.dates) != 2:
                raise ValueError(
                    "In 'comparison' mode, 'dates' must contain exactly 2 "
                    "dates: [t1_date, t2_date]"
                )

            t1 = datetime.strptime(
                self.dates[0], "%Y-%m-%d"
            ).date()

            t2 = datetime.strptime(
                self.dates[1], "%Y-%m-%d"
            ).date()

            if t1 >= t2:
                raise ValueError(
                    "In 'comparison' mode, the first date (T1) must be "
                    "earlier than the second date (T2)."
                )

        else:
            raise ValueError(
                f"Unsupported mode '{self.mode}'. "
                "Mode must be 'single' or 'comparison'."
            )

        return self


class FetchImageResponse(BaseModel):
    image_urls: List[str] = Field(
        ...,
        description="Public URLs to access the fetched satellite images",
    )

    image_ids: List[str] = Field(
        ...,
        description=(
            "Unique identifiers for the stored satellite images "
            "in the database"
        ),
    )

    requested_dates: List[str] = Field(
        ...,
        description=(
            "Dates requested by the user in YYYY-MM-DD format"
        ),
    )

    actual_acquisition_dates: List[str] = Field(
        ...,
        description=(
            "Actual Sentinel-2 acquisition dates returned by the "
            "satellite provider in YYYY-MM-DD format"
        ),
    )