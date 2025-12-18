import { AgentOutput } from '../../shared/contracts';
import { runActionPack } from './workflows';

interface ContentActionPackPayload {
  userId: string;
  mode?: string;
  focus?: string;
  brief?: any;
  calendar?: any;
  insights?: any;
  journal?: any;
  __skip?: boolean;
  __forceFail?: boolean;
}

export async function runContentActionPackAdapter(payload: ContentActionPackPayload): Promise<AgentOutput<any>> {
  if (payload.__skip) return { status: 'SKIPPED', warnings: ['Skipped by debug flag'] };
  if (payload.__forceFail) return { status: 'FAILED', error: 'Forced failure (debug)' };
  if (!payload.userId) return { status: 'FAILED', error: 'userId is required' };

  try {
    const pack = await runActionPack({
      userId: payload.userId,
      mode: payload.mode || 'founder',
      topic: payload.focus || payload.brief?.summary || 'daily focus',
      tone: 'warm, strengths-centered',
      themes: payload.insights?.insights?.map((i: any) => i.title) || ['focus', 'rest', 'clarity'],
    } as any);

    return {
      status: 'OK',
      output: pack,
    };
  } catch (err: any) {
    return { status: 'FAILED', error: err.message };
  }
}
