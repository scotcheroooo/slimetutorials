const loginPanel = document.getElementById("loginPanel");
const pendingSection = document.getElementById("pendingSection");
const pendingList = document.getElementById("pendingList");
const pendingEmpty = document.getElementById("pendingEmpty");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const passwordInput = document.getElementById("password");
const loginStatus = document.getElementById("loginStatus");
const editFormTemplate = document.getElementById("editFormTemplate");

function getPassword() {
  return sessionStorage.getItem("st_admin_password");
}

function authHeaders() {
  return { Authorization: `Bearer ${getPassword()}` };
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function loadPending() {
  const res = await fetch("/api/pending", { headers: authHeaders() });

  if (res.status === 401) {
    sessionStorage.removeItem("st_admin_password");
    showLogin("Password incorrect.");
    return;
  }

  const submissions = await res.json();
  renderPending(submissions);
}

function renderPending(submissions) {
  pendingList.innerHTML = "";
  pendingEmpty.hidden = submissions.length !== 0;

  submissions.forEach((sub) => {
    const item = document.createElement("div");
    item.className = "pending-item";
    item.innerHTML = `
      <img class="pending-poster" src="${sub.poster || "/assets/placeholder.svg"}" alt="">
      <div>
        <p class="pending-title">${sub.title}</p>
        <p class="pending-meta">${sub.format || "unknown format"} — submitted by ${sub.submittedBy || "anonymous"}</p>
        <p class="pending-meta">${sub.notes || ""}</p>
      </div>
      <div class="pending-actions">
        <button class="btn btn-solid approve-btn">Approve</button>
        <button class="btn btn-quiet reject-btn">Reject</button>
      </div>
    `;

    item.querySelector(".approve-btn").addEventListener("click", () => openEditForm(item, sub));
    item.querySelector(".reject-btn").addEventListener("click", () => rejectSubmission(sub.id, item));

    pendingList.appendChild(item);
  });
}

function openEditForm(item, sub) {
  const existing = item.querySelector(".edit-form");
  if (existing) {
    existing.remove();
    return;
  }

  const fragment = editFormTemplate.content.cloneNode(true);
  const form = fragment.querySelector(".edit-form");

  form.title.value = sub.title || "";
  form.poster.value = sub.poster || "/assets/placeholder.svg";
  form.datePosted.value = new Date().toISOString().slice(0, 10);
  form.tags.value = "";
  form.link.value = sub.link || "";
  form.description.value = sub.notes || "";

  form.querySelector(".cancel-edit").addEventListener("click", () => form.remove());

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector(".form-status");
    status.textContent = "Publishing…";
    status.className = "form-status";

    const entry = {
      id: slugify(form.title.value),
      title: form.title.value,
      format: "musical",
      poster: form.poster.value,
      datePosted: form.datePosted.value,
      tags: form.tags.value.split(",").map((t) => t.trim()).filter(Boolean),
      link: form.link.value,
      description: form.description.value,
    };

    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ submissionId: sub.id, entry }),
      });

      if (!res.ok) throw new Error("Publish failed");

      status.textContent = "Published. It will appear on the site after the next build.";
      status.className = "form-status ok";
      item.remove();
    } catch (err) {
      status.textContent = "Something went wrong publishing this entry.";
      status.className = "form-status err";
    }
  });

  item.appendChild(form);
}

async function rejectSubmission(id, item) {
  try {
    const res = await fetch("/api/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ submissionId: id }),
    });

    if (!res.ok) throw new Error("Reject failed");
    item.remove();
  } catch (err) {
    alert("Could not reject this submission. Please try again.");
  }
}

function showLogin(message) {
  loginPanel.hidden = false;
  pendingSection.hidden = true;
  logoutBtn.hidden = true;
  loginStatus.textContent = message || "";
  loginStatus.className = "form-status err";
}

function showPending() {
  loginPanel.hidden = true;
  pendingSection.hidden = false;
  logoutBtn.hidden = false;
  loadPending();
}

loginBtn.addEventListener("click", () => {
  const value = passwordInput.value.trim();
  if (!value) return;
  sessionStorage.setItem("st_admin_password", value);
  showPending();
});

passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loginBtn.click();
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("st_admin_password");
  showLogin();
});

if (getPassword()) {
  showPending();
} else {
  showLogin();
}
