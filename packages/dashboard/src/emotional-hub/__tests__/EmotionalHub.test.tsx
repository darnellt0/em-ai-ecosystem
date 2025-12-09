import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmotionalHub from '../EmotionalHub';

describe('EmotionalHub', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: 'Test reply',
        routedAgents: ['growth.journal'],
        featureId: 'mood-sculptor',
      }),
    }) as any;
  });

  it('renders feature cards and opens interaction view', async () => {
    render(<EmotionalHub />);

    expect(screen.getByText(/Mood Sculptor/i)).toBeInTheDocument();
    const card = screen.getByText(/Mood Sculptor/i);
    fireEvent.click(card);

    expect(await screen.findByText(/Welcome to Mood Sculptor/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Tell me how you feel/i);
    fireEvent.change(input, { target: { value: 'Feeling stressed' } });
    fireEvent.click(screen.getByText(/Send/i));

    await waitFor(() => {
      expect(screen.getByText(/Test reply/i)).toBeInTheDocument();
    });
  });
});
