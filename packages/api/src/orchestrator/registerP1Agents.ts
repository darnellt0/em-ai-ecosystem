import { registerAgent } from '../../../orchestrator/src/registry/agent-registry';
import { runBrandStorytellerAdapter } from '../../../agents/brand-storyteller/adapter';
import { runCreativeDirectorAdapter } from '../../../agents/creative-director/adapter';
import { runIntegratedStrategistAdapter } from '../../../agents/integrated-strategist/adapter';
import { runRelationshipTrackerAdapter } from '../../../agents/relationship-tracker/adapter';
import { runCurriculumGeneratorAdapter } from '../../../agents/curriculum-generator/adapter';
import { runEventArchitectAdapter } from '../../../agents/event-architect/adapter';
import { runAccountabilityPartnerAdapter } from '../../../agents/accountability-partner/adapter';
import { runCommunityCuratorAdapter } from '../../../agents/community-curator/adapter';
import { runP1StubAdapter } from '../../../agents/p1-stubs/adapter';

let p1Registered = false;

const P1_KEYS = [
  'brand.storyteller.generate',
  'content.creative_director.review',
  'strategy.integrated.plan',
  'relationships.track.update',
  'curriculum.generate.module',
  'events.architect.plan',
  'accountability.check_in',
  'community.curator.outreach',
  'p1.rhythm',
  'p1.purpose',
  'p1.mindset',
  'p1.membership_guardian',
  'p1.systems_architect',
  'p1.voice_companion',
  'p1.vision_builder',
  'p1.wellness_reset',
  'p1.meal_vision',
  'p1.quicklist',
];

export function ensureP1AgentsRegistered() {
  if (p1Registered) return;

  registerAgent({
    key: 'brand.storyteller.generate',
    description: 'Brand storyteller agent',
    status: 'frozen',
    run: (p) => runBrandStorytellerAdapter(p),
  });
  registerAgent({
    key: 'content.creative_director.review',
    description: 'Creative director review',
    status: 'frozen',
    run: (p) => runCreativeDirectorAdapter(p),
  });
  registerAgent({
    key: 'strategy.integrated.plan',
    description: 'Integrated strategist',
    status: 'frozen',
    run: (p) => runIntegratedStrategistAdapter(p),
  });
  registerAgent({
    key: 'relationships.track.update',
    description: 'Relationship tracker',
    status: 'frozen',
    run: (p) => runRelationshipTrackerAdapter(p),
  });
  registerAgent({
    key: 'curriculum.generate.module',
    description: 'Curriculum generator',
    status: 'frozen',
    run: (p) => runCurriculumGeneratorAdapter(p),
  });
  registerAgent({
    key: 'events.architect.plan',
    description: 'Event architect',
    status: 'frozen',
    run: (p) => runEventArchitectAdapter(p),
  });
  registerAgent({
    key: 'accountability.check_in',
    description: 'Accountability partner',
    status: 'frozen',
    run: (p) => runAccountabilityPartnerAdapter(p),
  });
  registerAgent({
    key: 'community.curator.outreach',
    description: 'Community curator',
    status: 'frozen',
    run: (p) => runCommunityCuratorAdapter(p),
  });
  // Stubbed/blocked P1 agents (registered for discoverability)
  registerAgent({
    key: 'p1.rhythm',
    description: 'Rhythm agent (stub)',
    status: 'frozen',
    run: runP1StubAdapter('p1.rhythm', 'Rhythm agent'),
  });
  registerAgent({
    key: 'p1.purpose',
    description: 'Purpose agent (stub)',
    status: 'frozen',
    run: runP1StubAdapter('p1.purpose', 'Purpose agent'),
  });
  registerAgent({
    key: 'p1.mindset',
    description: 'Mindset agent (stub)',
    status: 'frozen',
    run: runP1StubAdapter('p1.mindset', 'Mindset agent'),
  });
  registerAgent({
    key: 'p1.membership_guardian',
    description: 'Membership guardian (stub)',
    status: 'frozen',
    run: runP1StubAdapter('p1.membership_guardian', 'Membership guardian'),
  });
  registerAgent({
    key: 'p1.systems_architect',
    description: 'Systems architect (stub)',
    status: 'frozen',
    run: runP1StubAdapter('p1.systems_architect', 'Systems architect'),
  });
  registerAgent({
    key: 'p1.voice_companion',
    description: 'Voice companion (stub)',
    status: 'frozen',
    run: runP1StubAdapter('p1.voice_companion', 'Voice companion'),
  });
  registerAgent({
    key: 'p1.vision_builder',
    description: 'Vision builder (stub)',
    status: 'frozen',
    run: runP1StubAdapter('p1.vision_builder', 'Vision builder'),
  });
  registerAgent({
    key: 'p1.wellness_reset',
    description: 'Wellness reset (stub)',
    status: 'frozen',
    run: runP1StubAdapter('p1.wellness_reset', 'Wellness reset'),
  });
  registerAgent({
    key: 'p1.meal_vision',
    description: 'Meal vision (stub)',
    status: 'frozen',
    run: runP1StubAdapter('p1.meal_vision', 'Meal vision'),
  });
  registerAgent({
    key: 'p1.quicklist',
    description: 'Quicklist (stub)',
    status: 'frozen',
    run: runP1StubAdapter('p1.quicklist', 'Quicklist'),
  });

  p1Registered = true;
}

export function listP1Keys() {
  return P1_KEYS;
}
