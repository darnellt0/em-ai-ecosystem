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
      connect: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
      quit: jest.fn(),
      quitAll: jest.fn(),
      end: jest.fn(),
      get: jest.fn().mockResolvedValue('true'),
      xrevrange: jest.fn().mockResolvedValue([]),
    };
    return instance;
  });
  return { __esModule: true, default: Redis };
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

process.env.PORT = process.env.PORT || '0';
