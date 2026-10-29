// SAMPLE reviews (Demo data), written by the team to show the format. They are not real
// travelers. In the product a review can only be written with a booking code after the
// trip date, so every published review comes from someone who actually went.
// Each review keeps its original language and a translation (EN / 中文).

import type { TourId } from './types';

export type Review = {
  tour: TourId;
  name: string;
  from: string;
  lang: 'zh' | 'en' | 'ru';
  stars: 1 | 2 | 3 | 4 | 5;
  code: string;
  month: string;
  text: { zh: string; en: string; ru?: string };
};

export const sampleReviews: Review[] = [
  { tour: 'kolsai', name: '王丽', from: 'Shanghai', lang: 'zh', stars: 5, code: 'SG-H7KD', month: '2026-09', text: { zh: '凯恩迪湖的水下森林太震撼了！出发前和导游视频见过面，很放心。山路有点颠簸，晕车的朋友记得带药。', en: 'The sunken forest at Kaindy was stunning! We met the guide on video before the trip, which was reassuring. The mountain road is bumpy: bring motion-sickness pills.' } },
  { tour: 'kolsai', name: 'Daniel', from: 'Singapore', lang: 'en', stars: 4, code: 'SG-M3QF', month: '2026-08', text: { en: 'Clear about what was and wasn’t included, which I appreciated. The 4×4 transfer to Kaindy was confirmed in writing two days before.', zh: '包含和不包含的内容写得很清楚，这点我很欣赏。去凯恩迪湖的四驱车接驳在出发前两天书面确认了。' } },
  { tour: 'charyn', name: '陈晨', from: 'Chengdu', lang: 'zh', stars: 5, code: 'SG-2PXR', month: '2026-09', text: { zh: '峡谷日出非常值得早起。客栈很干净，晚饭很好吃。', en: 'The sunrise over the canyon was worth getting up early for. The guesthouse was clean and dinner was great.' } },
  { tour: 'charyn', name: 'Мария', from: 'Novosibirsk', lang: 'ru', stars: 4, code: 'SG-9TWA', month: '2026-07', text: { ru: 'Отличная поездка, гид всё объяснял по-английски и немного по-китайски. Дорога длинная, берите воду.', en: 'Great trip, the guide explained everything in English and a bit of Chinese. Long drive, bring water.', zh: '很棒的旅行，导游用英语讲解，也会一点中文。路程很长，记得带水。' } },
  { tour: 'turkestan', name: '李明', from: 'Beijing', lang: 'zh', stars: 5, code: 'SG-K4NE', month: '2026-10', text: { zh: '亚萨维陵墓非常壮观，导游讲的丝绸之路历史很有意思。', en: 'The Yasawi mausoleum is magnificent, and the guide’s Silk Road history was fascinating.' } },
  { tour: 'turkestan', name: 'Ji-woo', from: 'Seoul', lang: 'en', stars: 5, code: 'SG-B8HM', month: '2026-09', text: { en: 'Easy to book with my own card, and the audio guide filled the gaps between stops.', zh: '用我自己的银行卡就能轻松预订，站点之间的语音导览也很实用。' } },
  { tour: 'burabay', name: '张悦', from: 'Guangzhou', lang: 'zh', stars: 4, code: 'SG-5DJC', month: '2026-08', text: { zh: '湖水很清澈，空气很好，适合从阿斯塔纳出发放松两天。', en: 'Clear lakes and fresh air, a good two-day break from Astana.' } },
  { tour: 'burabay', name: 'Tom', from: 'Berlin', lang: 'en', stars: 5, code: 'SG-R6UV', month: '2026-07', text: { en: 'Short, relaxed and well organised. The Trip Pass let my parents follow along.', zh: '行程短而轻松，组织得很好。我父母通过行程通行证随时了解我的行程。' } },
];
