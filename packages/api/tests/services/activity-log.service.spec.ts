jest.mock('../../src/services/database.service', () => {
  const query = jest.fn().mockResolvedValue({});
  const release = jest.fn();
  const connect = jest.fn().mockResolvedValue({ query, release });

  return {
    databaseService: {
      getPool: jest.fn(() => ({ connect })),
    },
    _mocks: { query, connect, release },
  };
});

const { ActivityLogService } = require('../../src/services/activity-log.service');
const { databaseService, _mocks } = require('../../src/services/database.service');

describe('ActivityLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs agent run when pool is available', async () => {
    const service = new ActivityLogService();
    const result = await service.logAgentRun({
      agentName: 'DailyBrief',
      founderEmail: 'user@example.com',
      status: 'success',
      metadata: { test: true },
    });

    expect(result.success).toBe(true);
    expect(_mocks.connect).toHaveBeenCalled();
    expect(_mocks.query).toHaveBeenCalledTimes(2); // ensure table + insert
  });

  it('returns false when pool is missing', async () => {
    (databaseService.getPool as jest.Mock).mockReturnValueOnce(null);
    const service = new ActivityLogService();

    const result = await service.logAgentRun({
      agentName: 'DailyBrief',
      founderEmail: 'user@example.com',
      status: 'success',
    });

    expect(result.success).toBe(false);
  });
});
