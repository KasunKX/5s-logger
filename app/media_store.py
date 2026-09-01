"""Filesystem and SQLite persistence for uploaded workplace images."""

from __future__ import annotations

import sqlite3
import json
import math
import time
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from flask import Flask, current_app
from werkzeug.datastructures import FileStorage


def init_media_store(flask_app: Flask) -> None:
    """Create the media directories and metadata table when the app starts."""

    storage_root = Path(flask_app.config["MEDIA_STORAGE_ROOT"]).resolve()
    uploads_root = storage_root / "uploads"
    database_path = storage_root / "sitesight.sqlite3"

    uploads_root.mkdir(parents=True, exist_ok=True)
    flask_app.config["MEDIA_STORAGE_ROOT"] = str(storage_root)
    flask_app.config["MEDIA_UPLOADS_ROOT"] = str(uploads_root)
    flask_app.config["MEDIA_DATABASE_PATH"] = str(database_path)

    with closing(sqlite3.connect(database_path)) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS uploads (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                original_name TEXT NOT NULL,
                stored_name TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                inspection_json TEXT
            )
            """
        )
        upload_columns = {
            row[1]
            for row in connection.execute("PRAGMA table_info(uploads)").fetchall()
        }
        if "inspection_json" not in upload_columns:
            connection.execute(
                "ALTER TABLE uploads ADD COLUMN inspection_json TEXT"
            )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS uploads_user_created_idx "
            "ON uploads (user_id, created_at DESC)"
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS inspection_requests (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at REAL NOT NULL
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS inspection_requests_created_idx "
            "ON inspection_requests (created_at)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS inspection_requests_user_created_idx "
            "ON inspection_requests (user_id, created_at)"
        )
        connection.commit()


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(
        current_app.config["MEDIA_DATABASE_PATH"], timeout=30
    )
    connection.row_factory = sqlite3.Row
    # WAL lets concurrent readers/writers (multiple gunicorn workers) proceed
    # without the "database is locked" errors the default journal mode gives
    # under concurrent access.
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA busy_timeout=30000")
    return connection


def create_upload(
    *,
    user_id: str,
    image: FileStorage,
    extension: str,
    mime_type: str,
    size_bytes: int,
) -> dict[str, Any]:
    """Persist an image and return its metadata record."""

    upload_id = str(uuid4())
    stored_name = f"{upload_id}.{extension}"
    user_directory = Path(current_app.config["MEDIA_UPLOADS_ROOT"]) / user_id
    user_directory.mkdir(parents=True, exist_ok=True)
    destination = user_directory / stored_name
    image.stream.seek(0)
    image.save(destination)

    created_at = datetime.now(timezone.utc).isoformat()
    original_name = image.filename or f"upload.{extension}"
    with closing(_connect()) as connection:
        connection.execute(
            """
            INSERT INTO uploads (
                id, user_id, original_name, stored_name, mime_type,
                size_bytes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                upload_id,
                user_id,
                original_name,
                stored_name,
                mime_type,
                size_bytes,
                created_at,
            ),
        )
        connection.commit()

    return {
        "id": upload_id,
        "user_id": user_id,
        "original_name": original_name,
        "stored_name": stored_name,
        "mime_type": mime_type,
        "size_bytes": size_bytes,
        "created_at": created_at,
        "inspection": None,
    }


def _deserialize_record(row: sqlite3.Row) -> dict[str, Any]:
    record = dict(row)
    encoded = record.pop("inspection_json", None)
    record["inspection"] = json.loads(encoded) if encoded else None
    return record


def list_uploads(user_id: str, limit: int = 20) -> list[dict[str, Any]]:
    """Return the newest images owned by a browser user."""

    with closing(_connect()) as connection:
        rows = connection.execute(
            """
            SELECT id, user_id, original_name, stored_name, mime_type,
                   size_bytes, created_at, inspection_json
            FROM uploads
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()
    return [_deserialize_record(row) for row in rows]


def get_upload(upload_id: str, user_id: str) -> dict[str, Any] | None:
    """Return one image only when it belongs to the supplied browser user."""

    with closing(_connect()) as connection:
        row = connection.execute(
            """
            SELECT id, user_id, original_name, stored_name, mime_type,
                   size_bytes, created_at, inspection_json
            FROM uploads
            WHERE id = ? AND user_id = ?
            """,
            (upload_id, user_id),
        ).fetchone()
    return _deserialize_record(row) if row else None


def save_inspection(
    upload_id: str,
    user_id: str,
    inspection: dict[str, Any],
) -> None:
    """Attach a validated inspection result to a stored image."""

    with closing(_connect()) as connection:
        connection.execute(
            """
            UPDATE uploads
            SET inspection_json = ?
            WHERE id = ? AND user_id = ?
            """,
            (json.dumps(inspection, separators=(",", ":")), upload_id, user_id),
        )
        connection.commit()


def delete_upload(upload_id: str, user_id: str) -> bool:
    """Permanently remove one owned upload and its metadata."""

    record = get_upload(upload_id, user_id)
    if not record:
        return False

    uploads_root = Path(current_app.config["MEDIA_UPLOADS_ROOT"]).resolve()
    path = upload_path(record).resolve()
    if uploads_root not in path.parents:
        raise RuntimeError("Refusing to delete a file outside the upload store.")

    if path.exists():
        path.unlink()

    with closing(_connect()) as connection:
        connection.execute(
            "DELETE FROM uploads WHERE id = ? AND user_id = ?",
            (upload_id, user_id),
        )
        connection.commit()
    return True


def claim_inspection_slot(
    user_id: str,
    *,
    user_limit: int,
    system_limit: int,
    window_seconds: int = 3600,
) -> dict[str, Any]:
    """Atomically reserve one request inside the rolling rate-limit window."""

    now = time.time()
    cutoff = now - window_seconds
    with closing(_connect()) as connection:
        connection.execute("BEGIN IMMEDIATE")
        connection.execute(
            "DELETE FROM inspection_requests WHERE created_at <= ?",
            (cutoff,),
        )
        user_times = [
            row[0]
            for row in connection.execute(
                """
                SELECT created_at FROM inspection_requests
                WHERE user_id = ?
                ORDER BY created_at ASC
                """,
                (user_id,),
            ).fetchall()
        ]
        system_times = [
            row[0]
            for row in connection.execute(
                "SELECT created_at FROM inspection_requests ORDER BY created_at ASC"
            ).fetchall()
        ]

        if len(user_times) >= user_limit:
            retry_after = max(1, math.ceil(user_times[0] + window_seconds - now))
            connection.commit()
            return {
                "allowed": False,
                "scope": "user",
                "retry_after_seconds": retry_after,
            }

        if len(system_times) >= system_limit:
            retry_after = max(1, math.ceil(system_times[0] + window_seconds - now))
            connection.commit()
            return {
                "allowed": False,
                "scope": "system",
                "retry_after_seconds": retry_after,
            }

        connection.execute(
            "INSERT INTO inspection_requests (id, user_id, created_at) VALUES (?, ?, ?)",
            (str(uuid4()), user_id, now),
        )
        connection.commit()
        return {
            "allowed": True,
            "user_remaining": user_limit - len(user_times) - 1,
            "system_remaining": system_limit - len(system_times) - 1,
        }


def upload_path(record: dict[str, Any]) -> Path:
    """Resolve the server-side path for an owned upload record."""

    return (
        Path(current_app.config["MEDIA_UPLOADS_ROOT"])
        / record["user_id"]
        / record["stored_name"]
    )
