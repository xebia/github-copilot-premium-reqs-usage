// Backward-compatibility model entries.
//
// These entries cover legacy/historical model identifiers that may still appear
// in older GitHub Copilot CSV exports. They are maintained by hand and are
// intentionally NOT touched by the auto-update workflow.
//
// Values: -1 = not available on this plan; 0 = included (free); >0 = premium.
//
// Current (live) models live in `model-multipliers.generated.ts` and are
// refreshed daily from rajbos/github-copilot-model-notifier (data/models.json).
export const LEGACY_MODEL_MULTIPLIERS_PAID: Record<string, number> = {
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

// Free-plan multipliers for legacy models.
// Most older premium models were not available on Copilot Free (-1).
export const LEGACY_MODEL_MULTIPLIERS_FREE: Record<string, number> = {
  'gpt-4o-2024-11-20': 1,   // Copilot Free default model
  'gpt-4.1-2025-04-14': 1,  // Copilot Free default model
  'gpt-4o': 1,
  'gpt-4.1': 1,
  'gpt-4.5': -1,
  'gpt-4.1-vision': -1,
  'claude-sonnet-3.5': -1,
  'claude-sonnet-3.7': -1,
  'claude-sonnet-3.7-thinking': -1,
  'claude-sonnet-4': -1,
  'claude-opus-4': -1,
  'gemini-2.0-flash': 1,
  'gemini-2.5-pro': -1,
  'o1': -1,
  'o3': -1,
  'o3-mini': 1,
  'o3-mini-2025-01-31': 1,
  'o4-mini': 1,
  'o4-mini-2025-04-16': 1,
};

// Backward-compat alias.
export const LEGACY_MODEL_MULTIPLIERS = LEGACY_MODEL_MULTIPLIERS_PAID;

// Legacy default model identifiers (always grouped under "Default").
export const LEGACY_DEFAULT_MODELS: string[] = [
  'gpt-4o-2024-11-20',
  'gpt-4.1-2025-04-14',
];
