import type { Hub, L, Tour, TourId } from './types';

// All tour details and prices are DEMO DATA for the prototype.
// Park fees, exact guesthouse names, the Kaindy 4×4 transfer and
// Chinese-guide availability are deliberately listed as "Not yet confirmed".

const guideEn: L = { en: 'English-speaking guide for the whole tour', zh: '全程英语导游' };
const water: L = { en: 'Drinking water and tea stops', zh: '饮用水与途中茶歇' };
const flights: L = { en: 'Flights or trains to the start city', zh: '往返出发城市的机票或火车票' };
const insurance: L = { en: 'Travel and medical insurance', zh: '旅行及医疗保险' };
const tips: L = { en: 'Tips for guide and driver', zh: '导游与司机小费' };
const alcohol: L = { en: 'Alcohol and personal purchases', zh: '酒水及个人消费' };
const parkFees: L = { en: 'National park entrance fees (amount and whether included)', zh: '国家公园门票（金额及是否包含）' };
const guesthouse: L = { en: 'Exact guesthouse or hotel names', zh: '具体客栈或酒店名称' };
const zhGuide: L = { en: 'Chinese-speaking guide on your date', zh: '您所选日期的中文导游' };

export const tours: Tour[] = [
  {
    id: 'charyn',
    name: { en: 'Charyn Canyon & the Steppe', zh: '查伦大峡谷与草原' },
    tagline: {
      en: 'Red canyon walls, a turquoise river and a night under steppe stars.',
      zh: '赤红峡谷、碧绿河流，在草原星空下住一晚。',
    },
    days: 2,
    hub: 'almaty',
    priceKzt: 54000,
    region: { en: 'Almaty Region', zh: '阿拉木图州' },
    difficulty: { en: 'Easy · short walks on dirt paths', zh: '轻松 · 土路短途步行' },
    bestFor: ['nature', 'photography'],
    highlights: [
      { en: 'Valley of Castles walk to the river', zh: '城堡谷徒步至河边' },
      { en: 'Sunrise at the canyon rim', zh: '峡谷边缘看日出' },
      { en: 'Open steppe drive with photo stops', zh: '草原公路自驾与拍照停留' },
    ],
    inclusions: {
      included: [
        { label: guideEn },
        { label: { en: 'Minivan transport from and back to Almaty', zh: '阿拉木图往返小巴交通' } },
        { label: { en: '1 night in a guesthouse, twin share', zh: '客栈住宿1晚（双人间）' } },
        { label: { en: '1 breakfast, 1 lunch, 1 dinner', zh: '1次早餐、1次午餐、1次晚餐' } },
        { label: water },
      ],
      optional: [
        { label: { en: 'Single room supplement', zh: '单人间补差' }, priceKzt: 9000 },
        { label: { en: 'Sunset photo session with the guide', zh: '导游陪同日落摄影' }, priceKzt: 7000 },
      ],
      notIncluded: [{ label: flights }, { label: insurance }, { label: alcohol }, { label: tips }],
      unconfirmed: [{ label: parkFees }, { label: guesthouse }, { label: zhGuide }],
    },
    itinerary: [
      {
        title: { en: 'Day 1 · Almaty → Charyn Canyon', zh: '第1天 · 阿拉木图 → 查伦大峡谷' },
        items: [
          { en: 'Pick-up in central Almaty in the morning', zh: '上午在阿拉木图市中心接您' },
          { en: 'Steppe drive with photo stops', zh: '草原公路行驶，沿途拍照' },
          { en: 'Walk the Valley of Castles down to the river', zh: '徒步城堡谷，下行至河边' },
          { en: 'Dinner and night at the guesthouse', zh: '客栈晚餐并住宿' },
        ],
      },
      {
        title: { en: 'Day 2 · Sunrise → Almaty', zh: '第2天 · 日出 → 返回阿拉木图' },
        items: [
          { en: 'Optional sunrise at the canyon rim', zh: '可选：峡谷边缘看日出' },
          { en: 'Breakfast, short viewpoint walk', zh: '早餐后短途观景步行' },
          { en: 'Return to Almaty in the evening', zh: '傍晚返回阿拉木图' },
        ],
      },
    ],
    packing: [
      { en: 'Comfortable walking shoes', zh: '舒适的徒步鞋' },
      { en: 'Sun hat and sunscreen', zh: '遮阳帽和防晒霜' },
      { en: 'Warm layer for the evening', zh: '傍晚保暖外套' },
      { en: 'Reusable water bottle', zh: '可重复使用的水瓶' },
      { en: 'Power bank for photos', zh: '拍照用充电宝' },
      { en: 'Passport (keep it with you)', zh: '护照（随身携带）' },
    ],
    audio: [
      {
        title: { en: 'Arrival at the rim', zh: '抵达峡谷边缘' },
        text: {
          en: 'You are standing on the edge of Charyn Canyon. Over a very long time, the river below cut through layers of rock, and wind shaped the walls you see now.',
          zh: '您正站在查伦大峡谷的边缘。漫长岁月里，下方的河流切开了层层岩石，风又雕刻出您眼前的峭壁。',
        },
      },
      {
        title: { en: 'Valley of Castles', zh: '城堡谷' },
        text: {
          en: 'This section is called the Valley of Castles because the rock towers look like walls and turrets. Stay on the path; the edges can be loose.',
          zh: '这一段被称为城堡谷，因为岩柱看起来像城墙和塔楼。请走在步道上，边缘的岩石可能松动。',
        },
      },
      {
        title: { en: 'The river', zh: '河边' },
        text: {
          en: 'At the bottom, the Charyn River flows between the walls. Its colour changes with the light, from green to turquoise.',
          zh: '在谷底，查伦河在峭壁之间流淌。河水随光线变化，从绿色变为碧蓝色。',
        },
      },
    ],
  },
  {
    id: 'kolsai',
    name: { en: 'Kolsai Lakes & Kaindy', zh: '科尔赛湖与凯恩迪湖' },
    tagline: {
      en: 'Mountain lakes in spruce forest and the sunken trees of Kaindy.',
      zh: '云杉林中的高山湖泊，还有凯恩迪湖的水下森林。',
    },
    days: 3,
    hub: 'almaty',
    priceKzt: 69000,
    region: { en: 'Almaty Region · Tien Shan', zh: '阿拉木图州 · 天山' },
    difficulty: { en: 'Moderate · forest trails, some uphill', zh: '中等 · 林间小路，部分上坡' },
    bestFor: ['nature', 'photography', 'adventure'],
    highlights: [
      { en: 'Lower Kolsai Lake shore walk', zh: '下科尔赛湖湖畔漫步' },
      { en: 'Kaindy Lake and its sunken forest', zh: '凯恩迪湖与水下森林' },
      { en: 'Village stay in the mountains', zh: '山中村庄住宿' },
    ],
    inclusions: {
      included: [
        { label: guideEn },
        { label: { en: 'Transport from and back to Almaty', zh: '阿拉木图往返交通' } },
        { label: { en: '2 nights in a village guesthouse, twin share', zh: '村庄客栈住宿2晚（双人间）' } },
        { label: { en: 'Full board from Day 1 lunch to Day 3 lunch', zh: '第1天午餐至第3天午餐全包' } },
        { label: water },
      ],
      optional: [
        { label: { en: 'Horse ride at Kolsai (1 hour)', zh: '科尔赛湖骑马（1小时）' }, priceKzt: 8000 },
        { label: { en: 'Boat rental on the lower lake', zh: '下湖划船租赁' }, priceKzt: 5000 },
        { label: { en: 'Single room supplement', zh: '单人间补差' }, priceKzt: 16000 },
      ],
      notIncluded: [{ label: flights }, { label: insurance }, { label: alcohol }, { label: tips }],
      unconfirmed: [
        { label: parkFees },
        { label: { en: 'Kaindy 4×4 transfer (price and whether included)', zh: '凯恩迪湖四驱车接驳（价格及是否包含）' } },
        { label: guesthouse },
        { label: zhGuide },
      ],
    },
    itinerary: [
      {
        title: { en: 'Day 1 · Almaty → Saty village', zh: '第1天 · 阿拉木图 → 萨特村' },
        items: [
          { en: 'Early pick-up in Almaty', zh: '清晨在阿拉木图接您' },
          { en: 'Long scenic drive east, lunch on the way', zh: '向东长途风景驾驶，途中午餐' },
          { en: 'Evening walk at Lower Kolsai Lake', zh: '傍晚漫步下科尔赛湖' },
        ],
      },
      {
        title: { en: 'Day 2 · Kaindy Lake', zh: '第2天 · 凯恩迪湖' },
        items: [
          { en: '4×4 transfer towards Kaindy (to be confirmed)', zh: '四驱车前往凯恩迪湖（待确认）' },
          { en: 'Short hike down to the sunken forest', zh: '短途徒步至水下森林' },
          { en: 'Picnic lunch, free time at the guesthouse', zh: '野餐午餐，回客栈自由活动' },
        ],
      },
      {
        title: { en: 'Day 3 · Kolsai trail → Almaty', zh: '第3天 · 科尔赛步道 → 阿拉木图' },
        items: [
          { en: 'Morning forest trail above the lower lake', zh: '上午在下湖上方的林间步道徒步' },
          { en: 'Lunch in the village', zh: '村中午餐' },
          { en: 'Drive back, arrival in Almaty late evening', zh: '返程，晚间抵达阿拉木图' },
        ],
      },
    ],
    packing: [
      { en: 'Hiking shoes with grip', zh: '防滑徒步鞋' },
      { en: 'Rain jacket', zh: '防雨外套' },
      { en: 'Warm fleece for cool evenings', zh: '保暖抓绒（傍晚较凉）' },
      { en: 'Cash in KZT for small village shops', zh: '少量坚戈现金（村中小店用）' },
      { en: 'Power bank (limited signal in the mountains)', zh: '充电宝（山区信号有限）' },
      { en: 'Passport (keep it with you)', zh: '护照（随身携带）' },
    ],
    audio: [
      {
        title: { en: 'Lower Kolsai Lake', zh: '下科尔赛湖' },
        text: {
          en: 'Kolsai is a chain of mountain lakes surrounded by spruce forest. You are at the lower lake, the easiest one to reach.',
          zh: '科尔赛湖是被云杉林环绕的一串高山湖泊。您现在位于下湖，这是最容易到达的一个。',
        },
      },
      {
        title: { en: 'Kaindy: the sunken forest', zh: '凯恩迪湖：水下森林' },
        text: {
          en: 'The trunks you see rising from the water are spruce trees. They stood here before a landslide dammed the valley and the lake formed around them.',
          zh: '您看到从水中伸出的树干是云杉。山体滑坡堵塞山谷之前，它们就生长在这里，湖水随后在树木周围形成。',
        },
      },
      {
        title: { en: 'Village life', zh: '山村生活' },
        text: {
          en: 'Saty is a small village where many families host travelers. Ask before taking photos of people and their homes.',
          zh: '萨特是一个小村庄，许多家庭接待旅行者。拍摄村民和他们的住宅前，请先征得同意。',
        },
      },
      {
        title: { en: 'Mountain safety', zh: '山地安全' },
        text: {
          en: 'Mobile signal is weak here. Stay with your group, and tell the guide if you feel unwell at altitude.',
          zh: '这里手机信号较弱。请跟紧队伍，如在高海拔感到不适，请告知导游。',
        },
      },
    ],
  },
  {
    id: 'turkestan',
    name: { en: 'Turkestan: Silk Road Heritage', zh: '突厥斯坦：丝绸之路遗产' },
    tagline: {
      en: 'Turquoise domes, ancient Otrar and the stories of the Silk Road.',
      zh: '碧蓝穹顶、古城讹答剌，聆听丝绸之路的故事。',
    },
    days: 4,
    hub: 'turkestan',
    priceKzt: 89000,
    region: { en: 'Turkestan Region', zh: '突厥斯坦州' },
    difficulty: { en: 'Easy · city and site walks', zh: '轻松 · 城市与遗址步行' },
    bestFor: ['culture', 'photography', 'relaxation'],
    highlights: [
      { en: 'Mausoleum of Khoja Ahmed Yasawi', zh: '霍贾·艾哈迈德·亚萨维陵墓' },
      { en: 'Arystan Bab mausoleum', zh: '阿雷斯坦巴布陵墓' },
      { en: 'Ruins of ancient Otrar', zh: '讹答剌古城遗址' },
    ],
    inclusions: {
      included: [
        { label: guideEn },
        { label: { en: 'All local transport in Turkestan region', zh: '突厥斯坦州内全部交通' } },
        { label: { en: '3 nights in a hotel, twin share', zh: '酒店住宿3晚（双人间）' } },
        { label: { en: 'Daily breakfast and 3 lunches', zh: '每日早餐及3次午餐' } },
        { label: water },
      ],
      optional: [
        { label: { en: 'Evening show in the old town', zh: '古城晚间演出' }, priceKzt: 10000 },
        { label: { en: 'Pottery workshop', zh: '陶艺体验课' }, priceKzt: 6000 },
        { label: { en: 'Single room supplement', zh: '单人间补差' }, priceKzt: 24000 },
      ],
      notIncluded: [
        { label: flights },
        { label: insurance },
        { label: { en: 'Dinners (local cafés)', zh: '晚餐（当地餐馆）' } },
        { label: tips },
      ],
      unconfirmed: [
        { label: { en: 'Site entrance fees (amount and whether included)', zh: '景点门票（金额及是否包含）' } },
        { label: guesthouse },
        { label: zhGuide },
      ],
    },
    itinerary: [
      {
        title: { en: 'Day 1 · Arrival in Turkestan', zh: '第1天 · 抵达突厥斯坦' },
        items: [
          { en: 'Meet your guide at the station or airport', zh: '在车站或机场与导游会合' },
          { en: 'Afternoon visit to the Yasawi mausoleum', zh: '下午参观亚萨维陵墓' },
          { en: 'Evening walk in the old town', zh: '傍晚漫步古城' },
        ],
      },
      {
        title: { en: 'Day 2 · Arystan Bab and Otrar', zh: '第2天 · 阿雷斯坦巴布与讹答剌' },
        items: [
          { en: 'Arystan Bab mausoleum', zh: '阿雷斯坦巴布陵墓' },
          { en: 'Walk among the ruins of Otrar', zh: '漫步讹答剌古城遗址' },
          { en: 'Lunch with a local family (to be arranged)', zh: '与当地家庭共进午餐（待安排）' },
        ],
      },
      {
        title: { en: 'Day 3 · Crafts and Silk Road stories', zh: '第3天 · 手工艺与丝路故事' },
        items: [
          { en: 'Local bazaar with your guide', zh: '导游陪同逛当地巴扎' },
          { en: 'Optional pottery workshop', zh: '可选：陶艺体验' },
          { en: 'Sunset photos at the mausoleum', zh: '在陵墓前拍摄日落' },
        ],
      },
      {
        title: { en: 'Day 4 · Departure', zh: '第4天 · 离开' },
        items: [
          { en: 'Free morning', zh: '上午自由活动' },
          { en: 'Transfer to the station or airport', zh: '送往车站或机场' },
        ],
      },
    ],
    packing: [
      { en: 'Clothes covering shoulders and knees for sacred sites', zh: '参观圣地时遮盖肩膀和膝盖的衣物' },
      { en: 'Light scarf (useful for women at mausoleums)', zh: '轻薄围巾（女士参观陵墓时有用）' },
      { en: 'Sun hat and sunscreen', zh: '遮阳帽和防晒霜' },
      { en: 'Comfortable walking shoes', zh: '舒适的步行鞋' },
      { en: 'Reusable water bottle', zh: '可重复使用的水瓶' },
      { en: 'Passport (keep it with you)', zh: '护照（随身携带）' },
    ],
    audio: [
      {
        title: { en: 'The Yasawi mausoleum', zh: '亚萨维陵墓' },
        text: {
          en: 'This mausoleum honours Khoja Ahmed Yasawi, a Sufi poet and teacher. Look up at the turquoise dome and the tilework on the walls.',
          zh: '这座陵墓纪念苏菲派诗人和导师霍贾·艾哈迈德·亚萨维。请抬头欣赏碧蓝色的穹顶和墙上的瓷砖装饰。',
        },
      },
      {
        title: { en: 'Arystan Bab', zh: '阿雷斯坦巴布' },
        text: {
          en: 'Arystan Bab is remembered as a teacher of Yasawi. By tradition, many pilgrims visit here first, before going on to Turkestan.',
          zh: '阿雷斯坦巴布被视为亚萨维的老师。按照传统，许多朝圣者会先来这里，然后再前往突厥斯坦。',
        },
      },
      {
        title: { en: 'Otrar', zh: '讹答剌' },
        text: {
          en: 'Otrar was once a busy city on the Silk Road. Today you walk among its ruins and imagine the caravans that stopped here.',
          zh: '讹答剌曾是丝绸之路上的繁华城市。如今您漫步在遗址之间，想象当年在此停留的商队。',
        },
      },
      {
        title: { en: 'Respect at sacred sites', zh: '圣地礼仪' },
        text: {
          en: 'These are places of prayer. Speak quietly, dress modestly, and ask your guide where photos are allowed.',
          zh: '这些是祈祷的场所。请轻声交谈、着装得体，并向导游询问哪里可以拍照。',
        },
      },
    ],
  },
  {
    id: 'burabay',
    name: { en: 'Burabay Lakes & Granite', zh: '布拉拜湖与花岗岩' },
    tagline: {
      en: 'Granite rocks, pine forest and clear lakes, a short drive from Astana.',
      zh: '花岗岩奇石、松林与清澈湖泊，距阿斯塔纳车程不远。',
    },
    days: 2,
    hub: 'astana',
    priceKzt: 48000,
    region: { en: 'Akmola Region', zh: '阿克莫拉州' },
    difficulty: { en: 'Easy to moderate · one viewpoint hike', zh: '轻松至中等 · 一段观景徒步' },
    bestFor: ['nature', 'relaxation', 'photography'],
    highlights: [
      { en: 'Okzhetpes rock and Zhumbaktas', zh: '奥日佩斯石与朱姆巴克塔斯石' },
      { en: 'Pine forest viewpoint hike', zh: '松林观景徒步' },
      { en: 'Lakeside evening', zh: '湖畔傍晚' },
    ],
    inclusions: {
      included: [
        { label: guideEn },
        { label: { en: 'Transport from and back to Astana', zh: '阿斯塔纳往返交通' } },
        { label: { en: '1 night in a lakeside guesthouse, twin share', zh: '湖畔客栈住宿1晚（双人间）' } },
        { label: { en: '1 breakfast, 2 lunches, 1 dinner', zh: '1次早餐、2次午餐、1次晚餐' } },
        { label: water },
      ],
      optional: [
        { label: { en: 'Bike rental around the lake', zh: '环湖自行车租赁' }, priceKzt: 5000 },
        { label: { en: 'Sauna at the guesthouse', zh: '客栈桑拿' }, priceKzt: 8000 },
      ],
      notIncluded: [{ label: flights }, { label: insurance }, { label: alcohol }, { label: tips }],
      unconfirmed: [{ label: parkFees }, { label: guesthouse }, { label: zhGuide }],
    },
    itinerary: [
      {
        title: { en: 'Day 1 · Astana → Burabay', zh: '第1天 · 阿斯塔纳 → 布拉拜' },
        items: [
          { en: 'Morning pick-up in Astana', zh: '上午在阿斯塔纳接您' },
          { en: 'Okzhetpes rock and Zhumbaktas viewpoint', zh: '奥日佩斯石与朱姆巴克塔斯观景点' },
          { en: 'Lakeside walk and dinner', zh: '湖畔漫步并享用晚餐' },
        ],
      },
      {
        title: { en: 'Day 2 · Viewpoint hike → Astana', zh: '第2天 · 观景徒步 → 返回阿斯塔纳' },
        items: [
          { en: 'Pine forest hike to a viewpoint', zh: '松林徒步至观景台' },
          { en: 'Lunch, free time by the water', zh: '午餐后湖边自由活动' },
          { en: 'Return to Astana in the evening', zh: '傍晚返回阿斯塔纳' },
        ],
      },
    ],
    packing: [
      { en: 'Walking shoes', zh: '步行鞋' },
      { en: 'Windproof jacket', zh: '防风外套' },
      { en: 'Insect repellent (summer)', zh: '驱蚊液（夏季）' },
      { en: 'Swimwear for the sauna or lake', zh: '泳衣（桑拿或湖边用）' },
      { en: 'Reusable water bottle', zh: '可重复使用的水瓶' },
      { en: 'Passport (keep it with you)', zh: '护照（随身携带）' },
    ],
    audio: [
      {
        title: { en: 'Okzhetpes rock', zh: '奥日佩斯石' },
        text: {
          en: 'The tall granite rock by the lake is Okzhetpes. Its name is often translated as "the arrow will not reach". Your guide will tell you the legend behind it.',
          zh: '湖边高耸的花岗岩是奥日佩斯石，名字常被译为"箭也射不到"。导游会为您讲述背后的传说。',
        },
      },
      {
        title: { en: 'Zhumbaktas, the riddle stone', zh: '朱姆巴克塔斯：谜之石' },
        text: {
          en: 'The rock standing in the water is Zhumbaktas, the "riddle stone". From different angles people see different faces in it.',
          zh: '立在水中的岩石叫朱姆巴克塔斯，意为"谜之石"。从不同角度看，人们会看到不同的面孔。',
        },
      },
      {
        title: { en: 'Pine forest', zh: '松林' },
        text: {
          en: 'Burabay is an island of pine forest and granite in the middle of the steppe. Keep to marked trails to protect it.',
          zh: '布拉拜是草原中央的一片松林和花岗岩"孤岛"。请走标记步道，保护这里的自然环境。',
        },
      },
    ],
  },
];

export const tourById = (id: string | undefined): Tour | undefined => tours.find((t) => t.id === id);

export const tourIds: TourId[] = tours.map((t) => t.id);

export const hubName: Record<Hub, L> = {
  almaty: { en: 'Almaty', zh: '阿拉木图' },
  turkestan: { en: 'Turkestan', zh: '突厥斯坦' },
  astana: { en: 'Astana', zh: '阿斯塔纳' },
};
