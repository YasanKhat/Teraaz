# Sarva public capture (connectivity experiment)

A GitHub-hosted Chromium visits a small fixed set of public pages, captures rendered HTML, screenshots and same-origin static resources, and uploads them as a short-lived Actions artifact. Start by changing this directory on the session branch or, if the workflow is available for dispatch, run `gh workflow run sarva-capture.yml --ref arena/3c4e6c63-teraaz`. Inspect with `gh run list --workflow sarva-capture.yml`, then `gh run download RUN_ID -n sarva-public-capture -D OUTPUT`.

This is an **anonymous connectivity experiment**, not a complete site archive: it does not exercise games, measure multiple states or screen sizes, discover every route, archive API responses, log in, or capture subscription/account views. Pages may block hosted runners. Do not add credentials, session storage, personal data, cookies, or private account captures to public Actions artifacts. Avoid aggressive crawling.
