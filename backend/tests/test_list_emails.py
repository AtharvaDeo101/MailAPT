import json
from unittest.mock import MagicMock, patch


class FakeBatch:
    """Runs callbacks immediately; first sub-request of every batch 429s."""

    calls = []

    def __init__(self):
        self.items = []

    def add(self, request, request_id, callback):
        self.items.append((request_id, callback))

    def execute(self):
        FakeBatch.calls.append(len(self.items))
        for i, (msg_id, callback) in enumerate(self.items):
            if i == 0:
                callback(msg_id, None, Exception("rateLimitExceeded"))
            else:
                callback(
                    msg_id,
                    {
                        "id": msg_id,
                        "snippet": "s",
                        "payload": {"headers": [{"name": "To", "value": "her@example.com"}]},
                    },
                    None,
                )


@patch("email_service.time.sleep")
@patch("email_service.get_gmail_service")
def test_batches_are_chunked_and_failures_retried(mock_get_service, _sleep, client, login):
    FakeBatch.calls = []
    ids = [{"id": f"m{i}"} for i in range(25)]

    service = MagicMock()
    service.users().messages().list().execute.return_value = {"messages": ids}
    service.users().messages().get().execute.return_value = {
        "id": "retried", "snippet": "s", "payload": {"headers": []}
    }
    service.new_batch_http_request.side_effect = FakeBatch
    mock_get_service.return_value = service

    login(client)
    emails = json.loads(client.get("/list_emails?max_results=50").data)["emails"]

    assert FakeBatch.calls == [10, 10, 5]      # chunked, never one 25-wide batch
    assert len(emails) == 25                   # 3 failures retried back in
    # recipient surfaced so Sent can be searched by address
    assert emails[1]["to"] == "her@example.com"
