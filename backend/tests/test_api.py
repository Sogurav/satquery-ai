import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
import requests

from app.main import app
from app.services.sentinel import SatelliteImageResult


client = TestClient(app)


class TestSatelliteAPI(unittest.TestCase):
    def setUp(self):
        self.valid_bbox = [72.82, 18.92, 72.84, 18.94]
        self.dummy_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"

        self.dummy_result = SatelliteImageResult(
            image_bytes=self.dummy_png,
            acquisition_date="2026-01-01",
        )

    # a. Valid single request
    @patch("app.api.satellite.supabase")
    @patch("app.api.satellite.upload_image_to_storage")
    @patch("app.api.satellite.fetch_satellite_image")
    def test_valid_single_request(
        self, mock_fetch, mock_upload, mock_supabase
    ):
        mock_fetch.return_value = self.dummy_result
        mock_upload.return_value = (
            "https://example.com/storage/img_single.png"
        )
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {"id": "550e8400-e29b-41d4-a716-446655440000"}
        ]

        payload = {
            "bbox": self.valid_bbox,
            "dates": ["2026-01-01"],
            "mode": "single",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertEqual(mock_fetch.call_count, 1)
        self.assertEqual(
            data["image_urls"],
            ["https://example.com/storage/img_single.png"],
        )
        self.assertEqual(
            data["image_ids"],
            ["550e8400-e29b-41d4-a716-446655440000"],
        )
        self.assertEqual(
            data["requested_dates"],
            ["2026-01-01"],
        )
        self.assertEqual(
            data["actual_acquisition_dates"],
            ["2026-01-01"],
        )

    # b. Valid comparison request
    @patch("app.api.satellite.supabase")
    @patch("app.api.satellite.upload_image_to_storage")
    @patch("app.api.satellite.fetch_satellite_image")
    def test_valid_comparison_request(
        self, mock_fetch, mock_upload, mock_supabase
    ):
        result_t1 = SatelliteImageResult(
            image_bytes=self.dummy_png,
            acquisition_date="2026-01-01",
        )

        result_t2 = SatelliteImageResult(
            image_bytes=self.dummy_png,
            acquisition_date="2026-01-31",
        )

        mock_fetch.side_effect = [result_t1, result_t2]

        mock_upload.side_effect = [
            "https://example.com/storage/img_t1.png",
            "https://example.com/storage/img_t2.png",
        ]

        mock_supabase.table.return_value.insert.return_value.execute.side_effect = [
            MagicMock(data=[{"id": "uuid-t1"}]),
            MagicMock(data=[{"id": "uuid-t2"}]),
        ]

        payload = {
            "bbox": self.valid_bbox,
            "dates": ["2026-01-01", "2026-01-31"],
            "mode": "comparison",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 200)

        data = response.json()

        # Verify two separate image requests
        self.assertEqual(mock_fetch.call_count, 2)

        self.assertEqual(
            mock_fetch.call_args_list[0].kwargs,
            {
                "bbox": self.valid_bbox,
                "start_date": "2026-01-01",
                "end_date": "2026-01-01",
            },
        )

        self.assertEqual(
            mock_fetch.call_args_list[1].kwargs,
            {
                "bbox": self.valid_bbox,
                "start_date": "2026-01-31",
                "end_date": "2026-01-31",
            },
        )

        self.assertEqual(
            data["image_urls"],
            [
                "https://example.com/storage/img_t1.png",
                "https://example.com/storage/img_t2.png",
            ],
        )

        self.assertEqual(
            data["image_ids"],
            ["uuid-t1", "uuid-t2"],
        )

        self.assertEqual(
            data["requested_dates"],
            ["2026-01-01", "2026-01-31"],
        )

        self.assertEqual(
            data["actual_acquisition_dates"],
            ["2026-01-01", "2026-01-31"],
        )

    # c. Invalid bbox validation
    def test_invalid_bbox_length(self):
        payload = {
            "bbox": [72.82, 18.92, 72.84],
            "dates": ["2026-01-01"],
            "mode": "single",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 422)

    def test_invalid_bbox_out_of_bounds(self):
        payload = {
            "bbox": [72.82, 18.92, 195.0, 18.94],
            "dates": ["2026-01-01"],
            "mode": "single",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 422)

    def test_invalid_bbox_min_greater_than_max(self):
        payload = {
            "bbox": [72.85, 18.92, 72.84, 18.94],
            "dates": ["2026-01-01"],
            "mode": "single",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 422)

    # d. Invalid date validation
    def test_invalid_date_format(self):
        payload = {
            "bbox": self.valid_bbox,
            "dates": ["2026/01/01"],
            "mode": "single",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 422)

    def test_invalid_calendar_date(self):
        payload = {
            "bbox": self.valid_bbox,
            "dates": ["2026-02-31"],
            "mode": "single",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 422)

    # e. Invalid number of dates for each mode
    def test_single_mode_with_multiple_dates(self):
        payload = {
            "bbox": self.valid_bbox,
            "dates": ["2026-01-01", "2026-01-31"],
            "mode": "single",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 422)
        self.assertIn("exactly 1 date", response.text)

    def test_comparison_mode_with_one_date(self):
        payload = {
            "bbox": self.valid_bbox,
            "dates": ["2026-01-01"],
            "mode": "comparison",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 422)
        self.assertIn("exactly 2 dates", response.text)

    def test_comparison_mode_with_three_dates(self):
        payload = {
            "bbox": self.valid_bbox,
            "dates": [
                "2026-01-01",
                "2026-01-15",
                "2026-01-31",
            ],
            "mode": "comparison",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 422)

    # f. Response schema validation
    @patch("app.api.satellite.supabase")
    @patch("app.api.satellite.upload_image_to_storage")
    @patch("app.api.satellite.fetch_satellite_image")
    def test_response_schema(
        self, mock_fetch, mock_upload, mock_supabase
    ):
        mock_fetch.return_value = self.dummy_result
        mock_upload.return_value = "https://example.com/test.png"

        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {"id": "img_123"}
        ]

        payload = {
            "bbox": self.valid_bbox,
            "dates": ["2026-01-01"],
            "mode": "single",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertIn("image_urls", data)
        self.assertIn("image_ids", data)
        self.assertIn("requested_dates", data)
        self.assertIn("actual_acquisition_dates", data)

        self.assertIsInstance(data["image_urls"], list)
        self.assertIsInstance(data["image_ids"], list)
        self.assertIsInstance(data["requested_dates"], list)
        self.assertIsInstance(
            data["actual_acquisition_dates"],
            list,
        )

    # Error handling tests
    @patch("app.api.satellite.fetch_satellite_image")
    def test_upstream_auth_error_sanitized(self, mock_fetch):
        err_res = requests.Response()
        err_res.status_code = 401

        mock_fetch.side_effect = requests.HTTPError(
            response=err_res
        )

        payload = {
            "bbox": self.valid_bbox,
            "dates": ["2026-01-01"],
            "mode": "single",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 502)
        self.assertIn(
            "authentication failed",
            response.json()["detail"].lower(),
        )

    @patch("app.api.satellite.upload_image_to_storage")
    @patch("app.api.satellite.fetch_satellite_image")
    def test_storage_upload_error_handled(
        self, mock_fetch, mock_upload
    ):
        mock_fetch.return_value = self.dummy_result
        mock_upload.side_effect = RuntimeError(
            "S3 / Storage timeout"
        )

        payload = {
            "bbox": self.valid_bbox,
            "dates": ["2026-01-01"],
            "mode": "single",
        }

        response = client.post("/api/fetch-image", json=payload)

        self.assertEqual(response.status_code, 500)
        self.assertIn(
            "Failed to upload",
            response.json()["detail"],
        )


if __name__ == "__main__":
    unittest.main()