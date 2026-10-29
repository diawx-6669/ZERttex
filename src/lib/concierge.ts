import { tours, tourById } from '../data/tours';
import type { Lang, TagKind, Tour, TourId } from '../data/types';

// Scripted, keyword-based concierge. NOT a live AI.
// Rule: never claim availability, prices beyond demo data, or credentials
// the company has not proven. When unsure → hand off to a human manager.

export type ChatAction =
  | { kind: 'tour'; id: TourId }
  | { kind: 'book'; id?: TourId }
  | { kind: 'manager' }
  | { kind: 'trust' }
  | { kind: 'plan' }
  | { kind: 'route'; to: '/tours' | '/trip' | '/postcard' };

export type BotAnswer = {
  text: string;
  lang: Lang;
  tag?: TagKind;
  actions?: ChatAction[];
  handoff?: boolean;
  intent: string;
  /** True when the live AI wrote this answer (always shown with an AI tag). */
  ai?: boolean;
  /** Honesty labels of the data the AI used. */
  tags?: TagKind[];
  /** Price guard: every number in the AI reply was found in verified data, or the reply was blocked. */
  guard?: 'passed' | 'blocked';
};

export const detectLang = (text: string, fallback: Lang): Lang => {
  if (/[㐀-鿿]/.test(text)) return 'zh';
  if (/[a-z]{2,}/i.test(text)) return 'en';
  return fallback;
};

type Intent = {
  id: string;
  en: (string | RegExp)[];
  zh: string[];
};

const intents: Intent[] = [
  { id: 'human', en: ['manager', 'human', 'real person', 'operator', 'call me', 'phone number'], zh: ['人工', '客服', '经理', '真人', '电话'] },
  { id: 'availability', en: ['available', 'availability', 'free seats', 'spots left', 'sold out', 'places left', 'seats left'], zh: ['有位', '空位', '名额', '还有位', '满了', '余位'] },
  { id: 'payment', en: ['pay', 'payment', 'card', 'alipay', 'wechat', 'kaspi', 'cash', 'mastercard', /visa\s*card/, 'unionpay', 'currency', 'yuan', 'dollar'], zh: ['支付', '付款', '支付宝', '微信', '银行卡', '信用卡', '外卡', '银联', '刷卡', '人民币', '汇率'] },
  { id: 'cancel', en: ['cancel', 'refund', 'reschedule', 'change date', 'money back', 'change my date'], zh: ['取消', '退款', '改期', '退钱', '改日期', '退订'] },
  { id: 'book', en: ['book', 'reserve', 'reservation', 'sign up', 'how to order', 'buy'], zh: ['预订', '预定', '怎么订', '报名', '下单', '购买'] },
  { id: 'included', en: ['include', 'included', "what's in", 'whats in', 'covered', 'extra cost', 'hidden'], zh: ['包含', '包括', '含什么', '包不包', '额外费用', '隐藏'] },
  { id: 'visa', en: [/\bvisa\b(?!\s*card)/, 'passport', 'entry', 'border', 'visa-free', 'how long can i stay'], zh: ['签证', '免签', '入境', '护照', '停留多久', '待多久'] },
  { id: 'zhguide', en: ['chinese guide', 'chinese-speaking', 'chinese speaking', 'mandarin', 'speak chinese', 'in chinese'], zh: ['中文导游', '中文', '普通话', '华语', '说中文', '讲中文'] },
  { id: 'choose', en: ['which tour', 'recommend', 'choose', 'best tour', 'suggest', 'what should i do', 'first time'], zh: ['推荐', '选哪', '哪个好', '哪条', '适合', '第一次'] },
  { id: 'packing', en: ['pack', 'bring', 'wear', 'clothes', 'luggage', 'shoes'], zh: ['带什么', '行李', '穿什么', '装备', '衣服', '鞋'] },
  { id: 'trust', en: ['trust', 'safe', 'scam', 'legit', 'license', 'licence', 'insurance', 'reliable', 'real company', 'reviews'], zh: ['可靠', '安全', '靠谱', '骗', '执照', '许可', '保险', '信任', '正规', '评价'] },
  { id: 'transport', en: ['transport', 'airport', 'transfer', 'train', 'flight', 'get to', 'taxi', 'pick up', 'pick-up', 'how far'], zh: ['交通', '机场', '接送', '火车', '航班', '怎么去', '打车', '接机', '多远'] },
  { id: 'price', en: ['price', 'cost', 'how much', 'expensive', 'cheap'], zh: ['价格', '多少钱', '费用', '贵', '便宜', '价钱'] },
  { id: 'weather', en: ['weather', 'rain', 'snow', 'season', 'when to go', 'best time', 'temperature'], zh: ['天气', '下雨', '下雪', '季节', '什么时候去', '气温', '最佳时间'] },
  { id: 'emergency', en: ['emergency', 'police', 'ambulance', 'hospital', 'help me', 'lost'], zh: ['紧急', '急救', '报警', '医院', '救命', '迷路'] },
  { id: 'greeting', en: [/^(hi|hello|hey)\b/, 'good morning', 'good evening'], zh: ['你好', '您好', '嗨', '哈喽'] },
];

const tourWords: Record<TourId, (string | RegExp)[]> = {
  charyn: ['charyn', 'canyon', '查伦', '峡谷'],
  kolsai: ['kolsai', 'kaindy', 'saty', '科尔赛', '凯恩迪', '高山湖'],
  turkestan: ['turkestan', 'yasawi', 'yassawi', 'otrar', 'arystan', 'silk road', '突厥斯坦', '亚萨维', '讹答剌', '丝绸之路', '丝路'],
  burabay: ['burabay', 'borovoe', 'borovoye', 'okzhetpes', '布拉拜', '博罗沃耶'],
};

const has = (text: string, w: string | RegExp) => (typeof w === 'string' ? text.includes(w) : w.test(text));

export const findTour = (text: string): Tour | undefined => {
  const q = text.toLowerCase();
  const id = (Object.keys(tourWords) as TourId[]).find((k) => tourWords[k].some((w) => has(q, w)));
  return tourById(id);
};

/** Every tour mentioned in the text (for the trip-builder free-text box). */
export const findTours = (text: string): TourId[] => {
  const q = text.toLowerCase();
  return (Object.keys(tourWords) as TourId[]).filter((k) => tourWords[k].some((w) => has(q, w)));
};

const score = (q: string, it: Intent) => it.en.filter((w) => has(q, w)).length + it.zh.filter((w) => q.includes(w)).length;

const fmt = (n: number) => n.toLocaleString('en-US');
const bullet = (items: string[]) => items.map((x) => `• ${x}`).join('\n');

function tourIncluded(t: Tour, lang: Lang): BotAnswer {
  const i = t.inclusions;
  const text =
    lang === 'zh'
      ? `「${t.name.zh}」${t.days}天，演示价格 ${fmt(t.priceKzt)} 坚戈/人。\n\n已包含：\n${bullet(i.included.map((x) => x.label.zh))}\n\n不包含：\n${bullet(i.notIncluded.map((x) => x.label.zh))}\n\n尚未确认（出行前书面确认）：\n${bullet(i.unconfirmed.map((x) => x.label.zh))}`
      : `${t.name.en}, ${t.days} days, demo price ${fmt(t.priceKzt)} KZT per person.\n\nIncluded:\n${bullet(i.included.map((x) => x.label.en))}\n\nNot included:\n${bullet(i.notIncluded.map((x) => x.label.en))}\n\nNot yet confirmed (confirmed in writing before the trip):\n${bullet(i.unconfirmed.map((x) => x.label.en))}`;
  return { text, lang, tag: 'demo', actions: [{ kind: 'tour', id: t.id }, { kind: 'book', id: t.id }], intent: 'included' };
}

function tourOverview(t: Tour, lang: Lang): BotAnswer {
  const text =
    lang === 'zh'
      ? `「${t.name.zh}」：${t.tagline.zh}\n${t.days}天，从${t.hub === 'almaty' ? '阿拉木图' : t.hub === 'astana' ? '阿斯塔纳' : '突厥斯坦'}出发，演示价格 ${fmt(t.priceKzt)} 坚戈/人。\n亮点：${t.highlights.map((h) => h.zh).join('、')}。`
      : `${t.name.en}: ${t.tagline.en}\n${t.days} days from ${t.hub[0].toUpperCase() + t.hub.slice(1)}, demo price ${fmt(t.priceKzt)} KZT per person.\nHighlights: ${t.highlights.map((h) => h.en).join('; ')}.`;
  return { text, lang, tag: 'demo', actions: [{ kind: 'tour', id: t.id }, { kind: 'book', id: t.id }], intent: 'tour' };
}

const A = (lang: Lang, en: string, zh: string) => (lang === 'zh' ? zh : en);

export function answer(input: string, uiLang: Lang): BotAnswer {
  const q = input.trim().toLowerCase();
  const lang = detectLang(input, uiLang);
  if (!q) return fallback(lang);

  const tour = findTour(q);
  const ranked = intents.map((it) => ({ it, s: score(q, it) })).filter((x) => x.s > 0);
  ranked.sort((a, b) => b.s - a.s || intents.indexOf(a.it) - intents.indexOf(b.it));
  const intent = ranked[0]?.it.id;

  switch (intent) {
    case 'human':
      return {
        text: A(lang, 'Of course. Leave your email and question below and a manager will reply.', '好的。请在下方留下邮箱和问题，客服会回复您。'),
        lang,
        handoff: true,
        actions: [{ kind: 'manager' }],
        intent,
      };
    case 'availability':
      return {
        text: A(
          lang,
          "I can't see live availability, so I won't guess. A manager checks seats for your date and confirms by email before you pay.",
          '我无法查看实时余位，所以不会乱猜。客服会核实您所选日期的名额，并在您付款前通过邮件确认。',
        ),
        lang,
        tag: 'confirm',
        handoff: true,
        actions: [{ kind: 'manager' }],
        intent,
      };
    case 'payment':
      return {
        text: A(
          lang,
          'Foreign cards (Visa, Mastercard and others) are paid on the payment provider’s secure hosted page, so we never see your card number. Alipay and WeChat Pay are planned and need provider approval first. Prices are in KZT with an indicative USD or CNY amount. In this prototype all payments are simulated.',
          '外国银行卡（Visa、万事达等）在支付服务商的安全托管页面完成支付，我们不会看到您的卡号。支付宝和微信支付正在规划中，需先获得服务商审批。价格以坚戈计，并显示美元或人民币参考价。本原型中所有支付均为模拟。',
        ),
        lang,
        tag: 'proposal',
        actions: [{ kind: 'book', id: tour?.id }],
        intent,
      };
    case 'cancel':
      return {
        text: A(
          lang,
          'Proposed refund guarantee: your money is held until the tour starts.\n• 14+ days before: full refund\n• 13-4 days before: 50%\n• Under 4 days: no refund\n• Road closure or severe weather: free reschedule',
          '退款保障（提案）：您的款项在行程开始前托管。\n• 出发前14天以上：全额退款\n• 出发前13至4天：退款50%\n• 不足4天：不予退款\n• 道路封闭或恶劣天气：免费改期',
        ),
        lang,
        tag: 'proposal',
        actions: [{ kind: 'trust' }],
        intent,
      };
    case 'book':
      return {
        text: A(
          lang,
          'Booking takes 3 steps: 1) choose the tour, date (at least 7 days ahead) and number of travelers; 2) enter the lead traveler’s name, email and country (no passport needed); 3) choose a payment method. You see what is included before you pay.',
          '预订只需三步：1）选择线路、日期（至少提前7天）和人数；2）填写主要联系人的姓名、邮箱和国家（无需护照）；3）选择支付方式。付款前您可以看到所有包含内容。',
        ),
        lang,
        actions: [{ kind: 'book', id: tour?.id }, { kind: 'plan' }],
        intent,
      };
    case 'included':
      if (tour) return tourIncluded(tour, lang);
      return {
        text: A(
          lang,
          'Every tour page splits costs into four groups: Included, Optional extra, Not included and Not yet confirmed. Which tour are you interested in: Charyn, Kolsai, Turkestan or Burabay?',
          '每条线路页面都把费用分为四组：已包含、可选附加、不包含、尚未确认。您对哪条线路感兴趣：查伦、科尔赛、突厥斯坦还是布拉拜？',
        ),
        lang,
        actions: tours.map((t) => ({ kind: 'tour', id: t.id }) as ChatAction),
        intent,
      };
    case 'visa':
      return {
        text: A(
          lang,
          'Kazakhstan and China have a mutual visa-free regime since November 2023: up to 30 days per visit, max 90 days in 180 days (The Times of Central Asia, 19 June 2025, citing the Ministry of Tourism and Sports). For other passports, or to double-check your case, ask a manager or your embassy.',
          '自2023年11月起，哈萨克斯坦与中国互免签证：每次停留最多30天，每180天累计不超过90天（来源：The Times of Central Asia，2025年6月19日，援引旅游和体育部）。其他国家护照或需核实具体情况，请咨询客服或使领馆。',
        ),
        lang,
        tag: 'verified',
        actions: [{ kind: 'manager' }],
        intent,
      };
    case 'zhguide':
      return {
        text: A(
          lang,
          'You can choose 中文 as your guide language when booking. Chinese-speaking guide availability is not yet confirmed for every date. The company confirms in writing before you pay. The audio guide is available in Chinese on every tour.',
          '预订时可选择"中文"作为导游语言。中文导游并非每个日期都已确认，公司会在您付款前书面确认。每条线路都提供中文语音导览。',
        ),
        lang,
        tag: 'confirm',
        actions: [{ kind: 'book', id: tour?.id }, { kind: 'manager' }],
        intent,
      };
    case 'choose':
      return {
        text: A(
          lang,
          'A quick guide:\n• Nature and photos, short trip → Charyn Canyon (2 days)\n• Mountain lakes and forest hikes → Kolsai & Kaindy (3 days)\n• Silk Road culture → Turkestan (4 days)\n• Easy lakes near the capital → Burabay (2 days)\nThe trip builder can combine several and fit them to your days.',
          '简单推荐：\n• 自然风光与摄影，时间短 → 查伦大峡谷（2天）\n• 高山湖泊与林间徒步 → 科尔赛与凯恩迪（3天）\n• 丝绸之路文化 → 突厥斯坦（4天）\n• 首都附近的轻松湖景 → 布拉拜（2天）\n行程规划工具可以组合多条线路，并按您的天数安排。',
        ),
        lang,
        actions: [{ kind: 'plan' }, { kind: 'tour', id: 'kolsai' }, { kind: 'tour', id: 'turkestan' }],
        intent,
      };
    case 'packing': {
      const t = tour ?? tourById('kolsai')!;
      return {
        text:
          A(lang, `Packing list for ${t.name.en}:\n`, `「${t.name.zh}」行李清单：\n`) +
          bullet(t.packing.map((p) => p[lang])) +
          A(lang, '\nEach tour page has a tickable checklist.', '\n每条线路页面都有可勾选的清单。'),
        lang,
        tag: 'demo',
        actions: [{ kind: 'tour', id: t.id }],
        intent,
      };
    }
    case 'trust':
      return {
        text: A(
          lang,
          'Here is what I can say honestly. Case facts: Saryarqa Routes was founded in 2020 in Astana, has 9 full-time staff and ~25 freelance guides, and served 3,400 travelers in 2025. Business registration, operator licence and insurance documents still need to be provided by the company. I won’t claim them before that. You can also book a 5-minute video call with your guide before paying.',
          '我如实告诉您。案例事实：Saryarqa Routes 于2020年在阿斯塔纳成立，有9名全职员工和约25名兼职导游，2025年接待了3400名旅客。企业注册、经营许可和保险文件仍需公司提供，在此之前我不会声称已具备。您还可以在付款前与导游预约5分钟视频通话。',
        ),
        lang,
        tag: 'case',
        actions: [{ kind: 'trust' }],
        intent,
      };
    case 'transport':
      return {
        text: A(
          lang,
          'Charyn and Kolsai start in Almaty, Burabay starts in Astana, and Turkestan starts in Turkestan. Transport from the start city is included on every tour. Getting to the start city (flight or train) is not included. Exact pick-up points are sent after booking.',
          '查伦和科尔赛线路从阿拉木图出发，布拉拜从阿斯塔纳出发，突厥斯坦线路在突厥斯坦当地出发。每条线路都包含从出发城市起的交通，但前往出发城市的机票或火车票不包含。具体接送地点将在预订后发送。',
        ),
        lang,
        tag: 'demo',
        actions: [{ kind: 'plan' }],
        intent,
      };
    case 'price':
      if (tour) return tourOverview(tour, lang);
      return {
        text:
          A(lang, 'Demo prices per person:\n', '演示价格（每人）：\n') +
          bullet(tours.map((t) => `${t.name[lang]} · ${t.days}${A(lang, ' days', '天')} · ${fmt(t.priceKzt)} KZT`)) +
          A(lang, '\nI can’t quote live prices or discounts. The final price is shown before payment.', '\n我无法报实时价格或折扣，最终价格将在付款前显示。'),
        lang,
        tag: 'demo',
        actions: [{ kind: 'book' }],
        intent,
      };
    case 'weather':
      return {
        text: A(
          lang,
          'I don’t have live weather. Mountain roads can close after heavy rain or early snow; if that happens, the proposed policy is a free reschedule. In My trip you can try the weather and road demo.',
          '我没有实时天气数据。大雨或提前降雪后山路可能封闭；如遇此情况，按提案政策可免费改期。您可以在"我的行程"中体验天气与道路演示。',
        ),
        lang,
        tag: 'confirm',
        actions: [{ kind: 'manager' }],
        intent,
      };
    case 'emergency':
      return {
        text: A(
          lang,
          'In an emergency in Kazakhstan, call 112. Then tell your guide. I am a scripted demo and cannot call anyone for you.',
          '在哈萨克斯坦遇到紧急情况，请拨打112，然后告知您的导游。我是预设脚本演示，无法替您拨打电话。',
        ),
        lang,
        tag: 'confirm',
        actions: [{ kind: 'manager' }],
        intent,
      };
    case 'greeting':
      return {
        text: A(lang, 'Hello! Ask me about tours, booking, payment, visas or what is included.', '您好！可以问我线路、预订、支付、签证或费用包含等问题。'),
        lang,
        intent,
      };
  }

  if (tour) return tourOverview(tour, lang);
  return fallback(lang);
}

function fallback(lang: Lang): BotAnswer {
  return {
    text: A(
      lang,
      "I won't guess on this one. I only answer from verified tour data. Let me pass your question to a human manager.",
      '这个问题我不会乱猜。我只根据已核实的线路信息回答。让我把您的问题转给人工客服。',
    ),
    lang,
    handoff: true,
    actions: [{ kind: 'manager' }],
    intent: 'fallback',
  };
}
