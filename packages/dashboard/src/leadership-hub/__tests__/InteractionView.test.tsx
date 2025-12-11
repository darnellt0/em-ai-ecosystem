import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InteractionView } from '../InteractionView';
import { LeadershipFeature } from '../features';

const mockFeature: LeadershipFeature = {
  id: 'mood-sculptor',
  title: 'Mood Sculptor',
  desc: 'Shape the leadership energy you bring—calm, clear, and rooted in rest.',
  color: 'from-violet-500/30 via-indigo-500/20 to-blue-500/20',
  text: 'text-violet-100',
  border: 'border-violet-500/40',
  shadow: 'shadow-[0_0_25px_rgba(139,92,246,0.35)]',
  icon: () => <div aria-label="icon" />,
};

describe('InteractionView', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    (global as any).fetch = undefined;
  });

  it('sends message and renders assistant reply (happy path)', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: 'Leadership guidance reply',
        routedAgents: ['MindsetAgent'],
        featureId: 'mood-sculptor',
      }),
    } as any);

    render(<InteractionView feature={mockFeature} onClose={() => {}} />);

    const input = screen.getByPlaceholderText(/rested and intentional/i);
    fireEvent.change(input, { target: { value: 'My leadership context' } });
    fireEvent.click(screen.getByText(/Send/i));

    await waitFor(() => {
      expect(screen.getByText(/Leadership guidance reply/i)).toBeInTheDocument();
      expect(screen.getByText(/My leadership context/i)).toBeInTheDocument();
    });

    expect((global as any).fetch).toHaveBeenCalledWith('/api/em-ai/leadership-session', expect.any(Object));
    const call = ((global as any).fetch as jest.Mock).mock.calls[0][1];
    expect(call.method).toBe('POST');
    expect(call.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(call.body);
    expect(body.featureId).toBe('mood-sculptor');
    expect(body.message).toBe('My leadership context');
    expect(body.history?.[0]?.content).toBe('My leadership context');
  });

  it('shows error when fetch fails', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('Network fail'));

    render(<InteractionView feature={mockFeature} onClose={() => {}} />);

    const input = screen.getByPlaceholderText(/rested and intentional/i);
    fireEvent.change(input, { target: { value: 'Struggling with pace' } });
    fireEvent.click(screen.getByText(/Send/i));

    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Leadership guidance reply/i)).not.toBeInTheDocument();
  });
});
