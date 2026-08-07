import json
from unittest.mock import MagicMock, patch

from email_service import DEFAULT_SETTINGS, _clean_settings, _merged_settings


class TestSettingsValidation:
    def test_drops_unknown_and_invalid_values(self):
        cleaned = _clean_settings(
            {
                "fontFamily": "comic",  # not an offered family
                "fontSize": "large",
                "themeColor": "red",  # not a hex colour
                "leftPanelColor": "#ABCDEF",
                "somethingElse": "x",  # unknown key
                "notifications": {
                    "volume": 5,  # clamped
                    "sound": "airhorn",  # not an offered sound
                    "enabled": "yes",  # not a bool
                    "silentFrom": "25:00",  # not a time
                    "silentTo": "07:30",
                },
            }
        )

        assert cleaned == {
            "fontSize": "large",
            "leftPanelColor": "#ABCDEF",
            "notifications": {"volume": 1.0, "silentTo": "07:30"},
        }

    def test_non_dict_payload_is_rejected(self):
        assert _clean_settings(["dark"]) == {}
        assert _clean_settings(None) == {}

    def test_merge_fills_in_defaults(self):
        merged = _merged_settings({"appearance": "dark", "notifications": {"volume": 0.2}})

        assert merged["appearance"] == "dark"
        assert merged["notifications"]["volume"] == 0.2
        assert merged["notifications"]["sound"] == DEFAULT_SETTINGS["notifications"]["sound"]
        assert merged["language"] == DEFAULT_SETTINGS["language"]

    def test_merge_leaves_defaults_untouched(self):
        _merged_settings({"notifications": {"volume": 0.1}})

        assert DEFAULT_SETTINGS["notifications"]["volume"] == 0.6


class TestSettingsRoutes:
    def test_requires_auth(self, client):
        assert client.get("/settings").status_code == 401
        assert client.put("/settings", json={"appearance": "dark"}).status_code == 401

    def test_round_trip(self, client, login):
        login(client)
        with client.session_transaction() as sess:
            sess["email_address"] = "someone@example.com"

        response = client.put(
            "/settings",
            json={"appearance": "dark", "notifications": {"volume": 0.25}},
        )
        assert response.status_code == 200

        stored = json.loads(client.get("/settings").data)["settings"]
        assert stored["appearance"] == "dark"
        assert stored["notifications"]["volume"] == 0.25
        # untouched keys keep their defaults
        assert stored["fontFamily"] == DEFAULT_SETTINGS["fontFamily"]

    def test_rejects_payload_with_nothing_valid(self, client, login):
        login(client)
        with client.session_transaction() as sess:
            sess["email_address"] = "someone@example.com"

        assert client.put("/settings", json={"appearance": "neon"}).status_code == 400

    def test_falls_back_to_gmail_profile_for_the_address(self, client, login):
        service = MagicMock()
        service.users.return_value.getProfile.return_value.execute.return_value = {
            "emailAddress": "profile@example.com"
        }

        login(client)

        with patch("email_service.get_gmail_service", return_value=service):
            response = client.get("/settings")

        assert response.status_code == 200
        assert json.loads(response.data)["settings"] == DEFAULT_SETTINGS
