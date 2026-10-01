from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


@pytest.fixture
def client():
	original_activities = deepcopy(activities)

	with TestClient(app) as test_client:
		yield test_client

	activities.clear()
	activities.update(original_activities)


def test_get_activities_returns_all_activities(client):
	response = client.get("/activities")

	assert response.status_code == 200
	assert "Chess Club" in response.json()
	assert response.json()["Chess Club"]["participants"] == [
		"michael@mergington.edu",
		"daniel@mergington.edu",
	]


def test_signup_adds_student_to_activity(client):
	response = client.post(
		"/activities/Chess Club/signup",
		params={"email": "student@mergington.edu"},
	)

	assert response.status_code == 200
	assert response.json() == {
		"message": "Signed up student@mergington.edu for Chess Club"
	}
	assert "student@mergington.edu" in activities["Chess Club"]["participants"]


def test_signup_returns_not_found_for_unknown_activity(client):
	response = client.post(
		"/activities/Unknown Club/signup",
		params={"email": "student@mergington.edu"},
	)

	assert response.status_code == 404
	assert response.json() == {"detail": "Activity not found"}


def test_signup_returns_bad_request_for_existing_student(client):
	response = client.post(
		"/activities/Chess Club/signup",
		params={"email": "michael@mergington.edu"},
	)

	assert response.status_code == 400
	assert response.json() == {
		"detail": "Student already signed up for this activity"
	}


def test_remove_signup_removes_student_from_activity(client):
	response = client.delete(
		"/activities/Chess Club/signup",
		params={"email": "michael@mergington.edu"},
	)

	assert response.status_code == 200
	assert response.json() == {
		"message": "Removed michael@mergington.edu from Chess Club"
	}
	assert "michael@mergington.edu" not in activities["Chess Club"]["participants"]


def test_remove_signup_returns_not_found_for_unknown_activity(client):
	response = client.delete(
		"/activities/Unknown Club/signup",
		params={"email": "student@mergington.edu"},
	)

	assert response.status_code == 404
	assert response.json() == {"detail": "Activity not found"}


def test_remove_signup_returns_not_found_for_unknown_student(client):
	response = client.delete(
		"/activities/Chess Club/signup",
		params={"email": "student@mergington.edu"},
	)

	assert response.status_code == 404
	assert response.json() == {
		"detail": "Student is not signed up for this activity"
	}
