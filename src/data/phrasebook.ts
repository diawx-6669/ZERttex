// Offline phrasebook for the in-trip translator (#/talk). Works with no internet:
// it is part of the page itself. Traveler speaks Chinese, guide speaks Russian.
// Translations by the team: a native-speaker check is planned before launch
// (budget line "Localization ZH + EN, native proofreading").

import type { L } from './types';

export type Phrase = { zh: string; py: string; ru: string; en: string };
export type PhraseGroup = { id: string; name: L; icon: 'chat' | 'route' | 'bag' | 'alert' | 'card' | 'pin' | 'users'; dir: 'traveler' | 'guide'; phrases: Phrase[] };

export const phrasebook: PhraseGroup[] = [
  {
    id: 'basics',
    name: { en: 'Basics', zh: '基本用语' },
    icon: 'chat',
    dir: 'traveler',
    phrases: [
      { zh: '你好', py: 'nǐ hǎo', ru: 'Здравствуйте', en: 'Hello' },
      { zh: '谢谢', py: 'xièxie', ru: 'Спасибо', en: 'Thank you' },
      { zh: '请说慢一点', py: 'qǐng shuō màn yìdiǎn', ru: 'Говорите, пожалуйста, медленнее', en: 'Please speak slowly' },
      { zh: '我听不懂', py: 'wǒ tīng bù dǒng', ru: 'Я не понимаю', en: 'I don’t understand' },
      { zh: '可以拍照吗？', py: 'kěyǐ pāizhào ma?', ru: 'Можно сфотографировать?', en: 'May I take a photo?' },
      { zh: '洗手间在哪里？', py: 'xǐshǒujiān zài nǎlǐ?', ru: 'Где туалет?', en: 'Where is the toilet?' },
    ],
  },
  {
    id: 'road',
    name: { en: 'On the road', zh: '路上' },
    icon: 'route',
    dir: 'traveler',
    phrases: [
      { zh: '我们几点出发？', py: 'wǒmen jǐ diǎn chūfā?', ru: 'Во сколько мы выезжаем?', en: 'What time do we leave?' },
      { zh: '还要多久到？', py: 'hái yào duōjiǔ dào?', ru: 'Сколько ещё ехать?', en: 'How much longer until we arrive?' },
      { zh: '请停一下车', py: 'qǐng tíng yíxià chē', ru: 'Остановите, пожалуйста, машину', en: 'Please stop the car' },
      { zh: '我晕车', py: 'wǒ yūnchē', ru: 'Меня укачивает', en: 'I feel carsick' },
      { zh: '我们在这里停留多久？', py: 'wǒmen zài zhèlǐ tíngliú duōjiǔ?', ru: 'Сколько мы здесь пробудем?', en: 'How long do we stay here?' },
      { zh: '这条路安全吗？', py: 'zhè tiáo lù ānquán ma?', ru: 'Эта дорога безопасна?', en: 'Is this road safe?' },
    ],
  },
  {
    id: 'food',
    name: { en: 'Food', zh: '饮食' },
    icon: 'bag',
    dir: 'traveler',
    phrases: [
      { zh: '我不吃猪肉', py: 'wǒ bù chī zhūròu', ru: 'Я не ем свинину', en: 'I don’t eat pork' },
      { zh: '我对坚果过敏', py: 'wǒ duì jiānguǒ guòmǐn', ru: 'У меня аллергия на орехи', en: 'I’m allergic to nuts' },
      { zh: '我吃素', py: 'wǒ chī sù', ru: 'Я не ем мясо (вегетарианец)', en: 'I’m vegetarian' },
      { zh: '不要太辣', py: 'bú yào tài là', ru: 'Не очень остро, пожалуйста', en: 'Not too spicy, please' },
      { zh: '有热水吗？', py: 'yǒu rèshuǐ ma?', ru: 'Есть горячая вода?', en: 'Is there hot water?' },
      { zh: '请给我账单', py: 'qǐng gěi wǒ zhàngdān', ru: 'Счёт, пожалуйста', en: 'The bill, please' },
    ],
  },
  {
    id: 'help',
    name: { en: 'Health & help', zh: '健康与求助' },
    icon: 'alert',
    dir: 'traveler',
    phrases: [
      { zh: '我需要医生', py: 'wǒ xūyào yīshēng', ru: 'Мне нужен врач', en: 'I need a doctor' },
      { zh: '请帮帮我', py: 'qǐng bāngbang wǒ', ru: 'Помогите мне, пожалуйста', en: 'Please help me' },
      { zh: '我头疼', py: 'wǒ tóuténg', ru: 'У меня болит голова', en: 'I have a headache' },
      { zh: '我迷路了', py: 'wǒ mílù le', ru: 'Я заблудился (заблудилась)', en: 'I am lost' },
      { zh: '请打 112 急救电话', py: 'qǐng dǎ yāo yāo èr jíjiù diànhuà', ru: 'Позвоните, пожалуйста, 112', en: 'Please call 112 (emergency)' },
      { zh: '我的护照丢了', py: 'wǒ de hùzhào diū le', ru: 'Я потерял(а) паспорт', en: 'I lost my passport' },
    ],
  },
  {
    id: 'money',
    name: { en: 'Money', zh: '付款' },
    icon: 'card',
    dir: 'traveler',
    phrases: [
      { zh: '多少钱？', py: 'duōshao qián?', ru: 'Сколько стоит?', en: 'How much is it?' },
      { zh: '可以刷卡吗？', py: 'kěyǐ shuākǎ ma?', ru: 'Можно оплатить картой?', en: 'Can I pay by card?' },
      { zh: '可以用支付宝吗？', py: 'kěyǐ yòng Zhīfùbǎo ma?', ru: 'Можно оплатить через Alipay?', en: 'Can I pay with Alipay?' },
      { zh: '附近有取款机吗？', py: 'fùjìn yǒu qǔkuǎnjī ma?', ru: 'Здесь рядом есть банкомат?', en: 'Is there an ATM nearby?' },
    ],
  },
  {
    id: 'stay',
    name: { en: 'Guesthouse', zh: '住宿' },
    icon: 'pin',
    dir: 'traveler',
    phrases: [
      { zh: 'Wi-Fi 密码是多少？', py: 'Wi-Fi mìmǎ shì duōshao?', ru: 'Какой пароль от Wi-Fi?', en: 'What is the Wi-Fi password?' },
      { zh: '房间太冷了', py: 'fángjiān tài lěng le', ru: 'В комнате очень холодно', en: 'The room is too cold' },
      { zh: '明天早上几点吃早饭？', py: 'míngtiān zǎoshang jǐ diǎn chī zǎofàn?', ru: 'Во сколько завтра завтрак?', en: 'What time is breakfast tomorrow?' },
      { zh: '可以给手机充电吗？', py: 'kěyǐ gěi shǒujī chōngdiàn ma?', ru: 'Можно зарядить телефон?', en: 'Can I charge my phone?' },
    ],
  },
  {
    id: 'guide',
    name: { en: 'Guide says', zh: '导游常用语' },
    icon: 'users',
    dir: 'guide',
    phrases: [
      { ru: 'Пристегнитесь, пожалуйста', zh: '请系好安全带', py: 'qǐng jì hǎo ānquándài', en: 'Please fasten your seatbelt' },
      { ru: 'Через 20 минут остановка', zh: '20 分钟后停车休息', py: 'èrshí fēnzhōng hòu tíngchē xiūxi', en: 'We stop in 20 minutes' },
      { ru: 'Встречаемся здесь через час', zh: '一小时后在这里集合', py: 'yì xiǎoshí hòu zài zhèlǐ jíhé', en: 'Meet here in one hour' },
      { ru: 'Держитесь тропы', zh: '请沿着小路走', py: 'qǐng yánzhe xiǎolù zǒu', en: 'Please stay on the path' },
      { ru: 'Здесь нельзя фотографировать', zh: '这里不能拍照', py: 'zhèlǐ bù néng pāizhào', en: 'No photos here' },
      { ru: 'Возьмите тёплую одежду', zh: '请带上保暖衣服', py: 'qǐng dàishàng bǎonuǎn yīfu', en: 'Bring warm clothes' },
      { ru: 'Воду из реки пить нельзя', zh: '河水不能喝', py: 'héshuǐ bù néng hē', en: 'Do not drink the river water' },
    ],
  },
];

const allPhrases = phrasebook.flatMap((g) => g.phrases);

/** Offline fallback for spoken text: the closest phrasebook entry, or null if nothing is close enough. */
export function matchPhrase(text: string, from: 'zh' | 'ru'): Phrase | null {
  const norm = (s: string) => s.toLowerCase().replace(/[\s,.!?？！。，、()（）-]/g, '');
  const q = norm(text);
  if (!q) return null;
  const units = (s: string) => (from === 'zh' ? [...s] : s.toLowerCase().split(/[^a-zа-яё0-9]+/i).filter((w) => w.length > 2));
  const qa = new Set(units(from === 'zh' ? q : text));
  let best: { p: Phrase; score: number } | null = null;
  for (const p of allPhrases) {
    const target = from === 'zh' ? norm(p.zh) : p.ru;
    if (norm(target) === q) return p;
    const ta = new Set(units(from === 'zh' ? target : target));
    const inter = [...qa].filter((u) => ta.has(u)).length;
    const score = inter / Math.max(qa.size, ta.size, 1);
    if (!best || score > best.score) best = { p, score };
  }
  return best && best.score >= 0.6 ? best.p : null;
}
