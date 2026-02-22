import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

async function callPriceRoute(code: string) {
  const { GET } = await import("@/app/api/stock/price/[code]/route");
  const url = `http://localhost/api/stock/price/${code}`;
  const request = new NextRequest(url);
  return GET(request, { params: { code } });
}

describe("GET /api/stock/price/[code]", () => {
  it("360750 조회 → price=12345 (쉼표 제거)", async () => {
    const response = await callPriceRoute("360750");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.code).toBe("360750");
    expect(data.name).toBe("TIGER 미국S&P500");
    // "12,345" → 12345 (쉼표 제거 버그 회귀 테스트)
    expect(data.price).toBe(12345);
    expect(typeof data.price).toBe("number");
  });

  it("버그 회귀: closePrice='12,345' → 12345 (12 아님)", async () => {
    const response = await callPriceRoute("360750");
    const data = await response.json();

    // parseInt("12,345") = 12 (버그) vs parseInt("12345") = 12345 (정상)
    expect(data.price).toBe(12345);
    expect(data.price).not.toBe(12);
  });

  it("458730 조회 → price=9870", async () => {
    const response = await callPriceRoute("458730");
    const data = await response.json();

    expect(data.price).toBe(9870);
    expect(data.name).toBe("TIGER 미국배당다우존스");
  });

  it("stockName 없으면 code를 name으로 fallback", async () => {
    server.use(
      http.get(
        "https://m.stock.naver.com/api/stock/:code/basic",
        () => {
          return HttpResponse.json({
            stockName: "",
            symbolCode: "999999",
            closePrice: "5,000",
            stockEndType: "ETF",
          });
        }
      )
    );

    const response = await callPriceRoute("999999");
    const data = await response.json();

    expect(data.name).toBe("999999");
  });

  it("closePrice가 없으면 price=0", async () => {
    server.use(
      http.get(
        "https://m.stock.naver.com/api/stock/:code/basic",
        () => {
          return HttpResponse.json({
            stockName: "테스트ETF",
            symbolCode: "888888",
            closePrice: "",
            stockEndType: "ETF",
          });
        }
      )
    );

    const response = await callPriceRoute("888888");
    const data = await response.json();

    expect(data.price).toBe(0);
  });

  it("Naver API 404 → 404 전달", async () => {
    server.use(
      http.get(
        "https://m.stock.naver.com/api/stock/:code/basic",
        () => {
          return HttpResponse.json({ error: "종목 없음" }, { status: 404 });
        }
      )
    );

    const response = await callPriceRoute("000000");
    expect(response.status).toBe(404);
  });

  it("네트워크 오류 → 500 반환", async () => {
    server.use(
      http.get(
        "https://m.stock.naver.com/api/stock/:code/basic",
        () => {
          return HttpResponse.error();
        }
      )
    );

    const response = await callPriceRoute("360750");
    expect(response.status).toBe(500);
  });
});
