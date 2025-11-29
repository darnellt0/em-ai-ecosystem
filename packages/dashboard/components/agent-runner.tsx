"use client";

import { FormEvent, useMemo, useState } from 'react';
import type { AgentConfig, AgentInputField } from '@/types/emAiAgents';

interface AgentRunnerProps {
  agent: AgentConfig;
}

type FormState = Record<string, any>;

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

function getInitialValue(field: AgentInputField) {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  switch (field.type) {
    case 'multi-select':
      return [];
    case 'boolean':
      return false;
    case 'number':
      return '';
    default:
      return '';
  }
}

export function AgentRunner({ agent }: AgentRunnerProps) {
  const [formState, setFormState] = useState<FormState>(() =>
    agent.inputSchema.reduce<FormState>((acc, field) => {
      acc[field.id] = getInitialValue(field);
      return acc;
    }, {})
  );
  const [isSubmitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runEndpoint = useMemo(() => {
    const base = apiBaseUrl.length > 0 ? apiBaseUrl : '';
    return `${base}/em-ai/agents/${agent.id}/run`;
  }, [agent.id]);

  function handleFieldChange(field: AgentInputField, value: any) {
    setFormState((prev) => ({
      ...prev,
      [field.id]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setOutput(null);
    setSubmitting(true);

    try {
      const res = await fetch(runEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: formState }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Agent run failed');
      }

      const data = await res.json();
      const text = data?.result?.outputText ?? JSON.stringify(data, null, 2);
      setOutput(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error running agent');
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(field: AgentInputField) {
    const baseClasses =
      'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-emerald-300/70 focus:outline-none focus:ring-0';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.id}
            name={field.id}
            required={field.required}
            placeholder={field.placeholder}
            className={`${baseClasses} min-h-[120px] resize-y`}
            value={formState[field.id] ?? ''}
            onChange={(event) => handleFieldChange(field, event.target.value)}
          />
        );
      case 'select':
        return (
          <select
            id={field.id}
            name={field.id}
            required={field.required}
            className={`${baseClasses} bg-[#050608]`}
            value={formState[field.id] ?? ''}
            onChange={(event) => handleFieldChange(field, event.target.value)}
          >
            <option value="" disabled>
              {field.placeholder || 'Select an option'}
            </option>
            {(field.options || []).map((option) => (
              <option key={option.value} value={option.value} className="bg-[#050608] text-black">
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'multi-select':
        return (
          <select
            id={field.id}
            name={field.id}
            multiple
            className={`${baseClasses} bg-[#050608]`}
            value={formState[field.id] ?? []}
            onChange={(event) =>
              handleFieldChange(
                field,
                Array.from(event.target.selectedOptions).map((option) => option.value)
              )
            }
          >
            {(field.options || []).map((option) => (
              <option key={option.value} value={option.value} className="bg-[#050608] text-black">
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'number':
        return (
          <input
            id={field.id}
            name={field.id}
            type="number"
            required={field.required}
            placeholder={field.placeholder}
            className={baseClasses}
            value={formState[field.id] ?? ''}
            onChange={(event) => handleFieldChange(field, event.target.value === '' ? '' : Number(event.target.value))}
          />
        );
      case 'boolean':
        return (
          <label className="inline-flex items-center gap-3 text-white/80">
            <input
              id={field.id}
              name={field.id}
              type="checkbox"
              className="h-4 w-4 rounded border-white/30 bg-transparent text-emerald-300 focus:ring-emerald-500"
              checked={Boolean(formState[field.id])}
              onChange={(event) => handleFieldChange(field, event.target.checked)}
            />
            <span>{field.placeholder || 'Yes'}</span>
          </label>
        );
      default:
        return (
          <input
            id={field.id}
            name={field.id}
            type="text"
            required={field.required}
            placeholder={field.placeholder}
            className={baseClasses}
            value={formState[field.id] ?? ''}
            onChange={(event) => handleFieldChange(field, event.target.value)}
          />
        );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Input</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">Personalize the agent</h3>
          </div>
          <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
            {agent.inputSchema.length} fields
          </span>
        </div>

        <div className="space-y-5">
          {agent.inputSchema.map((field) => (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor={field.id} className="text-white">
                  {field.label}
                </label>
                {field.required && <span className="text-xs uppercase tracking-[0.2em] text-rose-200">Required</span>}
              </div>
              {renderField(field)}
              {field.helperText && <p className="text-xs text-white/60">{field.helperText}</p>}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-400/90 px-4 py-3 text-lg font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/30"
        >
          {isSubmitting ? 'Running…' : 'Run Agent'}
        </button>

        {error && <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Output</p>
        <h3 className="text-2xl font-semibold text-white">Results</h3>
        <div className="min-h-[240px] rounded-xl border border-white/5 bg-black/40 p-4 text-sm text-white/80">
          {isSubmitting && <p className="text-white/60">Running {agent.name}…</p>}
          {!isSubmitting && output && (
            <pre className="whitespace-pre-wrap text-white">{output}</pre>
          )}
          {!isSubmitting && !output && <p className="text-white/50">Run {agent.name} to see results here.</p>}
        </div>
      </div>
    </form>
  );
}
