# Slime Tutorials

A personal archive site publicly framed as slime tutorials, actually cataloguing musicals for now. The data model can grow to other formats later, but the site currently only shows and collects musicals.

## How it works

The public site is plain static HTML, CSS, and JS served by Cloudflare Pages, matching the scotch.quest style. There is no build step and no framework.

Every entry lives in two places:
- `entries/<id>.json`, a readable record of that one entry
- `data/entries.json`, the combined array the homepage actually loads

Visitors can submit a suggestion through `/suggest.html`. That form posts to a small Worker function that stores the suggestion in a Cloudflare KV namespace. Nothing on the live site changes at that point.

You review suggestions at `/admin.html`, which is protected by a password you set yourself (not a full login system, just a shared password). Approving a suggestion opens an editable form. Submitting it writes both `entries/<id>.json` and `data/entries.json` directly to your GitHub repo through the GitHub API. Cloudflare Pages watches the repo and rebuilds automatically once that commit lands, so the new entry appears on the site within a minute or two.

## Project structure

```
index.html          homepage, entry grid with filtering
entry.html           single entry page (reads ?id= from the URL)
suggest.html         public suggestion form
admin.html            password protected review panel
style.css             all shared styles
script.js, entry.js, suggest.js, admin.js
data/entries.json     the aggregate file the homepage reads
entries/              one JSON file per published entry, for history
functions/api/        Cloudflare Pages Functions (the small backend pieces)
assets/placeholder.svg
```

## Setup

1. Push this project to a new GitHub repo.
2. In Cloudflare Pages, create a project connected to that repo. Framework preset: none, build command: none, output directory: the repo root.
3. Create a KV namespace (Workers and Pages, KV, Create namespace) and bind it to the Pages project as `SUBMISSIONS`.
4. In the Pages project settings, add these environment variables:
   - `ADMIN_PASSWORD`, whatever password you want to use to log into `/admin.html`
   - `GITHUB_TOKEN`, a fine grained personal access token scoped to this one repo with read and write access to contents
   - `GITHUB_REPO`, in the form `yourusername/slime-tutorials`
   - `GITHUB_BRANCH`, optional, defaults to `main`
5. Point slimetutorials.com at the Pages project as a custom domain.

## Adding entries yourself

You do not need to go through the suggestion form for your own additions. You can either use the admin panel the same way a reviewed suggestion would work, or add a file to `entries/` and append the same object to `data/entries.json` directly in GitHub.

## Fields on an entry

- `id`, a short slug used in the URL, generated from the title
- `title`
- `poster`, a URL to the cover image
- `datePosted`
- `format`, musical, play, ebook, film, album, or other
- `tags`, an array of short strings
- `link`, where the piece can be read, watched, or listened to
- `description`

## Notes

- The sample entries in `data/entries.json` are placeholders. Replace or remove them once you have real content.
- Poster images are just URLs, so you can host them anywhere, including a folder you add under `assets/`.
- The admin password is sent as a bearer token on each request. It is adequate for a small personal tool but is not a full authentication system.
