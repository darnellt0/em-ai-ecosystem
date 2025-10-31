import dotenv from 'dotenv';
import path from 'path';
import logger from './logger';

dotenv.config({ path: path.join(process.cwd(), '.env') });

interface Config {
  founders: {
    darnell: {
      emailPrimary: string;
      emailPersonal: string;
      calendarId: string;
    };
    shria: {
      emailPrimary: string;
      emailPersonal: string;
      calendarId: string;
    };
  };
  openai: {
    apiKey: string;
  };
  anthropic: {
    apiKey: string;
  };
  elevenlabs: {
    apiKey: string;
    voiceIdShria: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    darnellAppPassword: string;
    shriaAppPassword: string;
  };
  timezone: string;
  allowPersonalDataToLLM: boolean;
  costBudgetMonthly: number;
  nasMountPath: string;
  adminFounder: 'darnell' | 'shria';
  basicAuth: {
    user: string;
    pass: string;
  };
  apiKey: string;
  alerts: {
    critical: string;
    general: string[];
  };
  slackWebhook?: string;
  db?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    name: string;
  };
}

function validateEnv(): Config {
  const required = [
    'OPENAI_API_KEY',
    'DARNELL_EMAIL_PRIMARY',
    'DARNELL_EMAIL_PERSONAL',
    'SHRIA_EMAIL_PRIMARY',
    'SHRIA_EMAIL_PERSONAL',
    'DARNELL_GMAIL_APP_PASSWORD',
    'SHRIA_GMAIL_APP_PASSWORD',
    'BASIC_AUTH_USER',
    'BASIC_AUTH_PASS'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    const msg = missing.join(', ');
    logger.error(`Missing required environment variables: ${msg}`);
    throw new Error(`Missing required environment variables: ${msg}`);
  }
  
  return {
    founders: {
      darnell: {
        emailPrimary: process.env.DARNELL_EMAIL_PRIMARY!,
        emailPersonal: process.env.DARNELL_EMAIL_PERSONAL!,
        calendarId: process.env.DARNELL_CALENDAR_ID || 'primary'
      },
      shria: {
        emailPrimary: process.env.SHRIA_EMAIL_PRIMARY!,
        emailPersonal: process.env.SHRIA_EMAIL_PERSONAL!,
        calendarId: process.env.SHRIA_CALENDAR_ID || 'primary'
      }
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY!
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    },
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      voiceIdShria: process.env.ELEVENLABS_VOICE_ID_SHRIA || ''
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    },
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE !== 'false',
      darnellAppPassword: process.env.DARNELL_GMAIL_APP_PASSWORD!,
      shriaAppPassword: process.env.SHRIA_GMAIL_APP_PASSWORD!
    },
    timezone: process.env.TZ || 'America/Los_Angeles',
    allowPersonalDataToLLM: process.env.ALLOW_PERSONAL_DATA_TO_LLM === 'true',
    costBudgetMonthly: parseInt(process.env.COST_BUDGET_MONTHLY || '100'),
    nasMountPath: process.env.NAS_MOUNT_PATH || '/mnt/wdmycloud',
    adminFounder: (process.env.ADMIN_FOUNDER as 'darnell' | 'shria') || 'darnell',
    basicAuth: {
      user: process.env.BASIC_AUTH_USER!,
      pass: process.env.BASIC_AUTH_PASS!
    },
    apiKey: process.env.API_KEY || '',
    alerts: {
      critical: process.env.ALERT_EMAIL_CRITICAL || '',
      general: (process.env.ALERT_EMAIL_GENERAL || '').split(',').filter(Boolean)
    },
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    db: process.env.DB_HOST ? {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER!,
      pass: process.env.DB_PASS!,
      name: process.env.DB_NAME || 'em_ai'
    } : undefined
  };
}

export const config = validateEnv();
export default config;
