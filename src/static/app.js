document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function setEmptyParticipantsState(participantsList) {
    if (participantsList.children.length !== 0) {
      return;
    }

    const emptyState = document.createElement("li");
    emptyState.className = "participants-empty";
    emptyState.textContent = "No participants yet";
    participantsList.appendChild(emptyState);
  }

  function addParticipantToCard(activityCard, activityName, email) {
    const participantsList = activityCard.querySelector(".participants-list");
    const availabilityCount = activityCard.querySelector(".availability-count");
    participantsList.querySelector(".participants-empty")?.remove();

    const participant = document.createElement("li");
    participant.className = "participant-item";

    const participantEmail = document.createElement("span");
    participantEmail.className = "participant-email";
    participantEmail.textContent = email;
    participant.appendChild(participantEmail);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-participant";
    removeButton.setAttribute("aria-label", `Remove ${email} from ${activityName}`);
    removeButton.title = `Remove ${email} from ${activityName}`;

    const trashIcon = document.createElement("span");
    trashIcon.className = "trash-icon";
    trashIcon.setAttribute("aria-hidden", "true");
    removeButton.appendChild(trashIcon);

    removeButton.addEventListener("click", async () => {
      removeButton.disabled = true;

      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.detail || "Unable to remove participant");
        }

        participant.remove();
        availabilityCount.textContent = String(Number(availabilityCount.textContent) + 1);
        setEmptyParticipantsState(participantsList);
      } catch (error) {
        removeButton.disabled = false;
        messageDiv.textContent = error.message || "Failed to remove participant";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        console.error("Error removing participant:", error);
      }
    });

    participant.appendChild(removeButton);
    participantsList.appendChild(participant);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activityName = name;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="availability-count">${spotsLeft}</span> spots left</p>
        `;
        const availabilityCount = activityCard.querySelector(".availability-count");

        const participantsHeading = document.createElement("h5");
        participantsHeading.className = "participants-heading";
        participantsHeading.textContent = "Participants";
        activityCard.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        activityCard.appendChild(participantsList);
        details.participants.forEach((email) => {
          addParticipantToCard(activityCard, name, email);
        });
        setEmptyParticipantsState(participantsList);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        const activityCard = Array.from(activitiesList.querySelectorAll(".activity-card"))
          .find((card) => card.dataset.activityName === activity);
        if (activityCard) {
          addParticipantToCard(activityCard, activity, email);
          const availabilityCount = activityCard.querySelector(".availability-count");
          availabilityCount.textContent = String(Number(availabilityCount.textContent) - 1);
        }
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
