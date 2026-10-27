import type { L } from './types';

// Official case facts (ZERTTEX Hackathon 2026, Case 1). Do not change.
export const caseFacts: { label: string; value: string }[] = [
  { label: 'Company', value: 'Saryarqa Routes, founded 2020 in Astana' },
  { label: 'Team', value: '9 full-time staff, ~25 freelance guides' },
  { label: 'Products', value: 'Guided trips of 2-7 days to Charyn Canyon, Kolsai Lakes, Turkestan, Burabay' },
  { label: 'Travelers in 2025', value: '3,400' },
  { label: 'Revenue in 2025', value: '150,000,000 KZT' },
  { label: 'Average price', value: '44,000 KZT per traveler' },
  { label: 'Share from Kazakhstan', value: '~96% of travelers' },
  { label: 'Sales channels', value: 'Instagram messages, WhatsApp, phone' },
  { label: 'Payment', value: 'Kaspi transfer or cash' },
  { label: 'Website', value: 'One page, Russian only' },
  { label: 'Goal', value: 'Within 24 months, 30% of travelers from abroad' },
  { label: 'Budget', value: 'Up to 20,000,000 KZT for development and launch in year 1' },
];

export type Complaint = { quote: L; answer: L; feature: L; route: string };

export const complaints: Complaint[] = [
  {
    quote: { en: '"It is unclear how to book."', zh: '"不清楚怎么预订。"' },
    feature: { en: 'International booking in 3 steps', zh: '三步完成国际预订' },
    answer: {
      en: 'One clear flow: trip, traveler, payment. Live price in KZT with USD or CNY shown next to it.',
      zh: '一个清晰的流程：行程、旅客、支付。实时显示坚戈价格，并附美元或人民币参考价。',
    },
    route: '/book',
  },
  {
    quote: { en: '"I am not sure the company is trustworthy."', zh: '"我不确定这家公司是否可信。"' },
    feature: { en: 'Trust Center', zh: '信任中心' },
    answer: {
      en: 'Meet your guide on video, see what is verified and what is not yet, and a refund guarantee.',
      zh: '通过视频认识导游，查看哪些已核实、哪些待核实，并提供退款保障。',
    },
    route: '/trust',
  },
  {
    quote: { en: '"My foreign card does not work."', zh: '"我的外国银行卡无法使用。"' },
    feature: { en: 'International card, Alipay, WeChat Pay', zh: '国际银行卡、支付宝、微信支付' },
    answer: {
      en: 'Hosted checkout for foreign cards. Alipay and WeChat Pay are planned after provider approval.',
      zh: '外国银行卡通过托管收银台支付。支付宝和微信支付将在支付服务商审批后上线。',
    },
    route: '/book',
  },
  {
    quote: { en: '"I do not know what is included."', zh: '"我不知道费用包含什么。"' },
    feature: { en: '"What\'s included" breakdown', zh: '"费用包含"明细' },
    answer: {
      en: 'Every tour splits costs into Included, Optional, Not included and Not yet confirmed. Nothing hidden before payment.',
      zh: '每条线路将费用分为：已包含、可选附加、不包含、尚未确认。付款前毫无隐藏。',
    },
    route: '/tour/kolsai',
  },
];

export type Evidence = { figure: string; text: L; source: string; date: string; url: string };

export const evidence: Evidence[] = [
  {
    figure: '655,000',
    text: {
      en: 'visitors from China in 2024, +78% vs 367,000 in 2023. Mutual visa-free regime since November 2023: up to 30 days per visit, max 90 days in 180 days.',
      zh: '2024年来自中国的游客，较2023年的36.7万增长78%。自2023年11月起互免签证：每次停留最多30天，每180天累计不超过90天。',
    },
    source: 'The Times of Central Asia, citing the Ministry of Tourism and Sports',
    date: '19 June 2025',
    url: 'https://timesca.com/kazakhstan-launches-2025-year-of-china-tourism/',
  },
  {
    figure: '241,700',
    text: {
      en: 'Chinese citizens visited in 2025, +38.9%. China is the #2 source market after Russia (429,800).',
      zh: '2025年到访的中国公民，增长38.9%。中国是仅次于俄罗斯（42.98万）的第二大客源国。',
    },
    source: 'Orda.kz, citing Energyprom.kz',
    date: '2026',
    url: 'https://en.orda.kz/chinese-tourist-arrivals-in-kazakhstan-rose-sharply-in-2025-analysts-say-10111/',
  },
  {
    figure: '15.7 million',
    text: {
      en: 'foreign visitors for tourism purposes in the first nine months of 2025, excluding labour migrants and permanent residents.',
      zh: '2025年前九个月以旅游为目的的外国访客人次（不含劳务移民和常住人员）。',
    },
    source: 'The Astana Times',
    date: 'February 2026',
    url: 'https://astanatimes.com/2026/02/kazakhstan-reports-tourism-growth-surge-as-visitor-numbers-and-revenues-climb-in-2025/',
  },
];

export const methodNote: L = {
  en: 'The two China figures use different methods (border crossings vs analyst data) and must not be compared directly.',
  zh: '两组中国游客数据统计口径不同（边境入境人次 vs 分析机构数据），不可直接比较。',
};
