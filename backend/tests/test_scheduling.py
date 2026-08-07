"""Covers the DB-backed draft/schedule endpoints the mail UI depends on."""

from datetime import datetime, timedelta, timezone


class TestScheduledEmails:
    def test_requires_auth(self, client):
        assert client.get("/scheduled_emails").status_code == 401
        assert client.post("/scheduled_emails", json={}).status_code == 401

    def test_rejects_incomplete_payloads(self, client, login):
        login(client)

        assert client.post("/scheduled_emails", json={"to": "a@b.com"}).status_code == 400
        assert (
            client.post(
                "/scheduled_emails",
                json={"to": "a@b.com", "body": "hi"},
            ).status_code
            == 400
        )
        assert (
            client.post(
                "/scheduled_emails",
                json={"to": "a@b.com", "body": "hi", "scheduled_for": "not-a-date"},
            ).status_code
            == 400
        )

    def test_schedule_round_trip(self, client, login):
        login(client)

        when = datetime.now(timezone.utc) + timedelta(hours=2)
        created = client.post(
            "/scheduled_emails",
            json={
                "to": "a@b.com",
                "subject": "Standup",
                "body": "See you at 9",
                "scheduled_for": when.isoformat().replace("+00:00", "Z"),
            },
        )
        assert created.status_code == 200
        sched_id = created.get_json()["id"]

        listed = client.get("/scheduled_emails").get_json()["scheduled"]
        mine = next(s for s in listed if s["id"] == sched_id)
        assert mine["to_address"] == "a@b.com"
        assert mine["status"] == "pending"

        # the payload row lives in `emails`, but Drafts must not show it
        drafts = client.get("/stored_emails?is_draft=true").get_json()["emails"]
        assert all(d["subject"] != "Standup" for d in drafts)

        assert client.delete(f"/scheduled_emails/{sched_id}").status_code == 200
        remaining = client.get("/scheduled_emails").get_json()["scheduled"]
        assert sched_id not in [s["id"] for s in remaining]

    def test_marking_sent_keeps_the_record_out_of_pending(self, client, login):
        login(client)

        when = datetime.now(timezone.utc) + timedelta(minutes=5)
        sched_id = client.post(
            "/scheduled_emails",
            json={
                "to": "a@b.com",
                "subject": "Later",
                "body": "body",
                "scheduled_for": when.isoformat(),
            },
        ).get_json()["id"]

        assert client.delete(f"/scheduled_emails/{sched_id}?sent=true").status_code == 200
        pending = client.get("/scheduled_emails").get_json()["scheduled"]
        assert sched_id not in [s["id"] for s in pending]

        # a sent schedule graduates into a normal non-draft mail row
        sent = client.get("/stored_emails?is_draft=false").get_json()["emails"]
        assert any(m["subject"] == "Later" for m in sent)

    def test_naive_datetime_is_accepted_as_utc(self, client, login):
        login(client)

        when = datetime.utcnow() + timedelta(hours=1)
        created = client.post(
            "/scheduled_emails",
            json={
                "to": "a@b.com",
                "subject": "Naive",
                "body": "body",
                "scheduled_for": when.isoformat(),
            },
        )
        assert created.status_code == 200
        assert created.get_json()["scheduled_for"].startswith(when.strftime("%Y-%m-%d"))


class TestStoredEmailMutations:
    def test_patch_updates_fields(self, client, login):
        login(client)
        when = datetime.now(timezone.utc) + timedelta(hours=1)
        email_id = client.post(
            "/scheduled_emails",
            json={
                "to": "x@y.com",
                "subject": "Before",
                "body": "b",
                "scheduled_for": when.isoformat(),
            },
        ).get_json()["email_id"]

        res = client.patch(f"/stored_emails/{email_id}", json={"subject": "After"})
        assert res.status_code == 200
        assert res.get_json()["subject"] == "After"

    def test_patch_missing_row_is_404(self, client, login):
        login(client)
        assert client.patch("/stored_emails/999999", json={}).status_code == 404

    def test_delete_clears_dependent_schedule(self, client, login):
        login(client)
        when = datetime.now(timezone.utc) + timedelta(hours=1)
        created = client.post(
            "/scheduled_emails",
            json={
                "to": "x@y.com",
                "subject": "Doomed",
                "body": "b",
                "scheduled_for": when.isoformat(),
            },
        ).get_json()

        # deleting the mail row must not leave an orphaned schedule behind
        assert client.delete(f"/stored_emails/{created['email_id']}").status_code == 200
        pending = client.get("/scheduled_emails").get_json()["scheduled"]
        assert created["id"] not in [s["id"] for s in pending]

    def test_stored_emails_requires_auth(self, client):
        assert client.get("/stored_emails").status_code == 401
