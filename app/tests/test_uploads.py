import io
import unittest
from tempfile import TemporaryDirectory

from app import create_app


class UploadRouteTest(unittest.TestCase):
    def setUp(self) -> None:
        self.storage = TemporaryDirectory()
        self.client = create_app(
            {"TESTING": True, "MEDIA_STORAGE_ROOT": self.storage.name}
        ).test_client()
        self.user_id = "browser_user_a1"

    def tearDown(self) -> None:
        self.storage.cleanup()

    def test_uploads_are_stored_and_scoped_to_the_user(self) -> None:
        image_bytes = b"\x89PNG\r\n\x1a\n" + b"sitesight-test-image"
        created = self.client.post(
            "/api/uploads",
            data={
                "user_id": self.user_id,
                "image": (io.BytesIO(image_bytes), "workbench.png"),
            },
            content_type="multipart/form-data",
        )

        self.assertEqual(created.status_code, 201)
        upload = created.get_json()["upload"]
        self.assertEqual(upload["original_name"], "workbench.png")

        owned_list = self.client.get(f"/api/uploads?user_id={self.user_id}")
        self.assertEqual(owned_list.status_code, 200)
        self.assertEqual(len(owned_list.get_json()["uploads"]), 1)

        other_list = self.client.get("/api/uploads?user_id=browser_user_b2")
        self.assertEqual(other_list.status_code, 200)
        self.assertEqual(other_list.get_json()["uploads"], [])

        owned_image = self.client.get(upload["image_url"])
        self.assertEqual(owned_image.status_code, 200)
        self.assertEqual(owned_image.data, image_bytes)
        owned_image.close()

        other_image = self.client.get(
            f"/api/uploads/{upload['id']}/image?user_id=browser_user_b2"
        )
        self.assertEqual(other_image.status_code, 404)

    def test_rejects_non_image_content(self) -> None:
        response = self.client.post(
            "/api/uploads",
            data={
                "user_id": self.user_id,
                "image": (io.BytesIO(b"not-an-image"), "notes.txt"),
            },
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("supported", response.get_json()["error"])


if __name__ == "__main__":
    unittest.main()
