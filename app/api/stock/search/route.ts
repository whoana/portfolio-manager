import { NextRequest, NextResponse } from "next/server";

interface NaverACItem {
  name: string;
  code: string;
  typeCode: string;
  typeName: string;
  url: string;
  reutersCode: string;
  nationCode: string;
  nationName: string;
  category: string;
}

interface NaverACResponse {
  items: NaverACItem[];
  query: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ items: [] });
  }

  try {
    // The Naver AC API supports both Korean and English/code queries
    const url = `https://ac.stock.naver.com/ac?q=${encodeURIComponent(query)}&target=stock&st=111`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://finance.naver.com",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "네이버 API 호출 실패", items: [] },
        { status: response.status }
      );
    }

    const data = (await response.json()) as NaverACResponse;

    // items is a flat array of NaverACItem objects
    const items: { name: string; code: string }[] = [];
    if (Array.isArray(data.items)) {
      data.items.forEach((item) => {
        if (item.code && item.name) {
          items.push({ name: item.name, code: item.code });
        }
      });
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Stock search error:", error);
    return NextResponse.json(
      { error: "종목 검색 중 오류가 발생했습니다.", items: [] },
      { status: 500 }
    );
  }
}
