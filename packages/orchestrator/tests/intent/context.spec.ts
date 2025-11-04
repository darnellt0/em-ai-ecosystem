import { resolveReferents } from '../../src/intent/context';
import { SessionTurn } from '../../src/intent/types';

describe('resolveReferents', () => {
  const baseTurns: SessionTurn[] = [
    {
      text: 'Reschedule my strategy meeting',
      intent: 'scheduler.reschedule',
      entities: {
        eventId: 'evt-123',
        title: 'strategy meeting',
        date: 'tomorrow',
        time: '3 pm',
      },
    },
    {
      text: 'Log the outreach task',
      intent: 'support.logComplete',
      entities: {
        taskId: 'task-77',
        title: 'investor outreach',
      },
    },
  ];

  it('fills event data when user references that meeting', () => {
    const entities = resolveReferents('Can you confirm that meeting?', baseTurns);
    expect(entities.eventId).toBe('evt-123');
    expect(entities.title).toBe('strategy meeting');
    expect(entities.time).toBe('3 pm');
  });

  it('fills task data when user references that task', () => {
    const entities = resolveReferents('Mark that task done', baseTurns);
    expect(entities.taskId).toBe('task-77');
    expect(entities.title).toBe('investor outreach');
  });

  it('returns empty object when no referent found', () => {
    const entities = resolveReferents('Tell me a joke', baseTurns);
    expect(entities).toEqual({});
  });
});
