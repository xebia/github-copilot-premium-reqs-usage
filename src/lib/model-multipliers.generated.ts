// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.
//
// Source: https://github.com/rajbos/github-copilot-model-notifier (data/models.json)
// Updated by: scripts/update-model-multipliers.py (run daily via GitHub Actions)
//
// To make manual changes, edit `model-multipliers.legacy.ts` instead.

export const CURRENT_MODELS_SOURCE_RELEASE = 'models-2026-09-11-081258';

// Multipliers for paid plans (Business / Enterprise / Pro / Pro+).
// -1 = not available on this plan; 0 = included (free); >0 = premium.
export const CURRENT_MODEL_MULTIPLIERS_PAID: Record<string, number> = {
  'Claude Fable 5': 1,
  'Claude Fable 5.1': 1,
  'Claude Haiku 4.5': 1,
  'Claude Opus 4.7': 1,
  'Claude Opus 4.8': 1,
  'Claude Opus 4.8 (fast mode) (preview)': 1,
  'Claude Opus 5': 1,
  'Claude Sonnet 4.6': 1,
  'Claude Sonnet 5': 1,
  'Gemini 3.5 Flash': 1,
  'Gemini 3.6 Flash': 1,
  'Gemini 3.7 Flash': 1,
  'Gemini 3.8 Flash': 1,
  'GPT-5 mini': 1,
  'GPT-5.3-Codex': 1,
  'GPT-5.4': 1,
  'GPT-5.4 mini': 1,
  'GPT-5.4 nano': 1,
  'GPT-5.5': 1,
  'GPT-5.6 Luna': 1,
  'GPT-5.6 Sol': 1,
  'GPT-5.6 Terra': 1,
  'GPT-6 Astra': 1,
  'Grok 4.5': 1,
  'Grok 4.6': 1,
  'Kimi K2.7 Code': 1,
  'Kimi K3': 1,
  'MAI-Code-1.1-Flash': 1,
  'Qwen2.5': 1,
};

// Multipliers for Copilot Free plan.
// -1 = not available on free plan; 0 = included; >0 = premium.
export const CURRENT_MODEL_MULTIPLIERS_FREE: Record<string, number> = {
  'Claude Fable 5': 1,
  'Claude Fable 5.1': 1,
  'Claude Haiku 4.5': 1,
  'Claude Opus 4.7': 1,
  'Claude Opus 4.8': 1,
  'Claude Opus 4.8 (fast mode) (preview)': 1,
  'Claude Opus 5': 1,
  'Claude Sonnet 4.6': 1,
  'Claude Sonnet 5': 1,
  'Gemini 3.5 Flash': 1,
  'Gemini 3.6 Flash': 1,
  'Gemini 3.7 Flash': 1,
  'Gemini 3.8 Flash': 1,
  'GPT-5 mini': 1,
  'GPT-5.3-Codex': 1,
  'GPT-5.4': 1,
  'GPT-5.4 mini': 1,
  'GPT-5.4 nano': 1,
  'GPT-5.5': 1,
  'GPT-5.6 Luna': 1,
  'GPT-5.6 Sol': 1,
  'GPT-5.6 Terra': 1,
  'GPT-6 Astra': 1,
  'Grok 4.5': 1,
  'Grok 4.6': 1,
  'Kimi K2.7 Code': 1,
  'Kimi K3': 1,
  'MAI-Code-1.1-Flash': 1,
  'Qwen2.5': 1,
};

// Backward-compat alias — defaults to paid-plan multipliers.
export const CURRENT_MODEL_MULTIPLIERS = CURRENT_MODEL_MULTIPLIERS_PAID;

// Models with a 0x paid multiplier are included in the subscription and grouped as "Default".
export const CURRENT_DEFAULT_MODELS: string[] = [
];
