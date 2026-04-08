import type { NewsMatch } from "./enrich-news";

export const CURATED_NEWS_FALLBACKS: Record<string, NewsMatch[]> = {
  "us-x-iran-ceasefire-by": [
    {
      sourceName: "AP",
      articleUrl: "https://apnews.com/article/2ebb9e98647b14715946975ab5b95d9c",
      title: "The Latest: Iran dismisses US ceasefire plan and issues its own counterproposal",
      publishedAt: "2026-04-06T00:00:00Z",
      imageOriginalUrl:
        "https://dims.apnews.com/dims4/default/295c329/2147483647/strip/true/crop/675x450+12+0/resize/980x653!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F90%2F29%2F4e3c1cc7446089a9101a7bdff4c8%2Fdefaultshareimage-copy.png",
      snippet: "Iran rejects the latest U.S. ceasefire proposal and offers a counterproposal, keeping talks in flux.",
      score: 92,
    },
    {
      sourceName: "澎湃新闻",
      articleUrl: "https://www.thepaper.cn/newsDetail_forward_32896877",
      title: "美伊第三轮间接会谈结束，双方同意下周继续会谈",
      publishedAt: "2026-04-05T12:00:00Z",
      imageOriginalUrl: null,
      snippet: "美伊围绕停火与协议边界继续拉锯，谈判没有形成明确收敛。",
      score: 84,
    },
  ],
  "btc-updown-5m-1775454600": [
    {
      sourceName: "CoinDesk",
      articleUrl:
        "https://www.coindesk.com/markets/2026/04/06/bitcoin-reclaims-usd69-000-as-ceasefire-talks-surface-and-crypto-shorts-get-squeezed",
      title: "Bitcoin price news: BTC back above $69,000 as crypto shorts get squeezed",
      publishedAt: "2026-04-06T00:00:00Z",
      imageOriginalUrl:
        "https://cdn.sanity.io/images/s3y3vcno/production/d362b063d041968027a3867005ab0fb225024f51-1440x1080.jpg?auto=format&w=960&h=540&crop=focalpoint&fit=clip&q=75&fm=jpg",
      snippet: "Bitcoin rebounds sharply as ceasefire headlines hit the tape and short-covering accelerates.",
      score: 91,
    },
  ],
  "nba-hou-gsw-2026-04-05": [
    {
      sourceName: "ESPN",
      articleUrl: "https://www.espn.com/nba/recap?gameId=401810997",
      title: "Rockets 117-116 Warriors (Apr 5, 2026) Game Recap",
      publishedAt: "2026-04-06T00:00:00Z",
      imageOriginalUrl:
        "https://s.espncdn.com/stitcher/sports/basketball/nba/events/401810997.png?templateId=espn.com.share.1",
      snippet: "Kevin Durant and Houston edge Golden State by one possession as Curry returns.",
      score: 90,
    },
  ],
  "israel-military-action-against-gaza-on": [
    {
      sourceName: "Reuters",
      articleUrl:
        "https://www.reuters.com/world/middle-east/israeli-fire-kills-four-palestinians-gaza-medics-say-2026-04-05/",
      title: "Israeli fire kills four Palestinians in Gaza, medics say",
      publishedAt: "2026-04-05T18:00:00Z",
      imageOriginalUrl:
        "https://www.reuters.com/resizer/v2/LQXDTS73CNOBZPEE5VYHOG2Q2Q.jpg?auth=7b05db1d0b51e72a556442a4c973b63a5fece37a16d40e8730234a56350e5522&height=1005&width=1920&quality=80&smart=true",
      snippet: "Fresh strikes in Gaza keep the military-action event live for headline traders.",
      score: 89,
    },
  ],
};
