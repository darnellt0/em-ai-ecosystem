import request from 'supertest';
import app from '../../src/index';

describe('POST /api/content/week', () => {
  it('returns a content pack', async () => {
    const res = await request(app).post('/api/content/week').send({
      scope: 'elevated_movements',
      channels: ['linkedin', 'instagram', 'newsletter'],
      focus: 'leadership',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pack).toBeDefined();
    expect(res.body.pack.linkedinPosts.length).toBeGreaterThan(0);
  });

  it('validates input', async () => {
    const res = await request(app).post('/api/content/week').send({ channels: [] });
    expect(res.status).toBe(400);
  });
});
