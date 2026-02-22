import { NextRequest, NextResponse } from "next/server";

interface NaverStockBasic {
  stockName: string;
  symbolCode: string;
  closePrice: string;
  stockEndType: string;
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
    const url = `https://m.stock.naver.com/api/stock/${code}/basic`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://m.stock.naver.com",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "현재가 조회 실패" },
        { status: response.status }
      );
    }

    const data = (await response.json()) as NaverStockBasic;
    const price = parseInt(data.closePrice?.replace(/,/g, "") || "0", 10);

    return NextResponse.json({
      code,
      name: data.stockName || code,
      price,
    });
  } catch (error) {
    console.error("Stock price error:", error);
    return NextResponse.json(
      { error: "현재가 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
