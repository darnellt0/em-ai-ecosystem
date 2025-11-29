export type AgentInputFieldType = 'text' | 'textarea' | 'select' | 'multi-select' | 'number' | 'boolean';

export interface AgentInputFieldOption {
  value: string;
  label: string;
}

export interface AgentInputField {
  id: string;
  label: string;
  type: AgentInputFieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  options?: AgentInputFieldOption[];
  defaultValue?: any;
}

export interface AgentConfig {
  id: string;
  name: string;
  category: 'Growth' | 'Ops' | 'Money' | 'Admin' | 'Other';
  icon?: string;
  tagline: string;
  description: string;
  inputSchema: AgentInputField[];
  orchestratorKey: string;
  mode?: 'single' | 'orchestrated';
  tags?: string[];
}
