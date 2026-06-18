// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.
//
// Source: https://github.com/rajbos/github-copilot-model-notifier (data/models.json)
// Updated by: scripts/update-model-multipliers.py (run daily via GitHub Actions)
//
// To make manual changes, edit `model-multipliers.legacy.ts` instead.

export const CURRENT_MODELS_SOURCE_RELEASE = 'models-2026-06-10-091603';

// Multipliers for paid plans (Business / Enterprise / Pro / Pro+).
// -1 = not available on this plan; 0 = included (free); >0 = premium.
export const CURRENT_MODEL_MULTIPLIERS_PAID: Record<string, number> = {
  'Claude Fable 5': 1,
  'Claude Haiku 4.5': 1,
  'Claude Opus 4.5': 1,
  'Claude Opus 4.6': 1,
  'Claude Opus 4.6 (fast mode) (preview)': 1,
  'Claude Opus 4.7': 1,
  'Claude Opus 4.8': 1,
  'Claude Sonnet 4.5': 1,
  'Claude Sonnet 4.6': 1,
  'Gemini 2.5 Pro': 1,
  'Gemini 3 Flash': 1,
  'Gemini 3.1 Pro': 1,
  'Gemini 3.5 Flash': 1,
  'GPT-5 mini': 1,
  'GPT-5.3-Codex': 1,
  'GPT-5.4': 1,
  'GPT-5.4 mini': 1,
  'GPT-5.4 nano': 1,
  'GPT-5.5': 1,
  'MAI-Code-1-Flash': 1,
  'MAI-Code-1-Flash[^mai-code-1-flash]': 1,
  'Qwen2.5': 1,
  'Raptor mini': 1,
};

// Multipliers for Copilot Free plan.
// -1 = not available on free plan; 0 = included; >0 = premium.
export const CURRENT_MODEL_MULTIPLIERS_FREE: Record<string, number> = {
  'Claude Fable 5': 1,
  'Claude Haiku 4.5': 1,
  'Claude Opus 4.5': 1,
  'Claude Opus 4.6': 1,
  'Claude Opus 4.6 (fast mode) (preview)': 1,
  'Claude Opus 4.7': 1,
  'Claude Opus 4.8': 1,
  'Claude Sonnet 4.5': 1,
  'Claude Sonnet 4.6': 1,
  'Gemini 2.5 Pro': 1,
  'Gemini 3 Flash': 1,
  'Gemini 3.1 Pro': 1,
  'Gemini 3.5 Flash': 1,
  'GPT-5 mini': 1,
  'GPT-5.3-Codex': 1,
  'GPT-5.4': 1,
  'GPT-5.4 mini': 1,
  'GPT-5.4 nano': 1,
  'GPT-5.5': 1,
  'MAI-Code-1-Flash': 1,
  'MAI-Code-1-Flash[^mai-code-1-flash]': 1,
  'Qwen2.5': 1,
  'Raptor mini': 1,
};

// Backward-compat alias — defaults to paid-plan multipliers.
export const CURRENT_MODEL_MULTIPLIERS = CURRENT_MODEL_MULTIPLIERS_PAID;

// Models with a 0x paid multiplier are included in the subscription and grouped as "Default".
export const CURRENT_DEFAULT_MODELS: string[] = [
];
