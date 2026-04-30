// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.
//
// Source: https://github.com/rajbos/github-copilot-model-notifier (latest release)
// Updated by: scripts/update-model-multipliers.py (run daily via GitHub Actions)
//
// To make manual changes, edit `model-multipliers.legacy.ts` instead.

export const CURRENT_MODELS_SOURCE_RELEASE = 'models-2026-04-25-082151';

export const CURRENT_MODEL_MULTIPLIERS: Record<string, number> = {
  'Claude Haiku 4.5': 0.33,
  'Claude Opus 4.5': 3,
  'Claude Opus 4.6': 3,
  'Claude Sonnet 4': 1,
  'Claude Sonnet 4.5': 1,
  'Claude Sonnet 4.6': 1,
  'Gemini 2.5 Pro': 1,
  'Gemini 3 Flash': 0.33,
  'Gemini 3.1 Pro': 1,
  'GPT-4.1': 0,
  'GPT-5 mini': 0,
  'GPT-5.2': 1,
  'GPT-5.2-Codex': 1,
  'GPT-5.3-Codex': 1,
  'GPT-5.4': 1,
  'GPT-5.4 mini': 0.33,
  'GPT-5.4 nano': 0.25,
  'GPT-5.5': 7.5
};

// Models with a 0x multiplier (free) are treated as "Default" and grouped together.
export const CURRENT_DEFAULT_MODELS: string[] = [
  'GPT-4.1',
  'GPT-5 mini',
];
