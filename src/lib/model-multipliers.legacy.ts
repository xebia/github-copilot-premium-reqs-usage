// Backward-compatibility model entries.
//
// These entries cover legacy/historical model identifiers that may still appear
// in older GitHub Copilot CSV exports. They are maintained by hand and are
// intentionally NOT touched by the auto-update workflow.
//
// With usage-based billing, model multipliers no longer apply — all premium
// requests count as 1 PRU each. A value of 0 means the model is included in
// the subscription (free/default); 1 means it consumes premium requests.
//
// Current (live) models live in `model-multipliers.generated.ts` and are
// refreshed daily from rajbos/github-copilot-model-notifier.
export const LEGACY_MODEL_MULTIPLIERS: Record<string, number> = {
  'gpt-4o-2024-11-20': 0,
  'gpt-4.1-2025-04-14': 0,
  'gpt-4o': 0,
  'gpt-4.1': 0,
  'gpt-4.5': 1,
  'gpt-4.1-vision': 0,
  'claude-sonnet-3.5': 1,
  'claude-sonnet-3.7': 1,
  'claude-sonnet-3.7-thinking': 1,
  'claude-sonnet-4': 1,
  'claude-opus-4': 1,
  'gemini-2.0-flash': 1,
  'gemini-2.5-pro': 1,
  'o1': 1,
  'o3': 1,
  'o3-mini': 1,
  'o3-mini-2025-01-31': 1,
  'o4-mini': 1,
  'o4-mini-2025-04-16': 1,
};

// Legacy default model identifiers (always grouped under "Default").
export const LEGACY_DEFAULT_MODELS: string[] = [
  'gpt-4o-2024-11-20',
  'gpt-4.1-2025-04-14',
];
