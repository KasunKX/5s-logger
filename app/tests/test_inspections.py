import io
import unittest
from tempfile import TemporaryDirectory

from app import create_app


INSPECTION_RESULT = {
    "suggested_actions": 1,
    "positive_points": 1,
    "percentage": 68,
    "state": "Needs improvement",
    "logs": [
        {
            "type": "action",
            "principle": "Sort",
            "observation": "Loose material is visible on the work surface.",
            "action": "Remove material that is not required for the current task.",
            "assessment": "Medium action",
        },
        {
            "type": "positive",
            "principle": "Set in order",
            "observation": "Frequently used tools are grouped together.",
            "action": "Maintain the current point-of-use arrangement.",
            "assessment": "Positive",
        },
    ],
}


def image_payload() -> tuple[io.BytesIO, str]:
    return io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"inspection-image"), "workplace.png"


class InspectionRouteTest(unittest.TestCase):
    def setUp(self) -> None:
        self.storage = TemporaryDirectory()

        def analyzer(path):
            self.assertTrue(path.is_file())
            return INSPECTION_RESULT

        self.client = create_app(
            {
                "TESTING": True,
                "MEDIA_STORAGE_ROOT": self.storage.name,
                "INSPECTION_ANALYZER": analyzer,
                "INSPECTION_USER_HOURLY_LIMIT": 2,
                "INSPECTION_SYSTEM_HOURLY_LIMIT": 3,
            }
        ).test_client()

    def tearDown(self) -> None:
        self.storage.cleanup()

    def inspect(self, user_id: str):
        return self.client.post(
            "/api/inspections",
            data={"user_id": user_id, "image": image_payload()},
            content_type="multipart/form-data",
        )

    def test_returns_and_persists_the_strict_inspection_result(self) -> None:
        response = self.inspect("browser_inspection_a")

        self.assertEqual(response.status_code, 201)
        payload = response.get_json()
        self.assertEqual(payload["inspection"], INSPECTION_RESULT)
        self.assertEqual(payload["upload"]["inspection"], INSPECTION_RESULT)
        self.assertEqual(payload["remaining"], {"user": 1, "system": 2})

        uploads = self.client.get("/api/uploads?user_id=browser_inspection_a")
        self.assertEqual(
            uploads.get_json()["uploads"][0]["inspection"],
            INSPECTION_RESULT,
        )

    def test_limits_one_user_to_two_requests_in_test_configuration(self) -> None:
        self.assertEqual(self.inspect("browser_inspection_a").status_code, 201)
        self.assertEqual(self.inspect("browser_inspection_a").status_code, 201)
        limited = self.inspect("browser_inspection_a")

        self.assertEqual(limited.status_code, 429)
        self.assertEqual(limited.headers.get("Retry-After"), "3600")

    def test_applies_the_system_wide_limit_across_users(self) -> None:
        self.assertEqual(self.inspect("browser_inspection_a").status_code, 201)
        self.assertEqual(self.inspect("browser_inspection_a").status_code, 201)
        self.assertEqual(self.inspect("browser_inspection_b").status_code, 201)
        limited = self.inspect("browser_inspection_c")

        self.assertEqual(limited.status_code, 429)
        self.assertIn("capacity", limited.get_json()["error"])

    def test_reinspects_and_deletes_an_owned_upload(self) -> None:
        created = self.inspect("browser_inspection_a")
        upload = created.get_json()["upload"]

        repeated = self.client.post(
            f"/api/uploads/{upload['id']}/inspection",
            data={"user_id": "browser_inspection_a"},
        )
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(repeated.get_json()["inspection"], INSPECTION_RESULT)

        removed = self.client.delete(
            f"/api/uploads/{upload['id']}?user_id=browser_inspection_a"
        )
        self.assertEqual(removed.status_code, 200)
        self.assertTrue(removed.get_json()["deleted"])

        missing = self.client.get(upload["image_url"])
        self.assertEqual(missing.status_code, 404)


if __name__ == "__main__":
    unittest.main()
