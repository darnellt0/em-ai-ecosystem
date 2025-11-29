export type EmAiAgentInputFieldType = 'text' | 'textarea' | 'select' | 'multi-select' | 'number' | 'boolean';

export interface EmAiAgentInputFieldOption {
  value: string;
  label: string;
}

export interface EmAiAgentInputField {
  id: string;
  label: string;
  type: EmAiAgentInputFieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  options?: EmAiAgentInputFieldOption[];
  defaultValue?: any;
}

export interface EmAiAgentConfig {
  id: string;
  name: string;
  category: 'Growth' | 'Ops' | 'Money' | 'Admin' | 'Other';
  icon?: string;
  tagline: string;
  description: string;
  inputSchema: EmAiAgentInputField[];
  orchestratorKey: string;
  mode?: 'single' | 'orchestrated';
  tags?: string[];
}

export const emAiAgentsCatalog: EmAiAgentConfig[] = [
  {
    id: 'journal',
    name: 'Journal Agent',
    category: 'Growth',
    icon: '📝',
    tagline: 'Guided daily reflection and emotional alignment.',
    description:
      'Creates reflective prompts, captures key learnings, and highlights emotional signals so founders stay grounded while moving fast.',
    inputSchema: [
      {
        id: 'focusArea',
        label: 'Focus Area',
        type: 'text',
        placeholder: 'Energy, gratitude, strategic clarity…',
        helperText: 'Helps the agent frame the reflections around the right lens.',
        required: true,
      },
      {
        id: 'recentWins',
        label: 'Recent Wins or Highlights',
        type: 'textarea',
        placeholder: 'List moments from today or this week worth reinforcing.',
      },
      {
        id: 'mood',
        label: 'Current Mood',
        type: 'select',
        options: [
          { value: 'energized', label: 'Energized' },
          { value: 'steady', label: 'Steady' },
          { value: 'stretched', label: 'Stretched' },
          { value: 'fatigued', label: 'Fatigued' },
        ],
        defaultValue: 'steady',
      },
      {
        id: 'timeAvailable',
        label: 'Time Available (minutes)',
        type: 'number',
        placeholder: '15',
        helperText: 'Used to tailor the number of prompts delivered.',
        defaultValue: 15,
      },
    ],
    orchestratorKey: 'journal',
    mode: 'single',
    tags: ['reflection', 'mindfulness'],
  },
  {
    id: 'niche',
    name: 'Niche Agent',
    category: 'Growth',
    icon: '🎯',
    tagline: 'Pressure-tests your GTM focus areas.',
    description:
      'Evaluates target segments, demand signals, and ideal customer characteristics to ensure your growth efforts stay razor sharp.',
    inputSchema: [
      {
        id: 'audience',
        label: 'Primary Audience',
        type: 'text',
        placeholder: 'e.g. mission-driven coaches',
        required: true,
      },
      {
        id: 'offer',
        label: 'Offer or Initiative',
        type: 'text',
        placeholder: 'Describe the product, service, or campaign in a sentence.',
      },
      {
        id: 'goals',
        label: 'Primary Growth Goal',
        type: 'select',
        options: [
          { value: 'leads', label: 'Lead Generation' },
          { value: 'retention', label: 'Retention' },
          { value: 'upsell', label: 'Upsell / Expansion' },
          { value: 'awareness', label: 'Awareness' },
        ],
        defaultValue: 'leads',
      },
      {
        id: 'constraints',
        label: 'Constraints',
        type: 'textarea',
        placeholder: 'Budget, timeline, capacity, or other bounds.',
      },
    ],
    orchestratorKey: 'niche',
    mode: 'single',
    tags: ['gtm', 'strategy'],
  },
  {
    id: 'mindset',
    name: 'Mindset Agent',
    category: 'Growth',
    icon: '🧠',
    tagline: 'Keeps founders in a resilient mental state.',
    description:
      'Surfaces reframes, rituals, and narratives to keep founders resilient through high-variance days.',
    inputSchema: [
      {
        id: 'challenge',
        label: 'Current Challenge',
        type: 'textarea',
        placeholder: 'Describe the friction you are feeling right now.',
        required: true,
      },
      {
        id: 'desiredState',
        label: 'Desired State',
        type: 'text',
        placeholder: 'e.g. calm confidence, resourcefulness',
      },
      {
        id: 'timeOfDay',
        label: 'Time of Day',
        type: 'select',
        options: [
          { value: 'morning', label: 'Morning' },
          { value: 'afternoon', label: 'Afternoon' },
          { value: 'evening', label: 'Evening' },
        ],
        defaultValue: 'morning',
      },
      {
        id: 'rituals',
        label: 'Preferred Rituals',
        type: 'multi-select',
        options: [
          { value: 'breathwork', label: 'Breathwork' },
          { value: 'movement', label: 'Movement' },
          { value: 'journaling', label: 'Journaling' },
          { value: 'music', label: 'Music' },
        ],
        helperText: 'Select any rituals that resonate today.',
      },
    ],
    orchestratorKey: 'mindset',
    mode: 'single',
    tags: ['resilience', 'coaching'],
  },
  {
    id: 'rhythm',
    name: 'Rhythm Agent',
    category: 'Ops',
    icon: '📅',
    tagline: 'Designs the ideal operating cadence for today.',
    description:
      'Balances deep work, performance, and rest windows so your week protects what matters most.',
    inputSchema: [
      {
        id: 'primaryObjective',
        label: 'Primary Objective',
        type: 'text',
        placeholder: 'What must get accomplished today?',
        required: true,
      },
      {
        id: 'energyLevel',
        label: 'Energy Level',
        type: 'select',
        options: [
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' },
        ],
        defaultValue: 'medium',
      },
      {
        id: 'availableHours',
        label: 'Available Hours',
        type: 'number',
        placeholder: '6',
        helperText: 'Used to size blocks realistically.',
        required: true,
      },
      {
        id: 'constraints',
        label: 'Non-Negotiables',
        type: 'textarea',
        placeholder: 'Meetings, childcare windows, travel, etc.',
      },
    ],
    orchestratorKey: 'rhythm',
    mode: 'single',
    tags: ['cadence', 'capacity-planning'],
  },
  {
    id: 'purpose',
    name: 'Purpose Agent',
    category: 'Growth',
    icon: '✨',
    tagline: 'Connects today’s work to long-term purpose.',
    description:
      'Audits commitments, opportunities, and asks to confirm they align with Elevated Movements’ long-game narrative.',
    inputSchema: [
      {
        id: 'initiative',
        label: 'Current Initiative',
        type: 'text',
        placeholder: 'Name the project or opportunity under review.',
        required: true,
      },
      {
        id: 'whyNow',
        label: 'Why Now?',
        type: 'textarea',
        placeholder: 'Describe why this feels important in this season.',
      },
      {
        id: 'impactHorizon',
        label: 'Impact Horizon',
        type: 'select',
        options: [
          { value: 'immediate', label: 'Immediate' },
          { value: 'quarter', label: 'This Quarter' },
          { value: 'year', label: 'This Year' },
          { value: 'legacy', label: 'Legacy' },
        ],
        defaultValue: 'quarter',
      },
      {
        id: 'stakeholders',
        label: 'Stakeholders',
        type: 'multi-select',
        options: [
          { value: 'team', label: 'Internal Team' },
          { value: 'community', label: 'Community' },
          { value: 'investors', label: 'Investors/Partners' },
          { value: 'self', label: 'Self' },
        ],
      },
    ],
    orchestratorKey: 'purpose',
    mode: 'single',
    tags: ['alignment', 'strategy'],
  },
  {
    id: 'calendar-optimizer',
    name: 'Calendar Optimizer',
    category: 'Ops',
    icon: '🗓️',
    tagline: 'Protects time, resolves conflicts, and creates breathing room.',
    description:
      'Connects with Google Calendar to block focus time, confirm meetings, and re-balance your week.',
    inputSchema: [
      {
        id: 'founderEmail',
        label: 'Founder Email',
        type: 'text',
        placeholder: 'founder@elevatedmovements.com',
        required: true,
      },
      {
        id: 'intent',
        label: 'Action',
        type: 'select',
        options: [
          { value: 'block', label: 'Block Focus Time' },
          { value: 'confirm', label: 'Confirm Meeting' },
          { value: 'reschedule', label: 'Reschedule Event' },
        ],
        required: true,
      },
      {
        id: 'durationMinutes',
        label: 'Duration (minutes)',
        type: 'number',
        placeholder: '60',
        helperText: 'Used for focus blocks or when proposing new slots.',
      },
      {
        id: 'notes',
        label: 'Context / Notes',
        type: 'textarea',
        placeholder: 'Attendees, purpose, or conflicts to consider.',
      },
    ],
    orchestratorKey: 'calendar-optimizer',
    mode: 'single',
    tags: ['calendar', 'automation'],
  },
  {
    id: 'grant-researcher',
    name: 'Grant Researcher',
    category: 'Money',
    icon: '📚',
    tagline: 'Surfaces aligned grants and funding opportunities.',
    description:
      'Parses government and philanthropic databases to curate grant matches, deadlines, and readiness checklists.',
    inputSchema: [
      {
        id: 'organizationType',
        label: 'Organization Type',
        type: 'select',
        options: [
          { value: 'nonprofit', label: 'Nonprofit' },
          { value: 'social-enterprise', label: 'Social Enterprise' },
          { value: 'for-profit', label: 'For-profit' },
        ],
        defaultValue: 'nonprofit',
      },
      {
        id: 'fundingNeed',
        label: 'Funding Need',
        type: 'text',
        placeholder: 'Programming, operations, wellness curriculum…',
        required: true,
      },
      {
        id: 'timing',
        label: 'Funding Timeline',
        type: 'select',
        options: [
          { value: 'immediate', label: 'Next 30 days' },
          { value: 'quarter', label: 'Next 90 days' },
          { value: 'year', label: 'Within the year' },
        ],
        defaultValue: 'quarter',
      },
      {
        id: 'keywords',
        label: 'Keywords',
        type: 'textarea',
        placeholder: 'Wellness, community healing, youth development…',
        helperText: 'Used to refine the search queries.',
      },
      {
        id: 'documentsReady',
        label: 'Have core documents ready?',
        type: 'boolean',
        defaultValue: false,
      },
    ],
    orchestratorKey: 'grant-researcher',
    mode: 'single',
    tags: ['funding', 'research'],
  },
];

export function getEmAiAgentConfig(agentId: string): EmAiAgentConfig | undefined {
  return emAiAgentsCatalog.find((agent) => agent.id === agentId);
}
