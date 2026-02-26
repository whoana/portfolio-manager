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

// 해외 주식 감지: 점(.) 포함이거나 순수 영문자 코드
function isOverseasCode(code: string): boolean {
  if (code.includes(".")) return true;
  // 순수 영문자(A-Z)만으로 구성된 코드는 해외 주식 (국내는 6자리 숫자)
  if (/^[A-Za-z]+$/.test(code)) return true;
  return false;
}

// 해외 주식 시세 조회 (접미사 없는 코드는 주요 거래소 접미사를 순차 시도)
const EXCHANGE_SUFFIXES = [".O", ".N", ".A", ".K"];

async function fetchOverseasPrice(code: string): Promise<Response> {
  // 이미 접미사가 있는 경우 바로 조회
  if (code.includes(".")) {
    return fetch(`https://api.stock.naver.com/stock/${code}/basic`, {
      headers: NAVER_HEADERS,
      next: { revalidate: 0 },
    });
  }

  // 접미사 없는 경우: 원본 코드 먼저 시도, 실패 시 주요 거래소 접미사 순차 시도
  const directRes = await fetch(`https://api.stock.naver.com/stock/${code}/basic`, {
    headers: NAVER_HEADERS,
    next: { revalidate: 0 },
  });
  if (directRes.ok) return directRes;

  for (const suffix of EXCHANGE_SUFFIXES) {
    const res = await fetch(`https://api.stock.naver.com/stock/${code}${suffix}/basic`, {
      headers: NAVER_HEADERS,
      next: { revalidate: 0 },
    });
    if (res.ok) return res;
  }

  return directRes; // 모두 실패 시 원본 응답 반환
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  if (!code) {
    return NextResponse.json({ error: "종목코드가 필요합니다." }, { status: 400 });
  }

  try {
    const isOverseas = isOverseasCode(code);

    if (isOverseas) {
      // 해외 주식: api.stock.naver.com 엔드포인트 사용
      const basicRes = await fetchOverseasPrice(code);

      if (!basicRes.ok) {
        return NextResponse.json(
          { error: "현재가 조회 실패" },
          { status: basicRes.status }
        );
      }

      const basicData = (await basicRes.json()) as NaverStockBasic;
      const price = parseFloat(basicData.closePrice?.replace(/,/g, "") || "0");

      return NextResponse.json({
        code,
        name: basicData.stockName || code,
        price,
      });
    }

    // 국내 주식: basic + integration API를 병렬 호출
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
