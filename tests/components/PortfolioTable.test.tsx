import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PortfolioTable from "@/app/components/PortfolioTable";
import type { PortfolioStock } from "@/app/lib/types";

vi.mock("@/app/lib/naverFinance", () => ({
  searchStocks: vi.fn(),
  getStockPrice: vi.fn(),
}));

import { getStockPrice } from "@/app/lib/naverFinance";
const mockGetStockPrice = vi.mocked(getStockPrice);

function makeStock(overrides: Partial<PortfolioStock> = {}): PortfolioStock {
  return {
    id: "stock_1",
    category: "배당",
    name: "TIGER 미국S&P500",
    code: "360750",
    targetWeight: 0.3,
    dividendRate: 0.02,
    strategy: "미국 대형주",
    analysis: "",
    rationale: "",
    currentPrice: 12000,
    ...overrides,
  };
}

const DEFAULT_PROPS = {
  stocks: [],
  onUpdate: vi.fn(),
  onAddClick: vi.fn(),
  onEditClick: vi.fn(),
};

describe("PortfolioTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("종목이 없으면 '아직 종목이 없습니다' 표시", () => {
    render(<PortfolioTable {...DEFAULT_PROPS} />);
    expect(screen.getByText("아직 종목이 없습니다.")).toBeInTheDocument();
  });

  it("종목 목록 렌더링", () => {
    const stocks = [makeStock()];
    render(<PortfolioTable {...DEFAULT_PROPS} stocks={stocks} />);

    const table = screen.getByTestId("desktop-table");
    expect(within(table).getByText("TIGER 미국S&P500")).toBeInTheDocument();
    expect(within(table).getByText("360750")).toBeInTheDocument();
  });

  it("행 더블클릭 → onEditClick(stock) 호출", async () => {
    const onEditClick = vi.fn();
    const stock = makeStock();
    const user = userEvent.setup();
    render(
      <PortfolioTable
        {...DEFAULT_PROPS}
        stocks={[stock]}
        onEditClick={onEditClick}
      />
    );

    const table = screen.getByTestId("desktop-table");
    const row = within(table).getByText("TIGER 미국S&P500").closest("tr")!;
    await user.dblClick(row);

    expect(onEditClick).toHaveBeenCalledWith(stock);
  });

  it("totalWeight > 1.001 → 비중 초과 경고 배지 표시", () => {
    const stocks = [
      makeStock({ targetWeight: 0.6 }),
      makeStock({ id: "stock_2", targetWeight: 0.5 }),
    ];
    render(<PortfolioTable {...DEFAULT_PROPS} stocks={stocks} />);

    expect(screen.getByText(/초과/)).toBeInTheDocument();
  });

  it("totalWeight <= 1.001 → 경고 배지 없음", () => {
    const stocks = [makeStock({ targetWeight: 0.3 })];
    render(<PortfolioTable {...DEFAULT_PROPS} stocks={stocks} />);

    expect(screen.queryByText(/초과/)).toBeNull();
  });

  it("+ 종목 추가 버튼 클릭 → onAddClick 호출", async () => {
    const onAddClick = vi.fn();
    const user = userEvent.setup();
    render(
      <PortfolioTable
        {...DEFAULT_PROPS}
        stocks={[makeStock()]}
        onAddClick={onAddClick}
      />
    );

    await user.click(screen.getByRole("button", { name: "+ 종목 추가" }));

    expect(onAddClick).toHaveBeenCalled();
  });

  it("개별 시세 갱신 → onUpdate 호출 (업데이트된 가격 포함)", async () => {
    mockGetStockPrice.mockResolvedValue({
      code: "360750",
      name: "TIGER 미국S&P500",
      price: 15000,
    });

    const onUpdate = vi.fn();
    const stock = makeStock({ currentPrice: 12000 });
    const user = userEvent.setup();
    render(
      <PortfolioTable
        {...DEFAULT_PROPS}
        stocks={[stock]}
        onUpdate={onUpdate}
      />
    );

    const table = screen.getByTestId("desktop-table");
    await user.click(within(table).getByTitle("현재가 조회"));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ currentPrice: 15000 }),
        ])
      );
    });
  });

  it("시세 갱신 실패 시 에러 메시지 표시, 나머지 가격은 유지", async () => {
    mockGetStockPrice.mockRejectedValue(new Error("조회 실패"));

    const stock = makeStock({ currentPrice: 12000 });
    const user = userEvent.setup();
    render(
      <PortfolioTable
        {...DEFAULT_PROPS}
        stocks={[stock]}
        onUpdate={vi.fn()}
      />
    );

    const table = screen.getByTestId("desktop-table");
    await user.click(within(table).getByTitle("현재가 조회"));

    await waitFor(() => {
      expect(
        screen.getByText(/TIGER 미국S&P500 현재가 조회 실패/)
      ).toBeInTheDocument();
    });
  });

  it("전체 시세 갱신: 일부 실패해도 나머지 종목 업데이트", async () => {
    const stocks = [
      makeStock({ id: "stock_1", code: "360750", name: "TIGER 미국S&P500", currentPrice: 12000 }),
      makeStock({ id: "stock_2", code: "458730", name: "TIGER 미국배당다우존스", currentPrice: 9000 }),
    ];

    // 첫 종목 성공, 두 번째 실패
    mockGetStockPrice
      .mockResolvedValueOnce({ code: "360750", name: "TIGER 미국S&P500", price: 15000 })
      .mockRejectedValueOnce(new Error("조회 실패"));

    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(
      <PortfolioTable
        {...DEFAULT_PROPS}
        stocks={stocks}
        onUpdate={onUpdate}
      />
    );

    await user.click(screen.getByRole("button", { name: "전체 시세 갱신" }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ code: "360750", currentPrice: 15000 }),
          // 실패한 종목은 기존 가격 유지
          expect.objectContaining({ code: "458730", currentPrice: 9000 }),
        ])
      );
    });
  });

  it("currentPrice 없으면 '-' 표시", async () => {
    mockGetStockPrice.mockRejectedValue(new Error("no price"));
    const stock = makeStock({ currentPrice: undefined });
    render(<PortfolioTable {...DEFAULT_PROPS} stocks={[stock]} />);

    const table = screen.getByTestId("desktop-table");
    // 마운트 시 자동 시세 갱신이 실행되므로 로딩 완료 후 확인
    await waitFor(() => {
      const rows = within(table).getAllByRole("row");
      const dataRow = rows[1];
      expect(within(dataRow).getByText("-")).toBeInTheDocument();
    });
  });

  it("삭제 버튼 클릭 → onUpdate(빈 배열) 호출", async () => {
    const onUpdate = vi.fn();
    const stock = makeStock();
    const user = userEvent.setup();
    render(
      <PortfolioTable
        {...DEFAULT_PROPS}
        stocks={[stock]}
        onUpdate={onUpdate}
      />
    );

    const table = screen.getByTestId("desktop-table");
    await user.click(within(table).getByTitle("삭제"));

    expect(onUpdate).toHaveBeenCalledWith([]);
  });
});
