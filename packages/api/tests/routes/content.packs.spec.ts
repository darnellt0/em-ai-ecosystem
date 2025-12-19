import request from 'supertest';
import express from 'express';
import contentRouter from '../../src/routes/content.routes';
import * as service from '../../src/services/contentPack.service';
import * as store from '../../src/content/contentPack.store';

describe('content packs routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', contentRouter);

  const mockPack = {
    packId: 'pack-123',
    createdAt: new Date().toISOString(),
    userId: 'tester',
    topic: 'test topic',
    assets: [],
    plannedActionIds: [],
    status: 'ready',
  };

  beforeEach(() => {
    jest.spyOn(service, 'generateContentPack').mockResolvedValue(mockPack as any);
    jest.spyOn(store, 'listContentPacks').mockReturnValue([{ packId: mockPack.packId, createdAt: mockPack.createdAt, topic: mockPack.topic, userId: mockPack.userId, status: mockPack.status } as any]);
    jest.spyOn(store, 'getContentPack').mockReturnValue(mockPack as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('POST /api/content/packs/generate returns pack', async () => {
    const res = await request(app).post('/api/content/packs/generate').send({ userId: 'tester', topic: 'hello' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pack.packId).toBe(mockPack.packId);
  });

  it('GET /api/content/packs lists packs', async () => {
    const res = await request(app).get('/api/content/packs');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.packs[0].packId).toBe(mockPack.packId);
  });

  it('GET /api/content/packs/:id returns detail', async () => {
    const res = await request(app).get('/api/content/packs/pack-123');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pack.packId).toBe(mockPack.packId);
  });
});
