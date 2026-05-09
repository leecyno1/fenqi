const TERM_TRANSLATIONS: Array<[RegExp, string]> = [
  [/Will the Fed cut rates before/gi, "美联储是否会在以下时间前降息"],
  [/in (\d{4})/gi, "$1 年"],
  [/before (\d{4})/gi, "$1 年前"],
  [/Will the Fed cut rates/gi, "美联储是否会降息"],
  [/Fed cut rates/gi, "美联储降息"],
  [/Fed/gi, "美联储"],
  [/Trump/gi, "特朗普"],
  [/Biden/gi, "拜登"],
  [/Harris/gi, "哈里斯"],
  [/Republicans?/gi, "共和党"],
  [/Democrats?/gi, "民主党"],
  [/US Presidential/gi, "美国总统"],
  [/U\.S\./gi, "美国"],
  [/US /gi, "美国"],
  [/China/gi, "中国"],
  [/Russia/gi, "俄罗斯"],
  [/Ukraine/gi, "乌克兰"],
  [/Israel/gi, "以色列"],
  [/Iran/gi, "伊朗"],
  [/Bitcoin/gi, "比特币"],
  [/Ethereum/gi, "以太坊"],
  [/BTC/gi, "BTC"],
  [/ETH/gi, "ETH"],
  [/Presidential Election Winner/gi, "总统大选获胜者"],
  [/Republican Presidential Nominee/gi, "共和党总统候选人"],
  [/Democratic Presidential Nominee/gi, "民主党总统候选人"],
  [/FIFA World Cup Winner/gi, "世界杯冠军"],
  [/UEFA Champions League Winner/gi, "欧冠冠军"],
  [/NBA Champion/gi, "NBA 总冠军"],
  [/NHL Stanley Cup Champion/gi, "NHL 斯坦利杯冠军"],
  [/English Premier League Winner/gi, "英超冠军"],
  [/LALIGA Winner/gi, "西甲冠军"],
  [/Brazil Presidential Election/gi, "巴西总统大选获胜者"],
  [/Nobel Peace Prize Winner/gi, "诺贝尔和平奖获奖者"],
  [/California Governor Election Winner/gi, "加州州长选举获胜者"],
  [/Colombia Presidential Election/gi, "哥伦比亚总统大选获胜者"],
  [/Maine Democratic Senate Primary Winner/gi, "缅因州民主党参议员初选获胜者"],
  [/Texas Republican Senate Primary Winner/gi, "得州共和党参议员初选获胜者"],
  [/Ballon d'Or Winner/gi, "金球奖得主"],
  [/Largest Company end of June/gi, "6 月底市值最大公司"],
  [/Super Bowl Winner/gi, "超级碗冠军"],
  [/World Series Winner/gi, "世界大赛冠军"],
  [/NBA Finals/gi, "NBA 总决赛"],
  [/CPI/gi, "CPI"],
  [/GDP/gi, "GDP"],
  [/rate cuts?/gi, "降息"],
  [/interest rates?/gi, "利率"],
  [/inflation/gi, "通胀"],
  [/recession/gi, "经济衰退"],
  [/all-time high/gi, "历史新高"],
  [/price/gi, "价格"],
  [/above/gi, "高于"],
  [/below/gi, "低于"],
  [/over/gi, "超过"],
  [/under/gi, "低于"],
  [/Which party wins US Presidential Election/gi, "哪一党赢得美国总统大选"],
  [/Which party will win the Senate/gi, "哪一党赢得参议院"],
  [/Which party will win the House/gi, "哪一党赢得众议院"],
  [/Will China invade Taiwan/gi, "中国大陆是否会攻台"],
  [/Will the U\.S\. invade Iran/gi, "美国是否会入侵伊朗"],
  [/Will there be/gi, "是否会出现"],
  [/Will .* happen/gi, "相关事件是否会发生"],
  [/Who will win/gi, "谁将赢得"],
  [/Which .* wins/gi, "哪一方将赢得"],
  [/Which .* will win/gi, "哪一方将赢得"],
  [/Will/gi, "是否"],
  [/Russia x Ukraine ceasefire/gi, "俄乌是否达成停火"],
  [/Netanyahu out/gi, "内塔尼亚胡是否下台"],
  [/before/gi, "在以下时间前"],
  [/by end of/gi, "截至年底"],
  [/by\.\.\.?/gi, "指定时间前"],
  [/by/gi, "截至"],
  [/end of June/gi, "6 月底"],
  [/Winner/gi, "获胜者"],
  [/Champion/gi, "冠军"],
  [/Nominee/gi, "候选人"],
  [/Election/gi, "选举"],
  [/Primary/gi, "初选"],
  [/Senate/gi, "参议院"],
  [/House/gi, "众议院"],
  [/Governor/gi, "州长"],
  [/Company/gi, "公司"],
  [/companies/gi, "公司"],
  [/person/gi, "候选人"],
  [/race/gi, "竞选"],
  [/sells?/gi, "出售"],
  [/buys?/gi, "购买"],
  [/any/gi, "任意"],
  [/Kansas/gi, "堪萨斯州"],
  [/MicroStrategy/gi, "Strategy 公司"],
  [/Strategy/gi, "Strategy 公司"],
  [/shares?/gi, "股票"],
  [/stocks?/gi, "股票"],
  [/market cap/gi, "市值"],
  [/wins?/gi, "获胜"],
  [/lose?s?/gi, "失利"],
  [/announces?/gi, "宣布"],
  [/launch(es)?/gi, "发布"],
  [/approval/gi, "批准"],
  [/deadline/gi, "截止时间"],
  [/before/gi, "之前"],
  [/after/gi, "之后"],
];

const MONTH_TRANSLATIONS: Array<[RegExp, string]> = [
  [/January/gi, "1 月"],
  [/February/gi, "2 月"],
  [/March/gi, "3 月"],
  [/April/gi, "4 月"],
  [/May/gi, "5 月"],
  [/June/gi, "6 月"],
  [/July/gi, "7 月"],
  [/August/gi, "8 月"],
  [/September/gi, "9 月"],
  [/October/gi, "10 月"],
  [/November/gi, "11 月"],
  [/December/gi, "12 月"],
];

function hasChinese(value: string) {
  return /[\u4e00-\u9fff]/.test(value);
}

export function isMostlyEnglish(value: string) {
  const letters = value.match(/[A-Za-z]/g)?.length ?? 0;
  const chinese = value.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  return letters > 0 && letters >= chinese * 2;
}

function applyDictionary(value: string) {
  let output = value.trim();
  for (const [pattern, replacement] of [...TERM_TRANSLATIONS, ...MONTH_TRANSLATIONS]) {
    output = output.replace(pattern, replacement);
  }

  return output
    .replace(/\?/g, "？")
    .replace(/\s+/g, " ")
    .replace(/\s+([，。？！])/g, "$1")
    .replace(/\s+年/g, " 年")
    .trim();
}


function sanitizeUntranslatedLatin(value: string) {
  const protectedTerms = new Map<string, string>([
    ["AI", "AI"],
    ["AGI", "AGI"],
    ["API", "API"],
    ["BTC", "BTC"],
    ["ETH", "ETH"],
    ["ETF", "ETF"],
    ["NBA", "NBA"],
    ["NFL", "NFL"],
    ["NHL", "NHL"],
    ["MLB", "MLB"],
    ["FIFA", "FIFA"],
    ["CPI", "CPI"],
    ["GDP", "GDP"],
  ]);

  return value
    .replace(/\b[A-Za-z]{1,8}\b/g, (token) => protectedTerms.get(token.toUpperCase()) ?? "相关方")
    .replace(/(?:相关方[\s·:：,，-]*){2,}/g, "相关方")
    .replace(/相关方\s*(公司|竞选|选举|候选人|获胜|出售|发布|宣布)/g, "相关$1")
    .replace(/\s+/g, " ")
    .replace(/\s+([，。？！：])/g, "$1")
    .trim();
}

function formatSlugFallback(slug: string) {
  return slug
    .replace(/-?(\d{4})$/u, " $1")
    .split(/[-_]+/u)
    .filter(Boolean)
    .map((part) => applyDictionary(part))
    .join(" · ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildReadableFallback(value: string, slug?: string | null) {
  const candidate = sanitizeUntranslatedLatin(applyDictionary(value || (slug ? formatSlugFallback(slug) : "")));
  if (candidate && !isMostlyEnglish(candidate)) {
    return candidate;
  }

  const slugText = slug ? sanitizeUntranslatedLatin(formatSlugFallback(slug)) : "";
  if (slugText && slugText !== candidate && !isMostlyEnglish(slugText)) {
    return slugText;
  }

  const compact = sanitizeUntranslatedLatin(candidate || slugText || value)
    .replace(/[^\p{L}\p{N}$%]+/gu, " ")
    .trim()
    .slice(0, 80);

  return compact ? `外部事件：${compact}` : "外部事件";
}

export function localizeExternalQuestion(input: { question: string; slug?: string | null; sourceName?: string | null }) {
  const question = input.question.trim();
  if (!question || hasChinese(question)) {
    return question;
  }

  const dictionaryResult = applyDictionary(question);
  if (hasChinese(dictionaryResult) && !isMostlyEnglish(dictionaryResult)) {
    return dictionaryResult;
  }

  return buildReadableFallback(dictionaryResult, input.slug);
}

export function localizeExternalBrief(input: { brief: string; question: string; sourceName?: string | null }) {
  const brief = input.brief.trim();
  if (brief && hasChinese(brief) && !isMostlyEnglish(brief)) {
    return brief;
  }

  const localizedQuestion = localizeExternalQuestion({
    question: input.question,
    sourceName: input.sourceName,
  });
  return `实时事件：围绕“${localizedQuestion}”的概率分歧、流动性和锁盘时间进行展示，结算以原始市场规则与公开来源为准。`;
}
