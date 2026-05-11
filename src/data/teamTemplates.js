// =============================================
// HIVE COMMAND — Industry Team Templates
// One-click pre-wired swarms for common verticals
// =============================================
//
// Each template:
//   - id: stable slug
//   - label: shown in the UI
//   - description: 1-line elevator pitch
//   - venture: which venture key the agents target (`cross` for multi-venture)
//   - agents: full agent list (Commander + Directors + Managers + Agents)
//
// Drop in any of these via Swarm → "Load Template" to instantly populate your
// dashboard with a working swarm for that vertical.
// =============================================

const COMMANDER = {
  id: 'cmd',
  name: 'COMMANDER',
  tier: 0,
  venture: null,
  status: 'active',
  mandate: 'Orchestrates all agents across the swarm. Issues directives, reviews outputs, approves deliverables.',
  trigger: 'Manual directive or scheduled review',
  steps: ['Scan dashboards', 'Issue directives', 'Review deliverables', 'Approve outputs', 'Update strategic priorities'],
  deliverables: ['Strategic directives', 'Approvals'],
  tools: ['Claude', 'Dashboard', 'Notion'],
  parent: null,
  task: null,
};

export const TEAM_TEMPLATES = [
  // ─── 1. Marketing Agency ──────────────────────────────
  {
    id: 'marketing-agency',
    label: 'Marketing Agency',
    description: 'Outreach → onboarding → delivery for a generalist marketing agency.',
    venture: 'agency',
    icon: 'Briefcase',
    agents: [
      COMMANDER,
      { id: 'd_growth',  name: 'GROWTH DIRECTOR',   tier: 1, venture: 'agency', status: 'active',    mandate: 'Drives client acquisition, onboarding, and delivery quality.', trigger: 'Weekly pipeline review', steps: ['Review pipeline', 'Coordinate outreach', 'Oversee onboarding', 'Report MRR'], deliverables: ['Pipeline reports', 'Dashboards'], tools: ['GoHighLevel', 'Airtable', 'Gmail'], parent: 'cmd', task: null },
      { id: 'm_outreach', name: 'OUTREACH MANAGER', tier: 2, venture: 'agency', status: 'active',    mandate: 'Multi-channel outreach to ICPs.',                              trigger: 'Daily',                  steps: ['Segment prospects', 'Send sequences', 'Book calls'],                                  deliverables: ['Reports'],                tools: ['LinkedIn', 'Gmail'],     parent: 'd_growth', task: null },
      { id: 'a_cold',    name: 'COLD EMAIL AGENT',  tier: 3, venture: 'agency', status: 'active',    mandate: 'Drafts and sends cold-email sequences.',                       trigger: 'Daily',                  steps: ['Load prospects', 'Personalize', 'Send', 'Track'],                                      deliverables: ['Hot leads'],               tools: ['Gmail'],                 parent: 'm_outreach', task: null },
      { id: 'a_li',      name: 'LINKEDIN AGENT',    tier: 3, venture: 'agency', status: 'active',    mandate: 'LinkedIn DM sequences.',                                       trigger: 'Daily',                  steps: ['Find prospects', 'Connect', 'DM sequence'],                                            deliverables: ['Connections'],             tools: ['LinkedIn'],              parent: 'm_outreach', task: null },
      { id: 'a_onb',     name: 'ONBOARDING AGENT',  tier: 3, venture: 'agency', status: 'reviewing', mandate: 'Contract → live operational handoff.',                         trigger: 'Contract signed',        steps: ['Create sub-account', 'Configure automations', 'Schedule kickoff'],                     deliverables: ['Onboarding kits'],         tools: ['GoHighLevel', 'Calendly'], parent: 'd_growth',    task: null },
    ],
  },

  // ─── 2. E-Commerce Brand ──────────────────────────────
  {
    id: 'ecommerce-brand',
    label: 'E-Commerce Brand',
    description: 'DTC store with paid ads, content, fulfillment, and CX.',
    venture: 'ecommerce',
    icon: 'ShoppingBag',
    agents: [
      COMMANDER,
      { id: 'd_brand',  name: 'BRAND DIRECTOR',    tier: 1, venture: 'ecommerce', status: 'active', mandate: 'Owns the storefront, pricing, fulfillment, and CX.', trigger: 'Weekly review', steps: ['Monitor sales', 'Update listings', 'Coordinate fulfillment'], deliverables: ['Reports'], tools: ['Shopify', 'Excel'], parent: 'cmd', task: null },
      { id: 'm_paid',   name: 'PAID ADS MANAGER',  tier: 2, venture: 'ecommerce', status: 'active', mandate: 'Meta + Google ads optimization.',                    trigger: 'Daily',         steps: ['Review ROAS', 'Pause losers', 'Scale winners'],            deliverables: ['Ad reports'], tools: ['Meta Ads'],          parent: 'd_brand', task: null },
      { id: 'a_creative', name: 'CREATIVE AGENT',  tier: 3, venture: 'ecommerce', status: 'active', mandate: 'Produces ad creative — images, copy, video scripts.', trigger: 'Brief from PAM', steps: ['Brief', 'Draft', 'Iterate'],                              deliverables: ['Creatives'],   tools: ['Canva', 'Figma'],   parent: 'm_paid',  task: null },
      { id: 'a_cx',     name: 'CX AGENT',          tier: 3, venture: 'ecommerce', status: 'active', mandate: 'Handles customer inquiries and refunds.',            trigger: 'Inbound',       steps: ['Triage', 'Reply', 'Escalate if needed'],                  deliverables: ['Resolutions'], tools: ['Email', 'ManyChat'], parent: 'd_brand', task: null },
      { id: 'a_pricing', name: 'PRICING AGENT',    tier: 3, venture: 'ecommerce', status: 'idle',   mandate: 'Updates supplier-driven price lists.',               trigger: 'Weekly',         steps: ['Collect prices', 'Apply markup', 'Publish'],              deliverables: ['Price lists'], tools: ['Excel'],             parent: 'd_brand', task: null },
    ],
  },

  // ─── 3. SaaS Startup ──────────────────────────────────
  {
    id: 'saas-startup',
    label: 'SaaS Startup',
    description: 'Product team building from PRD to launch with paid + content acquisition.',
    venture: 'saas',
    icon: 'Code2',
    agents: [
      COMMANDER,
      { id: 'd_product', name: 'PRODUCT DIRECTOR', tier: 1, venture: 'saas', status: 'active', mandate: 'Owns PRD, sprint, and GTM.',                       trigger: 'Sprint cycle',     steps: ['Prioritize features', 'Run sprint', 'Coordinate launch'], deliverables: ['Sprint reports'], tools: ['GitHub', 'Notion'], parent: 'cmd', task: null },
      { id: 'm_eng',     name: 'ENGINEERING MGR',  tier: 2, venture: 'saas', status: 'active', mandate: 'Coordinates engineering throughput.',              trigger: 'Daily standup',    steps: ['Triage', 'Assign', 'Unblock'],                            deliverables: ['Velocity reports'], tools: ['GitHub'],         parent: 'd_product', task: null },
      { id: 'a_fe',      name: 'FRONTEND AGENT',    tier: 3, venture: 'saas', status: 'active', mandate: 'Ships UI features per spec.',                      trigger: 'Sprint ticket',     steps: ['Read spec', 'Build', 'PR'],                                deliverables: ['PRs'],            tools: ['GitHub', 'Figma'], parent: 'm_eng',     task: null },
      { id: 'a_be',      name: 'BACKEND AGENT',     tier: 3, venture: 'saas', status: 'active', mandate: 'Implements API + data layer.',                     trigger: 'Sprint ticket',     steps: ['Read spec', 'Build', 'PR'],                                deliverables: ['PRs'],            tools: ['Supabase', 'APIs'], parent: 'm_eng',    task: null },
      { id: 'a_gtm',     name: 'GTM AGENT',         tier: 3, venture: 'saas', status: 'idle',   mandate: 'Drafts launch and lifecycle content.',             trigger: 'Milestone',        steps: ['Draft', 'Review', 'Schedule'],                            deliverables: ['Posts', 'Emails'], tools: ['Buffer', 'WordPress'], parent: 'd_product', task: null },
    ],
  },

  // ─── 4. Consulting Firm ───────────────────────────────
  {
    id: 'consulting-firm',
    label: 'Consulting Firm',
    description: 'Research-driven consulting with named clients and deliverable workstreams.',
    venture: 'consulting',
    icon: 'Briefcase',
    agents: [
      COMMANDER,
      { id: 'd_partner',   name: 'MANAGING PARTNER', tier: 1, venture: 'consulting', status: 'active',    mandate: 'Owns client portfolio and project delivery.', trigger: 'Weekly review',   steps: ['Review accounts', 'Coordinate teams', 'Quality gate'], deliverables: ['Deliverables', 'Status reports'], tools: ['Notion', 'Drive'], parent: 'cmd', task: null },
      { id: 'm_research',  name: 'RESEARCH LEAD',    tier: 2, venture: 'consulting', status: 'active',    mandate: 'Market + competitor intelligence.',           trigger: 'Project kickoff', steps: ['Scope', 'Research', 'Synthesize'],                  deliverables: ['Briefs'],                          tools: ['Web', 'Ahrefs'],   parent: 'd_partner', task: null },
      { id: 'a_analyst',   name: 'DATA ANALYST',     tier: 3, venture: 'consulting', status: 'active',    mandate: 'Quant analysis and modeling.',                trigger: 'Brief received',   steps: ['Pull data', 'Model', 'Visualize'],                  deliverables: ['Dashboards', 'Reports'],           tools: ['Excel', 'Python'], parent: 'm_research', task: null },
      { id: 'a_strategy',  name: 'STRATEGY AGENT',   tier: 3, venture: 'consulting', status: 'reviewing', mandate: 'Strategic recommendations and frameworks.',   trigger: 'Brief received',   steps: ['Frame', 'Draft', 'Iterate with partner'],           deliverables: ['Decks'],                            tools: ['Canva', 'Notion'], parent: 'd_partner', task: null },
    ],
  },

  // ─── 5. Content Studio ────────────────────────────────
  {
    id: 'content-studio',
    label: 'Content Studio',
    description: 'Multi-channel content engine — SEO, social, video, newsletters.',
    venture: 'content',
    icon: 'FileText',
    agents: [
      COMMANDER,
      { id: 'd_editor',   name: 'EDITORIAL DIRECTOR', tier: 1, venture: 'content', status: 'active', mandate: 'Owns editorial calendar and standards.',             trigger: 'Weekly planning', steps: ['Plan', 'Brief', 'Review', 'Schedule'],          deliverables: ['Calendar', 'Briefs'], tools: ['Notion', 'WordPress'], parent: 'cmd', task: null },
      { id: 'm_dist',     name: 'DISTRIBUTION MGR',  tier: 2, venture: 'content', status: 'active', mandate: 'Publishing + promotion across channels.',            trigger: 'Content ready',   steps: ['Format per channel', 'Schedule', 'Track'],      deliverables: ['Schedule', 'Reports'], tools: ['Buffer', 'LinkedIn'],  parent: 'd_editor', task: null },
      { id: 'a_seo',      name: 'SEO WRITER',        tier: 3, venture: 'content', status: 'active', mandate: 'Long-form SEO blog posts.',                          trigger: 'Brief received',  steps: ['Research', 'Draft', 'Optimize'],               deliverables: ['Posts'],              tools: ['Ahrefs', 'WordPress'], parent: 'd_editor', task: null },
      { id: 'a_social',   name: 'SOCIAL AGENT',      tier: 3, venture: 'content', status: 'idle',   mandate: 'Social posts and reels.',                            trigger: 'Calendar slot',   steps: ['Draft copy', 'Design visuals', 'Schedule'],   deliverables: ['Posts'],              tools: ['Canva', 'Buffer'],     parent: 'm_dist',    task: null },
      { id: 'a_news',     name: 'NEWSLETTER AGENT',  tier: 3, venture: 'content', status: 'idle',   mandate: 'Weekly newsletter from highlights.',                trigger: 'Weekly',           steps: ['Curate', 'Write', 'Send'],                     deliverables: ['Newsletter'],          tools: ['Email'],               parent: 'm_dist',    task: null },
    ],
  },

  // ─── 6. Research Lab ──────────────────────────────────
  {
    id: 'research-lab',
    label: 'Research Lab',
    description: 'Discovery, experimentation, and synthesis — for R&D or academic teams.',
    venture: 'research',
    icon: 'Microscope',
    agents: [
      COMMANDER,
      { id: 'd_pi',     name: 'PRINCIPAL INVESTIGATOR', tier: 1, venture: 'research', status: 'active',    mandate: 'Sets research agenda and reviews findings.',         trigger: 'Quarterly',    steps: ['Set thesis', 'Approve experiments', 'Review findings'], deliverables: ['Theses', 'Approvals'], tools: ['Notion', 'Drive'], parent: 'cmd', task: null },
      { id: 'm_lab',    name: 'LAB MANAGER',            tier: 2, venture: 'research', status: 'active',    mandate: 'Runs experiments and data pipelines.',              trigger: 'PI greenlight',  steps: ['Design experiment', 'Run', 'Collect data'],            deliverables: ['Datasets'],            tools: ['Python', 'APIs'], parent: 'd_pi', task: null },
      { id: 'a_data',   name: 'DATA AGENT',             tier: 3, venture: 'research', status: 'active',    mandate: 'ETL, cleaning, and basic statistics.',              trigger: 'Dataset received', steps: ['Ingest', 'Clean', 'Run stats'],                        deliverables: ['Clean datasets'],       tools: ['Python', 'Excel'], parent: 'm_lab', task: null },
      { id: 'a_synth',  name: 'SYNTHESIS AGENT',        tier: 3, venture: 'research', status: 'reviewing', mandate: 'Writes papers and briefs from findings.',           trigger: 'Findings ready',   steps: ['Review findings', 'Draft', 'Cite'],                    deliverables: ['Papers', 'Briefs'],     tools: ['Notion', 'Web'],   parent: 'd_pi', task: null },
    ],
  },
];
