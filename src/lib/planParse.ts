// Scripted (rules-based) reading of "Describe your trip" text. Used when the live
// AI is off or fails. Like the AI, it only extracts preferences; the itinerary
// itself always comes from tripBuilder.ts.
import type { AiPlan } from './ai';
import { findTours } from './concierge';
import type { Interest } from '../data/types';

const NUM_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
const num = (s?: string) => (s ? (/^\d+$/.test(s) ? +s : NUM_WORDS[s.toLowerCase()] ?? 0) : 0);
const N = '(\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|[一两二三四五六七八九十])';

const interestWords: Record<Interest, RegExp> = {
  nature: /(nature|lake|mountain|canyon|forest|scenery|自然|湖|山|峡谷|风景|森林)/i,
  photography: /(photo|camera|instagram|sunset|sunrise|摄影|拍照|出片|日落|日出)/i,
  culture: /(culture|history|silk road|mausoleum|museum|文化|历史|丝绸之路|丝路|古迹|陵墓)/i,
  adventure: /(adventure|hike|hiking|trek|horse|探险|徒步|骑马|越野)/i,
  relaxation: /(relax|slow|easy|rest|spa|休闲|放松|轻松|慢)/i,
};

export function parsePlanText(text: string, zh: boolean): AiPlan {
  const days = num(new RegExp(`${N}\\s*(?:-\\s*)?(?:days?|nights?|天|日)`, 'i').exec(text)?.[1]);
  const travelers =
    num(new RegExp(`${N}\\s*(?:people|persons|travell?ers|adults|friends|of us|人|位|个人)`, 'i').exec(text)?.[1]) ||
    (/(couple|two of us|my (wife|husband|partner)|我们俩|情侣|夫妻)/i.test(text) ? 2 : /\b(solo|alone|myself)\b|一个人|独自/i.test(text) ? 1 : 0);
  const interests = (Object.keys(interestWords) as Interest[]).filter((k) => interestWords[k].test(text));
  const budget = /(cheap|budget|low cost|经济|便宜|省钱)/i.test(text) ? 'budget' : /(luxury|premium|5[- ]star|豪华|高端)/i.test(text) ? 'premium' : /(comfort|mid-range|舒适)/i.test(text) ? 'comfort' : 'unknown';
  const destinations = findTours(text);
  if (!destinations.length && interests.includes('culture')) destinations.push('turkestan');
  if (!destinations.length && /(lake|湖)/i.test(text)) destinations.push('kolsai');
  const note = zh
    ? `已识别：${destinations.length} 条线路${days ? `，${days} 天` : ''}${travelers ? `，${travelers} 人` : ''}。请检查下方选项。`
    : `Understood: ${destinations.length} tour(s)${days ? `, ${days} days` : ''}${travelers ? `, ${travelers} traveler(s)` : ''}. Please check the options below.`;
  return { destinations, days, travelers, interests, budget, note };
}
