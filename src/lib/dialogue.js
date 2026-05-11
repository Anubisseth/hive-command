// =============================================
// HIVE COMMAND — Dialogue Snippets
// Short, dashboard-toned phrases for talking interactions
// =============================================

const SNIPPETS = {
  active: [
    'Got that brief — looping in.',
    'Pipeline\'s green, pushing through.',
    'Numbers held up after the audit.',
    'Hand-off ready when you are.',
    'Approved. Moving to staging.',
    'I\'ll take the next batch.',
    'Quick sync on the deliverable?',
  ],
  idle: [
    'Coffee\'s burnt again.',
    'Anyone seen the latest brief?',
    'Standby for next directive.',
    'Logs are clear on my end.',
    'Took a minute — back at it.',
  ],
  reviewing: [
    'Output\'s solid — minor edits.',
    'Score is a 7. Approving.',
    'Needs another pass.',
    'Aligns with the directive.',
    'Flagging for revision.',
  ],
  blocked: [
    'Dependency upstream.',
    'Waiting on credentials.',
    'API rate-limited.',
  ],
  default: [
    'Heard.',
    'On it.',
    'Got it.',
    'Stand by.',
    'Roger.',
  ],
};

let counter = 0;

/**
 * Pick a deterministic snippet for an agent based on status + a rotating index.
 * The same agent will see varied phrases across talking events.
 */
export function pickDialogueSnippet(agent, otherAgent) {
  const pool = SNIPPETS[agent?.status] || SNIPPETS.default;
  counter++;
  return pool[(counter + (agent?.name?.length || 0)) % pool.length];
}
