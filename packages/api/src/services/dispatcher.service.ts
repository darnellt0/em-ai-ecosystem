/**
 * Dispatcher Service
 *
 * Service wrapper for calling the dispatcher programmatically
 * Used by voice API and other internal services
 */

import axios from 'axios';

const DISPATCHER_BASE_URL = process.env.DISPATCHER_BASE_URL || 'http://localhost:5001';

export interface DispatchResult {
  success: boolean;
  intent: string;
  routed: boolean;
  data?: any;
  qa?: {
    pass: boolean;
    checks?: string[];
    errors?: string[];
  };
  error?: string;
}

/**
 * Dispatch a request to an agent via the dispatcher
 *
 * @param intent - Agent intent (e.g., 'voice_companion', 'daily_brief')
 * @param payload - Payload for the agent
 * @returns DispatchResult with agent response
 */
export async function dispatchToAgent(intent: string, payload: Record<string, any>): Promise<DispatchResult> {
  try {
    const response = await axios.post(
      `${DISPATCHER_BASE_URL}/api/exec-admin/dispatch`,
      {
        intent,
        payload,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,  // 30 second timeout
      }
    );

    return response.data;

  } catch (error: any) {
    console.error(`[Dispatcher Service] Error dispatching to ${intent}:`, error.message);

    return {
      success: false,
      intent,
      routed: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

/**
 * Check dispatcher health
 *
 * @returns Health check response
 */
export async function checkDispatcherHealth(): Promise<DispatchResult> {
  return await dispatchToAgent('health_check', {});
}
