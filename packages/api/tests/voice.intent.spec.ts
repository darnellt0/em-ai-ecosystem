import express, { Express } from 'express';
import request from 'supertest';
import intentRouter from '../src/voice/intent.router';

const app: Express = express();
app.use(express.json());
app.use('/api/voice', intentRouter);

describe('Voice Intent Router', () => {
  it('classifies scheduler block requests and extracts entities', async () => {
    const res = await request(app).post('/api/voice/intent').send({
      founder: 'shria',
      text: 'Block 30 minutes tomorrow at 2pm for deep work',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.intent).toBe('scheduler.block');
    expect(res.body.entities.minutes).toBe(30);
    expect(res.body.entities.date).toBe('tomorrow');
    expect(res.body.entities.time).toBe('2 pm');
    expect(res.body.humanSummary).toContain('Block');
  });

  it('uses conversation context to resolve referents', async () => {
    const res = await request(app).post('/api/voice/intent').send({
      founder: 'darnell',
      text: 'Can you confirm that meeting?',
      sessionTurns: [
        {
          text: 'Reschedule my board sync',
          intent: 'scheduler.reschedule',
          entities: {
            eventId: 'evt-42',
            title: 'board sync',
            date: 'next tuesday',
            time: '4 pm',
          },
        },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('scheduler.confirm');
    expect(res.body.entities.eventId).toBe('evt-42');
    expect(res.body.entities.title).toBe('board sync');
  });

  it('returns a multi-step plan for compound requests', async () => {
    const res = await request(app).post('/api/voice/intent').send({
      founder: 'shria',
      text: 'Summarize my inbox then draft a follow up',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('multi_step');
    expect(Array.isArray(res.body.nextBestAction)).toBe(true);
    expect(res.body.nextBestAction).toHaveLength(2);
  });

  it('asks for clarification when intent is unknown', async () => {
    const res = await request(app).post('/api/voice/intent').send({
      founder: 'shria',
      text: 'Sing me something fun',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('needs_clarification');
    expect(res.body.intent).toBe('unknown');
    expect(res.body.nextBestAction.suggestion).toContain('clarify');
  });
});
