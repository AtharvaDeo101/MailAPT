"""The gateway is what every route sits behind, so it gets its own checks."""

from unittest.mock import MagicMock, patch


class TestAuthGate:
    def test_unauthenticated_requests_are_refused(self, client):
        # /folders had no check of its own — the gateway is what covers it
        assert client.get("/folders").status_code == 401
        assert client.post("/folders", json={"name": "x"}).status_code == 401

    def test_public_paths_stay_open(self, client):
        assert client.get("/health").status_code == 200
        assert client.get("/").status_code == 200


class TestRateLimit:
    def test_burst_past_the_route_limit_is_throttled(self, client, login):
        login(client)

        # 10/min on /summarize_email; a 400 still counts as a request
        codes = [client.post("/summarize_email", json={}).status_code for _ in range(11)]

        assert codes[:10] == [400] * 10
        assert codes[10] == 429

    def test_throttled_response_says_when_to_retry(self, client, login):
        login(client)

        for _ in range(11):
            response = client.post("/summarize_email", json={})

        assert int(response.headers["Retry-After"]) > 0


class TestCache:
    def _service(self):
        service = MagicMock()
        service.users.return_value.labels.return_value.list.return_value.execute.return_value = {
            "labels": [{"id": "INBOX"}]
        }
        return service

    def test_repeat_read_is_served_without_hitting_gmail(self, client, login):
        login(client)
        service = self._service()

        with patch("email_service.get_gmail_service", return_value=service):
            first = client.get("/list_labels")
            second = client.get("/list_labels")

        assert first.headers.get("X-Cache") == "MISS"
        assert second.headers.get("X-Cache") == "HIT"
        assert second.get_json() == first.get_json()
        assert service.users.return_value.labels.return_value.list.call_count == 1

    def test_a_write_drops_the_cached_reads(self, client, login):
        login(client)
        service = self._service()

        with patch("email_service.get_gmail_service", return_value=service):
            client.get("/list_labels")
            client.post("/folders", json={"name": "Work"})
            refetched = client.get("/list_labels")

        assert refetched.headers.get("X-Cache") == "MISS"
