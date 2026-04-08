import {
  createMarketState,
  getMarketProbabilities,
  quoteBuyOrder,
  settlePortfolioPayout,
  type MarketSide,
  type ResolutionOutcome,
} from "@/lib/markets/lmsr";

export type SourceLink = {
  label: string;
  href: string;
};

export type MarketRecord = {
  id: string;
  slug: string;
  question: string;
  brief: string;
  category: "时事" | "科技" | "财经";
  status: "live" | "locked" | "review" | "resolved" | "voided";
  liquidity: number;
  yesShares: number;
  noShares: number;
  volumePoints: number;
  activeTraders: number;
  closesAt: string;
  resolvesAt: string;
  tone: string;
  evidence: string[];
  resolutionSource: SourceLink[];
  resolutionOutcome?: ResolutionOutcome;
};

export type PortfolioPosition = {
  marketSlug: string;
  marketQuestion: string;
  side: MarketSide;
  shares: number;
  totalCost: number;
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  title: string;
  score: number;
  hitRate: number;
  monthlyGain: number;
};

function links(primary: string, secondary: string): SourceLink[] {
  return [
    { label: primary, href: "https://www.reuters.com/" },
    { label: secondary, href: "https://www.bloomberg.com/" },
  ];
}

function notes(...items: string[]) {
  return items;
}

const marketRecords: MarketRecord[] = [
  {
    id: "mkt_cn_ai_phone_q3",
    slug: "cn-ai-phone-q3-shipment",
    question: "2026年第三季度，中国 AI 手机单季出货量会突破 1000 万台吗？",
    brief: "消费电子与端侧模型落地交叉判断，核心看新品节奏、补贴和实际使用黏性。",
    category: "科技",
    status: "live",
    liquidity: 125,
    yesShares: 84,
    noShares: 36,
    volumePoints: 483000,
    activeTraders: 2418,
    closesAt: "2026-07-29T20:00:00+08:00",
    resolvesAt: "2026-08-05T12:00:00+08:00",
    tone: "热度已经形成，但销量兑现仍然取决于价格带和本地 Agent 体验。",
    evidence: notes("看新品发布节奏，而不是单个品牌预热。", "补贴延续会决定增量价位带。", "重点看真实激活而不是发布会口径。"),
    resolutionSource: links("IDC China Quarterly Mobile Phone Tracker", "Counterpoint China Smartphone Shipment Tracker"),
  },
  {
    id: "mkt_fed_q3_cut",
    slug: "fed-rate-cut-before-q3-2026",
    question: "美联储会在 2026 年 9 月 30 日之前启动一次降息吗？",
    brief: "宏观条件概率市场，判断就业、通胀和金融条件是否同时让位给宽松路径。",
    category: "财经",
    status: "live",
    liquidity: 160,
    yesShares: 61,
    noShares: 87,
    volumePoints: 691000,
    activeTraders: 3794,
    closesAt: "2026-09-18T02:00:00+08:00",
    resolvesAt: "2026-09-19T10:00:00+08:00",
    tone: "市场分歧较大，价格反映的是路径争夺而不是单点预测。",
    evidence: notes("看核心通胀黏性。", "看就业市场下滑是否持续。", "看金融条件是否先于会议表态放松。"),
    resolutionSource: links("Federal Reserve FOMC Statements", "FRED Effective Federal Funds Rate"),
  },
  {
    id: "mkt_cn_agent_os",
    slug: "cn-agent-os-before-2026-q4",
    question: "会有中国大模型厂商在 2026 年第四季度前发布稳定商用的 Agent OS 吗？",
    brief: "判断重点不在发布会，而在任务编排、权限治理和端云协同是否进入可商用阶段。",
    category: "科技",
    status: "review",
    liquidity: 110,
    yesShares: 72,
    noShares: 48,
    volumePoints: 224000,
    activeTraders: 1142,
    closesAt: "2026-10-11T18:00:00+08:00",
    resolvesAt: "2026-10-15T10:00:00+08:00",
    tone: "叙事已经从参数规模切到系统封装，真实关键在于第三方接入可用性。",
    evidence: notes("需要明确商用与试验版边界。", "看第三方开发接入。", "看稳定任务执行成功率。"),
    resolutionSource: links("企业官方发布会与产品文档", "工信部备案与开发者平台公开信息"),
  },
  {
    id: "mkt_politics_us_budget",
    slug: "politics-us-house-budget-june-2026",
    question: "美国众议院会在 2026 年 6 月前通过年度预算框架吗？",
    brief: "议程推进、党内协调和财政僵局是否在窗口期内收敛。",
    category: "时事",
    status: "live",
    liquidity: 138,
    yesShares: 66,
    noShares: 54,
    volumePoints: 534000,
    activeTraders: 2804,
    closesAt: "2026-04-07T19:00:00+08:00",
    resolvesAt: "2026-04-09T12:00:00+08:00",
    tone: "真正变量不是表态，而是程序性投票能否过关。",
    evidence: notes("看党团协调窗口。", "看议长排程。", "看财政争议是否外溢到其他议案。"),
    resolutionSource: links("US House Roll Call", "Congress.gov Bill Actions"),
  },
  {
    id: "mkt_politics_us_speaker",
    slug: "politics-us-speaker-still-in-seat-july-2026",
    question: "美国众议院议长会在 2026 年 7 月前继续留任吗？",
    brief: "判断党内裂缝是否升级到真正的人事更替。",
    category: "时事",
    status: "live",
    liquidity: 112,
    yesShares: 78,
    noShares: 42,
    volumePoints: 301000,
    activeTraders: 1690,
    closesAt: "2026-04-11T20:00:00+08:00",
    resolvesAt: "2026-07-01T10:00:00+08:00",
    tone: "表面噪音很多，但真正风险点在于少数强硬派是否形成联手动作。",
    evidence: notes("看党内公开异议。", "看表决威胁是否成形。", "看替代人选是否浮现。"),
    resolutionSource: links("Roll Call Leadership Tracker", "AP Congress Coverage"),
  },
  {
    id: "mkt_politics_france_cabinet",
    slug: "politics-france-cabinet-reshuffle-may-2026",
    question: "法国政府会在 2026 年 5 月前进行一次内阁大幅改组吗？",
    brief: "欧洲政治风险的短周期市场，关注支持率和街头压力是否迫使人事调整。",
    category: "时事",
    status: "locked",
    liquidity: 108,
    yesShares: 57,
    noShares: 63,
    volumePoints: 189000,
    activeTraders: 1140,
    closesAt: "2026-04-04T18:00:00+08:00",
    resolvesAt: "2026-05-01T12:00:00+08:00",
    tone: "这类市场最怕假消息，必须以正式公告为准。",
    evidence: notes("看总理府和总统府公告。", "看议会信任投票压力。", "看执政联盟支持率。"),
    resolutionSource: links("Elysee Official Releases", "Le Monde Politics Live"),
  },
  {
    id: "mkt_politics_japan_upperhouse",
    slug: "politics-japan-upper-house-coalition-majority-2026",
    question: "日本执政联盟会在 2026 年参议院改选后保住多数吗？",
    brief: "判断经济议题、支持率和地方选情是否足以维持联盟控制力。",
    category: "时事",
    status: "review",
    liquidity: 96,
    yesShares: 51,
    noShares: 69,
    volumePoints: 142000,
    activeTraders: 980,
    closesAt: "2026-07-20T20:00:00+08:00",
    resolvesAt: "2026-07-22T12:00:00+08:00",
    tone: "这是典型慢变量市场，更适合看趋势而不是热点新闻。",
    evidence: notes("看联合执政支持率。", "看地方补选结果。", "看无党派流向。"),
    resolutionSource: links("NHK Election Results", "Japan Times Politics"),
  },
  {
    id: "mkt_world_ukraine_ceasefire",
    slug: "world-ukraine-ceasefire-before-july-2026",
    question: "俄乌冲突会在 2026 年 7 月前出现正式停火协议吗？",
    brief: "判断战场态势、谈判窗口和第三方斡旋是否足以形成书面协议。",
    category: "时事",
    status: "live",
    liquidity: 142,
    yesShares: 44,
    noShares: 76,
    volumePoints: 601000,
    activeTraders: 3210,
    closesAt: "2026-04-08T22:00:00+08:00",
    resolvesAt: "2026-07-01T12:00:00+08:00",
    tone: "市场更相信延宕而不是速成协议。",
    evidence: notes("看是否有书面停火文本。", "看主要交战方是否共同确认。", "看第三方担保机制。"),
    resolutionSource: links("Reuters World Conflict Desk", "United Nations Press Releases"),
  },
  {
    id: "mkt_world_oil_strait",
    slug: "world-strait-shipping-disruption-q2-2026",
    question: "关键海峡航运会在 2026 年第二季度前出现连续一周以上严重中断吗？",
    brief: "世界事件与运价风险联动判断。",
    category: "时事",
    status: "live",
    liquidity: 120,
    yesShares: 62,
    noShares: 58,
    volumePoints: 355000,
    activeTraders: 1730,
    closesAt: "2026-04-09T18:00:00+08:00",
    resolvesAt: "2026-06-30T12:00:00+08:00",
    tone: "这类市场对单日事件不过度反应，更看连续性中断。",
    evidence: notes("看官方航运公告。", "看主要航运公司声明。", "看保险和港口数据。"),
    resolutionSource: links("Lloyd's List Coverage", "MarineTraffic Alerts"),
  },
  {
    id: "mkt_world_china_eu_tariff",
    slug: "world-china-eu-ev-tariff-settlement-2026",
    question: "中欧会在 2026 年中前就电动车关税争议达成阶段性安排吗？",
    brief: "判断贸易谈判是否从对抗走向临时管理。",
    category: "时事",
    status: "live",
    liquidity: 118,
    yesShares: 70,
    noShares: 50,
    volumePoints: 262000,
    activeTraders: 1360,
    closesAt: "2026-05-30T18:00:00+08:00",
    resolvesAt: "2026-06-30T12:00:00+08:00",
    tone: "双方都想保留回旋空间，因此先看临时安排而不是最终协议。",
    evidence: notes("看欧委会披露。", "看商务部口径。", "看企业豁免安排。"),
    resolutionSource: links("European Commission Trade News", "中国商务部新闻发布"),
  },
  {
    id: "mkt_world_un_ai_treaty",
    slug: "world-un-ai-framework-before-q4-2026",
    question: "联合国框架下会在 2026 年第四季度前形成正式 AI 治理框架文本吗？",
    brief: "判断全球治理是否从原则宣言走到文本协商。",
    category: "时事",
    status: "review",
    liquidity: 90,
    yesShares: 47,
    noShares: 73,
    volumePoints: 118000,
    activeTraders: 840,
    closesAt: "2026-10-10T18:00:00+08:00",
    resolvesAt: "2026-11-15T12:00:00+08:00",
    tone: "共识很多，但文本落地总是慢于口号。",
    evidence: notes("看大会正式文件。", "看多边共同声明。", "看是否形成统一文本。"),
    resolutionSource: links("UN Press Releases", "OECD AI Policy Observatory"),
  },
  {
    id: "mkt_sports_lakers_playoffs",
    slug: "sports-lakers-playoffs-2026",
    question: "湖人会进入 2026 年季后赛吗？",
    brief: "高关注体育市场，判断最后冲刺赛程和核心阵容健康度。",
    category: "时事",
    status: "resolved",
    liquidity: 145,
    yesShares: 86,
    noShares: 34,
    volumePoints: 771000,
    activeTraders: 4320,
    closesAt: "2026-04-02T12:00:00+08:00",
    resolvesAt: "2026-04-03T12:00:00+08:00",
    tone: "赛季后段市场通常带有强情绪，结果一出就会迅速归零争议。",
    evidence: notes("看官方排名。", "看附加赛结果。", "看联盟最终晋级名单。"),
    resolutionSource: links("NBA Standings", "ESPN NBA Scoreboard"),
    resolutionOutcome: "YES",
  },
  {
    id: "mkt_sports_madrid_ucl",
    slug: "sports-real-madrid-ucl-semifinal-2026",
    question: "皇家马德里会进入 2026 年欧冠四强吗？",
    brief: "赛事淘汰赛型市场，判断签位、伤停和首回合优势。",
    category: "时事",
    status: "live",
    liquidity: 122,
    yesShares: 77,
    noShares: 43,
    volumePoints: 448000,
    activeTraders: 2470,
    closesAt: "2026-04-06T03:00:00+08:00",
    resolvesAt: "2026-04-16T12:00:00+08:00",
    tone: "体育市场最怕用名气代替赛程细节，关键是淘汰赛结构。",
    evidence: notes("看两回合赛程。", "看核心球员伤停。", "看主客场优势。"),
    resolutionSource: links("UEFA Match Centre", "Opta Analyst Coverage"),
  },
  {
    id: "mkt_sports_t1_msi",
    slug: "sports-t1-msi-title-2026",
    question: "T1 会拿下 2026 年 MSI 冠军吗？",
    brief: "电竞赛果市场，适合高频情绪与赛制因素混合判断。",
    category: "时事",
    status: "live",
    liquidity: 101,
    yesShares: 58,
    noShares: 62,
    volumePoints: 239000,
    activeTraders: 1520,
    closesAt: "2026-05-18T19:00:00+08:00",
    resolvesAt: "2026-05-20T12:00:00+08:00",
    tone: "电竞市场往往高波动，最重要的是版本和淘汰赛签位。",
    evidence: notes("看抽签。", "看版本强队。", "看淘汰赛 BO5 稳定性。"),
    resolutionSource: links("LoL Esports Schedule", "Liquipedia MSI"),
  },
  {
    id: "mkt_sports_f1_race",
    slug: "sports-f1-shanghai-pole-2026",
    question: "2026 上海站 F1 排位赛会由红牛车手拿到杆位吗？",
    brief: "短周期体育判断，更偏即时信息和排位节奏。",
    category: "时事",
    status: "locked",
    liquidity: 92,
    yesShares: 40,
    noShares: 80,
    volumePoints: 164000,
    activeTraders: 930,
    closesAt: "2026-04-05T14:00:00+08:00",
    resolvesAt: "2026-04-05T17:00:00+08:00",
    tone: "短周期体育题材适合填补即将锁盘分组。",
    evidence: notes("看官方排位结果。", "看练习赛节奏。", "看天气和轮胎窗口。"),
    resolutionSource: links("Formula 1 Timing", "Autosport Race Centre"),
  },
  {
    id: "mkt_crypto_bitcoin_150k",
    slug: "crypto-bitcoin-above-150k-q2-2026",
    question: "比特币会在 2026 年第二季度前站上 15 万美元吗？",
    brief: "加密大盘市场，观察 ETF 资金、流动性和风险偏好是否继续共振。",
    category: "财经",
    status: "locked",
    liquidity: 166,
    yesShares: 74,
    noShares: 46,
    volumePoints: 812000,
    activeTraders: 4620,
    closesAt: "2026-04-05T18:00:00+08:00",
    resolvesAt: "2026-06-30T12:00:00+08:00",
    tone: "加密市场的关键不只是涨跌，还看资金是否愿意追逐更高估值框架。",
    evidence: notes("看主流现货指数。", "看 ETF 资金净流入。", "看宏观流动性环境。"),
    resolutionSource: links("CoinDesk Price Index", "Bloomberg Crypto Coverage"),
  },
  {
    id: "mkt_crypto_eth_etf",
    slug: "crypto-eth-spot-etf-net-inflow-june-2026",
    question: "美国现货以太坊 ETF 会在 2026 年 6 月前连续四周净流入吗？",
    brief: "加密结构性题材，关注资金偏好的二阶变化。",
    category: "财经",
    status: "live",
    liquidity: 134,
    yesShares: 69,
    noShares: 51,
    volumePoints: 388000,
    activeTraders: 2070,
    closesAt: "2026-04-10T18:00:00+08:00",
    resolvesAt: "2026-06-30T12:00:00+08:00",
    tone: "真正要看的是持续流入，而不是某一周的情绪峰值。",
    evidence: notes("看发行人周报。", "看 CBOE / Nasdaq 数据。", "看链上风险偏好同步情况。"),
    resolutionSource: links("ETF Issuer Filings", "The Block ETF Tracker"),
  },
  {
    id: "mkt_crypto_sol_breakout",
    slug: "crypto-solana-above-400-before-july-2026",
    question: "Solana 会在 2026 年 7 月前站上 400 美元吗？",
    brief: "高 beta 市场，判断生态热度能否转化为持续定价。",
    category: "财经",
    status: "live",
    liquidity: 118,
    yesShares: 55,
    noShares: 65,
    volumePoints: 271000,
    activeTraders: 1650,
    closesAt: "2026-07-01T18:00:00+08:00",
    resolvesAt: "2026-07-02T12:00:00+08:00",
    tone: "比价格本身更重要的是资金是否愿意追涨生态叙事。",
    evidence: notes("看主流价格指数。", "看链上活动热度。", "看衍生品杠杆变化。"),
    resolutionSource: links("CoinGecko Historical Data", "Kaiko Market Data"),
  },
  {
    id: "mkt_crypto_stablecoin_bill",
    slug: "crypto-us-stablecoin-bill-before-aug-2026",
    question: "美国会在 2026 年 8 月前通过联邦层面的稳定币法案吗？",
    brief: "加密监管市场，适合观察立法推进与跨党派妥协。",
    category: "财经",
    status: "review",
    liquidity: 97,
    yesShares: 63,
    noShares: 57,
    volumePoints: 152000,
    activeTraders: 1080,
    closesAt: "2026-08-20T18:00:00+08:00",
    resolvesAt: "2026-08-31T12:00:00+08:00",
    tone: "监管市场更依赖文本推进，而不是一两次听证会 headlines。",
    evidence: notes("看法案文本推进。", "看委员会表决。", "看两院进度差异。"),
    resolutionSource: links("Congress.gov", "CoinDesk Policy"),
  },
  {
    id: "mkt_finance_us10y",
    slug: "finance-us10y-above-5-before-june-2026",
    question: "美国 10 年期国债收益率会在 2026 年 6 月前重新站上 5% 吗？",
    brief: "宏观利率路径市场，兼具通胀、财政和风险偏好三条主线。",
    category: "财经",
    status: "live",
    liquidity: 144,
    yesShares: 47,
    noShares: 73,
    volumePoints: 576000,
    activeTraders: 3010,
    closesAt: "2026-05-31T18:00:00+08:00",
    resolvesAt: "2026-06-01T12:00:00+08:00",
    tone: "这类市场最适合看定价是否在重复更高更久框架。",
    evidence: notes("看 Treasury 数据。", "看核心通胀和就业。", "看供给冲击和期限溢价。"),
    resolutionSource: links("U.S. Treasury Yield Data", "FRED DGS10"),
  },
  {
    id: "mkt_finance_gold",
    slug: "finance-gold-above-3200-before-july-2026",
    question: "黄金会在 2026 年 7 月前站上 3200 美元吗？",
    brief: "典型风险对冲资产判断，受利率、美元和地缘事件共振影响。",
    category: "财经",
    status: "live",
    liquidity: 121,
    yesShares: 68,
    noShares: 52,
    volumePoints: 326000,
    activeTraders: 1810,
    closesAt: "2026-06-30T18:00:00+08:00",
    resolvesAt: "2026-07-01T12:00:00+08:00",
    tone: "黄金不是单看恐慌，更看真实利率和央行配置节奏。",
    evidence: notes("看伦敦定盘。", "看 ETF 流入。", "看真实利率。"),
    resolutionSource: links("LBMA Gold Price", "World Gold Council"),
  },
  {
    id: "mkt_finance_oil",
    slug: "finance-brent-above-100-before-q3-2026",
    question: "布伦特原油会在 2026 年第三季度前重新站上 100 美元吗？",
    brief: "供给风险与全球需求预期之间的典型博弈市场。",
    category: "财经",
    status: "locked",
    liquidity: 109,
    yesShares: 60,
    noShares: 60,
    volumePoints: 207000,
    activeTraders: 1230,
    closesAt: "2026-04-05T20:00:00+08:00",
    resolvesAt: "2026-06-30T12:00:00+08:00",
    tone: "油价市场对单点新闻很敏感，但结算要严格看盘中触价是否真实发生。",
    evidence: notes("看官方结算价。", "看供给中断持续性。", "看库存与需求修复。"),
    resolutionSource: links("ICE Brent Futures", "EIA Oil Market Reports"),
  },
  {
    id: "mkt_finance_china_rrr",
    slug: "finance-china-rrr-cut-before-may-2026",
    question: "中国会在 2026 年 5 月前宣布一次全面降准吗？",
    brief: "国内政策判断，重点看增长压力、信用修复和政策窗口。",
    category: "财经",
    status: "review",
    liquidity: 93,
    yesShares: 70,
    noShares: 50,
    volumePoints: 131000,
    activeTraders: 970,
    closesAt: "2026-05-31T18:00:00+08:00",
    resolvesAt: "2026-05-31T20:00:00+08:00",
    tone: "政策市场需要严格定义官方公告，不接受二级解读替代。",
    evidence: notes("以央行公告为准。", "看社融和地产指标。", "看专项债与财政配合。"),
    resolutionSource: links("中国人民银行公告", "新华社宏观报道"),
  },
  {
    id: "mkt_tech_openai_device",
    slug: "tech-openai-device-launch-2026",
    question: "OpenAI 会在 2026 年底前发布自有 AI 设备吗？",
    brief: "平台与硬件融合判断，关注正式发布而不是研究项目曝光。",
    category: "科技",
    status: "live",
    liquidity: 136,
    yesShares: 72,
    noShares: 48,
    volumePoints: 565000,
    activeTraders: 2980,
    closesAt: "2026-12-10T18:00:00+08:00",
    resolvesAt: "2026-12-31T12:00:00+08:00",
    tone: "市场在定价产品化速度，而不是概念演示本身。",
    evidence: notes("以正式发布会或官网发布为准。", "不接受供应链传闻替代。", "看是否面向公众销售。"),
    resolutionSource: links("OpenAI Newsroom", "The Information Hardware Coverage"),
  },
  {
    id: "mkt_tech_apple_siri",
    slug: "tech-apple-siri-overhaul-wwdc-2026",
    question: "苹果会在 2026 年 WWDC 上发布明显升级版 Siri Agent 吗？",
    brief: "大厂产品节奏市场，适合看发布口径和可用能力是否匹配。",
    category: "科技",
    status: "live",
    liquidity: 128,
    yesShares: 69,
    noShares: 51,
    volumePoints: 418000,
    activeTraders: 2460,
    closesAt: "2026-06-10T02:00:00+08:00",
    resolvesAt: "2026-06-11T12:00:00+08:00",
    tone: "发布会噪音会很多，市场定义必须看可演示功能和公开表述。",
    evidence: notes("看 WWDC keynote。", "看开发者文档。", "看是否明确 Agent 能力。"),
    resolutionSource: links("Apple Newsroom", "Apple Developer Sessions"),
  },
  {
    id: "mkt_tech_nvidia_4m",
    slug: "tech-nvidia-4m-blackwell-q2-2026",
    question: "英伟达会在 2026 年第二季度内开始大规模交付下一代 Blackwell Ultra 吗？",
    brief: "AI 基础设施链条市场，判断路线图与供给节奏是否兑现。",
    category: "科技",
    status: "locked",
    liquidity: 119,
    yesShares: 63,
    noShares: 57,
    volumePoints: 266000,
    activeTraders: 1540,
    closesAt: "2026-04-05T21:00:00+08:00",
    resolvesAt: "2026-06-30T12:00:00+08:00",
    tone: "市场最容易混淆样品交付和大规模交付，结算定义必须前置。",
    evidence: notes("看财报口径。", "看客户验证。", "看量产发货迹象。"),
    resolutionSource: links("NVIDIA Investor Relations", "SemiAnalysis Supply Chain Coverage"),
  },
  {
    id: "mkt_tech_meta_glasses",
    slug: "tech-meta-rayban-shipments-q4-2026",
    question: "Meta 智能眼镜 2026 年全年出货会突破 800 万台吗？",
    brief: "硬件+模型场景落地市场，判断产品从早期 adopters 走向大众化的速度。",
    category: "科技",
    status: "review",
    liquidity: 102,
    yesShares: 59,
    noShares: 61,
    volumePoints: 144000,
    activeTraders: 1010,
    closesAt: "2026-12-28T18:00:00+08:00",
    resolvesAt: "2027-01-20T12:00:00+08:00",
    tone: "真正关键不是单季热销，而是全年累计规模是否跨过阈值。",
    evidence: notes("看官方披露。", "看第三方 tracker。", "看渠道补货持续性。"),
    resolutionSource: links("Meta Earnings", "IDC Wearables Tracker"),
  },
  {
    id: "mkt_culture_avatar_delay",
    slug: "culture-avatar-4-delay-2026",
    question: "《阿凡达 4》会在 2026 年内再次延期吗？",
    brief: "影视排期题材，适合做终态与作废市场样例。",
    category: "时事",
    status: "voided",
    liquidity: 85,
    yesShares: 50,
    noShares: 70,
    volumePoints: 93000,
    activeTraders: 620,
    closesAt: "2026-03-10T18:00:00+08:00",
    resolvesAt: "2026-03-12T12:00:00+08:00",
    tone: "片方临时改口径最容易造成规则争议，因此直接作废退款。",
    evidence: notes("定义争议过大时直接 VOID。", "档期变化必须以片方确认文本为准。", "预告和爆料不构成结算依据。"),
    resolutionSource: links("Disney Release Calendar", "Variety Film News"),
    resolutionOutcome: "VOID",
  },
  {
    id: "mkt_culture_boxoffice",
    slug: "culture-china-summer-boxoffice-35b-2026",
    question: "2026 年中国暑期档总票房会突破 350 亿元吗？",
    brief: "文化消费题材，适合用来观察节假日和爆款供给的共振。",
    category: "时事",
    status: "live",
    liquidity: 111,
    yesShares: 67,
    noShares: 53,
    volumePoints: 214000,
    activeTraders: 1320,
    closesAt: "2026-08-31T23:00:00+08:00",
    resolvesAt: "2026-09-02T12:00:00+08:00",
    tone: "最终不是看单片，是看供给结构和排片接力。",
    evidence: notes("看官方票房平台。", "看头部影片供给。", "看连续假期档期。"),
    resolutionSource: links("国家电影局数据", "猫眼专业版"),
  },
  {
    id: "mkt_culture_oscar",
    slug: "culture-china-film-oscar-nomination-2026",
    question: "会有中国影片进入 2026 年奥斯卡最佳国际影片最终提名吗？",
    brief: "文化事件市场，更偏提名节点判断。",
    category: "时事",
    status: "live",
    liquidity: 92,
    yesShares: 38,
    noShares: 82,
    volumePoints: 121000,
    activeTraders: 780,
    closesAt: "2026-12-20T18:00:00+08:00",
    resolvesAt: "2027-01-25T12:00:00+08:00",
    tone: "不要把入围长名单和最终提名混为一谈。",
    evidence: notes("看学院官方名单。", "看代表作选送。", "看评奖节奏。"),
    resolutionSource: links("Oscars Official News", "Variety Awards Circuit"),
  },
  {
    id: "mkt_culture_streaming",
    slug: "culture-netflix-anime-hit-2026",
    question: "Netflix 会在 2026 年推出一部全球爆红的新动画剧集吗？",
    brief: "文化热度题材，用于补足长尾浏览 feed 的多样性。",
    category: "时事",
    status: "review",
    liquidity: 81,
    yesShares: 56,
    noShares: 64,
    volumePoints: 87000,
    activeTraders: 610,
    closesAt: "2026-11-30T18:00:00+08:00",
    resolvesAt: "2026-12-20T12:00:00+08:00",
    tone: "这种题材最难的是定义“爆红”，所以审核期先不开放交易。",
    evidence: notes("必须写清阈值。", "需要采用公开榜单。", "避免主观热度定义。"),
    resolutionSource: links("Netflix Top 10", "Parrot Analytics"),
  },
];

const positions: PortfolioPosition[] = [
  {
    marketSlug: "cn-ai-phone-q3-shipment",
    marketQuestion: marketRecords[0].question,
    side: "YES",
    shares: 22,
    totalCost: 1118,
  },
  {
    marketSlug: "fed-rate-cut-before-q3-2026",
    marketQuestion: marketRecords[1].question,
    side: "NO",
    shares: 18,
    totalCost: 1234,
  },
  {
    marketSlug: "cn-agent-os-before-2026-q4",
    marketQuestion: marketRecords[2].question,
    side: "YES",
    shares: 16,
    totalCost: 907,
  },
];

const leaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "白描研究员", title: "科技事件领先", score: 128420, hitRate: 0.71, monthlyGain: 18400 },
  { rank: 2, name: "北岸宏观", title: "宏观路径交易", score: 121180, hitRate: 0.69, monthlyGain: 16110 },
  { rank: 3, name: "深水区", title: "时事驱动型用户", score: 118960, hitRate: 0.68, monthlyGain: 14780 },
  { rank: 4, name: "Delta CN", title: "高频参与者", score: 112340, hitRate: 0.66, monthlyGain: 13920 },
  { rank: 5, name: "政策边际", title: "政策与产业观察", score: 109120, hitRate: 0.65, monthlyGain: 11740 },
];

export function getMarkets() {
  return marketRecords.map((record) => {
    const state = createMarketState(record);
    const probability = getMarketProbabilities(state);
    const sampleOrder = quoteBuyOrder(state, {
      side: probability.yes >= probability.no ? "YES" : "NO",
      shareCount: 12,
    });

    return {
      ...record,
      probability,
      sampleOrder,
    };
  });
}

export function getMarketBySlug(slug: string) {
  return getMarkets().find((market) => market.slug === slug) ?? null;
}

export function getFeaturedMarket() {
  return [...getMarkets()].sort((left, right) => right.volumePoints - left.volumePoints)[0];
}

export function getPortfolioSnapshot() {
  const markets = getMarkets();
  const holdings = positions.map((position) => {
    const market = markets.find((item) => item.slug === position.marketSlug);
    const markPrice = position.side === "YES" ? market?.probability.yes ?? 0 : market?.probability.no ?? 0;
    const currentValue = position.shares * markPrice * 100;

    return {
      ...position,
      probability: markPrice,
      currentValue,
      pnl: currentValue - position.totalCost,
      market,
    };
  });

  const resolved = settlePortfolioPayout(
    [
      { side: "YES", shareCount: 14, totalCost: 622 },
      { side: "NO", shareCount: 9, totalCost: 411 },
    ],
    "YES",
  );

  return {
    user: {
      name: "演示账户 / 北岸观察",
      credits: 125000,
      availableCredits: 117640,
    },
    holdings,
    summary: {
      totalExposure: holdings.reduce((sum, item) => sum + item.totalCost, 0),
      markToMarket: holdings.reduce((sum, item) => sum + item.currentValue, 0),
      openPnl: holdings.reduce((sum, item) => sum + item.pnl, 0),
      resolvedPnl: resolved.netPayout,
      hitRate: 0.67,
    },
  };
}

export function getLeaderboard() {
  return leaderboard;
}

export function getResolutionQueue() {
  return getMarkets().filter((market) => market.status !== "live");
}

export function previewQuote(slug: string, side: MarketSide, shareCount: number) {
  const market = getMarketBySlug(slug);

  if (!market) {
    return null;
  }

  return quoteBuyOrder(createMarketState(market), {
    side,
    shareCount,
  });
}

export function resolveDemoMarket(slug: string, outcome: ResolutionOutcome) {
  const market = getMarketBySlug(slug);

  if (!market) {
    return null;
  }

  const impactedPositions = positions.filter((position) => position.marketSlug === slug);
  return {
    market,
    outcome,
    settlement: settlePortfolioPayout(
      impactedPositions.map((position) => ({
        side: position.side,
        shareCount: position.shares,
        totalCost: position.totalCost,
      })),
      outcome,
    ),
  };
}
