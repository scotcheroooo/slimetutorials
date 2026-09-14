// Populates entry.html based on the id in the query string.

const root = document.getElementById("entryRoot");

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function renderEntry(entry) {
  document.title = `${entry.title} — Slime Tutorials`;

  root.innerHTML = `
    <div class="entry-layout">
      <div>
        <img class="entry-poster" src="${entry.poster}" alt="Poster for ${entry.title}">
      </div>
      <div>
        <h1 class="entry-title">${entry.title}</h1>
        <div class="entry-tags">
          <span class="entry-tag">${entry.format}</span>
          ${entry.tags.map((t) => `<span class="entry-tag">${t}</span>`).join("")}
        </div>

        <div class="entry-specs">
          <div>
            <p class="spec-label">Date posted</p>
            <p class="spec-value">${formatDate(entry.datePosted)}</p>
          </div>
          <div>
            <p class="spec-label">Format</p>
            <p class="spec-value">${entry.format}</p>
          </div>
        </div>

        <div class="entry-description">
          <p>${entry.description}</p>
        </div>

        ${entry.link ? `<p style="margin-top: 24px;"><a class="btn btn-solid" href="${entry.link}" target="_blank" rel="noopener">Open full record</a></p>` : ""}
      </div>
    </div>
  `;
}

function renderNotFound() {
  root.innerHTML = `
    <div style="padding: 60px 0;">
      <h1 class="entry-title">Show not found</h1>
      <p style="color: var(--ink-dim);">This one may have closed. <a href="/">Return to the archive</a>.</p>
    </div>
  `;
}

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

fetch("/data/entries.json")
  .then((res) => res.json())
  .then((entries) => {
    const entry = entries.find((e) => e.id === id);
    if (entry) {
      renderEntry(entry);
    } else {
      renderNotFound();
    }
  })
  .catch(renderNotFound);
