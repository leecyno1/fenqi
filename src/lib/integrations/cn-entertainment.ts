import {
  buildHeatScoreBreakdown,
  type NormalizedEventCandidate,
} from "./polymarket";

type CnEntertainmentSeed = {
  externalId: string;
  externalSlug: string;
  question: string;
  brief: string;
  sourceName: string;
  sourceUrl: string;
  closesAt: string;
  resolvesAt: string;
  probabilityYes: number;
  liquidity: number;
  volumePoints: number;
  activeTraders: number;
  isFeatured?: boolean;
  tags: string[];
  evidence: string[];
};

const CN_ENTERTAINMENT_SEEDS: CnEntertainmentSeed[] = [
  {
    externalId: "cn-ent-01",
    externalSlug: "culture-singer-2026-launch-lineup",
    question: "《歌手 2026》官宣首发阵容后，首发歌手会拿下总冠军吗？",
    brief: "以节目官宣与决赛结果为结算依据的内娱事件。",
    sourceName: "澎湃新闻",
    sourceUrl: "https://www.thepaper.cn/",
    closesAt: "2026-06-28T12:00:00+08:00",
    resolvesAt: "2026-07-15T12:00:00+08:00",
    probabilityYes: 0.57,
    liquidity: 120,
    volumePoints: 980,
    activeTraders: 128,
    isFeatured: true,
    tags: ["综艺", "歌手2026", "总决赛"],
    evidence: [
      "以节目官方官宣名单与总决赛结果页为准。",
      "不使用自媒体爆料作为结算依据。",
    ],
  },
  {
    externalId: "cn-ent-02",
    externalSlug: "culture-ride-the-wind-2026-comeback",
    question: "《乘风 2026》最终成团名单会包含两位及以上返场嘉宾吗？",
    brief: "聚焦成团名单结构分歧，结算依据可公开复核。",
    sourceName: "财联社",
    sourceUrl: "https://www.cls.cn/",
    closesAt: "2026-06-20T18:00:00+08:00",
    resolvesAt: "2026-07-02T12:00:00+08:00",
    probabilityYes: 0.49,
    liquidity: 110,
    volumePoints: 910,
    activeTraders: 115,
    tags: ["乘风2026", "成团名单"],
    evidence: [
      "以官方公布成团名单与节目播出内容为准。",
      "仅统计最终官宣名单，不含彩蛋返场。",
    ],
  },
  {
    externalId: "cn-ent-03",
    externalSlug: "culture-standup-2026-rookie-win",
    question: "《脱口秀大会 2026》冠军会来自新人组吗？",
    brief: "围绕节目赛制与选手分组形成概率分歧。",
    sourceName: "虎嗅",
    sourceUrl: "https://www.huxiu.com/",
    closesAt: "2026-09-05T12:00:00+08:00",
    resolvesAt: "2026-09-18T12:00:00+08:00",
    probabilityYes: 0.42,
    liquidity: 105,
    volumePoints: 760,
    activeTraders: 92,
    tags: ["脱口秀大会", "新人组"],
    evidence: [
      "以节目官方赛制说明和总决赛结果为准。",
      "争议由主平台公告优先裁定。",
    ],
  },
  {
    externalId: "cn-ent-04",
    externalSlug: "culture-summer-boxoffice-2026-animation",
    question: "2026 暑期档票房冠军会来自国产动画吗？",
    brief: "以国家电影专资办公开票房口径为准。",
    sourceName: "36氪",
    sourceUrl: "https://36kr.com/",
    closesAt: "2026-08-31T21:00:00+08:00",
    resolvesAt: "2026-09-08T12:00:00+08:00",
    probabilityYes: 0.46,
    liquidity: 130,
    volumePoints: 1020,
    activeTraders: 133,
    isFeatured: true,
    tags: ["暑期档", "票房", "国产动画"],
    evidence: [
      "票房口径使用公开榜单的最终结算值。",
      "仅统计院线电影，不含网络电影。",
    ],
  },
  {
    externalId: "cn-ent-05",
    externalSlug: "culture-golden-eagle-2026-realist-drama",
    question: "2026 金鹰奖最佳电视剧会落在现实题材吗？",
    brief: "围绕奖项题材倾向的可验证事件。",
    sourceName: "澎湃新闻",
    sourceUrl: "https://www.thepaper.cn/",
    closesAt: "2026-10-10T20:00:00+08:00",
    resolvesAt: "2026-10-20T12:00:00+08:00",
    probabilityYes: 0.55,
    liquidity: 100,
    volumePoints: 680,
    activeTraders: 88,
    tags: ["金鹰奖", "现实题材"],
    evidence: [
      "以官方获奖名单为唯一结算依据。",
      "题材分类以奖项官方描述为准。",
    ],
  },
  {
    externalId: "cn-ent-06",
    externalSlug: "culture-weibo-night-2026-actor-track",
    question: "2026 微博之夜年度热度人物会来自演员赛道吗？",
    brief: "围绕跨赛道流量分配形成分歧。",
    sourceName: "虎嗅",
    sourceUrl: "https://www.huxiu.com/",
    closesAt: "2026-12-20T18:00:00+08:00",
    resolvesAt: "2026-12-28T12:00:00+08:00",
    probabilityYes: 0.63,
    liquidity: 95,
    volumePoints: 720,
    activeTraders: 94,
    tags: ["微博之夜", "年度热度人物"],
    evidence: [
      "以主办方公布名单为准。",
      "同名奖项以最终颁发奖项解释为准。",
    ],
  },
  {
    externalId: "cn-ent-07",
    externalSlug: "culture-vshow-2026-couple-confirmed",
    question: "某头部恋综 2026 季终会出现节目内官宣牵手成功吗？",
    brief: "仅根据节目正片与官微公告结算，不采信未证实八卦。",
    sourceName: "财联社",
    sourceUrl: "https://www.cls.cn/",
    closesAt: "2026-07-26T22:00:00+08:00",
    resolvesAt: "2026-08-02T12:00:00+08:00",
    probabilityYes: 0.51,
    liquidity: 115,
    volumePoints: 860,
    activeTraders: 122,
    tags: ["恋综", "牵手", "官宣"],
    evidence: [
      "以节目正片与平台官宣文案为准。",
      "网传偷拍视频或爆料不作为依据。",
    ],
  },
  {
    externalId: "cn-ent-08",
    externalSlug: "culture-bilibili-2026-newyear-growth",
    question: "2026 B站跨年晚会播放量会高于上一年吗？",
    brief: "以平台公开播放口径与财报披露为准。",
    sourceName: "36氪",
    sourceUrl: "https://36kr.com/",
    closesAt: "2026-12-31T23:30:00+08:00",
    resolvesAt: "2027-01-10T12:00:00+08:00",
    probabilityYes: 0.58,
    liquidity: 108,
    volumePoints: 640,
    activeTraders: 79,
    tags: ["B站跨年", "播放量"],
    evidence: [
      "优先采用平台公开披露数据。",
      "若口径冲突，以平台公告说明为准。",
    ],
  },
  {
    externalId: "cn-ent-09",
    externalSlug: "culture-streetdance7-overseas-champion",
    question: "《这！就是街舞 7》冠军会来自海外战队吗？",
    brief: "围绕战队构成与晋级走势的事件判断。",
    sourceName: "澎湃新闻",
    sourceUrl: "https://www.thepaper.cn/",
    closesAt: "2026-09-12T22:00:00+08:00",
    resolvesAt: "2026-09-20T12:00:00+08:00",
    probabilityYes: 0.44,
    liquidity: 102,
    volumePoints: 590,
    activeTraders: 74,
    tags: ["街舞", "冠军", "海外战队"],
    evidence: [
      "以节目官方总决赛结果页为准。",
      "战队归属以节目官方赛制说明为准。",
    ],
  },
  {
    externalId: "cn-ent-10",
    externalSlug: "culture-streaming-gala-2026-costume-drama",
    question: "2026 某头部平台年度剧王会落在古装题材吗？",
    brief: "以平台年度榜单和官宣结果为结算依据。",
    sourceName: "虎嗅",
    sourceUrl: "https://www.huxiu.com/",
    closesAt: "2026-11-28T20:00:00+08:00",
    resolvesAt: "2026-12-05T12:00:00+08:00",
    probabilityYes: 0.52,
    liquidity: 112,
    volumePoints: 710,
    activeTraders: 90,
    tags: ["年度剧王", "古装"],
    evidence: [
      "以平台官方年度榜单为准。",
      "并列第一按官方排序第一名结算。",
    ],
  },
];

function buildSyntheticShares(probabilityYes: number, liquidity: number) {
  const shift = Math.round(liquidity * Math.log(probabilityYes / (1 - probabilityYes)));
  return {
    yesShares: Math.max(1, shift > 0 ? shift : 1),
    noShares: Math.max(1, shift < 0 ? Math.abs(shift) : 1),
  };
}

export function getCnEntertainmentCandidates(now = new Date()): NormalizedEventCandidate[] {
  return CN_ENTERTAINMENT_SEEDS.map((seed) => {
    const { yesShares, noShares } = buildSyntheticShares(seed.probabilityYes, seed.liquidity);
    const scores = buildHeatScoreBreakdown({
      probabilityYes: seed.probabilityYes,
      liquidity: seed.liquidity,
      volume24hr: seed.volumePoints,
      volume1wk: seed.volumePoints * 2,
      newsMatchCount: 0,
      conflictSignalCount: 1,
      crossSourceDivergence: 0.35,
      featured: Boolean(seed.isFeatured),
    });

    return {
      externalSource: "cn_entertainment",
      externalId: seed.externalId,
      externalSlug: seed.externalSlug,
      sourceName: seed.sourceName,
      sourceUrl: seed.sourceUrl,
      canonicalSourceUrl: seed.sourceUrl,
      question: seed.question,
      brief: seed.brief,
      tone: "内娱可验证事件，按公开结果结算。",
      category: "current_affairs",
      status: "live",
      closesAt: new Date(seed.closesAt),
      resolvesAt: new Date(seed.resolvesAt),
      liquidity: seed.liquidity,
      yesShares,
      noShares,
      volumePoints: seed.volumePoints,
      activeTraders: seed.activeTraders,
      probability: {
        yes: seed.probabilityYes,
        no: 1 - seed.probabilityYes,
      },
      externalYesProbabilityBps: null,
      externalNoProbabilityBps: null,
      externalPriceUpdatedAt: null,
      externalPriceStale: false,
      priceAnchorMode: "local",
      clobTokenIds: [],
      externalImageUrl: null,
      newsImageUrl: null,
      newsImageCachedUrl: null,
      newsImageSource: null,
      newsReferences: [],
      heatScore: scores.heatScore,
      controversyScore: scores.controversyScore,
      isFeatured: Boolean(seed.isFeatured),
      resolutionSources: [
        {
          label: `${seed.sourceName} 公开页面`,
          href: seed.sourceUrl,
        },
      ],
      evidence: seed.evidence,
      tags: seed.tags,
      lastSyncedAt: now,
    };
  });
}
