// Homepage rendering for Slime Tutorials.
// Reads /data/entries.json, a flat array built from the individual
// show files in /entries at deploy time (see README for the
// approve to commit workflow).

const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function cardTemplate(entry) {
  const a = document.createElement("a");
  a.className = "card";
  a.href = `/entry.html?id=${encodeURIComponent(entry.id)}`;

  a.innerHTML = `
    <img class="card-poster" src="${entry.poster}" alt="Poster for ${entry.title}" loading="lazy">
    <div class="card-body">
      <p class="card-tag">${entry.format}</p>
      <h3 class="card-title">${entry.title}</h3>
      <div class="card-meta">
        <span>${formatDate(entry.datePosted)}</span>
      </div>
    </div>
  `;
  return a;
}

fetch("/data/entries.json")
  .then((res) => res.json())
  .then((entries) => {
    emptyState.hidden = entries.length !== 0;
    entries
      .slice()
      .sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted))
      .forEach((entry) => grid.appendChild(cardTemplate(entry)));
  })
  .catch(() => {
    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = "Could not load the archive";
    emptyState.querySelector("p").textContent = "Check that data/entries.json is reachable.";
  });
