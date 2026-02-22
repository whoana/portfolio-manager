import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddStockModal from "@/app/components/AddStockModal";
import type { PortfolioStock } from "@/app/lib/types";

// StockSearch를 mock하여 종목 선택을 제어
vi.mock("@/app/components/StockSearch", () => ({
  default: ({ onSelect }: { onSelect: (s: { name: string; code: string }) => void }) => (
    <button
      data-testid="mock-stock-search"
      onClick={() => onSelect({ name: "TIGER 미국S&P500", code: "360750" })}
    >
      종목 선택
    </button>
  ),
}));

const BASE_STOCK: PortfolioStock = {
  id: "stock_1",
  category: "배당",
  name: "TIGER 미국S&P500",
  code: "360750",
  targetWeight: 0.3,
  dividendRate: 0.035,
  strategy: "미국 대형주 ETF",
  analysis: "핵심역할 텍스트",
  rationale: "선정근거 텍스트",
  currentPrice: 12000,
};

describe("AddStockModal - 추가 모드", () => {
  it("제목이 '종목 추가'로 표시", () => {
    render(<AddStockModal onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("종목 추가")).toBeInTheDocument();
  });

  it("저장 버튼 텍스트가 '추가'", () => {
    render(<AddStockModal onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "추가" })).toBeInTheDocument();
  });

  it("종목 미선택 시 에러 표시", async () => {
    const user = userEvent.setup();
    render(<AddStockModal onAdd={vi.fn()} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("종목을 선택해주세요.")).toBeInTheDocument();
  });

  it("targetWeight=0 입력 시 유효성 에러", async () => {
    const user = userEvent.setup();
    render(<AddStockModal onAdd={vi.fn()} onClose={vi.fn()} />);

    // 종목 선택
    await user.click(screen.getByTestId("mock-stock-search"));
    // 비중 0 입력
    const weightInput = screen.getByPlaceholderText("예: 30");
    await user.clear(weightInput);
    await user.type(weightInput, "0");

    await user.click(screen.getByRole("button", { name: "추가" }));

    // targetWeight와 dividendRate 모두 에러일 수 있으므로 getAllByText 사용
    const errors = screen.getAllByText("0~100 사이 숫자를 입력하세요.");
    expect(errors.length).toBeGreaterThanOrEqual(1);
    // targetWeight 에러가 포함되어 있는지 확인
    const weightError = weightInput.parentElement?.parentElement?.querySelector("p.text-accent-red");
    expect(weightError).toBeInTheDocument();
  });

  it("targetWeight=100 → 유효 (100% 허용)", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddStockModal onAdd={onAdd} onClose={vi.fn()} />);

    await user.click(screen.getByTestId("mock-stock-search"));

    const weightInput = screen.getByPlaceholderText("예: 30");
    await user.clear(weightInput);
    await user.type(weightInput, "100");

    const divInput = screen.getByPlaceholderText("예: 3.5");
    await user.clear(divInput);
    await user.type(divInput, "0");

    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(onAdd).toHaveBeenCalled();
  });

  it("dividendRate=0 → 유효 (0% 허용)", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddStockModal onAdd={onAdd} onClose={vi.fn()} />);

    await user.click(screen.getByTestId("mock-stock-search"));

    const weightInput = screen.getByPlaceholderText("예: 30");
    await user.clear(weightInput);
    await user.type(weightInput, "30");

    const divInput = screen.getByPlaceholderText("예: 3.5");
    await user.clear(divInput);
    await user.type(divInput, "0");

    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ dividendRate: 0 })
    );
  });

  it("% → 소수 변환: 입력 '30' → stock.targetWeight=0.3", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddStockModal onAdd={onAdd} onClose={vi.fn()} />);

    await user.click(screen.getByTestId("mock-stock-search"));

    const weightInput = screen.getByPlaceholderText("예: 30");
    await user.clear(weightInput);
    await user.type(weightInput, "30");

    const divInput = screen.getByPlaceholderText("예: 3.5");
    await user.clear(divInput);
    await user.type(divInput, "3.5");

    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        targetWeight: 0.3,
        dividendRate: 0.035,
      })
    );
  });

  it("취소 버튼 클릭 시 onClose 호출", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<AddStockModal onAdd={vi.fn()} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe("AddStockModal - 수정 모드", () => {
  it("제목이 '종목 수정'으로 표시", () => {
    render(
      <AddStockModal
        onAdd={vi.fn()}
        onClose={vi.fn()}
        initialStock={BASE_STOCK}
      />
    );
    expect(screen.getByText("종목 수정")).toBeInTheDocument();
  });

  it("저장 버튼 텍스트가 '저장'", () => {
    render(
      <AddStockModal
        onAdd={vi.fn()}
        onClose={vi.fn()}
        initialStock={BASE_STOCK}
      />
    );
    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
  });

  it("기존 종목명/코드가 pre-fill됨", () => {
    render(
      <AddStockModal
        onAdd={vi.fn()}
        onClose={vi.fn()}
        initialStock={BASE_STOCK}
      />
    );
    expect(screen.getByText("TIGER 미국S&P500")).toBeInTheDocument();
    expect(screen.getByText("360750")).toBeInTheDocument();
  });

  it("기존 targetWeight가 % 로 변환되어 pre-fill (0.3 → '30.0')", () => {
    render(
      <AddStockModal
        onAdd={vi.fn()}
        onClose={vi.fn()}
        initialStock={BASE_STOCK}
      />
    );
    const weightInput = screen.getByPlaceholderText("예: 30") as HTMLInputElement;
    expect(weightInput.value).toBe("30.0");
  });

  it("기존 dividendRate가 % 로 변환되어 pre-fill (0.035 → '3.5')", () => {
    render(
      <AddStockModal
        onAdd={vi.fn()}
        onClose={vi.fn()}
        initialStock={BASE_STOCK}
      />
    );
    const divInput = screen.getByPlaceholderText("예: 3.5") as HTMLInputElement;
    expect(divInput.value).toBe("3.5");
  });

  it("기존 id를 유지하여 저장 (새 id 생성 안 함)", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(
      <AddStockModal
        onAdd={onAdd}
        onClose={vi.fn()}
        initialStock={BASE_STOCK}
      />
    );

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ id: "stock_1" })
    );
  });

  it("'다시 검색' 클릭 시 종목 검색창으로 돌아감", async () => {
    const user = userEvent.setup();
    render(
      <AddStockModal
        onAdd={vi.fn()}
        onClose={vi.fn()}
        initialStock={BASE_STOCK}
      />
    );

    await user.click(screen.getByText("다시 검색"));

    expect(screen.getByTestId("mock-stock-search")).toBeInTheDocument();
  });
});
