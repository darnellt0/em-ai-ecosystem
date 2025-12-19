import { runP0DailyFocusFlow } from '../flows/p0-daily-focus.flow';

/**
 * Registry for P0 canonical flows.
 * Single entry: P0-DAILY-FOCUS
 */
export const P0_FLOW_REGISTRY = {
  'P0-DAILY-FOCUS': {
    key: 'P0-DAILY-FOCUS',
    handler: runP0DailyFocusFlow,
  },
};

export type P0FlowKey = keyof typeof P0_FLOW_REGISTRY;

export function getP0Flow(key: P0FlowKey) {
  return P0_FLOW_REGISTRY[key];
}
