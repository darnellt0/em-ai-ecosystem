import { WeeklyContentPack, WeeklyContentRequest } from '../content/types';
import { generateWeeklyContentPack } from '../workflows/contentWeekEngine';

export async function runWeeklyContentPack(request: WeeklyContentRequest): Promise<WeeklyContentPack> {
  return generateWeeklyContentPack(request);
}
