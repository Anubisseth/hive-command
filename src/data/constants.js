// ═══════════════════════════════════════════════════
// HIVE COMMAND — Constants & Lookup Tables
// ═══════════════════════════════════════════════════
//
// VENTURES is the demo seed shipped with the template.
// Each developer should EITHER:
//   (a) replace the entries below with their own ventures, OR
//   (b) edit ventures live from the Ventures page (persisted to localStorage)
//
// Venture keys must match the option strings in the Airtable `Venture` select field
// across the Agents / Directives / Tasks / Outputs / Activity Log tables.
// See SETUP.md for the full Airtable schema.
// ═══════════════════════════════════════════════════

export const TIERS = {
  0: { label: "COMMANDER", color: "#FFB800", border: "rgba(255,184,0,0.45)" },
  1: { label: "DIRECTOR",  color: "#00D4FF", border: "rgba(0,212,255,0.35)" },
  2: { label: "MANAGER",   color: "#4ADE80", border: "rgba(74,222,128,0.3)" },
  3: { label: "AGENT",     color: "#4ADE80", border: "rgba(74,222,128,0.25)" },
};

export const STATUSES = {
  active:    { color: "#00FF88", label: "ACTIVE",    bg: "rgba(0,255,136,0.1)" },
  idle:      { color: "#FFB800", label: "IDLE",      bg: "rgba(255,184,0,0.1)" },
  blocked:   { color: "#FF3344", label: "BLOCKED",   bg: "rgba(255,51,68,0.1)" },
  offline:   { color: "#6B7280", label: "OFFLINE",   bg: "rgba(107,114,128,0.1)" },
  reviewing: { color: "#00D4FF", label: "REVIEWING", bg: "rgba(0,212,255,0.1)" },
};

// Generic 6-venture demo seed. Replace with your own ventures or edit in-app.
export const VENTURES = {
  agency:     { name: "Agency",       short: "AGY", color: "#3B82F6" },
  ecommerce:  { name: "E-Commerce",   short: "ECM", color: "#10B981" },
  saas:       { name: "SaaS",         short: "SAA", color: "#06B6D4" },
  consulting: { name: "Consulting",   short: "CON", color: "#D97706" },
  content:    { name: "Content",      short: "CNT", color: "#8B5CF6" },
  research:   { name: "Research",     short: "RES", color: "#E11D48" },
  cross:      { name: "Cross-Venture",short: "X",   color: "#EAB308" },
};

export const TOOL_COLORS = {
  GoHighLevel: "#FF6B35", GHL: "#FF6B35", Gmail: "#EA4335",
  Airtable: "#18BFFF", LinkedIn: "#0A66C2", Calendly: "#006BFF",
  Shopify: "#96BF48", Excel: "#217346", WhatsApp: "#25D366",
  GitHub: "#E6EDF3", Supabase: "#3ECF8E", DataDocked: "#1E40AF",
  Notion: "#FFFFFF", Canva: "#00C4CC", WordPress: "#21759B",
  Buffer: "#2C4BFF", n8n: "#FF6D5A", Make: "#6D00CC",
  Claude: "#D4A574", Dashboard: "#00FF88", Web: "#00D4FF",
  Ahrefs: "#FF8C00", SEMrush: "#FF642D", GSC: "#4285F4",
  DocuSign: "#FFD700", Email: "#9CA3AF", Drive: "#0066DA",
  QuickBooks: "#2CA01C", Banking: "#FFB800", Suppliers: "#D97706",
  "Meta Ads": "#0668E1", ManyChat: "#0084FF", GA4: "#E37400",
  APIs: "#06B6D4", Figma: "#F24E1E", Phone: "#FFB800", Python: "#3776AB",
  Stripe: "#635BFF", Zapier: "#FF4A00", HubSpot: "#FF7A59", Slack: "#4A154B",
};

export const NAV_ITEMS = [
  { id: "swarm",      label: "SWARM",      icon: "Grid3x3",   path: "/swarm" },
  { id: "commander",  label: "COMMANDER",  icon: "Crown",      path: "/commander" },
  { id: "ventures",   label: "VENTURES",   icon: "Building2",  path: "/ventures" },
  { id: "directives", label: "DIRECTIVES", icon: "Zap",        path: "/directives" },
  { id: "outputs",    label: "OUTPUTS",    icon: "FileText",   path: "/outputs" },
  { id: "office",     label: "3D OFFICE",  icon: "Building",   path: "/office" },
  { id: "analytics",  label: "ANALYTICS",  icon: "BarChart3",  path: "/analytics" },
  { id: "settings",   label: "SETTINGS",   icon: "Settings",   path: "/settings" },
];

export const LOOP_PHASES = {
  decompose:  { label: 'DECOMPOSE',  color: '#FFB800' },
  distribute: { label: 'DISTRIBUTE', color: '#00D4FF' },
  execute:    { label: 'EXECUTE',    color: '#00FF88' },
  collect:    { label: 'COLLECT',    color: '#8B5CF6' },
  review:     { label: 'REVIEW',     color: '#FF6B35' },
};
