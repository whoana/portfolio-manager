import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createLocalStorageMock } from "../mocks/localStorage";

// 모듈 import는 vi.stubGlobal 이후에 실행돼야 하므로 동적 import 사용
async function importStorage() {
  // 캐시 무효화를 위해 매번 새 import
  return await import("@/app/lib/portfolioStorage");
}

describe("portfolioStorage", () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    vi.stubGlobal("localStorage", localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  describe("getPortfolios", () => {
    it("localStorage가 비어있으면 빈 배열 반환", async () => {
      const { getPortfolios } = await importStorage();
      expect(getPortfolios()).toEqual([]);
    });

    it("저장된 데이터를 JSON 파싱하여 반환", async () => {
      const { getPortfolios, createPortfolio, savePortfolio } =
        await importStorage();
      const p = createPortfolio("테스트 포트폴리오");
      savePortfolio(p);

      const portfolios = getPortfolios();
      expect(portfolios).toHaveLength(1);
      expect(portfolios[0].name).toBe("테스트 포트폴리오");
    });

    it("localStorage에 깨진 JSON이 있으면 빈 배열 반환", async () => {
      localStorageMock._store.set("etf_portfolios", "{ invalid json ]]");
      const { getPortfolios } = await importStorage();

      expect(getPortfolios()).toEqual([]);
    });
  });

  describe("savePortfolio", () => {
    it("신규 포트폴리오 추가", async () => {
      const { savePortfolio, getPortfolios, createPortfolio } =
        await importStorage();
      const p = createPortfolio("신규");

      savePortfolio(p);

      const portfolios = getPortfolios();
      expect(portfolios).toHaveLength(1);
      expect(portfolios[0].id).toBe(p.id);
    });

    it("기존 포트폴리오 수정 시 updatedAt 갱신", async () => {
      const { savePortfolio, getPortfolios, createPortfolio } =
        await importStorage();
      const p = createPortfolio("기존");
      savePortfolio(p);

      // 1ms 후 수정
      await new Promise((r) => setTimeout(r, 10));
      const updated = { ...p, name: "수정됨" };
      savePortfolio(updated);

      const portfolios = getPortfolios();
      expect(portfolios).toHaveLength(1);
      expect(portfolios[0].name).toBe("수정됨");
      expect(portfolios[0].updatedAt).not.toBe(p.updatedAt);
    });

    it("여러 포트폴리오를 개별적으로 추가", async () => {
      const { savePortfolio, getPortfolios, createPortfolio } =
        await importStorage();

      // Date.now() 충돌 방지를 위해 mock으로 다른 id 부여
      const p1 = { ...createPortfolio("첫번째"), id: "portfolio_1" };
      const p2 = { ...createPortfolio("두번째"), id: "portfolio_2" };

      savePortfolio(p1);
      savePortfolio(p2);

      expect(getPortfolios()).toHaveLength(2);
    });
  });

  describe("getPortfolio", () => {
    it("id로 특정 포트폴리오 조회", async () => {
      const { savePortfolio, getPortfolio, createPortfolio } =
        await importStorage();
      const p = { ...createPortfolio("찾기"), id: "portfolio_find" };
      savePortfolio(p);

      const found = getPortfolio("portfolio_find");
      expect(found).not.toBeNull();
      expect(found?.name).toBe("찾기");
    });

    it("없는 id 조회 시 null 반환", async () => {
      const { getPortfolio } = await importStorage();
      expect(getPortfolio("nonexistent")).toBeNull();
    });
  });

  describe("deletePortfolio", () => {
    it("포트폴리오 삭제 후 목록에서 제거", async () => {
      const { savePortfolio, deletePortfolio, getPortfolios, createPortfolio } =
        await importStorage();
      const p = { ...createPortfolio("삭제용"), id: "portfolio_del" };
      savePortfolio(p);

      deletePortfolio("portfolio_del");

      expect(getPortfolios()).toHaveLength(0);
    });
  });

  describe("createPortfolio", () => {
    it("기본 investmentAmount가 1억", async () => {
      const { createPortfolio } = await importStorage();
      const p = createPortfolio("기본값 테스트");

      expect(p.investmentAmount).toBe(100_000_000);
      expect(p.stocks).toEqual([]);
    });

    it("id 형식이 'portfolio_'로 시작", async () => {
      const { createPortfolio } = await importStorage();
      const p = createPortfolio("id 테스트");

      expect(p.id).toMatch(/^portfolio_/);
    });

    it("버그 문서화: Date.now() 기반 id는 동일 ms 충돌 가능", async () => {
      const { createPortfolio } = await importStorage();
      // Date.now()를 같은 값으로 고정
      const spy = vi.spyOn(Date, "now").mockReturnValue(1234567890);

      const p1 = createPortfolio("첫번째");
      const p2 = createPortfolio("두번째");

      // 같은 ms 내 생성 시 id 충돌 발생 - 알려진 버그
      expect(p1.id).toBe(p2.id);

      spy.mockRestore();
    });
  });

  describe("SSR 방어 (window === undefined)", () => {
    it("window가 undefined이면 getPortfolios는 빈 배열 반환", async () => {
      vi.stubGlobal("window", undefined);
      const { getPortfolios } = await importStorage();

      expect(getPortfolios()).toEqual([]);
    });
  });
});
