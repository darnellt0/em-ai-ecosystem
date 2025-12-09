process.env.PORT = '0';

jest.mock('../../src/voice-realtime/ws.server', () => ({
  initVoiceRealtimeWSS: () => {},
}));

jest.mock('../../src/services/emAi.service', () => ({
  callEmAgent: jest.fn().mockResolvedValue({
    outputText: 'Exec Admin routed output',
    meta: {},
  }),
}));

import request from 'supertest';
import app from '../../src';

describe('emAiAgentsRouter via Exec Admin', () => {
  it('routes journal through callEmAgent', async () => {
    const { callEmAgent } = require('../../src/services/emAi.service');
    const res = await request(app)
      .post('/em-ai/agents/journal/run')
      .send({ input: { prompt: 'test', timeHorizon: 'today' } });

    expect(res.status).toBe(200);
    expect(res.body.result.outputText).toBe('Exec Admin routed output');
    expect(callEmAgent).toHaveBeenCalled();
  });
});
