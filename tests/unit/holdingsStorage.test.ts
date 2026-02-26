import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createLocalStorageMock } from "../mocks/localStorage";

async function importStorage() {
  return await import("@/app/lib/holdingsStorage");
}

describe("holdingsStorage", () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    vi.stubGlobal("localStorage", localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  describe("getAllHoldings", () => {
    it("localStorage가 비어있으면 빈 배열 반환", async () => {
      const { getAllHoldings } = await importStorage();
      expect(getAllHoldings()).toEqual([]);
    });

    it("깨진 JSON이면 빈 배열 반환", async () => {
      localStorageMock._store.set("etf_holdings", "{ broken }");
      const { getAllHoldings } = await importStorage();
      expect(getAllHoldings()).toEqual([]);
    });
  });

  describe("saveHoldings / getHoldings", () => {
    it("포트폴리오 ID로 보유내역 저장 및 조회", async () => {
      const { saveHoldings, getHoldings } = await importStorage();
      saveHoldings({
        portfolioId: "p1",
        items: [
          { id: "h1", category: "배당성장", name: "TIGER", code: "458730", quantity: 100, avgPrice: 12000 },
        ],
        updatedAt: new Date().toISOString(),
      });

      const result = getHoldings("p1");
      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(1);
      expect(result!.items[0].name).toBe("TIGER");
    });

    it("없는 portfolioId면 null", async () => {
      const { getHoldings } = await importStorage();
      expect(getHoldings("nonexistent")).toBeNull();
    });

    it("기존 보유내역 업데이트 시 덮어쓰기", async () => {
      const { saveHoldings, getHoldings } = await importStorage();
      saveHoldings({
        portfolioId: "p1",
        items: [{ id: "h1", category: "배당성장", name: "A", code: "111", quantity: 10, avgPrice: 1000 }],
        updatedAt: new Date().toISOString(),
      });
      saveHoldings({
        portfolioId: "p1",
        items: [
          { id: "h1", category: "배당성장", name: "A", code: "111", quantity: 10, avgPrice: 1000 },
          { id: "h2", category: "성장동력", name: "B", code: "222", quantity: 20, avgPrice: 2000 },
        ],
        updatedAt: new Date().toISOString(),
      });

      const result = getHoldings("p1");
      expect(result!.items).toHaveLength(2);
    });
  });

  describe("deleteHoldings", () => {
    it("포트폴리오 ID로 보유내역 삭제", async () => {
      const { saveHoldings, deleteHoldings, getHoldings } = await importStorage();
      saveHoldings({
        portfolioId: "p1",
        items: [{ id: "h1", category: "배당성장", name: "A", code: "111", quantity: 10, avgPrice: 1000 }],
        updatedAt: new Date().toISOString(),
      });

      deleteHoldings("p1");
      expect(getHoldings("p1")).toBeNull();
    });
  });

  describe("createHoldingItem", () => {
    it("id가 holding_ 접두사로 생성", async () => {
      const { createHoldingItem } = await importStorage();
      const item = createHoldingItem({
        category: "배당성장",
        name: "TIGER",
        code: "458730",
        quantity: 100,
        avgPrice: 12000,
      });
      expect(item.id).toMatch(/^holding_/);
      expect(item.quantity).toBe(100);
    });
  });

  describe("SSR 방어", () => {
    it("window가 undefined이면 getAllHoldings는 빈 배열", async () => {
      vi.stubGlobal("window", undefined);
      const { getAllHoldings } = await importStorage();
      expect(getAllHoldings()).toEqual([]);
    });
  });
});
