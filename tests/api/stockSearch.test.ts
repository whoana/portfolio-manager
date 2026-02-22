import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

async function callSearchRoute(query: string) {
  const { GET } = await import("@/app/api/stock/search/route");
  const url = `http://localhost/api/stock/search?q=${encodeURIComponent(query)}`;
  const request = new NextRequest(url);
  return GET(request);
}

describe("GET /api/stock/search", () => {
  it("빈 쿼리 → items:[] 즉시 반환 (외부 API 미호출)", async () => {
    const response = await callSearchRoute("");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toEqual([]);
  });

  it("공백만 있는 쿼리 → items:[] 즉시 반환", async () => {
    const response = await callSearchRoute("   ");
    const data = await response.json();

    expect(data.items).toEqual([]);
  });

  it("TIGER 검색 → 2개 결과 반환", async () => {
    const response = await callSearchRoute("TIGER");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(2);
    expect(data.items[0]).toMatchObject({ name: "TIGER 미국S&P500", code: "360750" });
    expect(data.items[1]).toMatchObject({ name: "TIGER 미국배당다우존스", code: "458730" });
  });

  it("검색결과 없는 쿼리 → items:[]", async () => {
    const response = await callSearchRoute("존재하지않는종목XYZ");
    const data = await response.json();

    expect(data.items).toEqual([]);
  });

  it("Naver API 500 오류 → 500 전달", async () => {
    server.use(
      http.get("https://ac.stock.naver.com/ac", () => {
        return HttpResponse.json({ error: "서버 오류" }, { status: 500 });
      })
    );

    const response = await callSearchRoute("TIGER");
    expect(response.status).toBe(500);
  });

  it("Naver API 네트워크 오류 → 500 반환", async () => {
    server.use(
      http.get("https://ac.stock.naver.com/ac", () => {
        return HttpResponse.error();
      })
    );

    const response = await callSearchRoute("TIGER");
    expect(response.status).toBe(500);
  });

  it("응답 items 배열에 name/code 필드만 포함", async () => {
    const response = await callSearchRoute("TIGER");
    const data = await response.json();

    data.items.forEach((item: Record<string, unknown>) => {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("code");
      // typeCode, url 등 불필요한 필드 제외 확인
      expect(item).not.toHaveProperty("typeCode");
    });
  });
});
