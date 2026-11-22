# Anonymous public Sarva capture

This workflow runs Chromium on GitHub Actions. It captures selected public page DOMs, screenshots, public same-origin static resources, and a few explicitly named, non-submitting interactions. It records limited layout metrics for those interactions. Start a run by updating this directory on the session branch. (GitHub may not allow manual dispatch until the workflow exists on the default branch.)

After the run finishes, retrieve its capture using:

```
python3 tools/sarva-capture/download.py RUN_ID /tmp/sarva-capture
```

The workflow uploads a 3-day Actions artifact and also creates **unreferenced Git blob objects**, without making commits or modifying refs, so the restricted agent environment can read public captures using GitHub's API. Their IDs are public and GitHub may garbage-collect them; this is not durable storage. The downloader verifies each Git object hash. Large resources over 2 MiB, resources with query strings, API responses and third-party resources are not included in Git objects.

**Coverage is incomplete:** the route list is not the full sitemap; most games are captured only in their initial state; there is no mobile capture, full network archive, authenticated session, account, subscription or privileged content. Do not use real credentials, cookies, session state, or private account data here: this repository and its Git objects are public. No claim of complete site parity follows from a successful run.
