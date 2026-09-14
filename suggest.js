const form = document.getElementById("suggestForm");
const status = document.getElementById("formStatus");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "Sending…";
  status.className = "form-status";

  const data = Object.fromEntries(new FormData(form).entries());
  data.format = "musical";

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Request failed");
    }

    status.textContent = "Received. Thank you for the suggestion.";
    status.className = "form-status ok";
    form.reset();
  } catch (err) {
    status.textContent = "Something went wrong. Please try again in a moment.";
    status.className = "form-status err";
  }
});
