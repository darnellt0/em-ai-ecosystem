"use strict";
/**
 * Growth Agent Registry
 * Registers all 5 Growth Agents with the orchestrator
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROWTH_AGENTS = void 0;
exports.getAgentByKey = getAgentByKey;
exports.getAgentsByPhase = getAgentsByPhase;
const journal_agent_1 = require("./agents/journal-agent");
const niche_agent_1 = require("./agents/niche-agent");
const mindset_agent_1 = require("./agents/mindset-agent");
const rhythm_agent_1 = require("./agents/rhythm-agent");
const purpose_agent_1 = require("./agents/purpose-agent");
/**
 * Registry of all 5 Growth Agents
 * Sorted by priority for execution order
 */
exports.GROWTH_AGENTS = [
    // Priority 1: Rooted Phase - Foundation agents
    {
        key: 'journal',
        displayName: 'Journal Agent',
        phase: 'Rooted',
        priority: 1,
        description: 'Daily Alignment Journal - Helps users reflect and align through journaling',
        runAgent: journal_agent_1.runJournalAgent,
    },
    {
        key: 'rhythm',
        displayName: 'Rhythm Agent',
        phase: 'Rooted',
        priority: 2,
        description: 'Rest & Rhythm Planner - Finds balance between productivity and rest',
        runAgent: rhythm_agent_1.runRhythmAgent,
    },
    // Priority 3-4: Grounded Phase - Growth agents
    {
        key: 'niche',
        displayName: 'Niche Agent',
        phase: 'Grounded',
        priority: 3,
        description: 'Niche Navigator - Helps discover and clarify unique niche',
        runAgent: niche_agent_1.runNicheAgent,
    },
    {
        key: 'mindset',
        displayName: 'Mindset Agent',
        phase: 'Grounded',
        priority: 4,
        description: 'Mindset Shift Mentor - Reframes limiting beliefs and develops empowering mindsets',
        runAgent: mindset_agent_1.runMindsetAgent,
    },
    // Priority 5: Radiant Phase - Purpose agent
    {
        key: 'purpose',
        displayName: 'Purpose Agent',
        phase: 'Radiant',
        priority: 5,
        description: 'Purpose Pathfinder - Discovers and articulates core purpose through Ikigai',
        runAgent: purpose_agent_1.runPurposeAgent,
    },
];
/**
 * Get agent by key
 */
function getAgentByKey(key) {
    return exports.GROWTH_AGENTS.find((agent) => agent.key === key);
}
/**
 * Get agents by phase
 */
function getAgentsByPhase(phase) {
    return exports.GROWTH_AGENTS.filter((agent) => agent.phase === phase);
}
//# sourceMappingURL=registry.js.map