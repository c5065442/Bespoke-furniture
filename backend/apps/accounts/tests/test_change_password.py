import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User

pytestmark = pytest.mark.django_db

CHANGE_PASSWORD_URL = "/api/v1/auth/change-password/"


@pytest.fixture
def user():
    return User.objects.create_user(username="alice", email="alice@example.com", password="OldPass123!")


@pytest.fixture
def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


class TestChangePassword:
    def test_requires_authentication(self):
        client = APIClient()
        response = client.post(CHANGE_PASSWORD_URL, {"current_password": "x", "new_password": "y"})
        assert response.status_code == 401

    def test_rejects_wrong_current_password(self, auth_client):
        response = auth_client.post(
            CHANGE_PASSWORD_URL, {"current_password": "WrongPass!", "new_password": "NewStrongPass456!"}
        )
        assert response.status_code == 400
        assert "current_password" in response.data

    def test_rejects_weak_new_password(self, auth_client):
        response = auth_client.post(CHANGE_PASSWORD_URL, {"current_password": "OldPass123!", "new_password": "123"})
        assert response.status_code == 400
        assert "new_password" in response.data

    def test_rejects_same_password_as_current(self, auth_client):
        response = auth_client.post(
            CHANGE_PASSWORD_URL, {"current_password": "OldPass123!", "new_password": "OldPass123!"}
        )
        assert response.status_code == 400

    def test_changes_password_successfully(self, auth_client, user):
        response = auth_client.post(
            CHANGE_PASSWORD_URL, {"current_password": "OldPass123!", "new_password": "NewStrongPass456!"}
        )
        assert response.status_code == 200

        user.refresh_from_db()
        assert user.check_password("NewStrongPass456!")
        assert not user.check_password("OldPass123!")

    def test_can_log_in_with_new_password_after_change(self, auth_client, user):
        auth_client.post(CHANGE_PASSWORD_URL, {"current_password": "OldPass123!", "new_password": "NewStrongPass456!"})

        login_client = APIClient()
        response = login_client.post(
            "/api/v1/auth/token/", {"username": "alice", "password": "NewStrongPass456!"}
        )
        assert response.status_code == 200
        assert "access" in response.data
