"""SiteSight API routes."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from flask import Blueprint, abort, current_app, jsonify, request, send_file, url_for

from app.inspection_service import InspectionError
from app.media_store import (
    claim_inspection_slot,
    create_upload,
    get_upload,
    list_uploads,
    save_inspection,
    upload_path,
)


api = Blueprint("api", __name__)
USER_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{8,64}$")
MAX_IMAGE_BYTES = 15 * 1024 * 1024


def _valid_user_id(value: str | None) -> str | None:
    if value and USER_ID_PATTERN.fullmatch(value):
        return value
    return None


def _detect_image(image_bytes: bytes) -> tuple[str, str] | None:
    if image_bytes.startswith(b"\xff\xd8\xff"):
        return "jpg", "image/jpeg"
    if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if image_bytes.startswith(b"RIFF") and image_bytes[8:12] == b"WEBP":
        return "webp", "image/webp"
    return None


def _serialize_upload(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": record["id"],
        "original_name": record["original_name"],
        "mime_type": record["mime_type"],
        "size_bytes": record["size_bytes"],
        "created_at": record["created_at"],
        "inspection": record.get("inspection"),
        "image_url": url_for(
            "api.upload_image",
            upload_id=record["id"],
            user_id=record["user_id"],
        ),
    }


@api.get("/health")
def health() -> tuple[object, int]:
    """Return a small readiness response for local and hosted checks."""

    return jsonify(
        {
            "status": "ok",
            "service": "sitesight-api",
            "version": "0.1.0",
        }
    ), 200


@api.get("/uploads")
def uploads_index() -> tuple[object, int]:
    """List recent uploads belonging to one browser user ID."""

    user_id = _valid_user_id(request.args.get("user_id"))
    if not user_id:
        return jsonify({"error": "A valid user_id is required."}), 400

    return jsonify(
        {"uploads": [_serialize_upload(item) for item in list_uploads(user_id)]}
    ), 200


@api.post("/uploads")
def create_upload_route() -> tuple[object, int]:
    """Store one validated image for a browser user ID."""

    user_id = _valid_user_id(request.form.get("user_id"))
    if not user_id:
        return jsonify({"error": "A valid user_id is required."}), 400

    image = request.files.get("image")
    if not image or not image.filename:
        return jsonify({"error": "An image file is required."}), 400

    image.stream.seek(0, 2)
    size_bytes = image.stream.tell()
    image.stream.seek(0)
    if size_bytes <= 0 or size_bytes > MAX_IMAGE_BYTES:
        return jsonify({"error": "The image must be between 1 byte and 15 MB."}), 400

    signature = image.stream.read(12)
    image.stream.seek(0)
    detected = _detect_image(signature)
    if not detected:
        return jsonify({"error": "Only JPG, PNG, and WebP images are supported."}), 400

    extension, mime_type = detected
    record = create_upload(
        user_id=user_id,
        image=image,
        extension=extension,
        mime_type=mime_type,
        size_bytes=size_bytes,
    )
    return jsonify({"upload": _serialize_upload(record)}), 201


@api.post("/inspections")
def create_inspection_route() -> tuple[object, int]:
    """Store and inspect one image within the configured hourly limits."""

    user_id = _valid_user_id(request.form.get("user_id"))
    if not user_id:
        return jsonify({"error": "The request could not be accepted."}), 400

    image = request.files.get("image")
    if not image or not image.filename:
        return jsonify({"error": "Choose an image to inspect."}), 400

    image.stream.seek(0, 2)
    size_bytes = image.stream.tell()
    image.stream.seek(0)
    if size_bytes <= 0 or size_bytes > MAX_IMAGE_BYTES:
        return jsonify({"error": "Choose an image smaller than 15 megabytes."}), 400

    signature = image.stream.read(12)
    image.stream.seek(0)
    detected = _detect_image(signature)
    if not detected:
        return jsonify({"error": "Choose a supported image."}), 400

    limit = claim_inspection_slot(
        user_id,
        user_limit=current_app.config["INSPECTION_USER_HOURLY_LIMIT"],
        system_limit=current_app.config["INSPECTION_SYSTEM_HOURLY_LIMIT"],
    )
    if not limit["allowed"]:
        if limit["scope"] == "user":
            message = "You have reached the hourly inspection limit. Please try again later."
        else:
            message = "Inspection capacity is full for this hour. Please try again later."
        response = jsonify(
            {
                "error": message,
                "retry_after_seconds": limit["retry_after_seconds"],
            }
        )
        response.status_code = 429
        response.headers["Retry-After"] = str(limit["retry_after_seconds"])
        return response, 429

    extension, mime_type = detected
    record = create_upload(
        user_id=user_id,
        image=image,
        extension=extension,
        mime_type=mime_type,
        size_bytes=size_bytes,
    )

    analyzer = current_app.config["INSPECTION_ANALYZER"]
    try:
        inspection = analyzer(upload_path(record))
    except InspectionError:
        current_app.logger.exception("Image inspection failed")
        return jsonify(
            {"error": "The inspection could not be completed. Please try again."}
        ), 503

    save_inspection(record["id"], user_id, inspection)
    record["inspection"] = inspection
    return jsonify(
        {
            "inspection": inspection,
            "upload": _serialize_upload(record),
            "remaining": {
                "user": limit["user_remaining"],
                "system": limit["system_remaining"],
            },
        }
    ), 201


@api.get("/uploads/<upload_id>/image")
def upload_image(upload_id: str):
    """Serve an image only when its browser owner ID is supplied."""

    user_id = _valid_user_id(request.args.get("user_id"))
    if not user_id:
        abort(404)

    record = get_upload(upload_id, user_id)
    if not record:
        abort(404)

    path = upload_path(record)
    if not path.is_file():
        abort(404)

    return send_file(
        Path(path),
        mimetype=record["mime_type"],
        download_name=record["original_name"],
        conditional=True,
    )
