import { NextRequest, NextResponse } from "next/server";

interface NaverStockBasic {
  stockName: string;
  symbolCode: string;
  closePrice: string;
  stockEndType: string;
}

interface NaverIntegration {
  stockEndType: string;
  stockName: string;
  etfKeyIndicator?: {
    dividendYieldTtm?: number;
  };
}

const NAVER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://m.stock.naver.com",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  if (!code) {
    return NextResponse.json({ error: "종목코드가 필요합니다." }, { status: 400 });
  }

  try {
    // basic + integration API를 병렬 호출
    const [basicRes, integrationRes] = await Promise.all([
      fetch(`https://m.stock.naver.com/api/stock/${code}/basic`, {
        headers: NAVER_HEADERS,
        next: { revalidate: 0 },
      }),
      fetch(`https://m.stock.naver.com/api/stock/${code}/integration`, {
        headers: NAVER_HEADERS,
        next: { revalidate: 0 },
      }),
    ]);

    if (!basicRes.ok) {
      return NextResponse.json(
        { error: "현재가 조회 실패" },
        { status: basicRes.status }
      );
    }

    const basicData = (await basicRes.json()) as NaverStockBasic;
    const price = parseInt(basicData.closePrice?.replace(/,/g, "") || "0", 10);

    // ETF 분배율(TTM) 추출 — integration 실패 시 무시
    let dividendYield: number | undefined;
    if (integrationRes.ok) {
      const intData = (await integrationRes.json()) as NaverIntegration;
      if (intData.etfKeyIndicator?.dividendYieldTtm != null) {
        dividendYield = intData.etfKeyIndicator.dividendYieldTtm;
      }
    }

    return NextResponse.json({
      code,
      name: basicData.stockName || code,
      price,
      ...(dividendYield != null && { dividendYield }),
    });
  } catch (error) {
    console.error("Stock price error:", error);
    return NextResponse.json(
      { error: "현재가 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
