process.env.NODE_ENV = 'test';
process.env.PORT = '0';

jest.mock('openai', () => {
  const OpenAI = jest.fn().mockImplementation(() => ({}));
  return { __esModule: true, default: OpenAI };
});

jest.mock('puppeteer', () => ({ __esModule: true, default: {} }));
jest.mock('twilio', () => ({ __esModule: true, default: jest.fn(() => ({})) }));

jest.mock('bullmq', () => {
  const mockAdd = jest.fn().mockResolvedValue({ id: 'agent-mock-1', name: 'mock-job' });
  const Queue = jest.fn(() => ({
    add: mockAdd,
    pause: jest.fn(),
    close: jest.fn(),
    getJobCounts: jest.fn().mockResolvedValue({ wait: 0, active: 0, completed: 0, failed: 0 }),
  }));
  const Worker = jest.fn();
  const QueueScheduler = jest.fn();
  const QueueEvents = jest.fn(() => ({ on: jest.fn(), off: jest.fn(), removeAllListeners: jest.fn() }));
  const Job = class {};
  return { __esModule: true, Queue, Worker, QueueScheduler, QueueEvents, Job };
});

jest.mock('ioredis', () => {
  const Redis = jest.fn(() => {
    const instance: any = {
      ping: jest.fn().mockResolvedValue('PONG'),
      duplicate: jest.fn(() => instance),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
      quitAll: jest.fn(),
      end: jest.fn(),
      get: jest.fn().mockResolvedValue('true'),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      lpush: jest.fn().mockResolvedValue(1),
      lrange: jest.fn().mockResolvedValue([]),
      ltrim: jest.fn().mockResolvedValue('OK'),
      xadd: jest.fn().mockResolvedValue('1-0'),
      xrevrange: jest.fn().mockResolvedValue([]),
    };
    return instance;
  });
  return { __esModule: true, default: Redis };
});

// Mock the centralized Redis config module
jest.mock('../src/config/redis.config', () => {
  const mockRedis = require('ioredis');
  return {
    __esModule: true,
    getRedisUrl: jest.fn(() => 'redis://localhost:6379'),
    createRedisClient: jest.fn(() => new mockRedis.default()),
    createLazyRedisClient: jest.fn(() => new mockRedis.default()),
  };
});

jest.mock('pg', () => {
  const connect = jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() });
  const Pool = jest.fn(() => ({
    connect,
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  }));
  return { __esModule: true, Pool };
});

jest.mock('ws', () => {
  const mockOn = jest.fn();
  const WebSocketServer = jest.fn(() => ({
    on: mockOn,
    clients: new Set(),
    handleUpgrade: jest.fn(),
    close: jest.fn(),
  }));
  const WebSocket = jest.fn();
  return { __esModule: true, WebSocketServer, WebSocket };
});

