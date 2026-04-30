// Backward-compatibility model multipliers.
//
// These entries cover legacy/historical model identifiers that may still appear
// in older GitHub Copilot CSV exports. They are maintained by hand and are
// intentionally NOT touched by the auto-update workflow.
//
// Current (live) model multipliers live in `model-multipliers.generated.ts`
// and are refreshed daily from rajbos/github-copilot-model-notifier.
export const LEGACY_MODEL_MULTIPLIERS: Record<string, number> = {
  'gpt-4o-2024-11-20': 0,
  'gpt-4.1-2025-04-14': 0,
  'gpt-4o': 0,
  'gpt-4.1': 0,
  'gpt-4.5': 50,
  'gpt-4.1-vision': 0,
  'claude-sonnet-3.5': 1,
  'claude-sonnet-3.7': 1,
  'claude-sonnet-3.7-thinking': 1.25,
  'claude-sonnet-4': 1,
  'claude-opus-4': 10,
  'gemini-2.0-flash': 0.25,
  'gemini-2.5-pro': 1,
  'o1': 10,
  'o3': 1,
  'o3-mini': 0.33,
  'o3-mini-2025-01-31': 0.33,
  'o4-mini': 0.33,
  'o4-mini-2025-04-16': 0.33,
};

// Legacy default model identifiers (always grouped under "Default").
export const LEGACY_DEFAULT_MODELS: string[] = [
  'gpt-4o-2024-11-20',
  'gpt-4.1-2025-04-14',
];
