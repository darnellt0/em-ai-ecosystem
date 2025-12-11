import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeadershipHub from '../LeadershipHub';

describe('LeadershipHub', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: 'Leadership reply',
        routedAgents: ['growth.mindset'],
        featureId: 'mood-sculptor',
      }),
    }) as any;
  });

  it('renders leadership feature cards and opens interaction view', async () => {
    render(<LeadershipHub />);

    expect(screen.getByText(/Mood Sculptor/i)).toBeInTheDocument();
    const card = screen.getByText(/Mood Sculptor/i);
    fireEvent.click(card);

    expect(await screen.findByText(/What’s present in your leadership/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/I’m leading a lot/i);
    fireEvent.change(input, { target: { value: 'Leading and need rest' } });
    fireEvent.click(screen.getByText(/Send/i));

    await waitFor(() => {
      expect(screen.getByText(/Leadership reply/i)).toBeInTheDocument();
    });
  });
});
