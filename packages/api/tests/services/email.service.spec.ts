jest.mock('nodemailer', () => {
  const sendMail = jest.fn().mockResolvedValue({ messageId: 'msg-123' });
  const verify = jest.fn().mockResolvedValue(true);
  let lastTransport: any = null;
  const createTransport = jest.fn(() => {
    lastTransport = { sendMail, verify };
    return lastTransport;
  });
  return {
    __esModule: true,
    default: { createTransport },
    createTransport,
    // expose mocks for assertions
    _mocks: { sendMail, verify },
    _getLastTransport: () => lastTransport,
  };
});

describe('EmailService', () => {
  const resetEnv = () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_SECURE;
    delete process.env.EMAIL_FROM;
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    resetEnv();
  });

  it('sends email when SMTP config is present', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';

    const nodemailer = require('nodemailer');
    const { EmailService } = require('../../src/services/email.service');
    const service = new EmailService();

    const result = await service.sendEmail('to@example.com', 'Hi', '<p>Hello</p>');

    expect(result.success).toBe(true);
    const transport = nodemailer._getLastTransport();
    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'to@example.com',
        subject: 'Hi',
        html: '<p>Hello</p>',
      })
    );
  });

  it('fails cleanly when SMTP config is missing', async () => {
    const nodemailer = require('nodemailer');
    const { EmailService } = require('../../src/services/email.service');
    const service = new EmailService();

    const result = await service.sendEmail('to@example.com', 'Hi', '<p>Hello</p>');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/SMTP/i);
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });
});
