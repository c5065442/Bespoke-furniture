"""
Consumes the free, keyless postcodes.io REST API to validate a UK postcode
and resolve it to coordinates + locality info during checkout — a live
example of a Django service *consuming* an external RESTful web service,
alongside the DRF views in this project that *build* one.

Kept behind a small client interface (matching the pattern used for Google
Maps in apps.delivery.services.geocoding) so tests never make real network
calls.
"""

import abc

import requests


class PostcodeLookupError(Exception):
    pass


class PostcodeLookupClient(abc.ABC):
    @abc.abstractmethod
    def lookup(self, postcode: str) -> dict | None:
        """Return normalized postcode data, or None if the postcode is invalid/not found."""


class PostcodesIoClient(PostcodeLookupClient):
    """https://postcodes.io — free, public, no API key required."""

    ENDPOINT = "https://api.postcodes.io/postcodes/{postcode}"

    def lookup(self, postcode: str) -> dict | None:
        url = self.ENDPOINT.format(postcode=requests.utils.quote(postcode.strip()))
        try:
            response = requests.get(url, timeout=8)
        except requests.RequestException as exc:
            raise PostcodeLookupError(f"Could not reach postcodes.io: {exc}") from exc

        if response.status_code == 404:
            return None
        response.raise_for_status()

        result = response.json()["result"]
        return {
            "postcode": result["postcode"],
            "latitude": result["latitude"],
            "longitude": result["longitude"],
            "city": result.get("admin_district") or result.get("parish") or "",
            "region": result.get("region") or "",
            "country": result.get("country") or "",
        }


class FakePostcodeLookupClient(PostcodeLookupClient):
    """Deterministic fake for tests — never hits the real API."""

    def __init__(self, known: dict[str, dict] | None = None):
        self.known = known or {
            "S1 2AB": {
                "postcode": "S1 2AB", "latitude": 53.386184, "longitude": -1.460492,
                "city": "Sheffield", "region": "Yorkshire and The Humber", "country": "England",
            }
        }

    def lookup(self, postcode: str) -> dict | None:
        return self.known.get(postcode.strip().upper())


def lookup_postcode(postcode: str, client: PostcodeLookupClient | None = None) -> dict | None:
    client = client or PostcodesIoClient()
    return client.lookup(postcode)
