import { http, HttpResponse } from "msw";

export const handlers = [
  // Naver 자동완성 API
  http.get("https://ac.stock.naver.com/ac", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";

    if (q.toUpperCase().includes("TIGER")) {
      return HttpResponse.json({
        items: [
          {
            name: "TIGER 미국S&P500",
            code: "360750",
            typeCode: "STOCK",
            typeName: "주식",
            url: "",
            reutersCode: "360750.KS",
            nationCode: "KOR",
            nationName: "한국",
            category: "ETF",
          },
          {
            name: "TIGER 미국배당다우존스",
            code: "458730",
            typeCode: "STOCK",
            typeName: "주식",
            url: "",
            reutersCode: "458730.KS",
            nationCode: "KOR",
            nationName: "한국",
            category: "ETF",
          },
        ],
        query: q,
      });
    }

    return HttpResponse.json({ items: [], query: q });
  }),

  // Naver 주식 기본 정보 API
  http.get(
    "https://m.stock.naver.com/api/stock/:code/basic",
    ({ params }) => {
      const { code } = params as { code: string };

      const stockData: Record<string, { stockName: string; closePrice: string }> = {
        "360750": { stockName: "TIGER 미국S&P500", closePrice: "12,345" },
        "458730": { stockName: "TIGER 미국배당다우존스", closePrice: "9,870" },
        "069500": { stockName: "KODEX 200", closePrice: "35,000" },
      };

      const data = stockData[code];
      if (data) {
        return HttpResponse.json({
          stockName: data.stockName,
          symbolCode: code,
          closePrice: data.closePrice,
          stockEndType: "ETF",
        });
      }

      return HttpResponse.json({ error: "종목 없음" }, { status: 404 });
    }
  ),

  // Naver 주식 integration API (ETF 분배율 포함)
  http.get(
    "https://m.stock.naver.com/api/stock/:code/integration",
    ({ params }) => {
      const { code } = params as { code: string };

      const etfData: Record<string, { stockName: string; dividendYieldTtm: number }> = {
        "360750": { stockName: "TIGER 미국S&P500", dividendYieldTtm: 1.72 },
        "458730": { stockName: "TIGER 미국배당다우존스", dividendYieldTtm: 2.86 },
        "069500": { stockName: "KODEX 200", dividendYieldTtm: 1.5 },
      };

      const data = etfData[code];
      if (data) {
        return HttpResponse.json({
          stockEndType: "etf",
          stockName: data.stockName,
          etfKeyIndicator: {
            dividendYieldTtm: data.dividendYieldTtm,
          },
        });
      }

      return HttpResponse.json({ error: "종목 없음" }, { status: 404 });
    }
  ),
];
