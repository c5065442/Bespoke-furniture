from unittest.mock import MagicMock, patch

import pytest
from rest_framework.test import APIClient

from apps.customers.postcode_lookup import FakePostcodeLookupClient, PostcodeLookupError, lookup_postcode

pytestmark = pytest.mark.django_db

LOOKUP_URL = "/api/v1/postcode-lookup/"


class TestLookupPostcodeService:
    def test_known_postcode_resolves(self):
        client = FakePostcodeLookupClient()
        result = lookup_postcode("S1 2AB", client=client)
        assert result["city"] == "Sheffield"
        assert result["latitude"] == pytest.approx(53.386184)

    def test_unknown_postcode_returns_none(self):
        client = FakePostcodeLookupClient()
        assert lookup_postcode("ZZ99 9ZZ", client=client) is None

    def test_lookup_is_case_and_whitespace_insensitive(self):
        client = FakePostcodeLookupClient()
        assert lookup_postcode(" s1 2ab ", client=client) is not None


class TestPostcodesIoClient:
    @patch("requests.get")
    def test_valid_postcode_returns_normalized_data(self, mock_get):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "result": {
                    "postcode": "S1 2AB", "latitude": 53.38, "longitude": -1.46,
                    "admin_district": "Sheffield", "region": "Yorkshire and The Humber", "country": "England",
                }
            },
        )
        from apps.customers.postcode_lookup import PostcodesIoClient

        result = PostcodesIoClient().lookup("S1 2AB")
        assert result["city"] == "Sheffield"
        assert result["postcode"] == "S1 2AB"

    @patch("requests.get")
    def test_404_returns_none(self, mock_get):
        mock_get.return_value = MagicMock(status_code=404)
        from apps.customers.postcode_lookup import PostcodesIoClient

        assert PostcodesIoClient().lookup("ZZ99 9ZZ") is None

    @patch("requests.get")
    def test_network_error_raises_lookup_error(self, mock_get):
        import requests

        mock_get.side_effect = requests.ConnectionError("boom")
        from apps.customers.postcode_lookup import PostcodesIoClient

        with pytest.raises(PostcodeLookupError):
            PostcodesIoClient().lookup("S1 2AB")


class TestPostcodeLookupEndpoint:
    def test_requires_postcode_param(self):
        response = APIClient().get(LOOKUP_URL)
        assert response.status_code == 400

    def test_is_public_no_auth_required(self):
        with patch("apps.customers.views.lookup_postcode", return_value=None):
            response = APIClient().get(LOOKUP_URL, {"postcode": "ZZ99 9ZZ"})
        assert response.status_code == 200

    def test_valid_postcode_response_shape(self):
        fake_result = {
            "postcode": "S1 2AB", "latitude": 53.38, "longitude": -1.46,
            "city": "Sheffield", "region": "Yorkshire and The Humber", "country": "England",
        }
        with patch("apps.customers.views.lookup_postcode", return_value=fake_result):
            response = APIClient().get(LOOKUP_URL, {"postcode": "S1 2AB"})
        assert response.status_code == 200
        assert response.data["valid"] is True
        assert response.data["city"] == "Sheffield"

    def test_invalid_postcode_response_shape(self):
        with patch("apps.customers.views.lookup_postcode", return_value=None):
            response = APIClient().get(LOOKUP_URL, {"postcode": "ZZ99 9ZZ"})
        assert response.status_code == 200
        assert response.data["valid"] is False

    def test_upstream_failure_returns_502(self):
        with patch("apps.customers.views.lookup_postcode", side_effect=PostcodeLookupError("down")):
            response = APIClient().get(LOOKUP_URL, {"postcode": "S1 2AB"})
        assert response.status_code == 502
