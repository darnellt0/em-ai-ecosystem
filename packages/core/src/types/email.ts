import { FounderId } from './founders';

export interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  timestamp: Date;
  labels: string[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  data?: Buffer;
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  tone: 'formal' | 'warm' | 'concise' | 'apologetic';
  confidence: number;
  reasoning: string;
}

export interface InboxDigest {
  timestamp: Date;
  founderId: FounderId;
  totalUnread: number;
  urgent: Email[];
  draftsReady: EmailDraft[];
  needsAttention: Email[];
  canDefer: Email[];
  summary: string;
}

export interface VoiceDNA {
  founder: FounderId;
  greetingStyle: string[];
  signoffStyle: string[];
  toneMarkers: string[];
  avgSentenceLength: number;
  commonPhrases: string[];
}
