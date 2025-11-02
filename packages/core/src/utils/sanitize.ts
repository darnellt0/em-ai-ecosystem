import { config } from './config';

export function sanitizeForLLM(text: string, allowSensitive: boolean = config.allowPersonalDataToLLM): string {
  if (allowSensitive) return text;
  
  let sanitized = text;
  sanitized = sanitized.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g, '[EMAIL]');
  sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
  sanitized = sanitized.replace(/\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g, '[PHONE]');
  sanitized = sanitized.replace(/https?:\/\/\S+/g, '[URL]');
  sanitized = sanitized.replace(/zoom\.us\/[^\s]+/gi, '[MEETING_LINK]');
  sanitized = sanitized.replace(/meet\.google\.com\/[^\s]+/gi, '[MEETING_LINK]');
  sanitized = sanitized.replace(/[a-z0-9]{20,}@group\.calendar\.google\.com/gi, '[CALENDAR_ID]');
  
  return sanitized;
}

export function sanitizeEmail(email: any): any {
  return {
    ...email,
    from: config.allowPersonalDataToLLM ? email.from : '[EMAIL]',
    to: config.allowPersonalDataToLLM ? email.to : ['[EMAIL]'],
    body: sanitizeForLLM(email.body)
  };
}
