"""SiteSight API application factory."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from flask import Flask
from flask_cors import CORS

from app.routes import api
from app.inspection_service import analyze_workplace_image
from app.media_store import init_media_store


def create_app(test_config: dict[str, Any] | None = None) -> Flask:
    """Create and configure the Flask API."""

    flask_app = Flask(__name__)
    flask_app.config.from_mapping(
        JSON_SORT_KEYS=False,
        CORS_ORIGINS=[
            origin.strip()
            for origin in os.getenv(
                "CORS_ORIGINS",
                "http://localhost:3000,http://127.0.0.1:3000",
            ).split(",")
            if origin.strip()
        ],
        MAX_CONTENT_LENGTH=16 * 1024 * 1024,
        MEDIA_STORAGE_ROOT=os.getenv(
            "MEDIA_STORAGE_ROOT",
            str(Path(__file__).resolve().parent / "data"),
        ),
        INSPECTION_ANALYZER=analyze_workplace_image,
        INSPECTION_USER_HOURLY_LIMIT=10,
        INSPECTION_SYSTEM_HOURLY_LIMIT=30,
    )

    if test_config:
        flask_app.config.update(test_config)

    CORS(
        flask_app,
        resources={r"/api/*": {"origins": flask_app.config["CORS_ORIGINS"]}},
    )
    init_media_store(flask_app)
    flask_app.register_blueprint(api, url_prefix="/api")

    return flask_app
