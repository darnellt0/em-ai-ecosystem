import { callEmExecutiveAdmin } from '../../src/services/executiveAdmin.service';
import * as contentService from '../../src/services/contentWeek.service';

describe('Executive Admin - weekly content intent', () => {
  it('routes content.weeklyPack and returns pack', async () => {
    const mockPack = {
      weekSummary: 'test',
      themes: ['a'],
      linkedinPosts: ['post'],
      instagramPosts: ['post'],
      newsletterSections: ['section'],
      videoScripts: ['script'],
      carousel: { slides: [], canvaPrompt: '' },
      visualGuidance: { general: '', video: '', newsletter: '' },
      meta: { generatedAt: '', sourceAgents: [], scope: 's', channels: [], tone: '', focus: '' },
    };

    jest.spyOn(contentService, 'runWeeklyContentPack').mockResolvedValueOnce(mockPack as any);

    const res = await callEmExecutiveAdmin({
      agentKey: 'content.weeklyPack',
      mode: 'single',
      payload: { scope: 's', channels: ['linkedin'] },
    });

    expect(contentService.runWeeklyContentPack).toHaveBeenCalled();
    expect(res.outputText || res.message).toBeDefined();
  });
});
