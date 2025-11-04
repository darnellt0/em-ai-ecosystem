import express, { Express } from 'express';
import request from 'supertest';
import contextRouter from '../src/context/context.router';

const appendTurn = jest.fn();
const getSession = jest.fn();
const remember = jest.fn();
const recall = jest.fn();

jest.mock('@em/context-memory', () => ({
  appendTurn: (...args: unknown[]) => appendTurn(...args),
  getSession: (...args: unknown[]) => getSession(...args),
  remember: (...args: unknown[]) => remember(...args),
  recall: (...args: unknown[]) => recall(...args),
  taskState: {
    create: jest.fn(),
    updateState: jest.fn(),
    get: jest.fn(),
  },
}));

describe('Context Router', () => {
  const app: Express = express();
  app.use(express.json());
  app.use('/api/context', contextRouter);

  const token = 'test-token';

  beforeEach(() => {
    process.env.VOICE_API_TOKEN = token;
    appendTurn.mockReset();
    getSession.mockReset();
    remember.mockReset();
    recall.mockReset();
  });

  afterEach(() => {
    delete process.env.VOICE_API_TOKEN;
  });

  it('rejects requests without bearer token', async () => {
    const res = await request(app).post('/api/context/turn').send({ founder: 'darnell', text: 'hello' });
    expect(res.status).toBe(401);
  });

  it('appends a sanitized turn', async () => {
    appendTurn.mockResolvedValue({ founder: 'darnell', text: 'hi', ts: '2024-01-01T00:00:00.000Z' });

    const res = await request(app)
      .post('/api/context/turn')
      .set('Authorization', `Bearer ${token}`)
      .send({ founder: 'darnell', text: 'hi' });

    expect(res.status).toBe(200);
    expect(appendTurn).toHaveBeenCalledWith({ founder: 'darnell', text: 'hi' });
    expect(res.body.turn).toEqual({ founder: 'darnell', text: 'hi', ts: '2024-01-01T00:00:00.000Z' });
  });

  it('returns validation errors for invalid turn payload', async () => {
    const res = await request(app)
      .post('/api/context/turn')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'missing founder' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('retrieves session history', async () => {
    getSession.mockResolvedValue([{ founder: 'shria', text: 'hi', ts: '2024-01-01T00:00:00Z' }]);

    const res = await request(app)
      .get('/api/context/session')
      .set('Authorization', `Bearer ${token}`)
      .query({ founder: 'shria', limit: '5' });

    expect(res.status).toBe(200);
    expect(getSession).toHaveBeenCalledWith({ founder: 'shria', limit: 5 });
    expect(res.body.turns).toHaveLength(1);
  });

  it('persists long-term memory', async () => {
    remember.mockResolvedValue({ id: '1', founder: 'shria', key: 'city', value: 'Oakland', source: 'agent' });

    const res = await request(app)
      .post('/api/context/memory')
      .set('Authorization', `Bearer ${token}`)
      .send({ founder: 'shria', key: 'city', value: 'Oakland', source: 'agent' });

    expect(res.status).toBe(201);
    expect(remember).toHaveBeenCalledWith({ founder: 'shria', key: 'city', value: 'Oakland', source: 'agent' });
  });

  it('returns 404 when memory entry missing', async () => {
    recall.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/context/memory')
      .set('Authorization', `Bearer ${token}`)
      .query({ founder: 'shria', key: 'city' });

    expect(res.status).toBe(404);
  });
});
