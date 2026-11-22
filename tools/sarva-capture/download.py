#!/usr/bin/env python3
"""Download a public capture made by the Actions workflow through GitHub's Git API.

Requires gh authentication with read access. Blobs are unreferenced Git objects, so
GitHub may garbage-collect them. Output is a scratch directory, not versioned data.
"""
import argparse
import base64
import concurrent.futures
import hashlib
import json
from pathlib import Path
import subprocess

REPO = 'YasanKhat/Teraaz'

def api(endpoint):
    return json.loads(subprocess.check_output(['gh', 'api', '--paginate', endpoint]))

def blob(sha):
    result = api(f'repos/{REPO}/git/blobs/{sha}')
    data = base64.b64decode(result['content'])
    actual = hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()
    if actual != sha:
        raise ValueError(f'Git blob hash mismatch: {sha}')
    return data

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('run_id', type=int)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    jobs = api(f'repos/{REPO}/actions/runs/{args.run_id}/jobs')['jobs']
    indices = []
    for job in jobs:
        annotations = api(f'repos/{REPO}/check-runs/{job["id"]}/annotations')
        indices.extend(x['message'] for x in annotations if x.get('title') == 'CaptureIndex')
    if len(indices) != 1 or len(indices[0]) != 40:
        raise ValueError(f'Expected one capture index, found {indices!r}')
    index_bytes = blob(indices[0])
    index = json.loads(index_bytes)
    root = args.destination.resolve()
    root.mkdir(parents=True, exist_ok=True)
    (root / 'blob-index.json').write_bytes(index_bytes)
    def download(item):
        target = (root / item['file']).resolve()
        if not target.is_relative_to(root):
            raise ValueError(f'Unsafe path: {item["file"]}')
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(blob(item['gitBlob']))
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(download, index['files']))
    print(f"Downloaded and verified {len(index['files'])} files to {root}")

if __name__ == '__main__':
    main()
