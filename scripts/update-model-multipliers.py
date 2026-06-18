#!/usr/bin/env python3
"""
Regenerate `src/lib/model-multipliers.generated.ts` from the latest release of
rajbos/github-copilot-model-notifier.

The source repo publishes a markdown table of current models in the release body
under a `### Current Models` heading. This script parses that table and fully
overwrites the generated TypeScript file. The companion file
`model-multipliers.legacy.ts` contains hand-maintained backward-compat entries
and is never touched here.

Usage:
    python scripts/update-model-multipliers.py

Env:
    GITHUB_TOKEN  Optional. Used to authenticate the GitHub API request.
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

RELEASE_URL = (
    "https://api.github.com/repos/rajbos/"
    "github-copilot-model-notifier/releases/latest"
)
REPO_ROOT = Path(__file__).resolve().parent.parent
GENERATED_PATH = REPO_ROOT / "src" / "lib" / "model-multipliers.generated.ts"


def fetch_latest_release() -> dict:
    """Fetch the latest release JSON from the source repo."""
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "github-copilot-premium-reqs-usage-updater",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(RELEASE_URL, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        sys.stderr.write(
            f"HTTP error {e.code} fetching latest release: {e.reason}\n"
        )
        raise


def parse_models_table(body: str) -> dict[str, float]:
    """Parse the `### Current Models` markdown table from the release body.

    Returns a mapping of model name -> paid multiplier (float).
    Multiplier 'Not applicable' is mapped to 0.
    """
    if not body:
        raise ValueError("Release body is empty; cannot parse models table.")

    m = re.search(
        r"###\s+Current Models\s*\n(.+?)(?=\n#{1,6}\s|\Z)",
        body,
        re.DOTALL,
    )
    if not m:
        raise ValueError(
            "Could not find '### Current Models' section in release body."
        )
    section = m.group(1)

    models: dict[str, float] = {}
    for line in section.splitlines():
        line = line.strip()
        if not line.startswith("|") or not line.endswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 3:
            continue
        if cells[0].lower() == "model":
            continue
        if set(cells[0]) <= set("-: "):
            continue

        name = cells[0]
        raw_mult = cells[2]
        if raw_mult.lower() == "not applicable":
            mult: float = 0.0
        elif raw_mult == "":
            # Multiplier data not available in source; default to 1 premium request.
            sys.stderr.write(
                f"Warning: {name!r} has no multiplier in source - defaulting to 1\n"
            )
            mult = 1.0
        else:
            try:
                mult = float(raw_mult)
            except ValueError:
                sys.stderr.write(
                    f"Warning: skipping {name!r} - "
                    f"unparseable multiplier {raw_mult!r}\n"
                )
                continue
        models[name] = mult

    if not models:
        raise ValueError("Parsed zero models from release body.")
    return models


def format_multiplier(value: float) -> str:
    """Render a multiplier as JS/TS literal: drop .0 for whole numbers."""
    if value == int(value):
        return str(int(value))
    return repr(value)


def js_string_literal(s: str) -> str:
    """Render a string as a single-quoted JS/TS literal."""
    escaped = s.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{escaped}'"


def render_generated_file(models: dict[str, float], tag_name: str) -> str:
    sorted_names = sorted(models.keys(), key=str.lower)
    default_names = [n for n in sorted_names if models[n] == 0]

    lines = [
        "// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.",
        "//",
        "// Source: https://github.com/rajbos/github-copilot-model-notifier (latest release)",
        "// Updated by: scripts/update-model-multipliers.py (run daily via GitHub Actions)",
        "//",
        "// To make manual changes, edit `model-multipliers.legacy.ts` instead.",
        "",
        f"export const CURRENT_MODELS_SOURCE_RELEASE = {js_string_literal(tag_name)};",
        "",
        "export const CURRENT_MODEL_MULTIPLIERS: Record<string, number> = {",
    ]
    for name in sorted_names:
        lines.append(
            f"  {js_string_literal(name)}: {format_multiplier(models[name])},"
        )
    lines.append("};")
    lines.append("")
    lines.append(
        "// Models with a 0x multiplier (free) are treated as \"Default\" "
        "and grouped together."
    )
    lines.append("export const CURRENT_DEFAULT_MODELS: string[] = [")
    for name in default_names:
        lines.append(f"  {js_string_literal(name)},")
    lines.append("];")
    lines.append("")  # trailing newline
    return "\n".join(lines)


def parse_existing_models(content: str) -> dict[str, float]:
    """Parse the existing CURRENT_MODEL_MULTIPLIERS object for a diff summary."""
    m = re.search(
        r"CURRENT_MODEL_MULTIPLIERS[^=]*=\s*\{(.*?)\};",
        content,
        re.DOTALL,
    )
    if not m:
        return {}
    body = m.group(1)
    models: dict[str, float] = {}
    entry_re = re.compile(r"'((?:\\'|[^'])*)'\s*:\s*([0-9.]+)")
    for line in body.splitlines():
        line = line.split("//", 1)[0]
        em = entry_re.search(line)
        if em:
            name = em.group(1).replace("\\'", "'")
            try:
                models[name] = float(em.group(2))
            except ValueError:
                continue
    return models


def print_diff_summary(
    old: dict[str, float], new: dict[str, float], tag_name: str
) -> None:
    added = sorted(set(new) - set(old), key=str.lower)
    removed = sorted(set(old) - set(new), key=str.lower)
    changed = sorted(
        (n for n in set(new) & set(old) if old[n] != new[n]), key=str.lower
    )

    print(f"Source release: {tag_name}")
    if not (added or removed or changed):
        print("No model changes detected.")
        return
    if added:
        print("Added:")
        for n in added:
            print(f"  + {n} = {format_multiplier(new[n])}")
    if removed:
        print("Removed:")
        for n in removed:
            print(f"  - {n} (was {format_multiplier(old[n])})")
    if changed:
        print("Changed:")
        for n in changed:
            print(
                f"  ~ {n}: {format_multiplier(old[n])} -> "
                f"{format_multiplier(new[n])}"
            )


def main() -> int:
    release = fetch_latest_release()
    tag_name = release.get("tag_name", "<unknown>")
    body = release.get("body") or ""

    new_models = parse_models_table(body)

    old_content = (
        GENERATED_PATH.read_text(encoding="utf-8")
        if GENERATED_PATH.exists()
        else ""
    )
    old_models = parse_existing_models(old_content)

    new_content = render_generated_file(new_models, tag_name)

    if new_content == old_content:
        print(f"Source release: {tag_name}")
        print(
            f"{GENERATED_PATH.relative_to(REPO_ROOT)} is already up to date."
        )
        return 0

    GENERATED_PATH.write_text(new_content, encoding="utf-8")
    print_diff_summary(old_models, new_models, tag_name)
    print(f"Updated {GENERATED_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
