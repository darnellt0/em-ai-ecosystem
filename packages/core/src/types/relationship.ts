import { FounderId } from './founders';

export interface RelationshipEntry {
  id: string;
  name: string;
  email?: string;
  type: 'client' | 'partner' | 'mentor' | 'team' | 'community';
  lastContact: Date;
  nextTouchpointDue: Date;
  interactionFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  relationshipStrength: number;
  primaryContact?: FounderId | 'both';
  notes: string;
  tags: string[];
}

export interface Interaction {
  date: Date;
  founder: FounderId | 'both';
  person: string;
  type: 'email' | 'meeting' | 'call';
  context: string;
}
