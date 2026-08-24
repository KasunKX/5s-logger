"""Run the SiteSight API with ``python -m app``."""

import os

from app import create_app


application = create_app()


if __name__ == "__main__":
    application.run(
        host=os.getenv("API_HOST", "127.0.0.1"),
        port=int(os.getenv("API_PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
    )
