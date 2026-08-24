import unittest
from tempfile import TemporaryDirectory

from app import create_app


class HealthRouteTest(unittest.TestCase):
    def setUp(self) -> None:
        self.storage = TemporaryDirectory()
        self.client = create_app(
            {"TESTING": True, "MEDIA_STORAGE_ROOT": self.storage.name}
        ).test_client()

    def tearDown(self) -> None:
        self.storage.cleanup()

    def test_health_route(self) -> None:
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {
                "status": "ok",
                "service": "sitesight-api",
                "version": "0.1.0",
            },
        )


if __name__ == "__main__":
    unittest.main()
