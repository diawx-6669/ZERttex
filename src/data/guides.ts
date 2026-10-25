import type { Guide } from './types';

// Sample profiles only. Not real people; names are illustrative.
export const guides: Guide[] = [
  {
    id: 'aruzhan',
    name: 'Aruzhan',
    initials: 'AR',
    role: { en: 'Lead guide · mountains', zh: '首席导游 · 山地' },
    languages: [
      { en: 'Kazakh', zh: '哈萨克语' },
      { en: 'Russian', zh: '俄语' },
      { en: 'English', zh: '英语' },
      { en: 'Chinese (level to be tested)', zh: '中文（水平待测试）' },
    ],
    specialties: [
      { en: 'Kolsai & Kaindy trails', zh: '科尔赛与凯恩迪步道' },
      { en: 'First aid (certificate to be verified)', zh: '急救（证书待核实）' },
    ],
    base: { en: 'Almaty', zh: '阿拉木图' },
    tours: ['kolsai', 'charyn'],
    intro: {
      en: 'I grew up near the mountains and love showing guests the quiet side of the Tien Shan.',
      zh: '我在山脚下长大，喜欢带客人领略天山宁静的一面。',
    },
  },
  {
    id: 'daniyar',
    name: 'Daniyar',
    initials: 'DN',
    role: { en: 'Photo guide · canyons and steppe', zh: '摄影导游 · 峡谷与草原' },
    languages: [
      { en: 'Kazakh', zh: '哈萨克语' },
      { en: 'Russian', zh: '俄语' },
      { en: 'English', zh: '英语' },
    ],
    specialties: [
      { en: 'Sunrise and night-sky photography', zh: '日出与星空摄影' },
      { en: 'Charyn Canyon routes', zh: '查伦峡谷路线' },
    ],
    base: { en: 'Almaty', zh: '阿拉木图' },
    tours: ['charyn', 'burabay'],
    intro: {
      en: 'I will help you find the light: the best hour for every viewpoint on the route.',
      zh: '我会帮您找到最好的光线：路线上每个观景点的最佳拍摄时刻。',
    },
  },
  {
    id: 'madina',
    name: 'Madina',
    initials: 'MD',
    role: { en: 'Culture guide · Silk Road', zh: '文化导游 · 丝绸之路' },
    languages: [
      { en: 'Kazakh', zh: '哈萨克语' },
      { en: 'Russian', zh: '俄语' },
      { en: 'English', zh: '英语' },
      { en: 'Chinese (level to be tested)', zh: '中文（水平待测试）' },
    ],
    specialties: [
      { en: 'Turkestan heritage sites', zh: '突厥斯坦遗产地' },
      { en: 'Crafts and local food', zh: '手工艺与当地美食' },
    ],
    base: { en: 'Turkestan', zh: '突厥斯坦' },
    tours: ['turkestan'],
    intro: {
      en: 'Every stone in Turkestan has a story. I will tell you the ones my grandmother told me.',
      zh: '突厥斯坦的每一块石头都有故事。我会讲给您听祖母讲给我的那些。',
    },
  },
];
