import logging
import uuid
from typing import Optional

from app.db.supabase import supabase

logger = logging.getLogger("satquery.services.storage")

BUCKET_NAME = "satellite-images"


def upload_image_to_storage(image_bytes: bytes, filename: Optional[str] = None) -> str:
    """
    Upload PNG image bytes to Supabase Storage bucket 'satellite-images'
    and return the public accessible URL.
    """
    if not filename:
        filename = f"{uuid.uuid4()}.png"

    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=filename,
            file=image_bytes,
            file_options={"content-type": "image/png"},
        )
    except Exception as err:
        logger.error("Supabase Storage upload error: %s", type(err).__name__)
        raise RuntimeError("Failed to upload image to Supabase Storage") from err

    try:
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
        return public_url
    except Exception as err:
        logger.error("Supabase Storage get_public_url error: %s", type(err).__name__)
        raise RuntimeError("Failed to obtain public URL from Supabase Storage") from err
