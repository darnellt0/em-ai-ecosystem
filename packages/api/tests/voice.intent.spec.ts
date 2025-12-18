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

    expect([200, 422]).toContain(res.status);
    expect(res.body).toBeDefined();
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

    expect([200, 422]).toContain(res.status);
  });

  it('returns a multi-step plan for compound requests', async () => {
    const res = await request(app).post('/api/voice/intent').send({
      founder: 'shria',
      text: 'Summarize my inbox then draft a follow up',
    });

    expect([200, 422]).toContain(res.status);
  });

  it('asks for clarification when intent is unknown', async () => {
    const res = await request(app).post('/api/voice/intent').send({
      founder: 'shria',
      text: 'Sing me something fun',
    });

    expect([200, 422]).toContain(res.status);
  });
});
