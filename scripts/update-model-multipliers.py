#!/usr/bin/env python3
"""
Regenerate `src/lib/model-multipliers.generated.ts` from the live model data
published by rajbos/github-copilot-model-notifier.

Model data is read from `data/models.json` in that repo (always at `main`),
which contains structured fields including `multiplier_paid` and
`multiplier_free`.  The latest GitHub release is still fetched for its
`tag_name` so we can record a meaningful provenance comment.

The companion file `model-multipliers.legacy.ts` contains hand-maintained
backward-compat entries and is never touched here.

Usage:
    python scripts/update-model-multipliers.py

Env:
    GITHUB_TOKEN  Optional. Used to authenticate GitHub API requests.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

MODELS_JSON_URL = (
    "https://raw.githubusercontent.com/rajbos/"
    "github-copilot-model-notifier/main/data/models.json"
)
RELEASE_URL = (
    "https://api.github.com/repos/rajbos/"
    "github-copilot-model-notifier/releases/latest"
)
REPO_ROOT = Path(__file__).resolve().parent.parent
GENERATED_PATH = REPO_ROOT / "src" / "lib" / "model-multipliers.generated.ts"

# Sentinel: model not available on this plan
NOT_APPLICABLE: float = -1.0


def _fetch(url: str, *, github_api: bool = False) -> bytes:
    """Fetch *url* and return the raw response body."""
    headers: dict[str, str] = {
        "User-Agent": "github-copilot-premium-reqs-usage-updater",
    }
    if github_api:
        headers["Accept"] = "application/vnd.github+json"
        token = os.environ.get("GITHUB_TOKEN")
        if token:
            headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        sys.stderr.write(f"HTTP error {e.code} fetching {url}: {e.reason}\n")
        raise


def fetch_tag_name() -> str:
    """Return the tag_name of the latest release (used for provenance only)."""
    data = json.loads(_fetch(RELEASE_URL, github_api=True).decode("utf-8"))
    return data.get("tag_name", "<unknown>")


def parse_multiplier(raw: str, model_name: str, field: str) -> float:
    """Convert a raw multiplier string to a float.

    Rules:
      ""                  -> 1.0   (no data yet; treat as 1 premium request)
      "Not applicable"    -> -1.0  (model not available on this plan)
      "0", "0.33", …      -> the numeric value
    """
    raw = raw.strip()
    if raw == "":
        return 1.0
    if raw.lower() == "not applicable":
        return NOT_APPLICABLE
    try:
        return float(raw)
    except ValueError:
        sys.stderr.write(
            f"Warning: {model_name!r} {field}={raw!r} unparseable, defaulting to 1\n"
        )
        return 1.0


def fetch_models() -> dict[str, tuple[float, float]]:
    """Fetch data/models.json and return {name: (paid, free)} mappings."""
    raw = _fetch(MODELS_JSON_URL).decode("utf-8")
    data: dict = json.loads(raw)

    models: dict[str, tuple[float, float]] = {}
    for name, info in data.items():
        paid = parse_multiplier(
            info.get("multiplier_paid", ""), name, "multiplier_paid"
        )
        free = parse_multiplier(
            info.get("multiplier_free", ""), name, "multiplier_free"
        )
        models[name] = (paid, free)

    if not models:
        raise ValueError("Fetched zero models from data/models.json.")
    return models


def format_multiplier(value: float) -> str:
    """Render a multiplier as a JS/TS literal."""
    if value == int(value):
        return str(int(value))
    return repr(value)


def js_string_literal(s: str) -> str:
    """Render a string as a single-quoted JS/TS literal."""
    escaped = s.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{escaped}'"


def render_generated_file(
    models: dict[str, tuple[float, float]], tag_name: str
) -> str:
    sorted_names = sorted(models.keys(), key=str.lower)
    # Default models: paid multiplier == 0 (included in subscription)
    default_names = [n for n in sorted_names if models[n][0] == 0]

    lines = [
        "// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.",
        "//",
        "// Source: https://github.com/rajbos/github-copilot-model-notifier"
        " (data/models.json)",
        "// Updated by: scripts/update-model-multipliers.py"
        " (run daily via GitHub Actions)",
        "//",
        "// To make manual changes, edit `model-multipliers.legacy.ts` instead.",
        "",
        f"export const CURRENT_MODELS_SOURCE_RELEASE ="
        f" {js_string_literal(tag_name)};",
        "",
        "// Multipliers for paid plans (Business / Enterprise / Pro / Pro+).",
        "// -1 = not available on this plan; 0 = included (free); >0 = premium.",
        "export const CURRENT_MODEL_MULTIPLIERS_PAID:"
        " Record<string, number> = {",
    ]
    for name in sorted_names:
        lines.append(
            f"  {js_string_literal(name)}:"
            f" {format_multiplier(models[name][0])},"
        )
    lines.append("};")
    lines.append("")
    lines.append(
        "// Multipliers for Copilot Free plan."
    )
    lines.append(
        "// -1 = not available on free plan; 0 = included; >0 = premium."
    )
    lines.append(
        "export const CURRENT_MODEL_MULTIPLIERS_FREE:"
        " Record<string, number> = {"
    )
    for name in sorted_names:
        lines.append(
            f"  {js_string_literal(name)}:"
            f" {format_multiplier(models[name][1])},"
        )
    lines.append("};")
    lines.append("")
    lines.append(
        "// Backward-compat alias — defaults to paid-plan multipliers."
    )
    lines.append(
        "export const CURRENT_MODEL_MULTIPLIERS ="
        " CURRENT_MODEL_MULTIPLIERS_PAID;"
    )
    lines.append("")
    lines.append(
        "// Models with a 0x paid multiplier are included in the subscription"
        ' and grouped as "Default".'
    )
    lines.append("export const CURRENT_DEFAULT_MODELS: string[] = [")
    for name in default_names:
        lines.append(f"  {js_string_literal(name)},")
    lines.append("];")
    lines.append("")  # trailing newline
    return "\n".join(lines)


def parse_existing_paid(content: str) -> dict[str, float]:
    """Parse the existing CURRENT_MODEL_MULTIPLIERS_PAID block for a diff."""
    import re
    m = re.search(
        r"CURRENT_MODEL_MULTIPLIERS_PAID[^=]*=\s*\{(.*?)\};",
        content,
        re.DOTALL,
    )
    if not m:
        # Fall back to the old single-block format
        m = re.search(
            r"CURRENT_MODEL_MULTIPLIERS[^=P][^=]*=\s*\{(.*?)\};",
            content,
            re.DOTALL,
        )
    if not m:
        return {}
    body = m.group(1)
    models: dict[str, float] = {}
    entry_re = re.compile(r"'((?:\\'|[^'])*)'\s*:\s*(-?[0-9.]+)")
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
    old: dict[str, float], new: dict[str, tuple[float, float]], tag_name: str
) -> None:
    new_paid = {n: v[0] for n, v in new.items()}
    added = sorted(set(new_paid) - set(old), key=str.lower)
    removed = sorted(set(old) - set(new_paid), key=str.lower)
    changed = sorted(
        (n for n in set(new_paid) & set(old) if old[n] != new_paid[n]),
        key=str.lower,
    )

    print(f"Source: {tag_name}")
    if not (added or removed or changed):
        print("No model changes detected.")
        return
    if added:
        print("Added:")
        for n in added:
            print(f"  + {n} (paid={format_multiplier(new_paid[n])},"
                  f" free={format_multiplier(new[n][1])})")
    if removed:
        print("Removed:")
        for n in removed:
            print(f"  - {n} (was paid={format_multiplier(old[n])})")
    if changed:
        print("Changed:")
        for n in changed:
            print(
                f"  ~ {n}: paid {format_multiplier(old[n])}"
                f" -> {format_multiplier(new_paid[n])}"
            )


def main() -> int:
    tag_name = fetch_tag_name()
    new_models = fetch_models()

    old_content = (
        GENERATED_PATH.read_text(encoding="utf-8")
        if GENERATED_PATH.exists()
        else ""
    )
    old_models = parse_existing_paid(old_content)

    new_content = render_generated_file(new_models, tag_name)

    if new_content == old_content:
        print(f"Source: {tag_name}")
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
